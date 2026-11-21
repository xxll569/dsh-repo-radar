<div align="center">
  <img src="./docs/logo.svg" width="72" height="72" alt="DSH RepoRadar icon" />
  <h1>DSH RepoRadar</h1>
  <p>
    <strong>IntelliJ IDEA-style multi-repository Git workbench plugin for DeepSeek Harness (DSH)</strong>
  </p>
  <p>
    <a href="./README.md">English</a> · <a href="./README.zh-CN.md">简体中文</a> ·
    <a href="https://github.com/xxll569/dsh-repo-radar/releases">Releases</a> ·
    <a href="https://github.com/xxll569/dsh-repo-radar/issues">Issues</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/DeepSeek%20Harness-Plugin-3574F0" alt="DSH Plugin" />
    <img src="https://img.shields.io/npm/v/dsh-repo-radar?color=2A9D8F" alt="npm version" />
    <img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="Apache-2.0 License" />
  </p>
</div>

---

By default, **DeepSeek Harness (DSH)** only detects `.git` at the workspace root. When your real repositories sit in nested subdirectories (e.g., `code/backend/`, `code/frontend/`, `refs/sdk/`) or your workspace contains multiple services, submodules, and worktrees, DSH cannot display or manage them together.

**DSH RepoRadar** (`dsh-repo-radar`) automatically scans workspace subdirectories to discover all Git repositories and embeds an **IntelliJ IDEA New UI** style Git tool window directly in the DSH conversation view bar—complete with a directory-tree Commit workflow, Side-by-Side Diff, 3-pane Git Log, Branch & Stash management, and the `multi_git` agent tool.

<p align="center">
  <img src="./docs/preview.jpg" width="100%" alt="DSH RepoRadar — IntelliJ IDEA-style multi-repository Git workbench inside DeepSeek Harness" />
</p>

---

## Features

- **Automatic Nested & Multi-Repository Discovery**
  - Discovers root repos, nested subdirectory repos, parent repos, Git submodules, and Git worktrees (default scan depth `6`) while skipping build/cache directories (`node_modules`, `target`, `dist`, `.git`, etc.).
  - Two-tier refresh: lightweight status refresh on tab return or AI turn completion, plus full directory rescan on demand.
  - **Fetch All** to concurrently run `git fetch --all --prune` across every discovered repository.
- **IntelliJ IDEA New UI Tool Window**
  - **Repositories Sidebar**: Collapsible repository switcher with search, *Dirty only* filter, branch name, and pending change count.
  - **Commit Tab**:
    - Compressed directory tree (*Compact Middle Packages* style) with tri-state checkboxes, IDEA file-status colors (`Modified`, `Added`, `Deleted`, `Unversioned`, `Conflict`), and Tree/Flat toggle.
    - Check-to-commit workflow supporting **Commit**, **Commit and Push...**, **Amend**, and batch or single-file **Rollback** with confirmation dialog.
    - **AI Commit Message Generator**: One-click **AI Generate** using your configured DSH model (`中文` / `English` / `Auto`) based on checked file diffs and recent repo commit style.
    - **IDEA-style Push Confirmation Dialog**: Preview local → remote branch mapping and every outgoing unpushed commit before pushing.
  - **Diff Viewer**:
    - **Side-by-Side** and **Unified** diff modes with 3px gutter change markers, line numbers, `+N -M` stats, and `↑` / `↓` hunk navigation.
  - **Git Log Tab (3-Pane)**:
    - Left **Branches Tree** (`HEAD`, `All`, `Local`, `Remote`) with click-to-filter, quick `Checkout`, and `+` New Branch.
    - Center **Commit Table** with graph rail, colored ref pills (`HEAD`, local, remote, tags), search by text or commit hash, author filter, sort order toggle, pagination (`Load more`), and **Undo Commit** (`git reset --soft HEAD~1`).
    - Right **Commit Inspector** with changed-files directory tree (`+N -M` numstat), **Cherry-pick**, hash copy, and single-file diff preview.
  - **Branch & Stash Popovers**:
    - Create, checkout, merge, and delete local branches; checkout remote tracking branches; copy remote URLs; and save, apply, pop, or drop stashes.
- **Shared `multi_git` Agent Tool**
  - Exposes the exact same repository discovery, log, diff, and safe Git operations to the DSH AI agent.

---

## Installation Guide

### Prerequisites

- **DeepSeek Harness (DSH)** (CLI, Web, or Desktop)
- **`git`** installed and available on your system `PATH`

### Method 1: Install Directly via `dsh` CLI (One Command, No Manual Clone)

If you use the `dsh` CLI (`web`, `tui`, `headless`, `sdk`, or custom profiles), install directly from **npm** (or GitHub):

```bash
# Install from npm (recommended)
dsh plugin --profile web add dsh-repo-radar

# Or install directly from GitHub / a specific release tag
dsh plugin --profile web add https://github.com/xxll569/dsh-repo-radar.git
dsh plugin --profile web add https://github.com/xxll569/dsh-repo-radar.git#v1.1.0
```

> **Note for DSH Desktop users**: A standalone npm-installed `dsh` CLI rejects `--profile desktop`; use Desktop's own bundled `dsh` command (after opening Desktop once and quitting it):
> ```bash
> dsh plugin --profile desktop add dsh-repo-radar
> ```
> Or use **Method 2 / Method 3** directly inside the running Desktop app without quitting.

### Method 2: Install via DSH Chat Agent (One Sentence)

If your DSH session has `plugin_manager` enabled, simply ask your DSH assistant:

> *"Install the DSH plugin `dsh-repo-radar`."*

*(Or point to `https://github.com/xxll569/dsh-repo-radar.git` or a local folder.)* Restart DSH once after installation so the Host plugin takes effect.

### Method 3: Install via DSH GUI (Package Name, Git URL, or Local Directory)

1. Open **DSH** → **Plugins** (插件管理) → **Add plugin**.
2. Enter `dsh-repo-radar` (or `https://github.com/xxll569/dsh-repo-radar.git`, or select a cloned folder from [Releases](https://github.com/xxll569/dsh-repo-radar/releases)).
3. Confirm **`DSH RepoRadar`** is **Enabled**, then **restart DSH once** so the Host backend routes (`/api/multi-git.*`) and `multi_git` agent tool are mounted.
4. Enter any session with a workspace or working directory and click **`Git repos`** (`Git 仓库`) in the top conversation view bar.

### Updating & Uninstalling

- **Update**:
  - Installed via npm or GitHub: run `dsh plugin --profile <name> update dsh-repo-radar` (or update in **Plugins**), then restart DSH.
  - Installed via local directory: run `git pull` inside your cloned folder, then restart DSH.
- **Disable / Uninstall**:
  - Run `dsh plugin --profile <name> remove dsh-repo-radar` or toggle off/remove **`dsh-repo-radar`** in **Plugins**. Turning it off cleanly removes the `Git repos` tab and `multi_git` tool without touching your Git repositories.

---

## Project Structure

```text
dsh-repo-radar/
├── package.json       # DSH bundle manifest & metadata
├── cordis.patch.yml   # Cordis plugin registration patch
├── index.js           # Host plugin: /api/multi-git.* routes & multi_git tool
├── git-scanner.js     # Non-interactive git CLI runner, repo discovery & parsers
├── client.js          # Web UI slot (conversation.view) in IDEA New UI style
├── icon.svg           # Plugin icon (36x36 SVG)
├── docs/              # Detail docs & preview illustration
└── locale/            # Localized plugin metadata (en.json / zh.json)
```

## Security Notes

- All `git` commands execute locally and non-interactively (`GIT_TERMINAL_PROMPT=0`, `GIT_OPTIONAL_LOCKS=0`) via `execFile` / `spawn` without shell string interpolation.
- Repository paths and file paths are strictly validated against discovered repositories and checked for path traversal.

## License

[Apache-2.0](./LICENSE)
