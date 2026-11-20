# DSH RepoRadar (`dsh-repo-radar`)

An **IntelliJ IDEA-style multi-repository Git workbench plugin** for **DeepSeek Harness (DSH)**.

By default, DeepSeek Harness only checks the workspace root for `.git`. In real-world monorepos, multi-service workspaces, or projects where the actual Git repository lives inside nested subdirectories (e.g. `code/app/`, `services/api/`, `frontend/`), DSH cannot detect or manage those repositories together. **DSH RepoRadar** automatically scans workspace subdirectories to discover every Git repository and brings an IDEA-style Git tool window right into your conversation view.

---

## Features / 核心功能

- **Automatic Nested & Multi-Repo Discovery**
  - Discovers root repos, nested subdirectory repos, parent repos, Git submodules, and Git worktrees (default depth 6) while skipping heavy folders (`node_modules`, `target`, `dist`, `.git`, etc.).
  - Two-tier refresh: fast lightweight status refresh on tab open and after AI turns finish, plus full directory rescan on demand.
  - **Fetch All** across all discovered repositories concurrently.
- **IntelliJ IDEA New UI Style Tool Window**
  - **Repositories Sidebar**: Collapsible flat repository list with search, **Dirty only** filter, branch indicator, and pending file counts.
  - **Commit Tab**:
    - Compressed directory tree (*Compact Middle Packages* style) with tri-state checkboxes, IDEA file-status color coding (`Modified`, `Added`, `Deleted`, `Unversioned`, `Conflict`), and flat/tree toggle.
    - Check-to-commit workflow (`Commit`, `Commit and Push...`, `Amend`), batch & single-file `Rollback` with confirmation dialog.
  - **Diff Viewer**:
    - **Side-by-Side** and **Unified** diff modes with gutter line numbers, 3px gutter change markers, and `↑` / `↓` hunk navigation.
  - **Git Log Tab (3-Pane)**:
    - Left **Branches Tree** (`HEAD`, `All`, `Local`, `Remote`) with click-to-filter, quick `Checkout`, and `+` New Branch.
    - Center **Commit Table** with graph rail, colored **HEAD / Local / Remote / Tag** ref pills, text or **commit hash** search, author filter, sort order toggle, pagination (`Load more`), and **Undo Commit** (`git reset --soft HEAD~1`).
    - Right **Commit Inspector** with changed-files directory tree (`+N -M` numstat), `Cherry-pick`, hash copy, and single-file diff preview.
  - **Header Popovers**:
    - Branch switcher (`Create`, `Checkout`, `Checkout Remote`, `Merge`, `Delete`, and `Remotes` URL copy).
    - **Stash** manager (`Stash`, `Apply`, `Pop`, `Drop`).
- **Shared `multi_git` Agent Tool**
  - Exposes the same repository discovery and Git operations (`scan`, `log`, `diff`, `commit_selected`, `rollback`, `checkout`, `stash_*`, `fetch`, `pull`, `push`, etc.) to the DSH coding agent.

---

## Installation in DeepSeek Harness / 安装方式

### Option 1: Install from Local Directory (Recommended)

1. Clone this repository:
   ```bash
   git clone https://github.com/xxll569/dsh-repo-radar.git
   ```
2. Open **DeepSeek Harness** → **Plugins** → **Add plugin** (local directory) and select the cloned `dsh-repo-radar` folder.
   *(Or ask your DSH agent to install the local bundle directory via `plugin_manager`.)*
3. Restart DSH once after initial installation so the Host plugin routes (`/api/multi-git.*`) and `multi_git` tool are mounted.

---

## Architecture / 项目结构

- `package.json` & `cordis.patch.yml`: DSH bundle manifest and Cordis patch registration.
- `index.js`: Host plugin registering `/api/multi-git.*` authenticated routes and the `multi_git` agent tool.
- `git-scanner.js`: Non-interactive `git` runner (`GIT_TERMINAL_PROMPT=0`, `GIT_OPTIONAL_LOCKS=0`), directory discovery, status/log/diff/numstat parsers, and path-traversal guards.
- `client.js`: Web UI slot (`conversation.view`) implemented in plain ESM + `React.createElement` using DSH CSS theme tokens (`--dsw-alias-*`) for native Light/Dark theme support.
- `locale/en.json`, `locale/zh.json`, `docs/`, `icon.svg`: Localized plugin metadata and icon assets.

---

## Security & Privacy

- All `git` commands run locally and non-interactively via `execFile` / `spawn` (no shell interpolation, strict repo-root and path-containment validation).
- Turning off or removing the bundle cleanly removes the `Git repos` conversation tab and the `multi_git` tool.

## License

[MIT](./LICENSE)
