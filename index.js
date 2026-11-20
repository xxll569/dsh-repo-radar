import path from 'node:path'
import {
  checkoutBranch,
  checkoutRemoteBranch,
  cherryPickCommit,
  commitSelected,
  commitStaged,
  createBranch,
  DEFAULT_OPTIONS,
  deleteBranch,
  discardFileChange,
  fetchAllRepositories,
  fetchRepo,
  inspectRepository,
  mergeBranch,
  pathKey,
  pullRepo,
  pushRepo,
  queryCommitLog,
  readCommitDetails,
  readCommitDiff,
  readCommitFileDiff,
  readFileDiff,
  refreshRepositoryList,
  rollbackFiles,
  scanWorkspaceRepositories,
  stageChanges,
  stashOperate,
  stashSave,
  toRelativeDisplay,
  undoLastCommit,
  unstageChanges,
} from './git-scanner.js'

export const name = 'multi-git-view'
export const inject = ['connection']

const SCAN_PATH = '/api/multi-git.scan'
const REFRESH_ALL_PATH = '/api/multi-git.refresh-all'
const FETCH_ALL_PATH = '/api/multi-git.fetch-all'
const REPO_REFRESH_PATH = '/api/multi-git.refresh-repo'
const LOG_PATH = '/api/multi-git.log'
const FILE_DIFF_PATH = '/api/multi-git.diff'
const COMMIT_DETAILS_PATH = '/api/multi-git.commit-details'
const COMMIT_FILE_DIFF_PATH = '/api/multi-git.commit-file-diff'
const COMMIT_DIFF_PATH = '/api/multi-git.commit-diff'
const ACTION_PATH = '/api/multi-git.action'

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

async function parseJsonBody(request) {
  try {
    const value = await request.json()
    if (value && typeof value === 'object' && !Array.isArray(value)) return value
    return null
  } catch {
    return null
  }
}

function resolveSessionContext(ctx, body = {}) {
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null
  let workspacePath = typeof body.workspacePath === 'string' && path.isAbsolute(body.workspacePath)
    ? body.workspacePath
    : null
  let cwd = typeof body.cwd === 'string' && path.isAbsolute(body.cwd)
    ? body.cwd
    : null

  try {
    if (sessionId) {
      const registry = ctx.get('workspaceRegistry')
      if (!workspacePath && registry && typeof registry.list === 'function') {
        const ws = registry.list().find(item => Array.isArray(item.sessionIds) && item.sessionIds.includes(sessionId))
        if (ws && typeof ws.path === 'string' && path.isAbsolute(ws.path)) {
          workspacePath = ws.path
        }
      }
      const sessions = ctx.get('sessions')
      const workingDirectory = ctx.get('workingDirectory')
      if (!cwd && sessions && typeof sessions.get === 'function') {
        const session = sessions.get(sessionId)
        if (session) {
          if (workingDirectory && typeof workingDirectory.get === 'function') {
            cwd = workingDirectory.get(session)
          } else if (session.header && typeof session.header.cwd === 'string') {
            cwd = session.header.cwd
          }
        }
      }
    }
  } catch {
    // Fall back to caller-supplied absolute paths.
  }

  const primaryRoot = workspacePath || cwd
  const extraRoots = []
  if (cwd && primaryRoot && pathKey(cwd) !== pathKey(primaryRoot)) {
    extraRoots.push(cwd)
  }
  return { sessionId, workspacePath, cwd, primaryRoot, extraRoots }
}

/**
 * Shared Host service owning all multi-repository discovery, log, diff, and Git actions.
 * Both the browser Fetch endpoints and the optional agent tool call these exact methods.
 */
class MultiGitService {
  constructor(ctx, config = {}) {
    this.ctx = ctx
    this.options = {
      maxDepth: typeof config.maxDepth === 'number' ? config.maxDepth : DEFAULT_OPTIONS.maxDepth,
      maxRepos: typeof config.maxRepos === 'number' ? config.maxRepos : DEFAULT_OPTIONS.maxRepos,
      maxCommits: typeof config.maxCommits === 'number' ? config.maxCommits : DEFAULT_OPTIONS.maxCommits,
      maxFilesPerRepo: typeof config.maxFilesPerRepo === 'number' ? config.maxFilesPerRepo : DEFAULT_OPTIONS.maxFilesPerRepo,
      maxDiffBytes: typeof config.maxDiffBytes === 'number' ? config.maxDiffBytes : DEFAULT_OPTIONS.maxDiffBytes,
      timeoutMs: typeof config.timeoutMs === 'number' ? config.timeoutMs : DEFAULT_OPTIONS.timeoutMs,
      networkTimeoutMs: typeof config.networkTimeoutMs === 'number' ? config.networkTimeoutMs : DEFAULT_OPTIONS.networkTimeoutMs,
      ignoreDirs: Array.isArray(config.ignoreDirs) ? config.ignoreDirs : DEFAULT_OPTIONS.ignoreDirs,
    }
    this.knownRepos = new Map()
  }

  rememberRepos(repos) {
    for (const repo of repos) {
      this.knownRepos.set(pathKey(repo.path), {
        path: repo.path,
        name: repo.name,
        relativePath: repo.relativePath,
        kind: repo.kind,
      })
    }
    if (this.knownRepos.size > 500) {
      const oldestKeys = [...this.knownRepos.keys()].slice(0, this.knownRepos.size - 300)
      for (const k of oldestKeys) this.knownRepos.delete(k)
    }
  }

  resolveKnownRepo(repoPath, rootPath) {
    if (!repoPath || typeof repoPath !== 'string' || !path.isAbsolute(repoPath)) return null
    const meta = this.knownRepos.get(pathKey(repoPath))
    if (!meta) return null
    if (rootPath && typeof rootPath === 'string' && path.isAbsolute(rootPath)) {
      return { ...meta, relativePath: toRelativeDisplay(rootPath, meta.path) }
    }
    return meta
  }

  async scan(params, signal) {
    const resolved = resolveSessionContext(this.ctx, params)
    if (!resolved.primaryRoot) {
      return { ok: false, status: 400, error: 'No workspace or session working directory available.' }
    }
    const reqDepth = typeof params.maxDepth === 'number' && Number.isFinite(params.maxDepth)
      ? Math.max(0, Math.min(10, Math.floor(params.maxDepth)))
      : this.options.maxDepth
    const result = await scanWorkspaceRepositories(resolved.primaryRoot, resolved.extraRoots, {
      ...this.options,
      maxDepth: reqDepth,
      signal,
    })
    this.rememberRepos(result.repos)
    return {
      ok: true,
      status: 200,
      workspacePath: resolved.workspacePath,
      cwd: resolved.cwd,
      maxDepth: reqDepth,
      ...result,
    }
  }

  async refreshAll(params, signal) {
    const repoPaths = Array.isArray(params.repoPaths) ? params.repoPaths : []
    const rootPath = typeof params.rootPath === 'string' && path.isAbsolute(params.rootPath)
      ? params.rootPath
      : null
    const metas = []
    for (const rp of repoPaths) {
      const meta = this.resolveKnownRepo(rp, rootPath)
      if (meta) metas.push(meta)
    }
    if (metas.length === 0) {
      return this.scan(params, signal)
    }
    const refreshed = await refreshRepositoryList(metas, { ...this.options, signal })
    return {
      ok: true,
      status: 200,
      rootPath: rootPath ?? metas[0]?.path ?? null,
      ...refreshed,
    }
  }

  async fetchAll(params, signal) {
    const repoPaths = Array.isArray(params.repoPaths) ? params.repoPaths : []
    const rootPath = typeof params.rootPath === 'string' && path.isAbsolute(params.rootPath)
      ? params.rootPath
      : null
    const metas = []
    for (const rp of repoPaths) {
      const meta = this.resolveKnownRepo(rp, rootPath)
      if (meta) metas.push(meta)
    }
    if (metas.length === 0) {
      return { ok: false, status: 404, error: 'No scanned repositories to fetch; please rescan.' }
    }
    const res = await fetchAllRepositories(metas, { ...this.options, signal })
    return { status: res.ok ? 200 : 200, rootPath: rootPath ?? metas[0]?.path ?? null, ...res }
  }

  async refreshRepo(params, signal) {
    const meta = this.resolveKnownRepo(params.repoPath, params.rootPath)
    if (!meta) {
      return { ok: false, status: 404, error: 'Repository is not in the current scan set; please rescan.' }
    }
    const repo = await inspectRepository(meta, { ...this.options, signal })
    return { ok: true, status: 200, repo, scannedAt: Date.now() }
  }

  async queryLog(params, signal) {
    const meta = this.resolveKnownRepo(params.repoPath, params.rootPath)
    if (!meta) {
      return { ok: false, status: 404, error: 'Repository is not in the current scan set; please rescan.' }
    }
    const res = await queryCommitLog(meta.path, params, { ...this.options, signal })
    return { status: res.ok ? 200 : 400, ...res }
  }

  async fileDiff(params, signal) {
    const meta = this.resolveKnownRepo(params.repoPath, params.rootPath)
    if (!meta) {
      return { ok: false, status: 404, error: 'Repository is not in the current scan set; please rescan.' }
    }
    const area = (
      params.area === 'head'
      || params.area === 'staged'
      || params.area === 'untracked'
      || params.area === 'conflicted'
    )
      ? params.area
      : 'unstaged'
    const result = await readFileDiff(meta.path, params.filePath, area, { ...this.options, signal })
    return { status: result.ok ? 200 : 400, ...result }
  }

  async commitDetails(params, signal) {
    const meta = this.resolveKnownRepo(params.repoPath, params.rootPath)
    if (!meta) {
      return { ok: false, status: 404, error: 'Repository is not in the current scan set; please rescan.' }
    }
    const result = await readCommitDetails(meta.path, params.hash, { ...this.options, signal })
    return { status: result.ok ? 200 : 400, ...result }
  }

  async commitFileDiff(params, signal) {
    const meta = this.resolveKnownRepo(params.repoPath, params.rootPath)
    if (!meta) {
      return { ok: false, status: 404, error: 'Repository is not in the current scan set; please rescan.' }
    }
    const result = await readCommitFileDiff(meta.path, params.hash, params.filePath, { ...this.options, signal })
    return { status: result.ok ? 200 : 400, ...result }
  }

  async commitDiff(params, signal) {
    const meta = this.resolveKnownRepo(params.repoPath, params.rootPath)
    if (!meta) {
      return { ok: false, status: 404, error: 'Repository is not in the current scan set; please rescan.' }
    }
    const result = await readCommitDiff(meta.path, params.hash, { ...this.options, signal })
    return { status: result.ok ? 200 : 400, ...result }
  }

  async runAction(params, signal) {
    const meta = this.resolveKnownRepo(params.repoPath, params.rootPath)
    if (!meta) {
      return { ok: false, status: 404, error: 'Repository is not in the current scan set; please rescan.' }
    }
    const opts = { ...this.options, signal }
    const action = params.action
    let result
    switch (action) {
      case 'stage':
        result = await stageChanges(meta, { paths: params.paths, all: Boolean(params.all) }, opts)
        break
      case 'unstage':
        result = await unstageChanges(meta, { paths: params.paths, all: Boolean(params.all) }, opts)
        break
      case 'discard':
        result = await discardFileChange(
          meta,
          { filePath: params.filePath, untracked: Boolean(params.untracked) },
          opts,
        )
        break
      case 'rollback':
        result = await rollbackFiles(
          meta,
          { trackedPaths: params.trackedPaths, untrackedPaths: params.untrackedPaths },
          opts,
        )
        break
      case 'commit':
        result = await commitStaged(meta, { message: params.message }, opts)
        break
      case 'commit_selected':
        result = await commitSelected(
          meta,
          {
            paths: params.paths,
            untrackedPaths: params.untrackedPaths,
            message: params.message,
            amend: Boolean(params.amend),
            push: Boolean(params.push),
          },
          opts,
        )
        break
      case 'checkout':
        result = await checkoutBranch(meta, { branch: params.branch }, opts)
        break
      case 'checkout_remote':
        result = await checkoutRemoteBranch(meta, { remoteBranch: params.remoteBranch }, opts)
        break
      case 'create_branch':
        result = await createBranch(meta, { branch: params.branch }, opts)
        break
      case 'merge_branch':
        result = await mergeBranch(meta, { branch: params.branch }, opts)
        break
      case 'delete_branch':
        result = await deleteBranch(meta, { branch: params.branch, force: Boolean(params.force) }, opts)
        break
      case 'cherry_pick':
        result = await cherryPickCommit(meta, { hash: params.hash }, opts)
        break
      case 'undo_commit':
        result = await undoLastCommit(meta, opts)
        break
      case 'stash_save':
        result = await stashSave(meta, { message: params.message }, opts)
        break
      case 'stash_apply':
        result = await stashOperate(meta, 'apply', { ref: params.ref }, opts)
        break
      case 'stash_pop':
        result = await stashOperate(meta, 'pop', { ref: params.ref }, opts)
        break
      case 'stash_drop':
        result = await stashOperate(meta, 'drop', { ref: params.ref }, opts)
        break
      case 'fetch':
        result = await fetchRepo(meta, opts)
        break
      case 'pull':
        result = await pullRepo(meta, opts)
        break
      case 'push':
        result = await pushRepo(meta, opts)
        break
      default:
        return { ok: false, status: 400, error: `Unsupported action: ${String(action)}` }
    }
    return { status: result.ok ? 200 : 400, action, ...result }
  }
}

function formatToolSummary(action, result) {
  if (!result.ok) {
    return `multi_git(${action}) failed: ${result.error || 'unknown error'}`
  }
  if (action === 'scan') {
    const lines = [
      `Scanned ${result.rootPath} (depth=${result.maxDepth}, dirs=${result.scannedDirs}, repos=${result.repos.length}):`,
    ]
    for (const r of result.repos) {
      const branchLabel = r.detached ? `detached@${r.shortOid || '?'}` : (r.branch || 'HEAD')
      const ab = (r.ahead || r.behind) ? ` (+${r.ahead}/-${r.behind})` : ''
      const counts = r.counts
        ? `staged=${r.counts.staged}, unstaged=${r.counts.unstaged}, untracked=${r.counts.untracked}, conflicted=${r.counts.conflicted}`
        : ''
      lines.push(`- ${r.relativePath} [${r.kind}] (${branchLabel}${ab}) ${counts}`)
    }
    return lines.join('\n')
  }
  if (action === 'commit_details' && result.commit) {
    const lines = [
      `${result.commit.shortHash} ${result.commit.subject} (${result.commit.author})`,
      ...result.files.map(f => `  ${f.status} ${f.path} (+${f.added}/-${f.deleted})`),
    ]
    return lines.join('\n')
  }
  if (action === 'diff' || action === 'commit_diff' || action === 'commit_file_diff') {
    if (result.binary) return '[binary file]'
    if (result.empty) return '(no diff)'
    return result.truncated ? `${result.diff}\n... [truncated]` : result.diff
  }
  const repoLine = result.repo
    ? `Repo ${result.repo.relativePath} (${result.repo.branch || result.repo.shortOid || 'HEAD'}): staged=${result.repo.counts.staged}, unstaged=${result.repo.counts.unstaged}, untracked=${result.repo.counts.untracked}`
    : ''
  return [result.output, repoLine].filter(Boolean).join('\n') || 'OK'
}

/**
 * Host half of the multi-git conversation view plugin.
 * Registers authenticated Fetch routes under /api/multi-git.* and a shared agent tool.
 */
export function apply(ctx, config = {}) {
  const service = new MultiGitService(ctx, config)

  const registerJsonPost = (routePath, handler) => {
    ctx.connection.fetch.register({
      path: routePath,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async (request) => {
        const body = await parseJsonBody(request)
        if (!body) return jsonResponse(400, { ok: false, error: 'Invalid JSON request body.' })
        const { status, ...payload } = await handler(body, request.signal)
        return jsonResponse(status, payload)
      },
    })
  }

  registerJsonPost(SCAN_PATH, (b, s) => service.scan(b, s))
  registerJsonPost(REFRESH_ALL_PATH, (b, s) => service.refreshAll(b, s))
  registerJsonPost(FETCH_ALL_PATH, (b, s) => service.fetchAll(b, s))
  registerJsonPost(REPO_REFRESH_PATH, (b, s) => service.refreshRepo(b, s))
  registerJsonPost(LOG_PATH, (b, s) => service.queryLog(b, s))
  registerJsonPost(FILE_DIFF_PATH, (b, s) => service.fileDiff(b, s))
  registerJsonPost(COMMIT_DETAILS_PATH, (b, s) => service.commitDetails(b, s))
  registerJsonPost(COMMIT_FILE_DIFF_PATH, (b, s) => service.commitFileDiff(b, s))
  registerJsonPost(COMMIT_DIFF_PATH, (b, s) => service.commitDiff(b, s))
  registerJsonPost(ACTION_PATH, (b, s) => service.runAction(b, s))

  ctx.inject(['tools'], (toolCtx) => {
    toolCtx.effect(() => toolCtx.tools.register({
      name: 'multi_git',
      description: 'Discover nested Git repositories in the current workspace and run IntelliJ-style repository operations (scan, log, diff, commit_details, commit_file_diff, commit_diff, stage, unstage, commit, commit_selected, rollback, discard, checkout, checkout_remote, create_branch, merge_branch, delete_branch, cherry_pick, undo_commit, stash_save, stash_apply, stash_pop, stash_drop, fetch, pull, push). Call action="scan" first to discover repoPath values.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: [
              'scan',
              'refresh_repo',
              'log',
              'diff',
              'commit_details',
              'commit_file_diff',
              'commit_diff',
              'stage',
              'unstage',
              'discard',
              'rollback',
              'commit',
              'commit_selected',
              'checkout',
              'checkout_remote',
              'create_branch',
              'merge_branch',
              'delete_branch',
              'cherry_pick',
              'undo_commit',
              'stash_save',
              'stash_apply',
              'stash_pop',
              'stash_drop',
              'fetch',
              'pull',
              'push',
            ],
            description: 'Operation to run.',
          },
          maxDepth: { type: 'integer', description: 'Maximum subdirectory depth for scan (0 to 10).' },
          repoPath: { type: 'string', description: 'Absolute repository root path returned by scan.' },
          filePath: { type: 'string', description: 'Repository-relative file path.' },
          area: { type: 'string', enum: ['head', 'staged', 'unstaged', 'untracked', 'conflicted'], description: 'Change area for diff.' },
          hash: { type: 'string', description: 'Commit hash for commit details, diff, or cherry-pick.' },
          paths: { type: 'array', items: { type: 'string' }, description: 'Repository-relative file paths.' },
          trackedPaths: { type: 'array', items: { type: 'string' }, description: 'Tracked paths for rollback.' },
          untrackedPaths: { type: 'array', items: { type: 'string' }, description: 'Untracked paths for rollback or commit_selected.' },
          all: { type: 'boolean', description: 'Stage or unstage all files.' },
          untracked: { type: 'boolean', description: 'Set true when discarding an untracked file.' },
          message: { type: 'string', description: 'Commit or stash message.' },
          amend: { type: 'boolean', description: 'Amend the previous commit (commit_selected).' },
          push: { type: 'boolean', description: 'Push immediately after commit (commit_selected).' },
          branch: { type: 'string', description: 'Branch name for log filter, checkout, create, merge, or delete.' },
          remoteBranch: { type: 'string', description: 'Remote branch name (e.g. origin/main) for checkout_remote.' },
          force: { type: 'boolean', description: 'Force delete branch (-D).' },
          ref: { type: 'string', description: 'Stash ref such as stash@{0}.' },
          query: { type: 'string', description: 'Commit message filter for action="log".' },
          author: { type: 'string', description: 'Author filter for action="log".' },
          limit: { type: 'integer', description: 'Page size for action="log".' },
          skip: { type: 'integer', description: 'Offset for action="log".' },
        },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: true,
          required: ['ok'],
          properties: {
            ok: { type: 'boolean', description: 'Whether the operation succeeded.' },
          },
        },
        render: (args, value) => [{
          type: 'text',
          text: formatToolSummary(args && typeof args === 'object' ? args.action : 'multi_git', value),
        }],
      },
      isConcurrencySafe: (args) => {
        const act = args && typeof args === 'object' ? args.action : null
        return (
          act === 'scan'
          || act === 'refresh_repo'
          || act === 'log'
          || act === 'diff'
          || act === 'commit_details'
          || act === 'commit_file_diff'
          || act === 'commit_diff'
        )
      },
      async execute(rawArgs, exec) {
        const args = rawArgs && typeof rawArgs === 'object' ? rawArgs : {}
        const sessionId = exec?.agent?.session?.id
        const params = { ...args, sessionId }
        const signal = exec?.signal
        let res
        if (args.action === 'scan') res = await service.scan(params, signal)
        else if (args.action === 'refresh_repo') res = await service.refreshRepo(params, signal)
        else if (args.action === 'log') res = await service.queryLog(params, signal)
        else if (args.action === 'diff') res = await service.fileDiff(params, signal)
        else if (args.action === 'commit_details') res = await service.commitDetails(params, signal)
        else if (args.action === 'commit_file_diff') res = await service.commitFileDiff(params, signal)
        else if (args.action === 'commit_diff') res = await service.commitDiff(params, signal)
        else res = await service.runAction(params, signal)
        const { status: _status, ...clean } = res
        return clean
      },
    }), 'multi-git-view: agent tool')
  })
}
