import { execFile, spawn } from 'node:child_process'
import { lstat, open, readdir, readFile, realpath, rm, stat } from 'node:fs/promises'
import path from 'node:path'

export const DEFAULT_IGNORE_DIRS = [
  'node_modules',
  '.pnpm',
  '.yarn',
  'dist',
  'build',
  'target',
  'out',
  '.next',
  '.nuxt',
  '.output',
  '.venv',
  'venv',
  '__pycache__',
  'vendor',
  '.cache',
  '.idea',
  '.vscode',
  '.gradle',
  'coverage',
  'bin',
  'obj',
]

export const DEFAULT_OPTIONS = {
  maxDepth: 6,
  maxRepos: 50,
  maxCommits: 40,
  maxFilesPerRepo: 500,
  maxDiffBytes: 256 * 1024,
  timeoutMs: 12000,
  networkTimeoutMs: 60000,
  ignoreDirs: DEFAULT_IGNORE_DIRS,
}

const IS_WIN = process.platform === 'win32'

/** Normalize a filesystem path into a deduplication key. */
export function pathKey(targetPath) {
  const resolved = path.resolve(targetPath)
  return IS_WIN ? resolved.toLowerCase() : resolved
}

/** Convert a path to slash-separated display form relative to a base directory. */
export function toRelativeDisplay(basePath, targetPath) {
  const rel = path.relative(basePath, targetPath)
  if (!rel || rel === '') return '.'
  return rel.split(path.sep).join('/')
}

/** Check whether candidate lies strictly inside or equal to rootPath. */
export function isPathWithin(rootPath, candidatePath) {
  const root = path.resolve(rootPath)
  const target = path.resolve(candidatePath)
  const rel = path.relative(root, target)
  if (rel === '') return true
  return !rel.startsWith('..') && !path.isAbsolute(rel)
}

/** Execute a git command with no shell, hidden console window on Windows, and strict timeout. */
export function runGit(cwd, args, options = {}) {
  const timeout = options.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs
  const maxBuffer = options.maxBuffer ?? 8 * 1024 * 1024
  const fullArgs = ['-c', 'core.quotepath=false', '-c', 'i18n.logOutputEncoding=utf-8', ...args]
  return new Promise((resolve) => {
    const child = execFile(
      'git',
      fullArgs,
      {
        cwd,
        timeout,
        maxBuffer,
        windowsHide: true,
        encoding: 'utf8',
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
          GIT_OPTIONAL_LOCKS: '0',
          LANG: 'C.UTF-8',
        },
      },
      (error, stdout, stderr) => {
        if (!error) {
          resolve({ ok: true, code: 0, stdout: stdout ?? '', stderr: stderr ?? '' })
          return
        }
        const code = typeof error.code === 'number' ? error.code : null
        const timedOut = Boolean(error.killed && error.signal)
        const notInstalled = error.code === 'ENOENT'
        resolve({
          ok: false,
          code,
          timedOut,
          notInstalled,
          stdout: stdout ?? '',
          stderr: stderr ?? error.message ?? '',
          message: error.message ?? 'git execution failed',
        })
      },
    )
    if (options.signal) {
      if (options.signal.aborted) {
        child.kill()
      } else {
        options.signal.addEventListener('abort', () => { child.kill() }, { once: true })
      }
    }
  })
}

/** Stream a git command's stdout up to maxBytes without failing on maxBuffer overflow. */
function runGitBoundedStdout(cwd, args, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs
  const maxBytes = options.maxBytes ?? DEFAULT_OPTIONS.maxDiffBytes
  const fullArgs = ['-c', 'core.quotepath=false', '-c', 'i18n.logOutputEncoding=utf-8', ...args]
  return new Promise((resolve) => {
    const child = spawn('git', fullArgs, {
      cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
        GIT_OPTIONAL_LOCKS: '0',
        LANG: 'C.UTF-8',
      },
    })
    const outChunks = []
    const errChunks = []
    let outBytes = 0
    let errBytes = 0
    let truncated = false
    let timedOut = false
    let settled = false

    const finish = (payload) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (options.signal) options.signal.removeEventListener('abort', onAbort)
      resolve(payload)
    }

    const onAbort = () => {
      child.kill()
      finish({ ok: false, error: 'Aborted', stdout: '', stderr: '', truncated: false })
    }
    if (options.signal) {
      if (options.signal.aborted) {
        onAbort()
        return
      }
      options.signal.addEventListener('abort', onAbort, { once: true })
    }

    const timer = setTimeout(() => {
      timedOut = true
      child.kill()
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      if (truncated) return
      const remaining = maxBytes - outBytes
      if (chunk.length > remaining) {
        if (remaining > 0) {
          outChunks.push(chunk.subarray(0, remaining))
          outBytes += remaining
        }
        truncated = true
        child.kill()
        return
      }
      outChunks.push(chunk)
      outBytes += chunk.length
    })

    child.stderr.on('data', (chunk) => {
      if (errBytes < 32 * 1024) {
        const take = chunk.subarray(0, 32 * 1024 - errBytes)
        errChunks.push(take)
        errBytes += take.length
      }
    })

    child.on('error', (err) => {
      finish({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        stdout: '',
        stderr: '',
        truncated: false,
      })
    })

    child.on('close', (code) => {
      const stdout = Buffer.concat(outChunks, outBytes).toString('utf8')
      const stderr = Buffer.concat(errChunks, errBytes).toString('utf8')
      if (truncated) {
        finish({ ok: true, stdout, stderr, truncated: true })
        return
      }
      if (timedOut) {
        finish({ ok: false, error: `git command timed out after ${timeoutMs}ms`, stdout, stderr, truncated: false })
        return
      }
      if (code === 0) {
        finish({ ok: true, stdout, stderr, truncated: false })
      } else {
        finish({ ok: false, error: stderr.trim() || `git exited with code ${code}`, stdout, stderr, truncated: false })
      }
    })
  })
}

async function resolveRealDir(dirPath) {
  if (!dirPath || typeof dirPath !== 'string') return null
  const resolved = path.resolve(dirPath)
  try {
    const info = await stat(resolved)
    if (!info.isDirectory()) return null
    try {
      return await realpath(resolved)
    } catch {
      return resolved
    }
  } catch {
    return null
  }
}

async function classifyGitMarker(dirPath, isDir) {
  if (isDir) return 'repository'
  try {
    const content = await readFile(path.join(dirPath, '.git'), 'utf8')
    const line = content.split(/\r?\n/, 1)[0]?.trim() ?? ''
    if (!line.toLowerCase().startsWith('gitdir:')) return null
    const target = line.slice('gitdir:'.length).trim().replace(/\\/g, '/')
    if (target.includes('/.git/modules/') || target.includes('/modules/')) return 'submodule'
    if (target.includes('/.git/worktrees/') || target.includes('/worktrees/')) return 'worktree'
    return 'linked'
  } catch {
    return null
  }
}

/**
 * Discover all git repositories under rootDir (recursively up to maxDepth) plus any
 * enclosing parent repository of rootDir or extraRoots.
 */
export async function discoverRepositories(primaryRoot, extraRoots = [], opts = {}) {
  const maxDepth = Math.max(0, Math.min(10, Number(opts.maxDepth ?? DEFAULT_OPTIONS.maxDepth)))
  const maxRepos = Math.max(1, Math.min(200, Number(opts.maxRepos ?? DEFAULT_OPTIONS.maxRepos)))
  const timeoutMs = Number(opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs)
  const ignoreSet = new Set(
    (opts.ignoreDirs ?? DEFAULT_IGNORE_DIRS).map(name => (IS_WIN ? name.toLowerCase() : name)),
  )

  const realPrimary = await resolveRealDir(primaryRoot)
  if (!realPrimary) {
    return {
      rootPath: primaryRoot,
      repos: [],
      truncated: false,
      scannedDirs: 0,
      gitAvailable: true,
      error: `Directory does not exist: ${primaryRoot}`,
    }
  }

  const found = new Map()
  const visitedDirs = new Set()
  let scannedDirs = 0
  let truncated = false
  let gitAvailable = true

  const recordRepo = async (candidatePath, kindHint) => {
    if (found.size >= maxRepos) {
      truncated = true
      return
    }
    const real = await resolveRealDir(candidatePath)
    if (!real) return
    const key = pathKey(real)
    if (found.has(key)) return
    const relPath = toRelativeDisplay(realPrimary, real)
    let kind = kindHint
    if (relPath === '.') {
      kind = kindHint === 'repository' ? 'root' : kindHint
    } else if (relPath.startsWith('..')) {
      kind = 'parent'
    } else if (kindHint === 'repository') {
      kind = 'nested'
    }
    found.set(key, {
      path: real,
      name: path.basename(real) || real,
      relativePath: relPath,
      kind,
    })
  }

  const checkRoots = [realPrimary]
  for (const extra of extraRoots) {
    const resolvedExtra = await resolveRealDir(extra)
    if (resolvedExtra && !checkRoots.some(r => pathKey(r) === pathKey(resolvedExtra))) {
      checkRoots.push(resolvedExtra)
    }
  }

  for (const checkDir of checkRoots) {
    const topRes = await runGit(checkDir, ['rev-parse', '--show-toplevel'], {
      timeoutMs,
      signal: opts.signal,
    })
    if (topRes.notInstalled) {
      gitAvailable = false
      break
    }
    if (topRes.ok) {
      const top = topRes.stdout.trim()
      if (top) {
        let markerIsDir = true
        try {
          const gitEntry = await lstat(path.join(top, '.git'))
          markerIsDir = gitEntry.isDirectory()
        } catch {
          markerIsDir = true
        }
        const kindHint = (await classifyGitMarker(top, markerIsDir)) ?? 'repository'
        await recordRepo(top, kindHint)
      }
    }
  }

  const queue = checkRoots.map(dir => ({ dir, depth: 0 }))
  while (queue.length > 0) {
    if (opts.signal?.aborted) break
    if (found.size >= maxRepos) {
      truncated = true
      break
    }
    const current = queue.shift()
    const key = pathKey(current.dir)
    if (visitedDirs.has(key)) continue
    visitedDirs.add(key)
    scannedDirs += 1

    let entries
    try {
      entries = await readdir(current.dir, { withFileTypes: true })
    } catch {
      continue
    }

    const gitEntry = entries.find(entry => entry.name === '.git')
    if (gitEntry) {
      let isDir = gitEntry.isDirectory()
      let isFile = gitEntry.isFile()
      if (gitEntry.isSymbolicLink()) {
        try {
          const info = await stat(path.join(current.dir, '.git'))
          isDir = info.isDirectory()
          isFile = info.isFile()
        } catch {
          isDir = false
          isFile = false
        }
      }
      if (isDir || isFile) {
        const kindHint = await classifyGitMarker(current.dir, isDir)
        if (kindHint) {
          await recordRepo(current.dir, kindHint)
        }
      }
    }

    if (current.depth >= maxDepth) continue

    for (const entry of entries) {
      if (entry.name === '.git') continue
      const normalizedName = IS_WIN ? entry.name.toLowerCase() : entry.name
      if (ignoreSet.has(normalizedName)) continue
      if (entry.name.startsWith('.') && entry.name !== '.github') continue
      if (entry.isDirectory()) {
        queue.push({ dir: path.join(current.dir, entry.name), depth: current.depth + 1 })
      }
    }
  }

  const repos = [...found.values()].sort((a, b) => {
    if (a.relativePath === '.') return -1
    if (b.relativePath === '.') return 1
    return a.relativePath.localeCompare(b.relativePath, undefined, { numeric: true, sensitivity: 'base' })
  })

  return {
    rootPath: realPrimary,
    repos,
    truncated,
    scannedDirs,
    gitAvailable,
    error: gitAvailable ? null : 'git executable was not found on PATH.',
  }
}

/** Parse `git status --porcelain=v2 --branch -uall -z` output. */
export function parsePorcelainV2(raw) {
  const result = {
    oid: null,
    branch: null,
    detached: false,
    upstream: null,
    ahead: 0,
    behind: 0,
    staged: [],
    unstaged: [],
    untracked: [],
    conflicted: [],
    totalFiles: 0,
    filesTruncated: false,
  }

  if (!raw) return result

  const tokens = raw.split('\0')
  const seenFiles = new Set()

  for (let i = 0; i < tokens.length; i += 1) {
    const entry = tokens[i]
    if (!entry) continue

    if (entry.startsWith('# ')) {
      if (entry.startsWith('# branch.oid ')) {
        const oid = entry.slice('# branch.oid '.length).trim()
        result.oid = oid === '(initial)' ? null : oid
      } else if (entry.startsWith('# branch.head ')) {
        const head = entry.slice('# branch.head '.length).trim()
        if (head === '(detached)') {
          result.detached = true
          result.branch = null
        } else {
          result.detached = false
          result.branch = head
        }
      } else if (entry.startsWith('# branch.upstream ')) {
        result.upstream = entry.slice('# branch.upstream '.length).trim()
      } else if (entry.startsWith('# branch.ab ')) {
        const match = /\+(\d+)\s+-(\d+)/.exec(entry)
        if (match) {
          result.ahead = Number(match[1])
          result.behind = Number(match[2])
        }
      }
      continue
    }

    const type = entry[0]
    if (type === '?') {
      const filePath = entry.slice(2)
      seenFiles.add(filePath)
      result.untracked.push({ path: filePath, status: '?', area: 'untracked' })
    } else if (type === '1') {
      const parts = splitFields(entry, 8)
      if (!parts) continue
      const xy = parts[1]
      const filePath = parts[8]
      seenFiles.add(filePath)
      const x = xy[0]
      const y = xy[1]
      if (x && x !== '.') {
        result.staged.push({ path: filePath, status: x, area: 'staged' })
      }
      if (y && y !== '.') {
        result.unstaged.push({ path: filePath, status: y, area: 'unstaged' })
      }
    } else if (type === '2') {
      const parts = splitFields(entry, 9)
      const origPath = tokens[i + 1] ?? null
      i += 1
      if (!parts) continue
      const xy = parts[1]
      const filePath = parts[9]
      seenFiles.add(filePath)
      const x = xy[0]
      const y = xy[1]
      if (x && x !== '.') {
        result.staged.push({ path: filePath, origPath, status: x, area: 'staged' })
      }
      if (y && y !== '.') {
        result.unstaged.push({ path: filePath, origPath, status: y, area: 'unstaged' })
      }
    } else if (type === 'u') {
      const parts = splitFields(entry, 10)
      if (!parts) continue
      const xy = parts[1]
      const filePath = parts[10]
      seenFiles.add(filePath)
      result.conflicted.push({ path: filePath, status: xy, area: 'conflicted' })
    }
  }

  result.totalFiles = seenFiles.size
  return result
}

function splitFields(line, fixedSpaceCount) {
  const fields = []
  let start = 0
  for (let count = 0; count < fixedSpaceCount; count += 1) {
    const idx = line.indexOf(' ', start)
    if (idx === -1) return null
    fields.push(line.slice(start, idx))
    start = idx + 1
  }
  fields.push(line.slice(start))
  return fields
}

function parseRefDecorations(rawRefs) {
  if (!rawRefs || !rawRefs.trim()) return []
  const refs = []
  for (const part of rawRefs.split(',')) {
    const item = part.trim()
    if (!item) continue
    if (item.startsWith('HEAD -> ')) {
      refs.push({ kind: 'head', label: item.slice('HEAD -> '.length).trim() })
    } else if (item === 'HEAD') {
      refs.push({ kind: 'head', label: 'HEAD' })
    } else if (item.startsWith('tag: ')) {
      refs.push({ kind: 'tag', label: item.slice('tag: '.length).trim() })
    } else if (item.includes('/')) {
      refs.push({ kind: 'remote', label: item })
    } else {
      refs.push({ kind: 'local', label: item })
    }
  }
  return refs
}

function parseCommits(raw) {
  if (!raw) return []
  const records = raw.split('\x1e')
  const commits = []
  for (const rawRecord of records) {
    const record = rawRecord.replace(/^\r?\n+/, '')
    if (!record.trim()) continue
    const [hash, shortHash, parentsRaw, refsRaw, author, committerIso, authorIso, subject] = record.split('\x1f')
    if (!hash || !hash.trim()) continue
    const parents = (parentsRaw ?? '').trim().split(/\s+/).filter(Boolean)
    commits.push({
      hash: hash.trim(),
      shortHash: (shortHash ?? hash.slice(0, 7)).trim(),
      parents,
      isMerge: parents.length > 1,
      refs: parseRefDecorations(refsRaw),
      author: (author ?? '').trim(),
      committerIso: (committerIso ?? '').trim(),
      authorIso: (authorIso ?? '').trim(),
      subject: (subject ?? '').trim(),
    })
  }
  return commits
}

function parseBranches(raw) {
  if (!raw) return []
  const branches = []
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue
    const [headMark, name, upstream, shortHash, subject] = line.split('\x1f')
    if (!name) continue
    branches.push({
      current: headMark === '*',
      name: name.trim(),
      upstream: (upstream ?? '').trim() || null,
      shortHash: (shortHash ?? '').trim(),
      subject: (subject ?? '').trim(),
    })
  }
  return branches
}

function parseRemoteBranches(raw) {
  if (!raw) return []
  const branches = []
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue
    const [name, shortHash, subject] = line.split('\x1f')
    const clean = (name ?? '').trim()
    if (!clean || !clean.includes('/') || clean.endsWith('/HEAD')) continue
    branches.push({
      name: clean,
      shortHash: (shortHash ?? '').trim(),
      subject: (subject ?? '').trim(),
    })
  }
  return branches
}

function parseRemotes(raw) {
  if (!raw) return []
  const map = new Map()
  for (const line of raw.split(/\r?\n/)) {
    const match = /^(\S+)\s+(\S+)\s+\((fetch|push)\)$/.exec(line.trim())
    if (!match) continue
    const [, name, url, kind] = match
    const existing = map.get(name) ?? { name, fetchUrl: null, pushUrl: null }
    if (kind === 'fetch') existing.fetchUrl = url
    if (kind === 'push') existing.pushUrl = url
    map.set(name, existing)
  }
  return [...map.values()]
}

function parseStashes(raw) {
  if (!raw) return []
  const stashes = []
  for (const rawRecord of raw.split('\x1e')) {
    const record = rawRecord.replace(/^\r?\n+/, '')
    if (!record.trim()) continue
    const [ref, shortHash, committerIso, message] = record.split('\x1f')
    if (!ref || !ref.trim()) continue
    stashes.push({
      ref: ref.trim(),
      shortHash: (shortHash ?? '').trim(),
      committerIso: (committerIso ?? '').trim(),
      message: (message ?? '').trim(),
    })
  }
  return stashes
}

function isSafeBranchName(name) {
  if (!name || typeof name !== 'string') return false
  const trimmed = name.trim()
  if (!trimmed || trimmed.startsWith('-') || trimmed.includes('..') || /\s/.test(trimmed)) return false
  return true
}

function validateRelativeFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string' || filePath.includes('\0') || path.isAbsolute(filePath)) {
    return false
  }
  return true
}

/** Query paginated and filtered commit log for one repository. */
export async function queryCommitLog(repoPath, params = {}, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs)
  const limit = Math.max(1, Math.min(100, Number(params.limit ?? DEFAULT_OPTIONS.maxCommits)))
  const skip = Math.max(0, Math.min(10000, Number(params.skip ?? 0)))
  const fmt = '--format=%H%x1f%h%x1f%P%x1f%D%x1f%an%x1f%cI%x1f%aI%x1f%s%x1e'
  const q = typeof params.query === 'string' ? params.query.trim() : ''

  // If user searches by commit hash prefix (e.g. 592a633) with no author filter, resolve directly first.
  if (skip === 0 && q && /^[0-9a-fA-F]{4,40}$/.test(q) && !params.author) {
    const hashRes = await runGit(repoPath, ['log', '-n', '1', fmt, q], { timeoutMs, signal: opts.signal })
    if (hashRes.ok) {
      const exact = parseCommits(hashRes.stdout)
      if (exact.length > 0) {
        return { ok: true, commits: exact, hasMore: false }
      }
    }
  }

  const args = ['log', '--date-order', '-n', String(limit + 1), '--skip', String(skip)]

  if (params.branch === '__all__') {
    args.push('--all')
  } else if (params.branch && isSafeBranchName(params.branch)) {
    args.push(params.branch.trim())
  }
  if (q) {
    args.push('--grep', q, '-i')
  }
  if (typeof params.author === 'string' && params.author.trim()) {
    args.push('--author', params.author.trim(), '-i')
  }
  args.push(fmt)

  const res = await runGit(repoPath, args, { timeoutMs, signal: opts.signal })
  if (!res.ok) {
    if (/does not have any commits yet|unknown revision/i.test(res.stderr)) {
      return { ok: true, commits: [], hasMore: false }
    }
    return { ok: false, error: res.stderr.trim() || res.message, commits: [], hasMore: false }
  }
  const all = parseCommits(res.stdout)
  const hasMore = all.length > limit
  return { ok: true, commits: hasMore ? all.slice(0, limit) : all, hasMore }
}

/** Collect detailed git state for one repository root. */
export async function inspectRepository(repoMeta, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs)
  const maxCommits = Math.max(1, Math.min(100, Number(opts.maxCommits ?? DEFAULT_OPTIONS.maxCommits)))
  const maxFiles = Math.max(20, Math.min(2000, Number(opts.maxFilesPerRepo ?? DEFAULT_OPTIONS.maxFilesPerRepo)))
  const gitOpts = { timeoutMs, signal: opts.signal }

  const [statusRes, logRes, branchRes, remoteBranchRes, remoteRes, stashRes] = await Promise.all([
    runGit(repoMeta.path, ['status', '--porcelain=v2', '--branch', '-uall', '-z'], gitOpts),
    queryCommitLog(repoMeta.path, { limit: maxCommits, skip: 0 }, opts),
    runGit(
      repoMeta.path,
      ['branch', '--format=%(HEAD)%1f%(refname:short)%1f%(upstream:short)%1f%(objectname:short)%1f%(contents:subject)'],
      gitOpts,
    ),
    runGit(
      repoMeta.path,
      ['branch', '-r', '--format=%(refname:short)%1f%(objectname:short)%1f%(contents:subject)'],
      gitOpts,
    ),
    runGit(repoMeta.path, ['remote', '-v'], gitOpts),
    runGit(repoMeta.path, ['stash', 'list', '--format=%gd%x1f%h%x1f%cI%x1f%s%x1e'], gitOpts),
  ])

  if (!statusRes.ok) {
    return {
      ...repoMeta,
      error: statusRes.stderr.trim() || statusRes.message,
      branch: null,
      detached: false,
      oid: null,
      shortOid: null,
      upstream: null,
      ahead: 0,
      behind: 0,
      dirty: false,
      counts: { staged: 0, unstaged: 0, untracked: 0, conflicted: 0, total: 0 },
      files: { staged: [], unstaged: [], untracked: [], conflicted: [] },
      filesTruncated: false,
      commits: [],
      hasMoreCommits: false,
      branches: [],
      remoteBranches: [],
      remotes: [],
      stashes: [],
      stashCount: 0,
    }
  }

  const parsed = parsePorcelainV2(statusRes.stdout)
  const cap = (arr) => {
    if (arr.length <= maxFiles) return arr
    parsed.filesTruncated = true
    return arr.slice(0, maxFiles)
  }
  const staged = cap(parsed.staged)
  const unstaged = cap(parsed.unstaged)
  const untracked = cap(parsed.untracked)
  const conflicted = cap(parsed.conflicted)

  const counts = {
    staged: parsed.staged.length,
    unstaged: parsed.unstaged.length,
    untracked: parsed.untracked.length,
    conflicted: parsed.conflicted.length,
    total: parsed.totalFiles,
  }
  const dirty = counts.staged + counts.unstaged + counts.untracked + counts.conflicted > 0
  const stashes = stashRes.ok ? parseStashes(stashRes.stdout) : []

  return {
    ...repoMeta,
    error: null,
    branch: parsed.branch,
    detached: parsed.detached,
    oid: parsed.oid,
    shortOid: parsed.oid ? parsed.oid.slice(0, 7) : null,
    upstream: parsed.upstream,
    ahead: parsed.ahead,
    behind: parsed.behind,
    dirty,
    counts,
    files: { staged, unstaged, untracked, conflicted },
    filesTruncated: parsed.filesTruncated,
    commits: logRes.ok ? logRes.commits : [],
    hasMoreCommits: Boolean(logRes.hasMore),
    branches: branchRes.ok ? parseBranches(branchRes.stdout) : [],
    remoteBranches: remoteBranchRes.ok ? parseRemoteBranches(remoteBranchRes.stdout) : [],
    remotes: remoteRes.ok ? parseRemotes(remoteRes.stdout) : [],
    stashes,
    stashCount: stashes.length,
  }
}

/** Run async mapper with bounded concurrency. */
export async function mapWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length)
  let nextIndex = 0
  const workerCount = Math.min(Math.max(1, concurrency), items.length)
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const idx = nextIndex
      nextIndex += 1
      results[idx] = await fn(items[idx], idx)
    }
  })
  await Promise.all(workers)
  return results
}

/** Full scan: discover repositories and inspect each repository's git state. */
export async function scanWorkspaceRepositories(primaryRoot, extraRoots = [], opts = {}) {
  const startedAt = Date.now()
  const discovery = await discoverRepositories(primaryRoot, extraRoots, opts)
  if (!discovery.gitAvailable || discovery.error) {
    return {
      rootPath: discovery.rootPath,
      scannedAt: Date.now(),
      durationMs: Date.now() - startedAt,
      scannedDirs: discovery.scannedDirs,
      truncated: discovery.truncated,
      gitAvailable: discovery.gitAvailable,
      error: discovery.error,
      repos: [],
    }
  }

  const inspected = await mapWithConcurrency(discovery.repos, 4, repo => inspectRepository(repo, opts))
  return {
    rootPath: discovery.rootPath,
    scannedAt: Date.now(),
    durationMs: Date.now() - startedAt,
    scannedDirs: discovery.scannedDirs,
    truncated: discovery.truncated,
    gitAvailable: true,
    error: null,
    repos: inspected,
  }
}

/** Lightweight status-only refresh for already discovered repository metadata. */
export async function refreshRepositoryList(repoMetas, opts = {}) {
  const startedAt = Date.now()
  const validMetas = []
  for (const meta of repoMetas) {
    const dir = await resolveRealDir(meta.path)
    if (dir) validMetas.push({ ...meta, path: dir })
  }
  const inspected = await mapWithConcurrency(validMetas, 4, repo => inspectRepository(repo, opts))
  return {
    scannedAt: Date.now(),
    durationMs: Date.now() - startedAt,
    repos: inspected,
  }
}

/** Fetch all discovered repositories concurrently and return refreshed snapshots. */
export async function fetchAllRepositories(repoMetas, opts = {}) {
  const startedAt = Date.now()
  const validMetas = []
  for (const meta of repoMetas) {
    const dir = await resolveRealDir(meta.path)
    if (dir) validMetas.push({ ...meta, path: dir })
  }
  const results = await mapWithConcurrency(validMetas, 3, async (meta) => {
    const gitOpts = { timeoutMs: opts.networkTimeoutMs ?? DEFAULT_OPTIONS.networkTimeoutMs, signal: opts.signal }
    const fetchRes = await runGit(meta.path, ['fetch', '--all', '--prune'], gitOpts)
    const repo = await inspectRepository(meta, opts)
    return {
      name: meta.name,
      ok: fetchRes.ok,
      error: fetchRes.ok ? null : (summarizeGitOutput(fetchRes) || fetchRes.message),
      repo,
    }
  })
  const failed = results.filter(r => !r.ok).map(r => `${r.name}: ${r.error}`)
  return {
    ok: failed.length === 0,
    error: failed.length > 0 ? failed.join('\n') : null,
    scannedAt: Date.now(),
    durationMs: Date.now() - startedAt,
    repos: results.map(r => r.repo),
  }
}

/** Read a bounded unified diff for one changed or untracked file inside a repository. */
export async function readFileDiff(repoPath, filePath, area, opts = {}) {
  const maxDiffBytes = Number(opts.maxDiffBytes ?? DEFAULT_OPTIONS.maxDiffBytes)
  const timeoutMs = Number(opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs)

  if (!validateRelativeFilePath(filePath)) {
    return { ok: false, error: 'Invalid relative file path.' }
  }

  if (area === 'untracked') {
    const resolvedFile = path.resolve(repoPath, filePath)
    if (!isPathWithin(repoPath, resolvedFile)) {
      return { ok: false, error: 'File path escapes repository root.' }
    }
    let handle = null
    try {
      const info = await lstat(resolvedFile)
      if (!info.isFile()) {
        return { ok: true, diff: '', binary: false, truncated: false, empty: true, isUntracked: true }
      }
      handle = await open(resolvedFile, 'r')
      const readLen = Math.min(info.size, maxDiffBytes + 1)
      const buf = Buffer.allocUnsafe(readLen)
      const { bytesRead } = readLen > 0 ? await handle.read(buf, 0, readLen, 0) : { bytesRead: 0 }
      const truncated = info.size > maxDiffBytes || bytesRead > maxDiffBytes
      const slice = buf.subarray(0, Math.min(bytesRead, maxDiffBytes))
      if (slice.includes(0)) {
        return { ok: true, diff: '', binary: true, truncated: false, empty: false, isUntracked: true }
      }
      const text = slice.toString('utf8')
      const lines = text.split(/\r?\n/)
      const body = lines.map(line => `+${line}`).join('\n')
      const header = `--- /dev/null\n+++ b/${filePath}\n@@ -0,0 +1,${lines.length} @@\n`
      return {
        ok: true,
        diff: header + body,
        binary: false,
        truncated,
        empty: text.length === 0,
        isUntracked: true,
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    } finally {
      if (handle) await handle.close().catch(() => {})
    }
  }

  let args
  if (area === 'head') {
    // Combined working-tree diff against HEAD (IDEA Commit view default for tracked files).
    args = ['diff', 'HEAD', '--no-color', '--unified=3', '--', filePath]
  } else if (area === 'staged') {
    args = ['diff', '--cached', '--no-color', '--unified=3', '--', filePath]
  } else {
    args = ['diff', '--no-color', '--unified=3', '--', filePath]
  }

  let res = await runGitBoundedStdout(repoPath, args, {
    timeoutMs,
    maxBytes: maxDiffBytes,
    signal: opts.signal,
  })
  // Fallback for initial/unborn HEAD where `git diff HEAD` fails.
  if (!res.ok && area === 'head') {
    res = await runGitBoundedStdout(repoPath, ['diff', '--cached', '--no-color', '--unified=3', '--', filePath], {
      timeoutMs,
      maxBytes: maxDiffBytes,
      signal: opts.signal,
    })
  }
  if (!res.ok) {
    return { ok: false, error: res.error || 'Failed to read diff.' }
  }

  const diff = res.stdout
  const binary = /^Binary files .* differ$/m.test(diff) || /^GIT binary patch$/m.test(diff)
  return {
    ok: true,
    diff,
    binary,
    truncated: Boolean(res.truncated),
    empty: diff.trim().length === 0,
    isUntracked: false,
  }
}

function parseNameStatusZ(raw) {
  const entries = []
  if (!raw) return entries
  const tokens = raw.split('\0')
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (!token) continue
    const code = token[0]
    if (code === 'R' || code === 'C') {
      const origPath = tokens[i + 1] ?? ''
      const newPath = tokens[i + 2] ?? ''
      i += 2
      if (newPath) entries.push({ status: code, path: newPath, origPath })
    } else {
      const filePath = tokens[i + 1] ?? ''
      i += 1
      if (filePath) entries.push({ status: code, path: filePath, origPath: null })
    }
  }
  return entries
}

function parseNumstatZ(raw) {
  const map = new Map()
  if (!raw) return map
  const tokens = raw.split('\0')
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (!token) continue
    const tab1 = token.indexOf('\t')
    const tab2 = tab1 >= 0 ? token.indexOf('\t', tab1 + 1) : -1
    if (tab1 < 0 || tab2 < 0) continue
    const addedRaw = token.slice(0, tab1)
    const deletedRaw = token.slice(tab1 + 1, tab2)
    let filePath = token.slice(tab2 + 1)
    if (filePath === '') {
      // Rename entry in -z numstat: next two tokens are origPath and newPath.
      const _orig = tokens[i + 1] ?? ''
      filePath = tokens[i + 2] ?? ''
      i += 2
    }
    const binary = addedRaw === '-' || deletedRaw === '-'
    map.set(filePath, {
      added: binary ? 0 : Number(addedRaw) || 0,
      deleted: binary ? 0 : Number(deletedRaw) || 0,
      binary,
    })
  }
  return map
}

/** Read structured commit metadata and changed file list with per-file numstat (IDEA Git Log). */
export async function readCommitDetails(repoPath, hash, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs)
  if (!hash || typeof hash !== 'string' || !/^[0-9a-fA-F]{4,40}$/.test(hash)) {
    return { ok: false, error: 'Invalid commit hash.' }
  }
  const gitOpts = { timeoutMs, signal: opts.signal }
  const [metaRes, statusRes, numstatRes] = await Promise.all([
    runGit(repoPath, ['show', '-s', '--format=%H%x1f%h%x1f%P%x1f%D%x1f%an%x1f%ae%x1f%cI%x1f%aI%x1f%s%x1f%b', hash], gitOpts),
    runGit(repoPath, ['show', '--first-parent', '-m', '--format=', '--name-status', '-z', '-M', hash], gitOpts),
    runGit(repoPath, ['show', '--first-parent', '-m', '--format=', '--numstat', '-z', '-M', hash], gitOpts),
  ])
  if (!metaRes.ok) {
    return { ok: false, error: metaRes.stderr.trim() || metaRes.message }
  }
  const [fullHash, shortHash, parentsRaw, refsRaw, author, email, committerIso, authorIso, subject, body] = metaRes.stdout.split('\x1f')
  const statusList = statusRes.ok ? parseNameStatusZ(statusRes.stdout) : []
  const statsMap = numstatRes.ok ? parseNumstatZ(numstatRes.stdout) : new Map()
  const files = statusList.map((entry) => {
    const st = statsMap.get(entry.path) ?? { added: 0, deleted: 0, binary: false }
    return {
      path: entry.path,
      origPath: entry.origPath,
      status: entry.status,
      added: st.added,
      deleted: st.deleted,
      binary: st.binary,
    }
  })
  return {
    ok: true,
    commit: {
      hash: (fullHash ?? hash).trim(),
      shortHash: (shortHash ?? hash.slice(0, 7)).trim(),
      parents: (parentsRaw ?? '').trim().split(/\s+/).filter(Boolean),
      refs: parseRefDecorations(refsRaw),
      author: (author ?? '').trim(),
      email: (email ?? '').trim(),
      committerIso: (committerIso ?? '').trim(),
      authorIso: (authorIso ?? '').trim(),
      subject: (subject ?? '').trim(),
      body: (body ?? '').trim(),
    },
    files,
  }
}

/** Read a bounded diff for a single file inside one commit (IDEA Git Log file diff). */
export async function readCommitFileDiff(repoPath, hash, filePath, opts = {}) {
  const maxDiffBytes = Number(opts.maxDiffBytes ?? DEFAULT_OPTIONS.maxDiffBytes)
  const timeoutMs = Number(opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs)
  if (!hash || typeof hash !== 'string' || !/^[0-9a-fA-F]{4,40}$/.test(hash)) {
    return { ok: false, error: 'Invalid commit hash.' }
  }
  if (!validateRelativeFilePath(filePath)) {
    return { ok: false, error: 'Invalid relative file path.' }
  }
  const res = await runGitBoundedStdout(
    repoPath,
    ['show', '--first-parent', '-m', '--format=', '--no-color', '--unified=3', hash, '--', filePath],
    { timeoutMs, maxBytes: maxDiffBytes, signal: opts.signal },
  )
  if (!res.ok) {
    return { ok: false, error: res.error || 'Failed to read commit file diff.' }
  }
  const diff = res.stdout
  const binary = /^Binary files .* differ$/m.test(diff) || /^GIT binary patch$/m.test(diff)
  return {
    ok: true,
    diff,
    binary,
    truncated: Boolean(res.truncated),
    empty: diff.trim().length === 0,
  }
}

/** Read a bounded commit summary and patch for one commit hash. */
export async function readCommitDiff(repoPath, hash, opts = {}) {
  const maxDiffBytes = Number(opts.maxDiffBytes ?? DEFAULT_OPTIONS.maxDiffBytes)
  const timeoutMs = Number(opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs)

  if (!hash || typeof hash !== 'string' || !/^[0-9a-fA-F]{4,40}$/.test(hash)) {
    return { ok: false, error: 'Invalid commit hash.' }
  }

  const res = await runGitBoundedStdout(
    repoPath,
    ['show', '--stat', '--patch', '--no-color', '--unified=3', hash],
    {
      timeoutMs,
      maxBytes: maxDiffBytes,
      signal: opts.signal,
    },
  )
  if (!res.ok) {
    return { ok: false, error: res.error || 'Failed to read commit diff.' }
  }
  const diff = res.stdout
  return {
    ok: true,
    diff,
    truncated: Boolean(res.truncated),
    empty: diff.trim().length === 0,
  }
}

function summarizeGitOutput(res) {
  return [res.stdout?.trim(), res.stderr?.trim()].filter(Boolean).join('\n').trim()
}

/** Stage specified relative paths or all changes in a repository. */
export async function stageChanges(repoMeta, { paths, all } = {}, opts = {}) {
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  let res
  if (all) {
    res = await runGit(repoMeta.path, ['add', '-A'], gitOpts)
  } else {
    const cleanPaths = Array.isArray(paths) ? paths.filter(validateRelativeFilePath) : []
    if (cleanPaths.length === 0) {
      return { ok: false, error: 'No valid file paths provided to stage.' }
    }
    res = await runGit(repoMeta.path, ['add', '--', ...cleanPaths], gitOpts)
  }
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res), repo }
}

/** Unstage specified relative paths or all staged changes in a repository. */
export async function unstageChanges(repoMeta, { paths, all } = {}, opts = {}) {
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  let res
  if (all) {
    res = await runGit(repoMeta.path, ['reset', 'HEAD'], gitOpts)
    if (!res.ok && /unborn|ambiguous argument 'HEAD'|unknown revision/i.test(res.stderr)) {
      res = await runGit(repoMeta.path, ['rm', '--cached', '-r', '--', '.'], gitOpts)
    }
  } else {
    const cleanPaths = Array.isArray(paths) ? paths.filter(validateRelativeFilePath) : []
    if (cleanPaths.length === 0) {
      return { ok: false, error: 'No valid file paths provided to unstage.' }
    }
    res = await runGit(repoMeta.path, ['restore', '--staged', '--', ...cleanPaths], gitOpts)
    if (!res.ok) {
      res = await runGit(repoMeta.path, ['reset', 'HEAD', '--', ...cleanPaths], gitOpts)
    }
    if (!res.ok && /unborn|ambiguous argument 'HEAD'|unknown revision/i.test(res.stderr)) {
      res = await runGit(repoMeta.path, ['rm', '--cached', '--', ...cleanPaths], gitOpts)
    }
  }
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res), repo }
}

/** IDEA-style commit: commit exactly the checked files (optionally with --amend and push). */
export async function commitSelected(repoMeta, { paths, untrackedPaths, message, amend, push } = {}, opts = {}) {
  const trimmed = typeof message === 'string' ? message.trim() : ''
  if (!trimmed) {
    return { ok: false, error: 'Commit message cannot be empty.' }
  }
  const cleanPaths = Array.isArray(paths) ? paths.filter(validateRelativeFilePath) : []
  const cleanUntracked = Array.isArray(untrackedPaths) ? untrackedPaths.filter(validateRelativeFilePath) : []
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }

  if (!amend && cleanPaths.length === 0) {
    return { ok: false, error: 'Select at least one file to commit.' }
  }

  // Check if HEAD exists (unborn branch cannot use `git commit --only -- <paths>`).
  const headCheck = await runGit(repoMeta.path, ['rev-parse', '--verify', 'HEAD'], gitOpts)
  const hasHead = headCheck.ok

  let commitRes
  if (cleanPaths.length === 0 && amend) {
    commitRes = await runGit(repoMeta.path, ['commit', '--amend', '-m', trimmed], gitOpts)
  } else if (!hasHead) {
    const addRes = await runGit(repoMeta.path, ['add', '-A', '--', ...cleanPaths], gitOpts)
    if (!addRes.ok) {
      const repo = await inspectRepository(repoMeta, opts)
      return { ok: false, error: summarizeGitOutput(addRes) || addRes.message, repo }
    }
    commitRes = await runGit(repoMeta.path, ['commit', '-m', trimmed], gitOpts)
  } else {
    if (cleanUntracked.length > 0) {
      const intentRes = await runGit(repoMeta.path, ['add', '-N', '--', ...cleanUntracked], gitOpts)
      if (!intentRes.ok) {
        const repo = await inspectRepository(repoMeta, opts)
        return { ok: false, error: summarizeGitOutput(intentRes) || intentRes.message, repo }
      }
    }
    const commitArgs = ['commit', '--only']
    if (amend) commitArgs.push('--amend')
    commitArgs.push('-m', trimmed, '--', ...cleanPaths)
    commitRes = await runGit(repoMeta.path, commitArgs, gitOpts)
  }

  if (!commitRes.ok) {
    const repo = await inspectRepository(repoMeta, opts)
    return { ok: false, error: summarizeGitOutput(commitRes) || commitRes.message, repo }
  }

  const outputs = [summarizeGitOutput(commitRes)]
  if (push) {
    const pushRes = await runGit(repoMeta.path, ['push'], {
      timeoutMs: opts.networkTimeoutMs ?? DEFAULT_OPTIONS.networkTimeoutMs,
      signal: opts.signal,
    })
    const repo = await inspectRepository(repoMeta, opts)
    if (!pushRes.ok) {
      return {
        ok: false,
        committed: true,
        error: `Commit succeeded, but push failed:\n${summarizeGitOutput(pushRes) || pushRes.message}`,
        repo,
      }
    }
    const pushOut = summarizeGitOutput(pushRes)
    if (pushOut) outputs.push(pushOut)
    return { ok: true, committed: true, pushed: true, output: outputs.filter(Boolean).join('\n'), repo }
  }

  const repo = await inspectRepository(repoMeta, opts)
  return { ok: true, committed: true, pushed: false, output: outputs.filter(Boolean).join('\n'), repo }
}

/** IDEA-style batch Rollback: restore tracked files and safely delete untracked files. */
export async function rollbackFiles(repoMeta, { trackedPaths, untrackedPaths } = {}, opts = {}) {
  const tracked = Array.isArray(trackedPaths) ? trackedPaths.filter(validateRelativeFilePath) : []
  const untracked = Array.isArray(untrackedPaths) ? untrackedPaths.filter(validateRelativeFilePath) : []
  if (tracked.length === 0 && untracked.length === 0) {
    return { ok: false, error: 'No files selected to roll back.' }
  }
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  const errors = []

  if (tracked.length > 0) {
    let res = await runGit(repoMeta.path, ['restore', '--staged', '--worktree', '--', ...tracked], gitOpts)
    if (!res.ok) {
      await runGit(repoMeta.path, ['reset', 'HEAD', '--', ...tracked], gitOpts)
      res = await runGit(repoMeta.path, ['checkout', '--', ...tracked], gitOpts)
    }
    if (!res.ok) {
      errors.push(summarizeGitOutput(res) || res.message)
    }
  }

  let deletedCount = 0
  for (const filePath of untracked) {
    const resolvedFile = path.resolve(repoMeta.path, filePath)
    if (!isPathWithin(repoMeta.path, resolvedFile) || pathKey(resolvedFile) === pathKey(repoMeta.path)) {
      errors.push(`Escapes repo root: ${filePath}`)
      continue
    }
    try {
      const info = await lstat(resolvedFile)
      if (info.isDirectory()) {
        errors.push(`Skipped directory: ${filePath}`)
        continue
      }
      const trackedCheck = await runGit(repoMeta.path, ['ls-files', '--error-unmatch', '--', filePath], gitOpts)
      if (trackedCheck.ok) {
        errors.push(`Refused to delete tracked file: ${filePath}`)
        continue
      }
      await rm(resolvedFile, { recursive: false, force: false })
      deletedCount += 1
    } catch (err) {
      errors.push(`${filePath}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const repo = await inspectRepository(repoMeta, opts)
  if (errors.length > 0) {
    return { ok: false, error: errors.join('\n'), repo }
  }
  return {
    ok: true,
    output: `Rolled back ${tracked.length} tracked and ${deletedCount} untracked file(s).`,
    repo,
  }
}

/** Discard unstaged modifications for one tracked file or remove one untracked file. */
export async function discardFileChange(repoMeta, { filePath, untracked } = {}, opts = {}) {
  return rollbackFiles(
    repoMeta,
    untracked ? { trackedPaths: [], untrackedPaths: [filePath] } : { trackedPaths: [filePath], untrackedPaths: [] },
    opts,
  )
}

/** Create a commit from currently staged changes. */
export async function commitStaged(repoMeta, { message } = {}, opts = {}) {
  const trimmed = typeof message === 'string' ? message.trim() : ''
  if (!trimmed) {
    return { ok: false, error: 'Commit message cannot be empty.' }
  }
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  const res = await runGit(repoMeta.path, ['commit', '-m', trimmed], gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res), repo }
}

/** Switch to an existing local branch. */
export async function checkoutBranch(repoMeta, { branch } = {}, opts = {}) {
  if (!isSafeBranchName(branch)) {
    return { ok: false, error: 'Invalid branch name.' }
  }
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  const res = await runGit(repoMeta.path, ['checkout', branch.trim()], gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res), repo }
}

/** Checkout a remote branch as a local tracking branch (or switch to it if it already exists). */
export async function checkoutRemoteBranch(repoMeta, { remoteBranch } = {}, opts = {}) {
  if (!isSafeBranchName(remoteBranch) || !remoteBranch.includes('/')) {
    return { ok: false, error: 'Invalid remote branch name.' }
  }
  const cleanRemote = remoteBranch.trim()
  const localName = cleanRemote.slice(cleanRemote.indexOf('/') + 1)
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  let res = await runGit(repoMeta.path, ['checkout', '--track', cleanRemote], gitOpts)
  if (!res.ok && /already exists/i.test(res.stderr)) {
    res = await runGit(repoMeta.path, ['checkout', localName], gitOpts)
  }
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res), repo }
}

/** Create and switch to a new local branch from current HEAD. */
export async function createBranch(repoMeta, { branch } = {}, opts = {}) {
  if (!isSafeBranchName(branch)) {
    return { ok: false, error: 'Invalid branch name.' }
  }
  const target = branch.trim()
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  const check = await runGit(repoMeta.path, ['check-ref-format', '--branch', target], gitOpts)
  if (!check.ok) {
    return { ok: false, error: summarizeGitOutput(check) || `Invalid Git branch name: ${target}` }
  }
  const res = await runGit(repoMeta.path, ['checkout', '-b', target], gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res), repo }
}

/** Merge a branch into the current branch without opening an editor. */
export async function mergeBranch(repoMeta, { branch } = {}, opts = {}) {
  if (!isSafeBranchName(branch)) {
    return { ok: false, error: 'Invalid branch name.' }
  }
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  const res = await runGit(repoMeta.path, ['merge', '--no-edit', branch.trim()], gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res) || `Merged ${branch.trim()}.`, repo }
}

/** Safely delete a merged local branch (-d). */
export async function deleteBranch(repoMeta, { branch, force } = {}, opts = {}) {
  if (!isSafeBranchName(branch)) {
    return { ok: false, error: 'Invalid branch name.' }
  }
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  const flag = force ? '-D' : '-d'
  const res = await runGit(repoMeta.path, ['branch', flag, branch.trim()], gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res), repo }
}

/** Cherry-pick one commit onto the current branch. */
export async function cherryPickCommit(repoMeta, { hash } = {}, opts = {}) {
  if (!hash || typeof hash !== 'string' || !/^[0-9a-fA-F]{4,40}$/.test(hash)) {
    return { ok: false, error: 'Invalid commit hash.' }
  }
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  const res = await runGit(repoMeta.path, ['cherry-pick', hash], gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res) || `Cherry-picked ${hash.slice(0, 7)}.`, repo }
}

/** IDEA-style Undo Last Commit: soft reset HEAD~1 keeping all changes in working tree/index. */
export async function undoLastCommit(repoMeta, opts = {}) {
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  const res = await runGit(repoMeta.path, ['reset', '--soft', 'HEAD~1'], gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res) || 'Last commit undone (changes preserved).', repo }
}

/** Save current working tree changes (including untracked) to a new stash entry. */
export async function stashSave(repoMeta, { message } = {}, opts = {}) {
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  const args = ['stash', 'push', '-u']
  const trimmed = typeof message === 'string' ? message.trim() : ''
  if (trimmed) args.push('-m', trimmed)
  const res = await runGit(repoMeta.path, args, gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res) || 'Changes stashed.', repo }
}

function isValidStashRef(ref) {
  return typeof ref === 'string' && /^stash@\{\d+\}$/.test(ref.trim())
}

/** Apply, pop, or drop one stash entry. */
export async function stashOperate(repoMeta, mode, { ref } = {}, opts = {}) {
  if (!isValidStashRef(ref)) {
    return { ok: false, error: 'Invalid stash reference.' }
  }
  const verb = mode === 'pop' ? 'pop' : mode === 'drop' ? 'drop' : 'apply'
  const gitOpts = { timeoutMs: opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs, signal: opts.signal }
  const res = await runGit(repoMeta.path, ['stash', verb, ref.trim()], gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res) || `Stash ${verb} completed.`, repo }
}

/** Fetch updates from remotes without interactive prompts. */
export async function fetchRepo(repoMeta, opts = {}) {
  const gitOpts = { timeoutMs: opts.networkTimeoutMs ?? DEFAULT_OPTIONS.networkTimeoutMs, signal: opts.signal }
  const res = await runGit(repoMeta.path, ['fetch', '--all', '--prune'], gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res) || 'Fetch completed.', repo }
}

/** Pull from upstream without opening an editor or prompting interactively. */
export async function pullRepo(repoMeta, opts = {}) {
  const gitOpts = { timeoutMs: opts.networkTimeoutMs ?? DEFAULT_OPTIONS.networkTimeoutMs, signal: opts.signal }
  const res = await runGit(repoMeta.path, ['pull', '--no-edit'], gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res) || 'Already up to date.', repo }
}

/** Push current branch to its upstream remote without interactive prompts. */
export async function pushRepo(repoMeta, opts = {}) {
  const gitOpts = { timeoutMs: opts.networkTimeoutMs ?? DEFAULT_OPTIONS.networkTimeoutMs, signal: opts.signal }
  const res = await runGit(repoMeta.path, ['push'], gitOpts)
  const repo = await inspectRepository(repoMeta, opts)
  if (!res.ok) {
    return { ok: false, error: summarizeGitOutput(res) || res.message, repo }
  }
  return { ok: true, output: summarizeGitOutput(res) || 'Push completed.', repo }
}

/** Read outgoing unpushed commits and upstream target for the Push confirmation dialog. */
export async function readPushPreview(repoPath, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs)
  const gitOpts = { timeoutMs, signal: opts.signal }

  const [branchRes, upstreamRes, remotesRes] = await Promise.all([
    runGit(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD'], gitOpts),
    runGit(repoPath, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], gitOpts),
    runGit(repoPath, ['remote'], gitOpts),
  ])

  const branch = branchRes.ok ? branchRes.stdout.trim() : 'HEAD'
  const upstream = upstreamRes.ok ? upstreamRes.stdout.trim() : null
  const remotes = remotesRes.ok ? remotesRes.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : []
  const defaultRemote = remotes[0] || null

  const fmt = '--format=%H%x1f%h%x1f%P%x1f%D%x1f%an%x1f%cI%x1f%aI%x1f%s%x1e'
  let commits = []
  let totalCount = 0

  if (upstream) {
    const [countRes, logRes] = await Promise.all([
      runGit(repoPath, ['rev-list', '--count', `${upstream}..HEAD`], gitOpts),
      runGit(repoPath, ['log', '--date-order', '-n', '50', fmt, `${upstream}..HEAD`], gitOpts),
    ])
    totalCount = countRes.ok ? Math.max(0, Number.parseInt(countRes.stdout.trim(), 10) || 0) : 0
    if (logRes.ok) {
      commits = parseCommits(logRes.stdout)
      if (totalCount === 0) totalCount = commits.length
    }
  } else {
    const logRes = await runGit(repoPath, ['log', '--date-order', '-n', '20', fmt, 'HEAD', '--not', '--remotes'], gitOpts)
    if (logRes.ok) {
      commits = parseCommits(logRes.stdout)
      totalCount = commits.length
    }
  }

  return {
    ok: true,
    branch,
    upstream,
    defaultRemote,
    totalCount,
    commits,
  }
}

/**
 * Collect a compact diff + untracked preview + recent commit subjects for AI commit message generation.
 * Strictly bounds output size so LLM calls remain fast and within context limits.
 */
export async function collectCommitDiffContext(repoPath, params = {}, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs)
  const maxDiffBytes = Number(opts.maxDiffBytes ?? 14000)
  const maxUntrackedTotalBytes = 4000
  const maxSingleUntrackedBytes = 1200

  const rawPaths = Array.isArray(params.paths) ? params.paths.filter(validateRelativeFilePath) : []
  const untrackedSet = new Set(
    Array.isArray(params.untrackedPaths) ? params.untrackedPaths.filter(validateRelativeFilePath) : [],
  )
  const trackedPaths = rawPaths.filter(p => !untrackedSet.has(p))
  const untrackedList = [...untrackedSet]

  const [branchRes, recentRes] = await Promise.all([
    runGit(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD'], { timeoutMs, signal: opts.signal }),
    runGit(repoPath, ['log', '-n', '5', '--format=%s'], { timeoutMs, signal: opts.signal }),
  ])
  const branch = branchRes.ok ? branchRes.stdout.trim() : ''
  const recentCommits = recentRes.ok
    ? recentRes.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    : []

  const hasExplicitSelection = rawPaths.length > 0 || untrackedList.length > 0
  let statText = ''
  let diffText = ''
  let diffTruncated = false

  if (trackedPaths.length > 0 || !hasExplicitSelection) {
    const pathArgs = trackedPaths.length > 0 ? ['--', ...trackedPaths] : []
    const statRes = await runGit(repoPath, ['diff', '--stat', '--no-color', 'HEAD', ...pathArgs], { timeoutMs, signal: opts.signal })
    if (statRes.ok) {
      statText = statRes.stdout.trim()
    } else {
      // Fallback for unborn HEAD (initial commit).
      const cachedStat = await runGit(repoPath, ['diff', '--cached', '--stat', '--no-color', ...pathArgs], { timeoutMs, signal: opts.signal })
      if (cachedStat.ok) statText = cachedStat.stdout.trim()
    }

    const diffRes = await runGitBoundedStdout(
      repoPath,
      ['diff', '--no-color', '--unified=2', 'HEAD', ...pathArgs],
      { timeoutMs, maxBytes: maxDiffBytes, signal: opts.signal },
    )
    if (diffRes.ok && diffRes.stdout.trim()) {
      diffText = diffRes.stdout
      diffTruncated = Boolean(diffRes.truncated)
    } else {
      const cachedDiff = await runGitBoundedStdout(
        repoPath,
        ['diff', '--cached', '--no-color', '--unified=2', ...pathArgs],
        { timeoutMs, maxBytes: maxDiffBytes, signal: opts.signal },
      )
      if (cachedDiff.ok && cachedDiff.stdout.trim()) {
        diffText = cachedDiff.stdout
        diffTruncated = Boolean(cachedDiff.truncated)
      }
    }
  }

  const untrackedPreviews = []
  let untrackedBytesUsed = 0
  for (const relPath of untrackedList.slice(0, 15)) {
    if (untrackedBytesUsed >= maxUntrackedTotalBytes) {
      untrackedPreviews.push({ path: relPath, preview: '(omitted due to size limit)' })
      continue
    }
    const absPath = path.resolve(repoPath, relPath)
    if (!isPathInside(repoPath, absPath)) continue
    try {
      const handle = await fs.open(absPath, 'r')
      try {
        const cap = Math.min(maxSingleUntrackedBytes, maxUntrackedTotalBytes - untrackedBytesUsed)
        const buf = Buffer.alloc(cap)
        const { bytesRead } = await handle.read(buf, 0, cap, 0)
        const slice = buf.subarray(0, bytesRead)
        if (slice.includes(0)) {
          untrackedPreviews.push({ path: relPath, preview: '(binary file)' })
        } else {
          untrackedBytesUsed += bytesRead
          untrackedPreviews.push({ path: relPath, preview: slice.toString('utf8') })
        }
      } finally {
        await handle.close()
      }
    } catch {
      untrackedPreviews.push({ path: relPath, preview: '(unreadable)' })
    }
  }

  if (!diffText.trim() && !statText && untrackedPreviews.length === 0) {
    return { ok: false, error: 'No changes found to generate a commit message.' }
  }

  return {
    ok: true,
    branch,
    recentCommits,
    stat: statText,
    diff: diffText,
    diffTruncated,
    untrackedFiles: untrackedList,
    untrackedPreviews,
  }
}
