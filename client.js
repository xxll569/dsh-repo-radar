window.__ModuleLoader__.load({
  id: 'dsh-repo-radar',
  factory(require) {
    const React = require('react');
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    const h = React.createElement;

    const NS = 'multi-git-view';
    const STYLE_ID = 'mgv-plugin-styles';
    const PAGE_SIZE = 80;

    const ZH = {
      'view.tab': 'Git 仓库',
      'header.reposToggle': '显示/隐藏仓库列表',
      'header.reposCount': '{repos} 仓库',
      'header.dirtyCount': '{dirty} 有变更',
      'header.branchTooltip': 'Git 分支与远程仓库（点击切换、新建、合并或检出）',
      'header.updateTooltip': '更新项目 (Pull)',
      'header.pushTooltip': '推送 (Push)',
      'header.fetchTooltip': '获取 (Fetch)',
      'header.fetchAllTooltip': '全部 Fetch（并发拉取所有仓库）',
      'header.stashTooltip': '储藏管理 (Stash)',
      'header.refreshTooltip': '刷新当前状态',
      'header.rescanTooltip': '重新扫描子目录仓库',
      'header.copyPathTooltip': '复制仓库绝对路径',
      'header.copyGitCTooltip': '复制 git -C 命令',
      'header.copied': '已复制',
      'header.tab.commit': 'Commit',
      'header.tab.log': 'Git',
      'rail.title': 'Repositories',
      'rail.searchPlaceholder': '筛选仓库…',
      'rail.dirtyOnly': '仅看有变更',
      'rail.hiddenClean': '隐藏 {count} 个干净仓库',
      'rail.showAll': '全部显示',
      'repo.kind.root': '根',
      'repo.kind.nested': '子目录',
      'repo.kind.submodule': '子模块',
      'repo.kind.worktree': 'Worktree',
      'repo.kind.parent': '上层',
      'repo.kind.linked': '关联',
      'repo.clean': '干净',
      'repo.detached': 'HEAD 分离',
      'repo.noMatches': '无匹配仓库',
      'repo.clearFilters': '清除筛选',
      'empty.title': '未检测到 Git 仓库',
      'empty.desc': '已在 {path} 下扫描 {dirs} 个目录，未发现 .git 仓库。',
      'empty.noDir': '当前会话尚未绑定工作区或工作目录。',
      'empty.rescan': '重新扫描',
      'error.gitMissing': '系统 PATH 中未找到 git 可执行文件。',
      'error.retry': '重试',
      'error.scanFailed': '扫描仓库失败',
      'error.refreshFailed': '刷新状态失败',
      'error.diffFailed': '读取差异失败',
      'error.commitDetailsFailed': '读取提交详情失败',
      'error.logFailed': '加载日志失败',
      'error.actionFailed': 'Git 操作失败',
      'detail.selectPrompt': '请选择一个 Git 仓库',
      'detail.noRemote': '未配置远程仓库',
      'detail.detachedHint': '当前处于分离头指针状态',
      'commit.placeholder': 'Commit Message (Ctrl+Enter 提交)',
      'commit.amend': 'Amend',
      'commit.submit': 'Commit',
      'commit.submitCount': 'Commit ({count})',
      'commit.submitPush': 'Commit and Push...',
      'commit.submitting': '提交中…',
      'commit.selectHint': '请勾选文件或开启 Amend',
      'commit.rollbackTooltip': '回滚勾选文件 (Rollback)',
      'commit.treeTooltip': '按目录分组显示',
      'commit.expandTooltip': '全部展开',
      'commit.collapseTooltip': '全部折叠',
      'commit.refreshTooltip': '刷新变更',
      'changes.filterPlaceholder': '筛选变更文件…',
      'changes.noFileMatches': '无匹配文件',
      'changes.conflicts': 'Merge Conflicts',
      'changes.tracked': 'Changes',
      'changes.unversioned': 'Unversioned Files',
      'changes.stagedMark': 'staged',
      'changes.empty': 'Nothing to commit',
      'changes.cappedHint': '前 {shown} 项',
      'changes.showMore': '展开更多 ({remaining})',
      'file.rollback': '回滚',
      'file.viewDiff': '点击查看差异',
      'diff.modeUnified': 'Unified',
      'diff.modeSplit': 'Side-by-side',
      'diff.prevHunk': '上一处变更',
      'diff.nextHunk': '下一处变更',
      'diff.closeTooltip': '关闭 Diff 面板',
      'splitter.dragTip': '拖动调整大小（双击恢复默认）',
      'inspector.closeTooltip': '关闭提交详情面板',
      'diff.placeholder': '选择左侧文件以查看 Diff',
      'diff.cleanPlaceholder': '工作区干净，无本地变更',
      'diff.loading': '正在加载差异…',
      'diff.empty': '文件内容无文本差异。',
      'diff.binary': '二进制文件，无法显示文本差异。',
      'diff.truncated': '差异内容过大，已截断显示前部分。',
      'diff.oldSide': 'Before (HEAD)',
      'diff.newSide': 'After (Local)',
      'log.branchesToggle': '显示/隐藏分支面板',
      'log.branchAll': 'All',
      'log.branchHead': 'HEAD (当前)',
      'log.searchPlaceholder': 'Text or hash',
      'log.authorPlaceholder': 'User',
      'log.sortDesc': '最新在前',
      'log.sortAsc': '最早在前',
      'log.undoCommit': 'Undo Commit',
      'log.undoTooltip': 'git reset --soft HEAD~1（保留改动回到变更区）',
      'log.colMessage': 'Commit Message',
      'log.colAuthor': 'Author',
      'log.colDate': 'Date',
      'log.colHash': 'Hash',
      'log.loadMore': '加载更多',
      'log.loading': '加载日志中…',
      'log.empty': '无匹配的提交记录',
      'log.placeholder': '选择提交记录以查看变更文件与 Diff',
      'log.changedFiles': 'Changed Files',
      'log.selectFileHint': '点击上方文件查看该文件 Diff',
      'log.cherryPick': 'Cherry-pick',
      'log.cherryPicking': '应用中…',
      'log.copyHash': '复制 Hash',
      'log.mergeBadge': 'Merge',
      'log.authorTimeDiff': '提交于 {commitTime}（作者时间 {authorTime}）',
      'log.committedAt': '提交于 {commitTime}',
      'branches.filterPlaceholder': 'Search branches…',
      'branches.createPlaceholder': 'New branch name…',
      'branches.createBtn': 'Create',
      'branches.creating': 'Creating…',
      'branches.local': 'Local',
      'branches.remote': 'Remote',
      'branches.current': 'HEAD',
      'branches.checkout': 'Checkout',
      'branches.merge': 'Merge',
      'branches.delete': 'Delete',
      'branches.empty': '无分支',
      'remotes.title': 'Remotes',
      'remotes.empty': '无远程仓库',
      'remotes.copyUrl': '复制',
      'stash.placeholder': 'Stash message (optional)…',
      'stash.saveBtn': 'Stash',
      'stash.saving': 'Stashing…',
      'stash.apply': 'Apply',
      'stash.pop': 'Pop',
      'stash.drop': 'Drop',
      'stash.empty': '暂无 Stash 记录',
      'modal.rollbackTitle': 'Rollback Changes',
      'modal.rollbackBody': '确定回滚 {repo} 中选中的 {tracked} 个已跟踪文件并删除 {untracked} 个未跟踪文件吗？此操作不可撤销。',
      'modal.rollbackSingleTracked': '确定回滚 {repo} 中 {file} 的本地更改吗？此操作不可撤销。',
      'modal.rollbackSingleUntracked': '确定永久删除 {repo} 中的未跟踪文件 {file} 吗？此操作不可撤销。',
      'modal.undoTitle': 'Undo Last Commit',
      'modal.undoBody': '对 {repo} 执行 git reset --soft HEAD~1？提交记录将被撤销，修改内容保留在 Changes 中。',
      'modal.deleteBranchTitle': 'Delete Branch',
      'modal.deleteBranchBody': '确定删除 {repo} 中的本地分支 {branch}（安全模式 -d）吗？',
      'modal.dropStashTitle': 'Drop Stash',
      'modal.dropStashBody': '确定永久删除 {repo} 的 {ref}（{message}）吗？',
      'modal.cancel': 'Cancel',
      'modal.confirmRollback': 'Rollback',
      'modal.confirmDelete': 'Delete',
      'modal.confirmUndo': 'Undo Commit',
      'feedback.dismiss': '关闭',
      'feedback.actionOk': '{action} 已完成',
      'feedback.fetchAllOk': '已完成全部 {count} 个仓库的 Fetch',
      'action.commit_selected': 'Commit',
      'action.rollback': 'Rollback',
      'action.discard': 'Rollback',
      'action.checkout': 'Checkout',
      'action.checkout_remote': 'Checkout Remote',
      'action.create_branch': 'New Branch',
      'action.merge_branch': 'Merge',
      'action.delete_branch': 'Delete Branch',
      'action.cherry_pick': 'Cherry-pick',
      'action.undo_commit': 'Undo Commit',
      'action.stash_save': 'Stash',
      'action.stash_apply': 'Apply Stash',
      'action.stash_pop': 'Pop Stash',
      'action.stash_drop': 'Drop Stash',
      'action.fetch': 'Fetch',
      'action.pull': 'Update (Pull)',
      'action.push': 'Push',
      'time.justNow': '刚刚',
      'time.minutesAgo': '{n}分钟前',
      'time.hoursAgo': '{n}小时前',
      'time.daysAgo': '{n}天前',
      'time.monthsAgo': '{n}个月前',
      'time.yearsAgo': '{n}年前',
    };

    const EN = {
      'view.tab': 'Git repos',
      'header.reposToggle': 'Toggle Repositories sidebar',
      'header.reposCount': '{repos} repos',
      'header.dirtyCount': '{dirty} dirty',
      'header.branchTooltip': 'Git Branches & Remotes',
      'header.updateTooltip': 'Update Project (Pull)',
      'header.pushTooltip': 'Push',
      'header.fetchTooltip': 'Fetch',
      'header.fetchAllTooltip': 'Fetch All Repositories',
      'header.stashTooltip': 'Stash Changes',
      'header.refreshTooltip': 'Refresh status',
      'header.rescanTooltip': 'Rescan subdirectories for Git repositories',
      'header.copyPathTooltip': 'Copy repository path',
      'header.copyGitCTooltip': 'Copy git -C command',
      'header.copied': 'Copied',
      'header.tab.commit': 'Commit',
      'header.tab.log': 'Git',
      'rail.title': 'Repositories',
      'rail.searchPlaceholder': 'Filter repositories…',
      'rail.dirtyOnly': 'Dirty only',
      'rail.hiddenClean': '{count} clean hidden',
      'rail.showAll': 'Show all',
      'repo.kind.root': 'Root',
      'repo.kind.nested': 'Nested',
      'repo.kind.submodule': 'Submodule',
      'repo.kind.worktree': 'Worktree',
      'repo.kind.parent': 'Parent',
      'repo.kind.linked': 'Linked',
      'repo.clean': 'Clean',
      'repo.detached': 'Detached HEAD',
      'repo.noMatches': 'No matching repos',
      'repo.clearFilters': 'Reset',
      'empty.title': 'No Git repositories found',
      'empty.desc': 'Scanned {dirs} directories under {path} and found no .git repositories.',
      'empty.noDir': 'No workspace or working directory bound to this session.',
      'empty.rescan': 'Rescan',
      'error.gitMissing': 'git executable not found on PATH.',
      'error.retry': 'Retry',
      'error.scanFailed': 'Repository scan failed',
      'error.refreshFailed': 'Refresh failed',
      'error.diffFailed': 'Failed to load diff',
      'error.commitDetailsFailed': 'Failed to load commit details',
      'error.logFailed': 'Failed to load Git log',
      'error.actionFailed': 'Git operation failed',
      'detail.selectPrompt': 'Select a Git repository',
      'detail.noRemote': 'No remote configured',
      'detail.detachedHint': 'HEAD is detached',
      'commit.placeholder': 'Commit Message (Ctrl+Enter)',
      'commit.amend': 'Amend',
      'commit.submit': 'Commit',
      'commit.submitCount': 'Commit ({count})',
      'commit.submitPush': 'Commit and Push...',
      'commit.submitting': 'Committing…',
      'commit.selectHint': 'Check files or enable Amend',
      'commit.rollbackTooltip': 'Rollback selected changes',
      'commit.treeTooltip': 'Group by directory',
      'commit.expandTooltip': 'Expand All',
      'commit.collapseTooltip': 'Collapse All',
      'commit.refreshTooltip': 'Refresh Changes',
      'changes.filterPlaceholder': 'Filter changed files…',
      'changes.noFileMatches': 'No matching files',
      'changes.conflicts': 'Merge Conflicts',
      'changes.tracked': 'Changes',
      'changes.unversioned': 'Unversioned Files',
      'changes.stagedMark': 'staged',
      'changes.empty': 'Nothing to commit',
      'changes.cappedHint': 'First {shown}',
      'changes.showMore': 'Show more ({remaining})',
      'file.rollback': 'Rollback',
      'file.viewDiff': 'Click to inspect diff',
      'diff.modeUnified': 'Unified',
      'diff.modeSplit': 'Side-by-side',
      'diff.prevHunk': 'Previous Difference',
      'diff.nextHunk': 'Next Difference',
      'diff.closeTooltip': 'Close Diff pane',
      'splitter.dragTip': 'Drag to resize (double-click to reset)',
      'inspector.closeTooltip': 'Close Commit Inspector',
      'diff.placeholder': 'Select a file to view Diff',
      'diff.cleanPlaceholder': 'Working tree clean — nothing to diff',
      'diff.loading': 'Loading diff…',
      'diff.empty': 'No text changes to display.',
      'diff.binary': 'Binary file — diff unavailable.',
      'diff.truncated': 'Diff exceeded size limit and was truncated.',
      'diff.oldSide': 'Before (HEAD)',
      'diff.newSide': 'After (Local)',
      'log.branchesToggle': 'Toggle Branches pane',
      'log.branchAll': 'All',
      'log.branchHead': 'HEAD (Current)',
      'log.searchPlaceholder': 'Text or hash',
      'log.authorPlaceholder': 'User',
      'log.sortDesc': 'Newest',
      'log.sortAsc': 'Oldest',
      'log.undoCommit': 'Undo Commit',
      'log.undoTooltip': 'git reset --soft HEAD~1 (keep changes)',
      'log.colMessage': 'Commit Message',
      'log.colAuthor': 'Author',
      'log.colDate': 'Date',
      'log.colHash': 'Hash',
      'log.loadMore': 'Load more',
      'log.loading': 'Loading log…',
      'log.empty': 'No commits match filter',
      'log.placeholder': 'Select a commit to view changed files & diff',
      'log.changedFiles': 'Changed Files',
      'log.selectFileHint': 'Select a changed file above to view its diff',
      'log.cherryPick': 'Cherry-pick',
      'log.cherryPicking': 'Applying…',
      'log.copyHash': 'Copy Hash',
      'log.mergeBadge': 'Merge',
      'log.authorTimeDiff': 'Committed {commitTime} (authored {authorTime})',
      'log.committedAt': 'Committed {commitTime}',
      'branches.filterPlaceholder': 'Search branches…',
      'branches.createPlaceholder': 'New branch name…',
      'branches.createBtn': 'Create',
      'branches.creating': 'Creating…',
      'branches.local': 'Local',
      'branches.remote': 'Remote',
      'branches.current': 'HEAD',
      'branches.checkout': 'Checkout',
      'branches.merge': 'Merge',
      'branches.delete': 'Delete',
      'branches.empty': 'No branches',
      'remotes.title': 'Remotes',
      'remotes.empty': 'No remotes configured',
      'remotes.copyUrl': 'Copy',
      'stash.placeholder': 'Stash message (optional)…',
      'stash.saveBtn': 'Stash',
      'stash.saving': 'Stashing…',
      'stash.apply': 'Apply',
      'stash.pop': 'Pop',
      'stash.drop': 'Drop',
      'stash.empty': 'No stashes',
      'modal.rollbackTitle': 'Rollback Changes',
      'modal.rollbackBody': 'Rollback {tracked} tracked file(s) and delete {untracked} untracked file(s) in {repo}? This cannot be undone.',
      'modal.rollbackSingleTracked': 'Rollback local changes to {file} in {repo}? This cannot be undone.',
      'modal.rollbackSingleUntracked': 'Delete untracked file {file} in {repo}? This cannot be undone.',
      'modal.undoTitle': 'Undo Last Commit',
      'modal.undoBody': 'Run git reset --soft HEAD~1 in {repo}? All edits remain in Changes.',
      'modal.deleteBranchTitle': 'Delete Branch',
      'modal.deleteBranchBody': 'Delete local branch {branch} in {repo} (-d)?',
      'modal.dropStashTitle': 'Drop Stash',
      'modal.dropStashBody': 'Drop {ref} ({message}) in {repo}? This cannot be undone.',
      'modal.cancel': 'Cancel',
      'modal.confirmRollback': 'Rollback',
      'modal.confirmDelete': 'Delete',
      'modal.confirmUndo': 'Undo Commit',
      'feedback.dismiss': 'Dismiss',
      'feedback.actionOk': '{action} succeeded',
      'feedback.fetchAllOk': 'Fetched updates across {count} repositories',
      'action.commit_selected': 'Commit',
      'action.rollback': 'Rollback',
      'action.discard': 'Rollback',
      'action.checkout': 'Checkout',
      'action.checkout_remote': 'Checkout Remote',
      'action.create_branch': 'New Branch',
      'action.merge_branch': 'Merge',
      'action.delete_branch': 'Delete Branch',
      'action.cherry_pick': 'Cherry-pick',
      'action.undo_commit': 'Undo Commit',
      'action.stash_save': 'Stash',
      'action.stash_apply': 'Apply Stash',
      'action.stash_pop': 'Pop Stash',
      'action.stash_drop': 'Drop Stash',
      'action.fetch': 'Fetch',
      'action.pull': 'Update',
      'action.push': 'Push',
      'time.justNow': 'just now',
      'time.minutesAgo': '{n}m ago',
      'time.hoursAgo': '{n}h ago',
      'time.daysAgo': '{n}d ago',
      'time.monthsAgo': '{n}mo ago',
      'time.yearsAgo': '{n}y ago',
    };

    const CSS = `
.mgv-root {
  /* JetBrains IDEA New UI Palette mapped safely onto DSH theme tokens */
  --mgv-accent: var(--dsw-alias-state-business-primary, #3574F0);
  --mgv-on-accent: var(--dsw-alias-label-on-color, #ffffff);
  --mgv-chrome: var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-module-platform));
  --mgv-canvas: var(--dsw-alias-bg-base);
  --mgv-surface-muted: var(--dsw-alias-bg-module-platform, var(--dsw-alias-card-fill));
  --mgv-hover: var(--dsw-alias-interactive-bg-hover);
  --mgv-sel: color-mix(in srgb, var(--mgv-accent) 16%, transparent);
  --mgv-sel-inactive: var(--dsw-alias-interactive-bg-active);
  --mgv-border: var(--dsw-alias-border-l2);
  --mgv-border-strong: var(--dsw-alias-border-l3, var(--dsw-alias-border-l2));
  --mgv-code-font: var(--ds-font-family-code, 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, sans-serif);

  /* IDEA File Status Colors */
  --mgv-st-mod: var(--dsw-alias-state-business-primary);
  --mgv-st-add: var(--dsw-alias-state-success-primary);
  --mgv-st-del: var(--dsw-alias-label-tertiary);
  --mgv-st-unver: var(--dsw-alias-state-warn-label, var(--dsw-alias-state-warn-primary));
  --mgv-st-conf: var(--dsw-alias-state-error-primary);

  /* IDEA Diff Colors */
  --mgv-add-bg: var(--dsw-alias-file-diff-added-bg, color-mix(in srgb, var(--dsw-alias-state-success-primary) 13%, transparent));
  --mgv-add-gutter: var(--dsw-alias-file-diff-added-gutter, var(--mgv-add-bg));
  --mgv-add-marker: var(--dsw-alias-file-diff-added-marker, var(--dsw-alias-state-success-primary));
  --mgv-del-bg: var(--dsw-alias-file-diff-deleted-bg, color-mix(in srgb, var(--dsw-alias-state-error-primary) 13%, transparent));
  --mgv-del-gutter: var(--dsw-alias-file-diff-deleted-gutter, var(--mgv-del-bg));
  --mgv-del-marker: var(--dsw-alias-file-diff-deleted-marker, var(--dsw-alias-state-error-primary));

  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding-bottom: calc(var(--dsh-composer-height, 152px) + 8px);
  overflow: hidden;
  color: var(--dsw-alias-label-primary);
  background: var(--mgv-canvas);
  font-size: 13.5px;
  line-height: 1.45;
  container-type: inline-size;
}
.mgv-root *, .mgv-root *::before, .mgv-root *::after {
  box-sizing: border-box;
}

@keyframes mgv-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.mgv-spin svg {
  animation: mgv-spin 0.9s linear infinite;
}
/* Single Unified IDEA Tool-Window Header */
.mgv-ide-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 10px;
  min-height: 40px;
  padding: 2px 12px;
  background: var(--mgv-chrome);
  border-bottom: 1px solid var(--mgv-border);
  flex: none;
}
.mgv-ide-header-left {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex: 1;
}
.mgv-ide-header-right {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: none;
}
.mgv-vsep {
  width: 1px;
  height: 18px;
  margin: 0 5px;
  background: var(--mgv-border);
  flex: none;
}

/* IDEA Tool Window Tabs (Commit | Git) */
.mgv-ide-tabs {
  display: flex;
  align-items: stretch;
  height: 38px;
  gap: 2px;
  margin-left: 4px;
}
.mgv-ide-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 11px;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
}
.mgv-ide-tab:hover {
  color: var(--dsw-alias-label-primary);
}
.mgv-ide-tab-active {
  color: var(--dsw-alias-label-primary);
  font-weight: 600;
}
.mgv-ide-tab-active::after {
  content: '';
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: 0;
  height: 2.5px;
  border-radius: 2px 2px 0 0;
  background: var(--mgv-accent);
}
.mgv-ide-tab-badge {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
  font-variant-numeric: tabular-nums;
}

/* IDEA Branch Widget */
.mgv-popover-anchor {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.mgv-branch-widget {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 9px;
  border-radius: 5px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  max-width: 280px;
}
.mgv-branch-widget:hover,
.mgv-branch-widget[aria-expanded='true'] {
  background: var(--mgv-hover);
  border-color: var(--mgv-border);
}
.mgv-branch-widget-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--mgv-code-font);
  font-size: 13px;
}
.mgv-ab-pill {
  font-family: var(--mgv-code-font);
  font-size: 12px;
  font-weight: 600;
  color: var(--mgv-accent);
}

/* IDEA Icon Buttons & Toolbar Buttons */
.mgv-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 90ms ease, color 90ms ease;
}
.mgv-icon-btn:hover:not(:disabled) {
  background: var(--mgv-hover);
  color: var(--dsw-alias-label-primary);
}
.mgv-icon-btn:disabled {
  opacity: 0.36;
  cursor: not-allowed;
}
.mgv-icon-btn-active {
  background: var(--mgv-sel);
  color: var(--mgv-accent);
}
.mgv-icon-btn-danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--mgv-st-conf) 12%, transparent);
  color: var(--mgv-st-conf);
}
.mgv-icon-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--mgv-accent);
}
.mgv-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 29px;
  padding: 0 12px;
  border-radius: 5px;
  border: 1px solid var(--mgv-border-strong);
  background: var(--mgv-canvas);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}
.mgv-btn:hover:not(:disabled) {
  background: var(--mgv-hover);
}
.mgv-btn:disabled {
  opacity: 0.44;
  cursor: not-allowed;
}
.mgv-btn-sm {
  height: 25px;
  padding: 0 9px;
  font-size: 12px;
}
.mgv-btn-primary {
  border-color: var(--mgv-accent);
  background: var(--mgv-accent);
  color: var(--mgv-on-accent);
}
.mgv-btn-primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--mgv-accent) 88%, var(--dsw-alias-label-primary));
}
.mgv-btn-danger-solid {
  border-color: var(--mgv-st-conf);
  background: var(--mgv-st-conf);
  color: var(--mgv-on-accent);
}
.mgv-input, .mgv-select {
  height: 27px;
  padding: 0 8px;
  border-radius: 4px;
  border: 1px solid var(--mgv-border);
  background: var(--mgv-canvas);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  outline: none;
  min-width: 0;
}
.mgv-input:focus-visible, .mgv-select:focus-visible {
  border-color: var(--mgv-accent);
}
.mgv-seg {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--mgv-border);
  border-radius: 5px;
  overflow: hidden;
  background: var(--mgv-canvas);
}
.mgv-seg-btn {
  height: 24px;
  padding: 0 9px;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.mgv-seg-btn:hover { background: var(--mgv-hover); color: var(--dsw-alias-label-primary); }
.mgv-seg-btn-active { background: var(--mgv-sel); color: var(--mgv-accent); }

/* Banners */
.mgv-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--mgv-border);
  font-size: 12.5px;
  flex: none;
}
.mgv-banner-ok { background: color-mix(in srgb, var(--mgv-st-add) 10%, var(--mgv-chrome)); }
.mgv-banner-error { background: color-mix(in srgb, var(--mgv-st-conf) 10%, var(--mgv-chrome)); color: var(--mgv-st-conf); }
.mgv-banner-warn { background: color-mix(in srgb, var(--mgv-st-unver) 10%, var(--mgv-chrome)); }
.mgv-banner-text {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 72px;
  overflow-y: auto;
  flex: 1;
  font-family: var(--mgv-code-font);
  font-size: 12px;
}

/* Main Workspace Shell: Optional Left Repositories Rail + Active Tool Window */
.mgv-shell {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-bottom: 1px solid var(--mgv-border);
}

/* Draggable IDE Splitters */
.mgv-splitter-v {
  position: relative;
  width: 5px;
  margin: 0 -2px;
  cursor: col-resize;
  flex: none;
  z-index: 6;
  touch-action: none;
}
.mgv-splitter-v::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  width: 1px;
  background: var(--mgv-border);
  transition: background-color 110ms ease, width 110ms ease, left 110ms ease;
}
.mgv-splitter-v:hover::after,
.mgv-splitter-v.mgv-splitter-active::after {
  left: 1px;
  width: 3px;
  background: var(--mgv-accent);
}
.mgv-splitter-h {
  position: relative;
  height: 5px;
  margin: -2px 0;
  cursor: row-resize;
  flex: none;
  z-index: 6;
  touch-action: none;
}
.mgv-splitter-h::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 2px;
  height: 1px;
  background: var(--mgv-border);
  transition: background-color 110ms ease, height 110ms ease, top 110ms ease;
}
.mgv-splitter-h:hover::after,
.mgv-splitter-h.mgv-splitter-active::after {
  top: 1px;
  height: 3px;
  background: var(--mgv-accent);
}

/* Left IDEA Repositories Sidebar (flat tree rows, no card boxes!) */
.mgv-repo-rail {
  width: 236px;
  max-width: 55%;
  flex: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--mgv-chrome);
}
.mgv-rail-head {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--mgv-border);
  flex: none;
}
.mgv-rail-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 5px 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mgv-repo-row {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 7px 9px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.mgv-repo-row:hover {
  background: var(--mgv-hover);
}
.mgv-repo-row-active {
  background: var(--mgv-sel);
}
.mgv-repo-row-active:hover {
  background: var(--mgv-sel);
}
.mgv-repo-row-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  gap: 2px;
}
.mgv-repo-row-line1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}
.mgv-repo-row-name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mgv-repo-row-count {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--mgv-accent);
  font-weight: 600;
  flex: none;
}
.mgv-repo-row-line2 {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mgv-repo-branch-sub {
  font-family: var(--mgv-code-font);
  font-size: 11.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mgv-rail-footer {
  padding: 6px 9px;
  border-top: 1px solid var(--mgv-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}

/* Tool Window Content Area */
.mgv-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/* IDEA Commit Tool Window Split (Left Tree+Message | Right Diff) */
.mgv-commit-split {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.mgv-tool-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--mgv-canvas);
  overflow: hidden;
}
.mgv-tool-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 34px;
  padding: 0 8px;
  border-bottom: 1px solid var(--mgv-border);
  background: var(--mgv-chrome);
  flex: none;
}
.mgv-tree-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 5px 5px 10px;
}

/* IDEA 27px Crisp Tree Rows */
.mgv-tree-row {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 27px;
  padding: 0 8px;
  border-radius: 4px;
  user-select: none;
}
.mgv-tree-row-test {
  background: color-mix(in srgb, var(--mgv-st-add) 10%, transparent);
  border-radius: 0;
}
.mgv-tree-row:hover {
  background: var(--mgv-hover);
  border-radius: 4px;
}
.mgv-tree-row-test:hover {
  background: color-mix(in srgb, var(--mgv-st-add) 17%, transparent);
  border-radius: 4px;
}
.mgv-tree-row-selected,
.mgv-tree-row-test.mgv-tree-row-selected {
  background: var(--mgv-sel);
  border-radius: 4px;
}
.mgv-tree-row-selected:hover,
.mgv-tree-row-test.mgv-tree-row-selected:hover {
  background: var(--mgv-sel);
}
.mgv-tree-caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  flex: none;
}
.mgv-tree-label-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.mgv-tree-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mgv-tree-path-muted {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.mgv-tree-count {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
  font-variant-numeric: tabular-nums;
  flex: none;
}
.mgv-tree-hover-act {
  opacity: 0;
  flex: none;
}
.mgv-tree-row:hover .mgv-tree-hover-act,
.mgv-tree-row-selected .mgv-tree-hover-act {
  opacity: 1;
}

/* IDEA File Status Colors */
.mgv-fn-M { color: var(--mgv-st-mod); }
.mgv-fn-A { color: var(--mgv-st-add); }
.mgv-fn-D { color: var(--mgv-st-del); text-decoration: line-through; }
.mgv-fn-R { color: var(--mgv-st-mod); }
.mgv-fn-U { color: var(--mgv-st-conf); }
.mgv-fn-Q { color: var(--mgv-st-unver); }

.mgv-checkbox {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--mgv-accent);
  cursor: pointer;
  flex: none;
}

/* Bottom IDEA Commit Message Dock */
.mgv-commit-dock {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 9px 10px;
  background: var(--mgv-chrome);
  flex: none;
  min-height: 84px;
}
.mgv-commit-textarea {
  width: 100%;
  flex: 1;
  min-height: 44px;
  resize: none;
  padding: 7px 9px;
  border-radius: 5px;
  border: 1px solid var(--mgv-border);
  background: var(--mgv-canvas);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
}
.mgv-commit-textarea:focus-visible {
  border-color: var(--mgv-accent);
}
.mgv-commit-dock-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.mgv-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  user-select: none;
}

/* IDEA Diff Viewer */
.mgv-diff-pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--mgv-canvas);
}
.mgv-diff-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 34px;
  padding: 0 12px;
  border-bottom: 1px solid var(--mgv-border);
  background: var(--mgv-chrome);
  flex: none;
}
.mgv-diff-title {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex: 1;
  font-family: var(--mgv-code-font);
  font-size: 12.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mgv-diff-actions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: none;
}
.mgv-diff-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--mgv-canvas);
}
.mgv-diff-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-family: var(--mgv-code-font);
  font-size: 12.5px;
  line-height: 1.55;
  tab-size: 4;
  table-layout: auto;
}
.mgv-diff-split-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--mgv-code-font);
  font-size: 12.5px;
  line-height: 1.55;
  tab-size: 4;
  table-layout: fixed;
}
.mgv-diff-split-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 4px 10px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary);
  background: var(--mgv-chrome);
  border-bottom: 1px solid var(--mgv-border);
}
.mgv-diff-table td, .mgv-diff-split-table td {
  padding: 0 8px;
  vertical-align: top;
}
.mgv-diff-ln {
  width: 46px;
  text-align: right;
  user-select: none;
  color: var(--dsw-alias-label-secondary);
  border-right: 1px solid var(--mgv-border);
  font-variant-numeric: tabular-nums;
  opacity: 0.78;
}
.mgv-diff-ln-add {
  background: var(--mgv-add-gutter);
  box-shadow: inset 3px 0 0 var(--mgv-add-marker);
}
.mgv-diff-ln-del {
  background: var(--mgv-del-gutter);
  box-shadow: inset 3px 0 0 var(--mgv-del-marker);
}
.mgv-diff-code-cell {
  white-space: pre;
}
.mgv-split-cell-code {
  white-space: pre-wrap;
  word-break: break-all;
}
.mgv-split-mid {
  border-right: 1px solid var(--mgv-border-strong);
}
.mgv-diff-tr-add { background: var(--mgv-add-bg); }
.mgv-diff-tr-del { background: var(--mgv-del-bg); }
.mgv-diff-tr-hunk {
  background: var(--mgv-surface-muted);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.mgv-split-empty {
  background: var(--mgv-surface-muted);
  opacity: 0.45;
}
.mgv-stat-add { color: var(--mgv-st-add); font-family: var(--mgv-code-font); font-size: 12px; font-weight: 600; }
.mgv-stat-del { color: var(--mgv-st-conf); font-family: var(--mgv-code-font); font-size: 12px; font-weight: 600; }

/* ========================================================= */
/* IDEA Git Log Tool Window (3-Pane: Branches | Table | Inspector) */
/* ========================================================= */
.mgv-log-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 7px;
  min-height: 35px;
  padding: 4px 10px;
  border-bottom: 1px solid var(--mgv-border);
  background: var(--mgv-chrome);
  flex: none;
}
.mgv-log-3pane {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.mgv-log-branches {
  width: 204px;
  max-width: 45%;
  flex: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--mgv-chrome);
  overflow-y: auto;
  padding: 5px;
}
.mgv-log-branch-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 3px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary);
}
.mgv-log-branch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  height: 26px;
  padding: 0 7px;
  border-radius: 4px;
  cursor: pointer;
}
.mgv-log-branch-item:hover {
  background: var(--mgv-hover);
}
.mgv-log-branch-item-active {
  background: var(--mgv-sel);
}
.mgv-log-branch-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
}
.mgv-log-branch-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mgv-log-branch-acts {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  flex: none;
}
.mgv-log-branch-item:hover .mgv-log-branch-acts {
  opacity: 1;
}

/* Center IDEA Commit Table */
.mgv-log-table-wrap {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--mgv-canvas);
  overflow: hidden;
}
.mgv-log-thead {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 92px 84px;
  align-items: center;
  height: 27px;
  padding: 0 10px;
  border-bottom: 1px solid var(--mgv-border);
  background: var(--mgv-chrome);
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary);
  flex: none;
}
.mgv-log-tbody {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.mgv-log-tr {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 92px 84px;
  align-items: center;
  height: 29px;
  width: 100%;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}
.mgv-log-tr:hover {
  background: var(--mgv-hover);
}
.mgv-log-tr-active {
  background: var(--mgv-sel);
}
.mgv-log-tr-active:hover {
  background: var(--mgv-sel);
}
.mgv-log-cell-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding-right: 8px;
}
.mgv-log-subj {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
.mgv-log-cell-meta {
  font-size: 12.5px;
  color: var(--dsw-alias-label-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mgv-log-cell-date {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* IDEA Ref Flags (Branch / Tag Badges in Git Log) */
.mgv-ref-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 18px;
  padding: 0 6px;
  border-radius: 3px;
  font-family: var(--mgv-code-font);
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  flex: none;
  border: 1px solid transparent;
}
.mgv-ref-head {
  color: var(--mgv-st-add);
  background: color-mix(in srgb, var(--mgv-st-add) 14%, var(--mgv-canvas));
  border-color: color-mix(in srgb, var(--mgv-st-add) 38%, transparent);
}
.mgv-ref-local {
  color: var(--mgv-accent);
  background: color-mix(in srgb, var(--mgv-accent) 12%, var(--mgv-canvas));
  border-color: color-mix(in srgb, var(--mgv-accent) 34%, transparent);
}
.mgv-ref-remote {
  color: var(--dsw-alias-state-done-primary, var(--dsw-alias-label-secondary));
  background: color-mix(in srgb, var(--dsw-alias-state-done-primary, var(--dsw-alias-label-secondary)) 11%, var(--mgv-canvas));
  border-color: color-mix(in srgb, var(--dsw-alias-state-done-primary, var(--mgv-border-strong)) 30%, transparent);
}
.mgv-ref-tag {
  color: var(--mgv-st-unver);
  background: color-mix(in srgb, var(--mgv-st-unver) 13%, var(--mgv-canvas));
  border-color: color-mix(in srgb, var(--mgv-st-unver) 36%, transparent);
}

/* Right IDEA Commit Inspector (Files Tree + Commit Info + File Diff) */
.mgv-log-inspector {
  flex: none;
  min-width: 260px;
  max-width: 72%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: var(--mgv-canvas);
}
.mgv-inspector-top {
  display: flex;
  flex-direction: column;
  flex: none;
  min-height: 110px;
  max-height: 75%;
  overflow: hidden;
}
.mgv-inspector-files {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 5px;
}
.mgv-inspector-meta {
  padding: 7px 11px;
  border-top: 1px solid var(--mgv-border);
  background: var(--mgv-chrome);
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: none;
}
.mgv-inspector-meta-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.mgv-inspector-subj {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mgv-inspector-sub {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Popover (IDEA Branches & Stash Popups) */
.mgv-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 90;
  width: 370px;
  max-width: min(370px, 88vw);
  max-height: 450px;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid var(--mgv-border-strong);
  background: var(--dsw-alias-bg-layer-1, var(--mgv-canvas));
  box-shadow: var(--dsw-alias-elevation-3, 0 10px 28px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent));
  overflow: hidden;
}
.mgv-popover-right { left: auto; right: 0; }
.mgv-popover-head {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 9px;
  border-bottom: 1px solid var(--mgv-border);
  background: var(--mgv-chrome);
}
.mgv-popover-head-row { display: flex; gap: 6px; }
.mgv-popover-body {
  overflow-y: auto;
  padding: 5px 7px 9px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mgv-popover-sec {
  padding: 4px 6px 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary);
}
.mgv-popover-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 7px;
  border-radius: 4px;
}
.mgv-popover-row:hover { background: var(--mgv-hover); }

/* Empty & Modal */
.mgv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 16px;
  text-align: center;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  flex: 1;
}
.mgv-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--dsw-alias-bg-mask-3, color-mix(in srgb, var(--mgv-canvas) 55%, transparent));
}
.mgv-modal {
  width: 440px;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--mgv-border-strong);
  background: var(--dsw-alias-bg-layer-1, var(--mgv-canvas));
  color: var(--dsw-alias-label-primary);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--dsw-alias-elevation-3, 0 12px 32px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent));
}
.mgv-modal-title { margin: 0; font-size: 15.5px; font-weight: 600; }
.mgv-modal-body { margin: 0; font-size: 13.5px; color: var(--dsw-alias-label-secondary); word-break: break-word; }
.mgv-modal-actions { display: flex; justify-content: flex-end; gap: 8px; }

@container (max-width: 1120px) {
  .mgv-log-branches, .mgv-log-branches-splitter { display: none; }
}
@container (max-width: 960px) {
  .mgv-commit-split, .mgv-log-3pane {
    display: flex;
    flex-direction: column;
  }
  .mgv-splitter-v { display: none; }
  .mgv-tool-pane, .mgv-log-table-wrap, .mgv-log-inspector {
    width: 100% !important;
    max-width: 100% !important;
    flex: 1 1 50%;
    border-bottom: 1px solid var(--mgv-border);
  }
}
@container (max-width: 700px) {
  .mgv-shell { flex-direction: column; }
  .mgv-repo-rail {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 150px;
    border-right: none;
    border-bottom: 1px solid var(--mgv-border);
  }
}
`;

    // Crisp JetBrains New UI-inspired SVG Icons
    function SvgIcon({ d, viewBox = '0 0 16 16', size = 15, stroke = 'currentColor', fill = 'none', strokeWidth = 1.45, children }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox,
        fill,
        stroke,
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        style: { flex: 'none', display: 'block' },
      }, d ? h('path', { d }) : children);
    }

    const Icons = {
      branch: (color = 'currentColor') => h(SvgIcon, { stroke: color, children: [
        h('circle', { key: 1, cx: 4.5, cy: 3.5, r: 1.5 }),
        h('circle', { key: 2, cx: 4.5, cy: 12.5, r: 1.5 }),
        h('circle', { key: 3, cx: 11.5, cy: 6.5, r: 1.5 }),
        h('path', { key: 4, d: 'M4.5 5v6M11.5 8c0 2.2-2.2 3-7 3' }),
      ] }),
      repo: (dirty) => h(SvgIcon, {
        stroke: dirty ? 'var(--mgv-accent)' : 'currentColor',
        children: [
          h('path', { key: 1, d: 'M2 4.5C2 3.7 2.7 3 3.5 3h3l1.3 1.5h4.7c.8 0 1.5.7 1.5 1.5v5.5c0 .8-.7 1.5-1.5 1.5h-9c-.8 0-1.5-.7-1.5-1.5V4.5Z' }),
        ],
      }),
      folder: () => h(SvgIcon, {
        size: 15,
        stroke: 'var(--dsw-alias-label-secondary)',
        children: h('path', { d: 'M1.8 4.2c0-.7.5-1.2 1.2-1.2h2.8l1.2 1.3h6c.7 0 1.2.5 1.2 1.2v6.3c0 .7-.5 1.2-1.2 1.2H3c-.7 0-1.2-.5-1.2-1.2V4.2Z' }),
      }),
      file: (status) => {
        const cls = status ? `mgv-fn-${status[0] === '?' ? 'Q' : status[0]}` : '';
        return h(SvgIcon, {
          size: 15,
          stroke: 'currentColor',
          children: [
            h('path', { key: 1, className: cls, d: 'M3.5 2h5.5l3.5 3.5V13c0 .6-.4 1-1 1h-8c-.6 0-1-.4-1-1V3c0-.6.4-1 1-1Z' }),
            h('path', { key: 2, className: cls, d: 'M9 2v3.5h3.5' }),
          ],
        });
      },
      pull: () => h(SvgIcon, { children: [
        h('path', { key: 1, d: 'M11.5 3.5 5 10m0 0V5.5M5 10h4.5' }),
        h('path', { key: 2, d: 'M3 13h10' }),
      ] }),
      push: () => h(SvgIcon, { children: [
        h('path', { key: 1, d: 'M4.5 11.5 11 5m0 0H6.5M11 5v4.5' }),
        h('path', { key: 2, d: 'M3 13h10' }),
      ] }),
      fetch: () => h(SvgIcon, { children: [
        h('path', { key: 1, d: 'M8 2.5v7.5m0 0-3-3m3 3 3-3' }),
        h('path', { key: 2, d: 'M3 12.5h10' }),
      ] }),
      fetchAll: () => h(SvgIcon, { children: [
        h('path', { key: 1, d: 'M5.5 2.5v7m0 0L3.2 7.2M5.5 9.5l2.3-2.3' }),
        h('path', { key: 2, d: 'M10.5 3.5v7m0 0-2.3-2.3m2.3 2.3 2.3-2.3' }),
        h('path', { key: 3, d: 'M2.5 13h11' }),
      ] }),
      stash: () => h(SvgIcon, { children: [
        h('path', { key: 1, d: 'M2.5 5.5 8 2.5l5.5 3-5.5 3-5.5-3Z' }),
        h('path', { key: 2, d: 'M2.5 8.5 8 11.5l5.5-3M2.5 11.5 8 14.5l5.5-3' }),
      ] }),
      refresh: () => h(SvgIcon, { children: [
        h('path', { key: 1, d: 'M13 4.5A5.5 5.5 0 0 0 3.7 4.2M3 2.5v2.5h2.5' }),
        h('path', { key: 2, d: 'M3 11.5a5.5 5.5 0 0 0 9.3.3M13 13.5V11h-2.5' }),
      ] }),
      rescan: () => h(SvgIcon, { children: [
        h('circle', { key: 1, cx: 7, cy: 7, r: 4.5 }),
        h('path', { key: 2, d: 'm10.5 10.5 3 3' }),
      ] }),
      rollback: () => h(SvgIcon, { children: [
        h('path', { key: 1, d: 'M4.5 6H10a3.5 3.5 0 1 1 0 7H6.5' }),
        h('path', { key: 2, d: 'M6.8 3.5 4.2 6l2.6 2.5' }),
      ] }),
      groupTree: () => h(SvgIcon, { children: [
        h('path', { key: 1, d: 'M2.5 3.5h4.5v3H2.5zM9.5 6.5H13.5v3H9.5zM9.5 11h4v3h-4z' }),
        h('path', { key: 2, d: 'M4.5 6.5v6h5M4.5 8h5' }),
      ] }),
      expandAll: () => h(SvgIcon, { children: [
        h('path', { key: 1, d: 'M5.5 5 8 2.5 10.5 5M5.5 11 8 13.5 10.5 11M3 8h10' }),
      ] }),
      collapseAll: () => h(SvgIcon, { children: [
        h('path', { key: 1, d: 'M5.5 2.5 8 5l2.5-2.5M5.5 13.5 8 11l2.5 2.5M3 8h10' }),
      ] }),
      sidebar: () => h(SvgIcon, { children: [
        h('rect', { key: 1, x: 2, y: 2.5, width: 12, height: 11, rx: 1.5 }),
        h('path', { key: 2, d: 'M6 2.5v11' }),
      ] }),
      copy: () => h(SvgIcon, { children: [
        h('rect', { key: 1, x: 5.5, y: 5, width: 8, height: 8.5, rx: 1.2 }),
        h('path', { key: 2, d: 'M3.5 10.5H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V4' }),
      ] }),
      arrowUp: () => h(SvgIcon, { size: 13, d: 'M8 12.5V3.5m0 0-3.5 3.5M8 3.5l3.5 3.5' }),
      arrowDown: () => h(SvgIcon, { size: 13, d: 'M8 3.5v9m0 0-3.5-3.5M8 12.5l3.5-3.5' }),
      caretRight: () => h(SvgIcon, { size: 11, d: 'm6 4 4 4-4 4' }),
      caretDown: () => h(SvgIcon, { size: 11, d: 'm4 6 4 4 4-4' }),
      funnel: () => h(SvgIcon, { size: 13, d: 'M2.5 3.5h11l-4.2 5v4l-2.6 1.2V8.5l-4.2-5Z' }),
      plus: () => h(SvgIcon, { size: 12, d: 'M8 3v10M3 8h10' }),
      close: () => h(SvgIcon, { size: 13, d: 'M4 4l8 8M12 4l-8 8' }),
    };

    const LAYOUT_STORAGE_KEY = 'mgv.layout.v1';
    const DEFAULT_LAYOUT = {
      railWidth: 236,
      commitLeftWidth: 390,
      commitDockHeight: 120,
      logBranchesWidth: 204,
      logInspectorWidth: 500,
      logFilesHeight: 230,
    };

    function loadSavedLayout() {
      try {
        if (typeof localStorage === 'undefined') return { ...DEFAULT_LAYOUT };
        const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_LAYOUT };
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_LAYOUT, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
      } catch {
        return { ...DEFAULT_LAYOUT };
      }
    }

    function saveLayout(next) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
        }
      } catch { /* ignore */ }
    }

    function clampNum(val, min, max) {
      return Math.max(min, Math.min(max, Math.round(val)));
    }

    function ResizeHandle({ orientation, side, size, min, max, defaultSize, onChange, className = '', title }) {
      const [dragging, setDragging] = useState(false);

      const handlePointerDown = (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        const startCoord = orientation === 'vertical' ? event.clientX : event.clientY;
        const startSize = size;
        const sign = (side === 'left' || side === 'top') ? 1 : -1;
        setDragging(true);
        const prevCursor = document.body.style.cursor;
        const prevUserSelect = document.body.style.userSelect;
        document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        const onMove = (moveEvt) => {
          const curCoord = orientation === 'vertical' ? moveEvt.clientX : moveEvt.clientY;
          const next = clampNum(startSize + sign * (curCoord - startCoord), min, max);
          onChange(next);
        };
        const onUp = () => {
          setDragging(false);
          document.body.style.cursor = prevCursor;
          document.body.style.userSelect = prevUserSelect;
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      };

      const baseCls = orientation === 'vertical' ? 'mgv-splitter-v' : 'mgv-splitter-h';
      return h('div', {
        role: 'separator',
        'aria-orientation': orientation,
        title,
        className: `${baseCls}${dragging ? ' mgv-splitter-active' : ''}${className ? ` ${className}` : ''}`,
        onPointerDown: handlePointerDown,
        onDoubleClick: () => { if (typeof defaultSize === 'number') onChange(defaultSize); },
      });
    }

    const scanCache = new Map();

    async function postApi(route, payload, signal) {
      const carrierFetch = (
        typeof window !== 'undefined'
        && window.__DSH_TRANSPORT__
        && typeof window.__DSH_TRANSPORT__.fetch === 'function'
      )
        ? window.__DSH_TRANSPORT__.fetch
        : globalThis.fetch.bind(globalThis);
      const response = await carrierFetch(route, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        ...(signal ? { signal } : {}),
      });
      const text = await response.text();
      let data = null;
      try { data = JSON.parse(text); } catch { data = null; }
      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: (data && typeof data.error === 'string') ? data.error : `HTTP ${response.status}`,
          repo: data && data.repo ? data.repo : undefined,
        };
      }
      return data || { ok: false, status: response.status, error: null };
    }

    async function copyText(value) {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try { await navigator.clipboard.writeText(value); return true; } catch { /* fallback */ }
      }
      try {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch { return false; }
    }

    function formatIsoLocal(iso) {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      } catch { return iso; }
    }

    function formatRelativeIso(iso, t) {
      if (!iso) return '';
      const ts = Date.parse(iso);
      if (Number.isNaN(ts)) return iso;
      const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
      if (diffSec < 60) return t('time.justNow');
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return t('time.minutesAgo', { n: diffMin });
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return t('time.hoursAgo', { n: diffHr });
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 30) return t('time.daysAgo', { n: diffDay });
      const diffMonth = Math.floor(diffDay / 30);
      if (diffMonth < 12) return t('time.monthsAgo', { n: diffMonth });
      return t('time.yearsAgo', { n: Math.floor(diffDay / 365) });
    }

    function formatAheadBehind(ahead, behind) {
      const parts = [];
      if (ahead > 0) parts.push(`↑${ahead}`);
      if (behind > 0) parts.push(`↓${behind}`);
      return parts.join(' ');
    }

    function splitDisplayPath(filePath, origPath) {
      const target = filePath || '';
      const slash = target.lastIndexOf('/');
      const base = slash >= 0 ? target.slice(slash + 1) : target;
      const dir = slash >= 0 ? target.slice(0, slash) : '';
      if (origPath) return { base, dir: `${origPath} → ${dir || '.'}` };
      return { base, dir };
    }

    function fileStatusTextClass(status) {
      const ch = (status || '?')[0];
      if (ch === 'A') return 'mgv-fn-A';
      if (ch === 'D') return 'mgv-fn-D';
      if (ch === 'U') return 'mgv-fn-U';
      if (ch === '?') return 'mgv-fn-Q';
      return 'mgv-fn-M';
    }

    function isTestPath(filePath) {
      if (!filePath) return false;
      const normalized = String(filePath).replace(/\\/g, '/');
      if (/(^|\/)(test|tests|__tests__|__mocks__|e2e)(\/|$)/i.test(normalized)) return true;
      const slash = normalized.lastIndexOf('/');
      const base = slash >= 0 ? normalized.slice(slash + 1) : normalized;
      if (/(?:Test|Tests|IT|Spec|TestCase)\.(java|kt|kts|scala|cs)$/i.test(base)) return true;
      if (/\.(?:test|spec|e2e|cy)\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(base)) return true;
      if (/^test_.+\.py$|_test\.py$/i.test(base)) return true;
      if (/_test\.go$/i.test(base)) return true;
      return false;
    }

    function isTestDirNode(dirNode) {
      if (!dirNode) return false;
      if (isTestPath(dirNode.fullPath)) return true;
      return Array.isArray(dirNode.allPaths) && dirNode.allPaths.length > 0 && dirNode.allPaths.every(isTestPath);
    }

    function buildTrackedChanges(repo) {
      if (!repo || !repo.files) return [];
      const map = new Map();
      const ingest = (list, flag) => {
        for (const item of list || []) {
          const existing = map.get(item.path);
          if (!existing) {
            map.set(item.path, {
              path: item.path,
              origPath: item.origPath || null,
              status: item.status,
              isStaged: flag === 'staged',
              isUnstaged: flag === 'unstaged',
            });
          } else {
            if (flag === 'staged') existing.isStaged = true;
            if (flag === 'unstaged') existing.isUnstaged = true;
            if (!existing.origPath && item.origPath) existing.origPath = item.origPath;
          }
        }
      };
      ingest(repo.files.staged, 'staged');
      ingest(repo.files.unstaged, 'unstaged');
      return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
    }

    function buildCompressedTree(items) {
      const root = { name: '', fullPath: '', dirs: new Map(), files: [], allPaths: [] };
      for (const item of items) {
        const parts = (item.path || '').split('/');
        let node = root;
        node.allPaths.push(item.path);
        for (let i = 0; i < parts.length - 1; i += 1) {
          const seg = parts[i];
          let child = node.dirs.get(seg);
          if (!child) {
            child = {
              name: seg,
              fullPath: node.fullPath ? `${node.fullPath}/${seg}` : seg,
              dirs: new Map(),
              files: [],
              allPaths: [],
            };
            node.dirs.set(seg, child);
          }
          child.allPaths.push(item.path);
          node = child;
        }
        node.files.push(item);
      }

      const compress = (dirNode) => {
        const compressedDirs = [];
        for (const child of dirNode.dirs.values()) {
          let cur = child;
          let label = cur.name;
          while (cur.files.length === 0 && cur.dirs.size === 1) {
            const nextChild = [...cur.dirs.values()][0];
            label = `${label}/${nextChild.name}`;
            cur = nextChild;
          }
          compressedDirs.push({
            label,
            fullPath: cur.fullPath,
            allPaths: cur.allPaths,
            files: cur.files,
            dirs: compress(cur),
          });
        }
        compressedDirs.sort((a, b) => a.label.localeCompare(b.label));
        return compressedDirs;
      };

      return { dirs: compress(root), files: root.files, allPaths: root.allPaths };
    }

    function parseUnifiedDiff(diffText) {
      const unifiedRows = [];
      const splitRows = [];
      let added = 0;
      let deleted = 0;
      let hunkCount = 0;
      if (!diffText) return { unifiedRows, splitRows, added, deleted, hunkCount };

      const lines = diffText.split('\n');
      let oldLine = 0;
      let newLine = 0;
      let pendingDel = [];
      let pendingAdd = [];

      const flushPending = () => {
        if (pendingDel.length === 0 && pendingAdd.length === 0) return;
        const maxLen = Math.max(pendingDel.length, pendingAdd.length);
        for (let i = 0; i < maxLen; i += 1) {
          splitRows.push({ type: 'pair', left: pendingDel[i] || null, right: pendingAdd[i] || null });
        }
        pendingDel = [];
        pendingAdd = [];
      };

      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (
          line.startsWith('diff --git ') || line.startsWith('index ')
          || line.startsWith('--- ') || line.startsWith('+++ ')
          || line.startsWith('new file ') || line.startsWith('deleted file ')
          || line.startsWith('similarity ') || line.startsWith('rename ')
        ) {
          flushPending();
          continue;
        }
        if (line.startsWith('@@')) {
          flushPending();
          const m = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
          if (m) {
            oldLine = Number(m[1]);
            newLine = Number(m[2]);
          }
          const hIdx = hunkCount;
          hunkCount += 1;
          unifiedRows.push({ type: 'hunk', hunkIndex: hIdx, text: line });
          splitRows.push({ type: 'hunk', hunkIndex: hIdx, text: line });
          continue;
        }
        if (line.startsWith('+')) {
          const item = { lineNo: newLine, text: line.slice(1) };
          newLine += 1;
          added += 1;
          unifiedRows.push({ type: 'add', oldNo: '', newNo: item.lineNo, sign: '+', text: item.text });
          pendingAdd.push(item);
        } else if (line.startsWith('-')) {
          const item = { lineNo: oldLine, text: line.slice(1) };
          oldLine += 1;
          deleted += 1;
          unifiedRows.push({ type: 'del', oldNo: item.lineNo, newNo: '', sign: '-', text: item.text });
          pendingDel.push(item);
        } else if (line.startsWith('\\')) {
          flushPending();
          unifiedRows.push({ type: 'meta', oldNo: '', newNo: '', sign: '', text: line });
        } else {
          flushPending();
          if (line === '' && i === lines.length - 1) continue;
          const text = line.startsWith(' ') ? line.slice(1) : line;
          const curOld = oldLine > 0 ? oldLine : '';
          const curNew = newLine > 0 ? newLine : '';
          if (oldLine > 0) oldLine += 1;
          if (newLine > 0) newLine += 1;
          unifiedRows.push({ type: 'ctx', oldNo: curOld, newNo: curNew, sign: ' ', text });
          splitRows.push({ type: 'ctx', left: { lineNo: curOld, text }, right: { lineNo: curNew, text } });
        }
      }
      flushPending();
      return { unifiedRows, splitRows, added, deleted, hunkCount };
    }

    function TriCheckbox({ checked, indeterminate, onChange, ariaLabel }) {
      const ref = useRef(null);
      useEffect(() => {
        if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
      }, [indeterminate]);
      return h('input', {
        ref,
        type: 'checkbox',
        className: 'mgv-checkbox',
        checked: Boolean(checked),
        'aria-label': ariaLabel,
        onChange: (e) => { onChange(e.target.checked); },
      });
    }

    function IdeaDiffPane({ titlePath, statusChar, diffState, diffMode, onDiffModeChange, extraActions, onClose, closeTitle, emptyText, t }) {
      const bodyRef = useRef(null);
      const [hunkCursor, setHunkCursor] = useState(0);

      const parsed = useMemo(
        () => parseUnifiedDiff(diffState.data && !diffState.data.binary ? (diffState.data.diff || '') : ''),
        [diffState.data],
      );

      useEffect(() => {
        setHunkCursor(0);
      }, [titlePath, diffState.data]);

      const jumpHunk = (delta) => {
        if (!bodyRef.current || parsed.hunkCount === 0) return;
        const next = Math.max(0, Math.min(parsed.hunkCount - 1, hunkCursor + delta));
        setHunkCursor(next);
        const el = bodyRef.current.querySelector(`[data-hunk="${next}"]`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      if (!titlePath) {
        return h('div', { className: 'mgv-diff-pane' },
          h('div', { className: 'mgv-empty' }, h('div', null, emptyText)),
        );
      }

      return h('div', { className: 'mgv-diff-pane' },
        h('div', { className: 'mgv-diff-head' },
          h('div', { className: 'mgv-diff-title', title: titlePath },
            Icons.file(statusChar),
            h('span', { className: fileStatusTextClass(statusChar) }, titlePath),
            (parsed.added > 0 || parsed.deleted > 0)
              ? h(React.Fragment, null,
                parsed.added > 0 ? h('span', { className: 'mgv-stat-add' }, `+${parsed.added}`) : null,
                parsed.deleted > 0 ? h('span', { className: 'mgv-stat-del' }, `-${parsed.deleted}`) : null,
              )
              : null,
          ),
          h('div', { className: 'mgv-diff-actions' },
            parsed.hunkCount > 1
              ? h(React.Fragment, null,
                h('button', {
                  type: 'button',
                  className: 'mgv-icon-btn',
                  title: t('diff.prevHunk'),
                  disabled: hunkCursor <= 0,
                  onClick: () => { jumpHunk(-1); },
                }, Icons.arrowUp()),
                h('span', { className: 'mgv-tree-count' }, `${hunkCursor + 1}/${parsed.hunkCount}`),
                h('button', {
                  type: 'button',
                  className: 'mgv-icon-btn',
                  title: t('diff.nextHunk'),
                  disabled: hunkCursor >= parsed.hunkCount - 1,
                  onClick: () => { jumpHunk(1); },
                }, Icons.arrowDown()),
                h('div', { className: 'mgv-vsep' }),
              )
              : null,
            h('div', { className: 'mgv-seg', role: 'group' },
              h('button', {
                type: 'button',
                className: `mgv-seg-btn${diffMode === 'split' ? ' mgv-seg-btn-active' : ''}`,
                onClick: () => { onDiffModeChange('split'); },
              }, t('diff.modeSplit')),
              h('button', {
                type: 'button',
                className: `mgv-seg-btn${diffMode === 'unified' ? ' mgv-seg-btn-active' : ''}`,
                onClick: () => { onDiffModeChange('unified'); },
              }, t('diff.modeUnified')),
            ),
            extraActions || null,
            onClose
              ? h('button', {
                type: 'button',
                className: 'mgv-icon-btn',
                title: closeTitle || t('diff.closeTooltip'),
                onClick: onClose,
              }, Icons.close())
              : null,
          ),
        ),
        h('div', { ref: bodyRef, className: 'mgv-diff-body' },
          diffState.loading
            ? h('div', { className: 'mgv-empty' }, h('div', null, t('diff.loading')))
            : diffState.error
              ? h('div', { className: 'mgv-empty', style: { color: 'var(--mgv-st-conf)' } }, diffState.error)
              : !diffState.data
                ? null
                : diffState.data.binary
                  ? h('div', { className: 'mgv-empty' }, t('diff.binary'))
                  : (diffState.data.empty || (parsed.unifiedRows.length === 0 && !diffState.data.diff))
                    ? h('div', { className: 'mgv-empty' }, t('diff.empty'))
                    : h(React.Fragment, null,
                      diffState.data.truncated ? h('div', { className: 'mgv-banner mgv-banner-warn' }, t('diff.truncated')) : null,
                      diffMode === 'split'
                        ? h('table', { className: 'mgv-diff-split-table' },
                          h('colgroup', null,
                            h('col', { style: { width: '42px' } }),
                            h('col', { style: { width: 'calc(50% - 42px)' } }),
                            h('col', { style: { width: '42px' } }),
                            h('col', { style: { width: 'calc(50% - 42px)' } }),
                          ),
                          h('thead', null,
                            h('tr', null,
                              h('th', { colSpan: 2, className: 'mgv-split-mid' }, t('diff.oldSide')),
                              h('th', { colSpan: 2 }, t('diff.newSide')),
                            ),
                          ),
                          h('tbody', null,
                            parsed.splitRows.map((row, idx) => {
                              if (row.type === 'hunk') {
                                return h('tr', { key: idx, 'data-hunk': row.hunkIndex, className: 'mgv-diff-tr-hunk' },
                                  h('td', { colSpan: 4 }, row.text),
                                );
                              }
                              if (row.type === 'ctx') {
                                return h('tr', { key: idx },
                                  h('td', { className: 'mgv-diff-ln' }, row.left.lineNo),
                                  h('td', { className: 'mgv-split-cell-code mgv-split-mid' }, row.left.text || ' '),
                                  h('td', { className: 'mgv-diff-ln' }, row.right.lineNo),
                                  h('td', { className: 'mgv-split-cell-code' }, row.right.text || ' '),
                                );
                              }
                              return h('tr', { key: idx },
                                h('td', { className: `mgv-diff-ln${row.left ? ' mgv-diff-ln-del' : ' mgv-split-empty'}` }, row.left ? row.left.lineNo : ''),
                                h('td', { className: `mgv-split-cell-code mgv-split-mid${row.left ? ' mgv-diff-tr-del' : ' mgv-split-empty'}` }, row.left ? (row.left.text || ' ') : ''),
                                h('td', { className: `mgv-diff-ln${row.right ? ' mgv-diff-ln-add' : ' mgv-split-empty'}` }, row.right ? row.right.lineNo : ''),
                                h('td', { className: `mgv-split-cell-code${row.right ? ' mgv-diff-tr-add' : ' mgv-split-empty'}` }, row.right ? (row.right.text || ' ') : ''),
                              );
                            }),
                          ),
                        )
                        : h('table', { className: 'mgv-diff-table' },
                          h('colgroup', null,
                            h('col', { style: { width: '42px' } }),
                            h('col', { style: { width: '42px' } }),
                            h('col', null),
                          ),
                          h('tbody', null,
                            parsed.unifiedRows.map((row, idx) => {
                              if (row.type === 'hunk') {
                                return h('tr', { key: idx, 'data-hunk': row.hunkIndex, className: 'mgv-diff-tr-hunk' },
                                  h('td', { colSpan: 3 }, row.text),
                                );
                              }
                              const rowCls = row.type === 'add' ? 'mgv-diff-tr-add' : row.type === 'del' ? 'mgv-diff-tr-del' : '';
                              const lnCls = row.type === 'add' ? 'mgv-diff-ln mgv-diff-ln-add' : row.type === 'del' ? 'mgv-diff-ln mgv-diff-ln-del' : 'mgv-diff-ln';
                              return h('tr', { key: idx, className: rowCls },
                                h('td', { className: lnCls }, row.oldNo),
                                h('td', { className: 'mgv-diff-ln' }, row.newNo),
                                h('td', { className: 'mgv-diff-code-cell' }, `${row.sign} ${row.text}`),
                              );
                            }),
                          ),
                        ),
                    ),
        ),
      );
    }

    function CommitGraphNode({ isFirst, isLast, isMerge }) {
      return h('svg', { width: 16, height: 29, viewBox: '0 0 16 29', fill: 'none', 'aria-hidden': true, style: { flex: 'none' } },
        !isFirst ? h('line', { x1: 8, y1: 0, x2: 8, y2: 11, stroke: 'var(--mgv-border-strong)', strokeWidth: 1.6 }) : null,
        !isLast ? h('line', { x1: 8, y1: 18, x2: 8, y2: 29, stroke: 'var(--mgv-border-strong)', strokeWidth: 1.6 }) : null,
        isMerge
          ? h(React.Fragment, null,
            h('circle', { cx: 8, cy: 14.5, r: 4.0, stroke: 'var(--mgv-accent)', strokeWidth: 1.6, fill: 'var(--mgv-canvas)' }),
            h('circle', { cx: 8, cy: 14.5, r: 1.5, fill: 'var(--mgv-accent)' }),
          )
          : h('circle', { cx: 8, cy: 14.5, r: 3.3, fill: 'var(--mgv-accent)' }),
      );
    }

    function ConfirmModal({ title, body, cancelLabel, confirmLabel, confirmDanger, onCancel, onConfirm }) {
      const cancelRef = useRef(null);
      const confirmRef = useRef(null);

      useEffect(() => {
        const previous = typeof document !== 'undefined' ? document.activeElement : null;
        if (cancelRef.current) cancelRef.current.focus();
        const onKeyDown = (event) => {
          if (event.key === 'Escape') { event.preventDefault(); onCancel(); return; }
          if (event.key === 'Tab') {
            const focusables = [cancelRef.current, confirmRef.current].filter(Boolean);
            if (focusables.length < 2) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
          window.removeEventListener('keydown', onKeyDown);
          if (previous && typeof previous.focus === 'function') previous.focus();
        };
      }, [onCancel]);

      return h('div', {
        className: 'mgv-modal-backdrop',
        onClick: (e) => { if (e.target === e.currentTarget) onCancel(); },
      },
        h('div', { className: 'mgv-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mgv-confirm-modal-title' },
          h('h4', { id: 'mgv-confirm-modal-title', className: 'mgv-modal-title' }, title),
          h('p', { className: 'mgv-modal-body' }, body),
          h('div', { className: 'mgv-modal-actions' },
            h('button', { ref: cancelRef, type: 'button', className: 'mgv-btn', onClick: onCancel }, cancelLabel),
            h('button', {
              ref: confirmRef,
              type: 'button',
              className: `mgv-btn ${confirmDanger ? 'mgv-btn-danger-solid' : 'mgv-btn-primary'}`,
              onClick: onConfirm,
            }, confirmLabel),
          ),
        ),
      );
    }

    function MultiGitView(props) {
      const { sessionId, useSession, useSessions, useWorkspaces, useProjection, t } = props;

      const workspacePath = typeof useWorkspaces === 'function'
        ? useWorkspaces((ws) => {
          if (!ws || !Array.isArray(ws.items)) return null;
          const found = ws.items.find(item => Array.isArray(item.sessionIds) && item.sessionIds.includes(sessionId));
          return found ? found.path : null;
        })
        : null;

      const sessionCwd = typeof useSessions === 'function'
        ? useSessions((list) => (list && list.byId && list.byId[sessionId] ? list.byId[sessionId].cwd || null : null))
        : null;

      const projectedCwd = typeof useProjection === 'function' ? useProjection('workingDirectory') : null;
      const effectiveCwd = projectedCwd || sessionCwd || null;
      const primaryRoot = workspacePath || effectiveCwd || null;
      const sessionRunning = typeof useSession === 'function' ? useSession((s) => Boolean(s && s.running)) : false;

      const cacheKey = `${primaryRoot || '__none__'}|${effectiveCwd || ''}`;
      const initialCache = scanCache.get(cacheKey);

      const [repos, setRepos] = useState(initialCache ? initialCache.repos : []);
      const [rootPath, setRootPath] = useState(initialCache ? initialCache.rootPath : primaryRoot);
      const [scannedDirs, setScannedDirs] = useState(initialCache ? initialCache.scannedDirs : 0);
      const [truncated, setTruncated] = useState(initialCache ? initialCache.truncated : false);
      const [gitAvailable, setGitAvailable] = useState(true);
      const [scanError, setScanError] = useState(null);
      const [scanPhase, setScanPhase] = useState(initialCache ? 'idle' : 'scanning');

      const [selectedRepoPath, setSelectedRepoPath] = useState(() => (
        initialCache && initialCache.repos.length > 0 ? initialCache.repos[0].path : null
      ));
      const [detailTab, setDetailTab] = useState('commit');
      const [diffMode, setDiffMode] = useState('split');
      const [treeMode, setTreeMode] = useState(true);
      const [showReposRail, setShowReposRail] = useState(true);
      const [showLogBranches, setShowLogBranches] = useState(true);
      const [layout, setLayout] = useState(loadSavedLayout);

      const updateLayout = useCallback((patch) => {
        setLayout((prev) => {
          const next = { ...prev, ...patch };
          saveLayout(next);
          return next;
        });
      }, []);

      const [searchQuery, setSearchQuery] = useState('');
      const [dirtyOnly, setDirtyOnly] = useState(false);
      const [fileFilter, setFileFilter] = useState('');

      const [openPopover, setOpenPopover] = useState(null); // 'branches' | 'stash' | null
      const [branchFilter, setBranchFilter] = useState('');
      const [stashDraft, setStashDraft] = useState('');

      const [busyByRepo, setBusyByRepo] = useState({});
      const [feedback, setFeedback] = useState(null);
      const [copiedKey, setCopiedKey] = useState(null);
      const [commitDrafts, setCommitDrafts] = useState({});
      const [amendByRepo, setAmendByRepo] = useState({});
      const [branchDrafts, setBranchDrafts] = useState({});
      const [checkedByRepo, setCheckedByRepo] = useState({});
      const [collapsedGroups, setCollapsedGroups] = useState({});
      const [collapsedDirs, setCollapsedDirs] = useState({});
      const [flatLimits, setFlatLimits] = useState({});

      const [selectedFile, setSelectedFile] = useState(null);
      const [fileDiffState, setFileDiffState] = useState({ loading: false, data: null, error: null });

      const [logBranch, setLogBranch] = useState('__current__');
      const [logQuery, setLogQuery] = useState('');
      const [logAuthor, setLogAuthor] = useState('');
      const [logSortOrder, setLogSortOrder] = useState('desc');
      const [logOverride, setLogOverride] = useState(null);
      const [selectedCommit, setSelectedCommit] = useState(null);
      const [commitDetailsState, setCommitDetailsState] = useState({ loading: false, data: null, error: null });
      const [selectedCommitFile, setSelectedCommitFile] = useState(null);
      const [commitFileDiffState, setCommitFileDiffState] = useState({ loading: false, data: null, error: null });
      const [logCollapsedDirs, setLogCollapsedDirs] = useState({});

      const [confirmModal, setConfirmModal] = useState(null);

      const scanAbortRef = useRef(null);
      const fileDiffAbortRef = useRef(null);
      const fileDiffSeqRef = useRef(0);
      const logAbortRef = useRef(null);
      const commitDetailsAbortRef = useRef(null);
      const commitDetailsSeqRef = useRef(0);
      const commitFileDiffAbortRef = useRef(null);
      const commitFileDiffSeqRef = useRef(0);
      const popoverRef = useRef(null);
      const prevRunningRef = useRef(sessionRunning);
      const reposRef = useRef(repos);
      reposRef.current = repos;

      const selectedRepo = useMemo(
        () => repos.find(r => r.path === selectedRepoPath) || null,
        [repos, selectedRepoPath],
      );
      const selectedBusy = selectedRepo ? (busyByRepo[selectedRepo.path] || null) : null;

      const trackedChanges = useMemo(() => buildTrackedChanges(selectedRepo), [selectedRepo]);
      const conflictedFiles = useMemo(() => (selectedRepo?.files?.conflicted || []), [selectedRepo]);
      const unversionedFiles = useMemo(() => (selectedRepo?.files?.untracked || []), [selectedRepo]);

      useEffect(() => {
        if (!selectedRepo) return;
        const repoPath = selectedRepo.path;
        const validPaths = new Set([
          ...trackedChanges.map(f => f.path),
          ...unversionedFiles.map(f => f.path),
          ...conflictedFiles.map(f => f.path),
        ]);
        setCheckedByRepo((prev) => {
          const existing = prev[repoPath];
          if (!existing) return { ...prev, [repoPath]: new Set(trackedChanges.map(f => f.path)) };
          const nextSet = new Set();
          for (const p of existing) {
            if (validPaths.has(p)) nextSet.add(p);
          }
          return { ...prev, [repoPath]: nextSet };
        });
      }, [selectedRepo, trackedChanges, unversionedFiles, conflictedFiles]);

      const checkedSet = useMemo(() => {
        if (!selectedRepo) return new Set();
        return checkedByRepo[selectedRepo.path] || new Set(trackedChanges.map(f => f.path));
      }, [selectedRepo, checkedByRepo, trackedChanges]);

      const setCheckedPaths = useCallback((repoPath, paths, shouldCheck) => {
        setCheckedByRepo((prev) => {
          const cur = new Set(prev[repoPath] || []);
          for (const p of paths) {
            if (shouldCheck) cur.add(p);
            else cur.delete(p);
          }
          return { ...prev, [repoPath]: cur };
        });
      }, []);

      const commitScanResult = useCallback((result, targetCacheKey) => {
        const nextRepos = Array.isArray(result.repos) ? result.repos : [];
        const nextRoot = result.rootPath || primaryRoot;
        setRepos(nextRepos);
        setRootPath(nextRoot);
        if (typeof result.scannedDirs === 'number') setScannedDirs(result.scannedDirs);
        if (typeof result.truncated === 'boolean') setTruncated(result.truncated);
        setGitAvailable(result.gitAvailable !== false);
        setScanError(result.error || null);
        scanCache.set(targetCacheKey || cacheKey, {
          rootPath: nextRoot,
          repos: nextRepos,
          scannedDirs: typeof result.scannedDirs === 'number' ? result.scannedDirs : 0,
          truncated: Boolean(result.truncated),
          scannedAt: result.scannedAt || Date.now(),
        });
        setSelectedRepoPath((prev) => {
          if (prev && nextRepos.some(r => r.path === prev)) return prev;
          return nextRepos.length > 0 ? nextRepos[0].path : null;
        });
      }, [cacheKey, primaryRoot]);

      const runFullScan = useCallback(async () => {
        if (!primaryRoot) { setRepos([]); setScanPhase('idle'); return; }
        const targetKey = cacheKey;
        if (scanAbortRef.current) scanAbortRef.current.abort();
        const ac = new AbortController();
        scanAbortRef.current = ac;
        setScanPhase('scanning');
        setScanError(null);
        try {
          const res = await postApi('api/multi-git.scan', { sessionId, workspacePath, cwd: effectiveCwd }, ac.signal);
          if (ac.signal.aborted) return;
          if (!res.ok) setScanError(res.error || t('error.scanFailed'));
          else commitScanResult(res, targetKey);
        } catch (err) {
          if (!ac.signal.aborted) setScanError(err instanceof Error ? err.message : String(err));
        } finally {
          if (!ac.signal.aborted) setScanPhase('idle');
        }
      }, [primaryRoot, cacheKey, sessionId, workspacePath, effectiveCwd, commitScanResult, t]);

      const runLightRefresh = useCallback(async (reposOverride, rootOverride) => {
        if (!primaryRoot) return;
        const targetRepos = Array.isArray(reposOverride) ? reposOverride : reposRef.current;
        const targetRoot = rootOverride || rootPath || primaryRoot;
        const targetKey = cacheKey;
        if (targetRepos.length === 0) { await runFullScan(); return; }
        if (scanAbortRef.current) scanAbortRef.current.abort();
        const ac = new AbortController();
        scanAbortRef.current = ac;
        setScanPhase('refreshing');
        setScanError(null);
        try {
          const res = await postApi('api/multi-git.refresh-all', {
            sessionId, workspacePath, cwd: effectiveCwd, rootPath: targetRoot, repoPaths: targetRepos.map(r => r.path),
          }, ac.signal);
          if (ac.signal.aborted) return;
          if (res.ok) commitScanResult(res, targetKey);
          else setScanError(res.error || t('error.refreshFailed'));
        } catch (err) {
          if (!ac.signal.aborted) setScanError(err instanceof Error ? err.message : String(err));
        } finally {
          if (!ac.signal.aborted) setScanPhase('idle');
        }
      }, [primaryRoot, sessionId, workspacePath, effectiveCwd, rootPath, cacheKey, commitScanResult, runFullScan, t]);

      const runFetchAll = useCallback(async () => {
        const targetRepos = reposRef.current;
        if (!primaryRoot || targetRepos.length === 0) return;
        if (scanAbortRef.current) scanAbortRef.current.abort();
        const ac = new AbortController();
        scanAbortRef.current = ac;
        setScanPhase('fetchingAll');
        setFeedback(null);
        try {
          const res = await postApi('api/multi-git.fetch-all', {
            rootPath: rootPath || primaryRoot, repoPaths: targetRepos.map(r => r.path),
          }, ac.signal);
          if (ac.signal.aborted) return;
          if (Array.isArray(res.repos)) commitScanResult(res, cacheKey);
          if (!res.ok) setFeedback({ kind: 'error', text: res.error || t('error.actionFailed') });
          else setFeedback({ kind: 'ok', text: t('feedback.fetchAllOk', { count: targetRepos.length }) });
        } catch (err) {
          if (!ac.signal.aborted) setFeedback({ kind: 'error', text: err instanceof Error ? err.message : String(err) });
        } finally {
          if (!ac.signal.aborted) setScanPhase('idle');
        }
      }, [primaryRoot, rootPath, cacheKey, commitScanResult, t]);

      useEffect(() => {
        setScanError(null);
        setFeedback(null);
        setSelectedFile(null);
        setFileDiffState({ loading: false, data: null, error: null });
        setSelectedCommit(null);
        setCommitDetailsState({ loading: false, data: null, error: null });
        setSelectedCommitFile(null);
        setCommitFileDiffState({ loading: false, data: null, error: null });
        setLogOverride(null);
        setConfirmModal(null);
        setOpenPopover(null);

        const cached = scanCache.get(cacheKey);
        if (cached && cached.repos.length > 0) {
          setRepos(cached.repos);
          setRootPath(cached.rootPath);
          setScannedDirs(cached.scannedDirs);
          setTruncated(cached.truncated);
          setSelectedRepoPath((prev) => (
            prev && cached.repos.some(r => r.path === prev) ? prev : cached.repos[0].path
          ));
          void runLightRefresh(cached.repos, cached.rootPath);
        } else {
          void runFullScan();
        }
        return () => { if (scanAbortRef.current) scanAbortRef.current.abort(); };
      }, [cacheKey]);

      useEffect(() => {
        const wasRunning = prevRunningRef.current;
        prevRunningRef.current = sessionRunning;
        if (wasRunning && !sessionRunning && primaryRoot) {
          const timer = setTimeout(() => { void runLightRefresh(); }, 400);
          return () => { clearTimeout(timer); };
        }
        return undefined;
      }, [sessionRunning, primaryRoot, runLightRefresh]);

      useEffect(() => {
        if (!openPopover) return undefined;
        const onPointerDown = (event) => {
          if (popoverRef.current && !popoverRef.current.contains(event.target)) setOpenPopover(null);
        };
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setOpenPopover(null);
        };
        document.addEventListener('mousedown', onPointerDown);
        window.addEventListener('keydown', onKeyDown);
        return () => {
          document.removeEventListener('mousedown', onPointerDown);
          window.removeEventListener('keydown', onKeyDown);
        };
      }, [openPopover]);

      useEffect(() => {
        if (fileDiffAbortRef.current) fileDiffAbortRef.current.abort();
        if (logAbortRef.current) logAbortRef.current.abort();
        if (commitDetailsAbortRef.current) commitDetailsAbortRef.current.abort();
        if (commitFileDiffAbortRef.current) commitFileDiffAbortRef.current.abort();
        fileDiffSeqRef.current += 1;
        commitDetailsSeqRef.current += 1;
        commitFileDiffSeqRef.current += 1;
        setSelectedFile(null);
        setFileDiffState({ loading: false, data: null, error: null });
        setLogBranch('__current__');
        setLogQuery('');
        setLogAuthor('');
        setLogOverride(null);
        setSelectedCommit(null);
        setCommitDetailsState({ loading: false, data: null, error: null });
        setSelectedCommitFile(null);
        setCommitFileDiffState({ loading: false, data: null, error: null });
        setFileFilter('');
        setOpenPopover(null);
      }, [selectedRepoPath]);

      useEffect(() => () => {
        if (scanAbortRef.current) scanAbortRef.current.abort();
        if (fileDiffAbortRef.current) fileDiffAbortRef.current.abort();
        if (logAbortRef.current) logAbortRef.current.abort();
        if (commitDetailsAbortRef.current) commitDetailsAbortRef.current.abort();
        if (commitFileDiffAbortRef.current) commitFileDiffAbortRef.current.abort();
      }, []);

      const setRepoBusy = useCallback((repoPath, actionOrNull) => {
        setBusyByRepo((prev) => {
          if (!actionOrNull) {
            if (!(repoPath in prev)) return prev;
            const next = { ...prev };
            delete next[repoPath];
            return next;
          }
          return { ...prev, [repoPath]: actionOrNull };
        });
      }, []);

      const replaceSingleRepo = useCallback((updatedRepo) => {
        if (!updatedRepo || !updatedRepo.path) return;
        setRepos((prev) => {
          const next = prev.map(item => (item.path === updatedRepo.path ? updatedRepo : item));
          const cached = scanCache.get(cacheKey);
          if (cached) scanCache.set(cacheKey, { ...cached, repos: next, scannedAt: Date.now() });
          return next;
        });
      }, [cacheKey]);

      const handleStaleScan = useCallback((res) => {
        if (res && res.status === 404) { void runFullScan(); return true; }
        return false;
      }, [runFullScan]);

      const openWorkingFileDiff = useCallback(async (repoPath, filePath, area, status) => {
        if (fileDiffAbortRef.current) fileDiffAbortRef.current.abort();
        const ac = new AbortController();
        fileDiffAbortRef.current = ac;
        const seq = ++fileDiffSeqRef.current;

        setSelectedFile({ repoPath, path: filePath, area, status });
        setFileDiffState({ loading: true, data: null, error: null });

        try {
          let res = await postApi('api/multi-git.diff', { repoPath, rootPath, filePath, area }, ac.signal);
          if (!res.ok && area === 'head') {
            res = await postApi('api/multi-git.diff', { repoPath, rootPath, filePath, area: 'unstaged' }, ac.signal);
          }
          if (ac.signal.aborted || fileDiffSeqRef.current !== seq) return;
          if (!res.ok) {
            handleStaleScan(res);
            setFileDiffState({ loading: false, data: null, error: res.error || t('error.diffFailed') });
          } else {
            setFileDiffState({ loading: false, data: res, error: null });
          }
        } catch (err) {
          if (!ac.signal.aborted && fileDiffSeqRef.current === seq) {
            setFileDiffState({ loading: false, data: null, error: err instanceof Error ? err.message : String(err) });
          }
        }
      }, [rootPath, handleStaleScan, t]);

      const openCommitSingleFileDiff = useCallback(async (repoPath, hash, fileObj) => {
        if (commitFileDiffAbortRef.current) commitFileDiffAbortRef.current.abort();
        const ac = new AbortController();
        commitFileDiffAbortRef.current = ac;
        const seq = ++commitFileDiffSeqRef.current;

        setSelectedCommitFile(fileObj);
        setCommitFileDiffState({ loading: true, data: null, error: null });
        try {
          const res = await postApi('api/multi-git.commit-file-diff', { repoPath, rootPath, hash, filePath: fileObj.path }, ac.signal);
          if (ac.signal.aborted || commitFileDiffSeqRef.current !== seq) return;
          if (!res.ok) setCommitFileDiffState({ loading: false, data: null, error: res.error || t('error.diffFailed') });
          else setCommitFileDiffState({ loading: false, data: res, error: null });
        } catch (err) {
          if (!ac.signal.aborted && commitFileDiffSeqRef.current === seq) {
            setCommitFileDiffState({ loading: false, data: null, error: err instanceof Error ? err.message : String(err) });
          }
        }
      }, [rootPath, t]);

      const openCommitDetails = useCallback(async (repoPath, commit) => {
        if (commitDetailsAbortRef.current) commitDetailsAbortRef.current.abort();
        if (commitFileDiffAbortRef.current) commitFileDiffAbortRef.current.abort();
        const ac = new AbortController();
        commitDetailsAbortRef.current = ac;
        const seq = ++commitDetailsSeqRef.current;

        setSelectedCommit(commit);
        setSelectedCommitFile(null);
        setCommitDetailsState({ loading: true, data: null, error: null });
        setCommitFileDiffState({ loading: false, data: null, error: null });

        try {
          const res = await postApi('api/multi-git.commit-details', { repoPath, rootPath, hash: commit.hash }, ac.signal);
          if (ac.signal.aborted || commitDetailsSeqRef.current !== seq) return;
          if (!res.ok) {
            const legacy = await postApi('api/multi-git.commit-diff', { repoPath, rootPath, hash: commit.hash }, ac.signal);
            if (ac.signal.aborted || commitDetailsSeqRef.current !== seq) return;
            if (legacy.ok) {
              setCommitDetailsState({ loading: false, data: { commit, files: [] }, error: null });
              setCommitFileDiffState({ loading: false, data: legacy, error: null });
              return;
            }
            handleStaleScan(res);
            setCommitDetailsState({ loading: false, data: null, error: res.error || t('error.commitDetailsFailed') });
            return;
          }
          setCommitDetailsState({ loading: false, data: res, error: null });
          if (Array.isArray(res.files) && res.files.length > 0) {
            void openCommitSingleFileDiff(repoPath, commit.hash, res.files[0]);
          }
        } catch (err) {
          if (!ac.signal.aborted && commitDetailsSeqRef.current === seq) {
            setCommitDetailsState({ loading: false, data: null, error: err instanceof Error ? err.message : String(err) });
          }
        }
      }, [rootPath, handleStaleScan, openCommitSingleFileDiff, t]);

      const fetchFilteredLog = useCallback(async (repoPath, opts = {}) => {
        if (logAbortRef.current) logAbortRef.current.abort();
        const ac = new AbortController();
        logAbortRef.current = ac;
        const append = Boolean(opts.append);
        const skip = opts.skip || 0;
        const branchArg = opts.branch !== undefined ? opts.branch : logBranch;
        const queryArg = opts.query !== undefined ? opts.query : logQuery;
        const authorArg = opts.author !== undefined ? opts.author : logAuthor;

        setLogOverride((prev) => ({
          repoPath,
          commits: append && prev && prev.repoPath === repoPath ? prev.commits : [],
          hasMore: append && prev ? prev.hasMore : false,
          loading: true,
        }));
        try {
          const res = await postApi('api/multi-git.log', {
            repoPath,
            rootPath,
            branch: branchArg === '__current__' ? undefined : branchArg,
            query: queryArg,
            author: authorArg,
            limit: 40,
            skip,
          }, ac.signal);
          if (ac.signal.aborted) return;
          if (!res.ok) {
            setFeedback({ kind: 'error', text: res.error || t('error.logFailed') });
            setLogOverride(null);
            return;
          }
          setLogOverride((prev) => ({
            repoPath,
            commits: append && prev && prev.repoPath === repoPath
              ? [...prev.commits, ...(res.commits || [])]
              : (res.commits || []),
            hasMore: Boolean(res.hasMore),
            loading: false,
          }));
        } catch (err) {
          if (!ac.signal.aborted) {
            setFeedback({ kind: 'error', text: err instanceof Error ? err.message : String(err) });
            setLogOverride(null);
          }
        }
      }, [logBranch, logQuery, logAuthor, rootPath, t]);

      useEffect(() => {
        if (detailTab !== 'log' || !selectedRepo) return undefined;
        const isDefault = logBranch === '__current__' && !logQuery.trim() && !logAuthor.trim();
        if (isDefault) {
          setLogOverride(null);
          return undefined;
        }
        const timer = setTimeout(() => {
          void fetchFilteredLog(selectedRepo.path, { skip: 0, append: false });
        }, 250);
        return () => { clearTimeout(timer); };
      }, [detailTab, selectedRepo, logBranch, logQuery, logAuthor, fetchFilteredLog]);

      const refreshSingleRepo = useCallback(async (repoPath, repoName) => {
        if (busyByRepo[repoPath]) return;
        setRepoBusy(repoPath, 'refresh');
        try {
          const res = await postApi('api/multi-git.refresh-repo', { repoPath, rootPath });
          if (res.ok && res.repo) {
            replaceSingleRepo(res.repo);
            setLogOverride(null);
          } else if (!res.ok) {
            handleStaleScan(res);
            setFeedback({ kind: 'error', text: `[${repoName}] ${res.error || t('error.refreshFailed')}` });
          }
        } catch (err) {
          setFeedback({ kind: 'error', text: `[${repoName}] ${err instanceof Error ? err.message : String(err)}` });
        } finally {
          setRepoBusy(repoPath, null);
        }
      }, [busyByRepo, rootPath, setRepoBusy, replaceSingleRepo, handleStaleScan, t]);

      const runGitAction = useCallback(async (action, extraPayload = {}, targetRepo) => {
        const repoObj = targetRepo || selectedRepo;
        if (!repoObj || busyByRepo[repoObj.path]) return;
        const targetPath = repoObj.path;
        const repoName = repoObj.name;

        setRepoBusy(targetPath, action);
        setFeedback(null);
        try {
          const res = await postApi('api/multi-git.action', {
            action, repoPath: targetPath, rootPath, ...extraPayload,
          });
          if (res.repo) {
            replaceSingleRepo(res.repo);
            setLogOverride(null);
          }
          if (!res.ok) {
            handleStaleScan(res);
            if (res.committed) {
              setCommitDrafts((prev) => ({ ...prev, [targetPath]: '' }));
              setAmendByRepo((prev) => ({ ...prev, [targetPath]: false }));
            }
            setFeedback({ kind: 'error', text: `[${repoName}] ${res.error || t('error.actionFailed')}` });
          } else {
            const actionLabel = t(`action.${action}`) || action;
            const summaryText = res.output
              ? `[${repoName}] ${actionLabel}: ${res.output}`
              : `[${repoName}] ${t('feedback.actionOk', { action: actionLabel })}`;
            setFeedback({ kind: 'ok', text: summaryText });
            if (action === 'commit_selected' || action === 'commit') {
              setCommitDrafts((prev) => ({ ...prev, [targetPath]: '' }));
              setAmendByRepo((prev) => ({ ...prev, [targetPath]: false }));
              setSelectedFile((cur) => (cur && cur.repoPath === targetPath ? null : cur));
            }
            if (action === 'rollback' || action === 'discard' || action === 'stash_save' || action === 'stash_pop') {
              setSelectedFile((cur) => (cur && cur.repoPath === targetPath ? null : cur));
            }
            if (action === 'create_branch') {
              setBranchDrafts((prev) => ({ ...prev, [targetPath]: '' }));
              setOpenPopover(null);
            }
            if (action === 'checkout' || action === 'checkout_remote' || action === 'merge_branch') {
              setOpenPopover(null);
            }
            if (action === 'stash_save') setStashDraft('');
          }
        } catch (err) {
          setFeedback({ kind: 'error', text: `[${repoName}] ${err instanceof Error ? err.message : String(err)}` });
        } finally {
          setRepoBusy(targetPath, null);
        }
      }, [selectedRepo, busyByRepo, rootPath, setRepoBusy, replaceSingleRepo, handleStaleScan, t]);

      const handleCopy = useCallback(async (key, text) => {
        const ok = await copyText(text);
        if (ok) {
          setCopiedKey(key);
          setTimeout(() => { setCopiedKey((c) => (c === key ? null : c)); }, 1600);
        }
      }, []);

      const filteredRepos = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return repos.filter((repo) => {
          if (dirtyOnly && !repo.dirty) return false;
          if (!q) return true;
          return [repo.name, repo.relativePath, repo.branch || '', repo.kind || ''].join(' ').toLowerCase().includes(q);
        });
      }, [repos, searchQuery, dirtyOnly]);

      const hiddenCleanCount = useMemo(() => {
        if (!dirtyOnly) return 0;
        const q = searchQuery.trim().toLowerCase();
        return repos.filter((repo) => {
          if (repo.dirty) return false;
          if (!q) return true;
          return [repo.name, repo.relativePath, repo.branch || '', repo.kind || ''].join(' ').toLowerCase().includes(q);
        }).length;
      }, [repos, searchQuery, dirtyOnly]);

      const renderCommitFileRow = (file, area, depth, showParentDir) => {
        const isSelected = Boolean(
          selectedFile && selectedFile.repoPath === selectedRepo.path && selectedFile.path === file.path,
        );
        const isChecked = checkedSet.has(file.path);
        const { base, dir } = splitDisplayPath(file.path, file.origPath);
        const fullDisplay = file.origPath ? `${file.origPath} → ${file.path}` : file.path;
        const nameCls = fileStatusTextClass(file.status);
        const testRowCls = isTestPath(file.path) ? ' mgv-tree-row-test' : '';

        return h('div', {
          key: `${area}:${file.path}`,
          className: `mgv-tree-row${testRowCls}${isSelected ? ' mgv-tree-row-selected' : ''}`,
          style: depth > 0 ? { paddingLeft: `${depth * 14 + 6}px` } : undefined,
        },
          h(TriCheckbox, {
            checked: isChecked,
            indeterminate: false,
            ariaLabel: file.path,
            onChange: (next) => { setCheckedPaths(selectedRepo.path, [file.path], next); },
          }),
          h('button', {
            type: 'button',
            className: 'mgv-tree-label-btn',
            title: `${fullDisplay}\n${t('file.viewDiff')}`,
            onClick: () => { void openWorkingFileDiff(selectedRepo.path, file.path, area, file.status); },
          },
            Icons.file(file.status),
            h('span', { className: `mgv-tree-name ${nameCls}` }, base),
            (showParentDir && dir) ? h('span', { className: 'mgv-tree-path-muted' }, dir) : null,
          ),
          h('button', {
            type: 'button',
            className: 'mgv-icon-btn mgv-icon-btn-danger mgv-tree-hover-act',
            disabled: Boolean(selectedBusy),
            title: t('file.rollback'),
            onClick: () => {
              setConfirmModal({
                kind: 'rollback_single',
                repo: selectedRepo,
                filePath: file.path,
                untracked: area === 'untracked',
              });
            },
          }, Icons.rollback()),
        );
      };

      const renderTreeDirs = (dirs, area, groupKey, depth) => dirs.map((dirNode) => {
        const dirStateKey = `${selectedRepo.path}:${groupKey}:${dirNode.fullPath}`;
        const defaultCollapsed = groupKey === 'unversioned' && !fileFilter.trim();
        const isCollapsed = dirStateKey in collapsedDirs ? collapsedDirs[dirStateKey] : defaultCollapsed;
        let checkedCount = 0;
        for (const p of dirNode.allPaths) {
          if (checkedSet.has(p)) checkedCount += 1;
        }
        const allChecked = checkedCount > 0 && checkedCount === dirNode.allPaths.length;
        const someChecked = checkedCount > 0 && checkedCount < dirNode.allPaths.length;
        const testDirCls = isTestDirNode(dirNode) ? ' mgv-tree-row-test' : '';

        return h('div', { key: dirStateKey },
          h('div', { className: `mgv-tree-row${testDirCls}`, style: { paddingLeft: `${depth * 14 + 4}px` } },
            h('button', {
              type: 'button',
              className: 'mgv-tree-caret',
              'aria-expanded': !isCollapsed,
              onClick: () => { setCollapsedDirs((prev) => ({ ...prev, [dirStateKey]: !isCollapsed })); },
            }, isCollapsed ? Icons.caretRight() : Icons.caretDown()),
            h(TriCheckbox, {
              checked: allChecked,
              indeterminate: someChecked,
              ariaLabel: dirNode.label,
              onChange: (next) => { setCheckedPaths(selectedRepo.path, dirNode.allPaths, next); },
            }),
            h('button', {
              type: 'button',
              className: 'mgv-tree-label-btn',
              title: dirNode.fullPath,
              onClick: () => { setCollapsedDirs((prev) => ({ ...prev, [dirStateKey]: !isCollapsed })); },
            },
              Icons.folder(),
              h('span', { className: 'mgv-tree-name' }, dirNode.label),
              h('span', { className: 'mgv-tree-count' }, String(dirNode.allPaths.length)),
            ),
          ),
          !isCollapsed
            ? h(React.Fragment, null,
              renderTreeDirs(dirNode.dirs, area, groupKey, depth + 1),
              dirNode.files.map((f) => renderCommitFileRow(f, area, depth + 1, false)),
            )
            : null,
        );
      });

      const renderCommitGroup = (groupKey, title, items, totalCount, area) => {
        if (!items || items.length === 0) return null;
        const q = fileFilter.trim().toLowerCase();
        const filtered = q
          ? items.filter(f => f.path.toLowerCase().includes(q) || (f.origPath && f.origPath.toLowerCase().includes(q)))
          : items;
        if (q && filtered.length === 0) return null;

        const gKey = `${selectedRepo.path}:${groupKey}`;
        const defaultCollapsed = groupKey === 'unversioned' && totalCount > 20;
        const isCollapsed = !q && (gKey in collapsedGroups ? collapsedGroups[gKey] : defaultCollapsed);

        let checkedCount = 0;
        for (const f of filtered) {
          if (checkedSet.has(f.path)) checkedCount += 1;
        }
        const allChecked = checkedCount > 0 && checkedCount === filtered.length;
        const someChecked = checkedCount > 0 && checkedCount < filtered.length;
        const capped = totalCount > items.length;
        const badgeText = capped ? `${items.length}/${totalCount}` : String(filtered.length);
        const limitKey = `${selectedRepo.path}:${groupKey}`;
        const flatLimit = flatLimits[limitKey] || PAGE_SIZE;

        return h('div', { key: groupKey, style: { marginBottom: '4px' } },
          h('div', { className: 'mgv-tree-row' },
            h('button', {
              type: 'button',
              className: 'mgv-tree-caret',
              'aria-expanded': !isCollapsed,
              onClick: () => { setCollapsedGroups((prev) => ({ ...prev, [gKey]: !isCollapsed })); },
            }, isCollapsed ? Icons.caretRight() : Icons.caretDown()),
            h(TriCheckbox, {
              checked: allChecked,
              indeterminate: someChecked,
              ariaLabel: title,
              onChange: (next) => { setCheckedPaths(selectedRepo.path, filtered.map(f => f.path), next); },
            }),
            h('button', {
              type: 'button',
              className: 'mgv-tree-label-btn',
              onClick: () => { setCollapsedGroups((prev) => ({ ...prev, [gKey]: !isCollapsed })); },
            },
              h('span', { className: 'mgv-tree-name', style: { fontWeight: 600 } }, title),
              h('span', { className: 'mgv-tree-count' }, badgeText),
            ),
            capped ? h('span', { className: 'mgv-tree-count' }, t('changes.cappedHint', { shown: items.length })) : null,
          ),
          isCollapsed
            ? null
            : treeMode
              ? (() => {
                const tree = buildCompressedTree(filtered);
                return h(React.Fragment, null,
                  renderTreeDirs(tree.dirs, area, groupKey, 1),
                  tree.files.map((f) => renderCommitFileRow(f, area, 1, false)),
                );
              })()
              : (() => {
                const slice = filtered.slice(0, flatLimit);
                const remaining = filtered.length - slice.length;
                return h(React.Fragment, null,
                  slice.map((f) => renderCommitFileRow(f, area, 1, true)),
                  remaining > 0
                    ? h('div', { style: { padding: '4px 8px' } },
                      h('button', {
                        type: 'button',
                        className: 'mgv-btn mgv-btn-sm',
                        onClick: () => { setFlatLimits((prev) => ({ ...prev, [limitKey]: flatLimit + PAGE_SIZE })); },
                      }, t('changes.showMore', { remaining })),
                    )
                    : null,
                );
              })(),
        );
      };

      const renderCommitTab = () => {
        if (!selectedRepo) return null;
        const hasAny = trackedChanges.length + unversionedFiles.length + conflictedFiles.length > 0;
        const commitMsg = commitDrafts[selectedRepo.path] || '';
        const isAmend = Boolean(amendByRepo[selectedRepo.path]);

        const checkedTracked = trackedChanges.filter(f => checkedSet.has(f.path)).map(f => f.path);
        const checkedUntracked = unversionedFiles.filter(f => checkedSet.has(f.path)).map(f => f.path);
        const allCheckedPaths = [...checkedTracked, ...checkedUntracked];
        const canCommit = !selectedBusy && commitMsg.trim().length > 0 && (allCheckedPaths.length > 0 || isAmend);
        const hasRemote = Array.isArray(selectedRepo.remotes) && selectedRepo.remotes.length > 0 && !selectedRepo.detached;

        const handleExpandCollapseAll = (shouldCollapse) => {
          const nextGroups = { ...collapsedGroups };
          nextGroups[`${selectedRepo.path}:tracked`] = shouldCollapse;
          nextGroups[`${selectedRepo.path}:unversioned`] = shouldCollapse;
          nextGroups[`${selectedRepo.path}:conflicts`] = shouldCollapse;
          setCollapsedGroups(nextGroups);
          const nextDirs = { ...collapsedDirs };
          const walk = (nodes, groupKey) => {
            for (const d of nodes) {
              nextDirs[`${selectedRepo.path}:${groupKey}:${d.fullPath}`] = shouldCollapse;
              walk(d.dirs, groupKey);
            }
          };
          walk(buildCompressedTree(trackedChanges).dirs, 'tracked');
          walk(buildCompressedTree(unversionedFiles).dirs, 'unversioned');
          setCollapsedDirs(nextDirs);
        };

        const renderedGroups = [
          renderCommitGroup('conflicts', t('changes.conflicts'), conflictedFiles, selectedRepo.counts.conflicted, 'conflicted'),
          renderCommitGroup('tracked', t('changes.tracked'), trackedChanges, trackedChanges.length, 'head'),
          renderCommitGroup('unversioned', t('changes.unversioned'), unversionedFiles, selectedRepo.counts.untracked, 'untracked'),
        ].filter(Boolean);

        const hasDiffOpen = Boolean(selectedFile && selectedFile.repoPath === selectedRepo.path);

        return h('div', { className: 'mgv-commit-split' },
          h('div', {
            className: 'mgv-tool-pane',
            style: hasDiffOpen
              ? { width: `${layout.commitLeftWidth}px`, maxWidth: '70%', flex: 'none' }
              : { flex: 1 },
          },
            h('div', { className: 'mgv-tool-bar' },
              h('input', {
                type: 'search',
                className: 'mgv-input',
                style: { flex: '1 1 100px' },
                value: fileFilter,
                placeholder: t('changes.filterPlaceholder'),
                onChange: (e) => { setFileFilter(e.target.value); },
              }),
              h('button', {
                type: 'button',
                className: 'mgv-icon-btn',
                title: t('commit.refreshTooltip'),
                disabled: Boolean(selectedBusy),
                onClick: () => { void refreshSingleRepo(selectedRepo.path, selectedRepo.name); },
              }, Icons.refresh()),
              h('button', {
                type: 'button',
                className: 'mgv-icon-btn mgv-icon-btn-danger',
                title: t('commit.rollbackTooltip'),
                disabled: Boolean(selectedBusy) || allCheckedPaths.length === 0,
                onClick: () => {
                  setConfirmModal({
                    kind: 'rollback_batch',
                    repo: selectedRepo,
                    trackedPaths: checkedTracked,
                    untrackedPaths: checkedUntracked,
                  });
                },
              }, Icons.rollback()),
              h('div', { className: 'mgv-vsep' }),
              h('button', {
                type: 'button',
                className: `mgv-icon-btn${treeMode ? ' mgv-icon-btn-active' : ''}`,
                title: t('commit.treeTooltip'),
                onClick: () => { setTreeMode((v) => !v); },
              }, Icons.groupTree()),
              treeMode
                ? h(React.Fragment, null,
                  h('button', {
                    type: 'button',
                    className: 'mgv-icon-btn',
                    title: t('commit.expandTooltip'),
                    onClick: () => { handleExpandCollapseAll(false); },
                  }, Icons.expandAll()),
                  h('button', {
                    type: 'button',
                    className: 'mgv-icon-btn',
                    title: t('commit.collapseTooltip'),
                    onClick: () => { handleExpandCollapseAll(true); },
                  }, Icons.collapseAll()),
                )
                : null,
            ),
            h('div', { className: 'mgv-tree-scroll' },
              !hasAny
                ? h('div', { className: 'mgv-empty' }, h('div', null, t('changes.empty')))
                : renderedGroups.length > 0
                  ? renderedGroups
                  : h('div', { className: 'mgv-empty' }, h('div', null, t('changes.noFileMatches'))),
            ),
            h(ResizeHandle, {
              orientation: 'horizontal',
              side: 'bottom',
              size: layout.commitDockHeight,
              min: 84,
              max: 320,
              defaultSize: DEFAULT_LAYOUT.commitDockHeight,
              title: t('splitter.dragTip'),
              onChange: (next) => { updateLayout({ commitDockHeight: next }); },
            }),
            h('div', { className: 'mgv-commit-dock', style: { height: `${layout.commitDockHeight}px` } },
              h('textarea', {
                className: 'mgv-commit-textarea',
                value: commitMsg,
                placeholder: t('commit.placeholder'),
                disabled: Boolean(selectedBusy),
                onChange: (e) => {
                  const val = e.target.value;
                  setCommitDrafts((prev) => ({ ...prev, [selectedRepo.path]: val }));
                },
                onKeyDown: (e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canCommit) {
                    e.preventDefault();
                    void runGitAction('commit_selected', {
                      paths: allCheckedPaths, untrackedPaths: checkedUntracked, message: commitMsg, amend: isAmend, push: false,
                    }, selectedRepo);
                  }
                },
              }),
              h('div', { className: 'mgv-commit-dock-bar' },
                h('label', { className: 'mgv-checkbox-label' },
                  h('input', {
                    type: 'checkbox',
                    className: 'mgv-checkbox',
                    checked: isAmend,
                    disabled: Boolean(selectedBusy) || (selectedRepo.commits || []).length === 0,
                    onChange: (e) => {
                      const next = e.target.checked;
                      setAmendByRepo((prev) => ({ ...prev, [selectedRepo.path]: next }));
                      if (next && !commitMsg.trim() && selectedRepo.commits && selectedRepo.commits[0]) {
                        setCommitDrafts((prev) => ({ ...prev, [selectedRepo.path]: selectedRepo.commits[0].subject }));
                      }
                    },
                  }),
                  h('span', null, t('commit.amend')),
                ),
                h('div', { className: 'mgv-controls' },
                  h('button', {
                    type: 'button',
                    className: 'mgv-btn mgv-btn-primary',
                    disabled: !canCommit,
                    title: !canCommit ? t('commit.selectHint') : undefined,
                    onClick: () => {
                      void runGitAction('commit_selected', {
                        paths: allCheckedPaths, untrackedPaths: checkedUntracked, message: commitMsg, amend: isAmend, push: false,
                      }, selectedRepo);
                    },
                  }, selectedBusy === 'commit_selected'
                    ? t('commit.submitting')
                    : (allCheckedPaths.length > 0 && !isAmend)
                      ? t('commit.submitCount', { count: allCheckedPaths.length })
                      : t('commit.submit')),
                  h('button', {
                    type: 'button',
                    className: 'mgv-btn',
                    disabled: !canCommit || !hasRemote,
                    title: !hasRemote ? t('detail.noRemote') : undefined,
                    onClick: () => {
                      void runGitAction('commit_selected', {
                        paths: allCheckedPaths, untrackedPaths: checkedUntracked, message: commitMsg, amend: isAmend, push: true,
                      }, selectedRepo);
                    },
                  }, t('commit.submitPush')),
                ),
              ),
            ),
          ),
          hasDiffOpen
            ? h(React.Fragment, null,
              h(ResizeHandle, {
                orientation: 'vertical',
                side: 'left',
                size: layout.commitLeftWidth,
                min: 250,
                max: 760,
                defaultSize: DEFAULT_LAYOUT.commitLeftWidth,
                title: t('splitter.dragTip'),
                onChange: (next) => { updateLayout({ commitLeftWidth: next }); },
              }),
              h(IdeaDiffPane, {
                titlePath: selectedFile.path,
                statusChar: selectedFile.status,
                diffState: fileDiffState,
                diffMode,
                onDiffModeChange: setDiffMode,
                emptyText: t('diff.placeholder'),
                onClose: () => {
                  if (fileDiffAbortRef.current) fileDiffAbortRef.current.abort();
                  setSelectedFile(null);
                  setFileDiffState({ loading: false, data: null, error: null });
                },
                t,
                extraActions: h('button', {
                  type: 'button',
                  className: 'mgv-icon-btn mgv-icon-btn-danger',
                  title: t('file.rollback'),
                  disabled: Boolean(selectedBusy),
                  onClick: () => {
                    setConfirmModal({
                      kind: 'rollback_single',
                      repo: selectedRepo,
                      filePath: selectedFile.path,
                      untracked: selectedFile.area === 'untracked',
                    });
                  },
                }, Icons.rollback()),
              }),
            )
            : null,
        );
      };

      const renderInspectorTreeDirs = (dirs, commitHash, depth) => dirs.map((dirNode) => {
        const key = `${commitHash}:${dirNode.fullPath}`;
        const isCollapsed = Boolean(logCollapsedDirs[key]);
        const testDirCls = isTestDirNode(dirNode) ? ' mgv-tree-row-test' : '';
        return h('div', { key },
          h('div', { className: `mgv-tree-row${testDirCls}`, style: { paddingLeft: `${depth * 14 + 4}px` } },
            h('button', {
              type: 'button',
              className: 'mgv-tree-caret',
              onClick: () => { setLogCollapsedDirs((prev) => ({ ...prev, [key]: !isCollapsed })); },
            }, isCollapsed ? Icons.caretRight() : Icons.caretDown()),
            h('button', {
              type: 'button',
              className: 'mgv-tree-label-btn',
              onClick: () => { setLogCollapsedDirs((prev) => ({ ...prev, [key]: !isCollapsed })); },
            },
              Icons.folder(),
              h('span', { className: 'mgv-tree-name' }, dirNode.label),
              h('span', { className: 'mgv-tree-count' }, String(dirNode.allPaths.length)),
            ),
          ),
          !isCollapsed
            ? h(React.Fragment, null,
              renderInspectorTreeDirs(dirNode.dirs, commitHash, depth + 1),
              dirNode.files.map((f) => renderInspectorFileRow(f, commitHash, depth + 1)),
            )
            : null,
        );
      });

      const renderInspectorFileRow = (f, commitHash, depth) => {
        const isSel = selectedCommitFile && selectedCommitFile.path === f.path;
        const { base } = splitDisplayPath(f.path, f.origPath);
        const testRowCls = isTestPath(f.path) ? ' mgv-tree-row-test' : '';
        return h('div', {
          key: f.path,
          className: `mgv-tree-row${testRowCls}${isSel ? ' mgv-tree-row-selected' : ''}`,
          style: { paddingLeft: `${depth * 14 + 18}px` },
        },
          h('button', {
            type: 'button',
            className: 'mgv-tree-label-btn',
            title: f.path,
            onClick: () => { void openCommitSingleFileDiff(selectedRepo.path, commitHash, f); },
          },
            Icons.file(f.status),
            h('span', { className: `mgv-tree-name ${fileStatusTextClass(f.status)}` }, base),
          ),
          f.binary
            ? h('span', { className: 'mgv-tree-count' }, 'bin')
            : h('span', { style: { display: 'inline-flex', gap: '4px', flex: 'none' } },
              f.added > 0 ? h('span', { className: 'mgv-stat-add' }, `+${f.added}`) : null,
              f.deleted > 0 ? h('span', { className: 'mgv-stat-del' }, `-${f.deleted}`) : null,
            ),
        );
      };

      const renderGitLogTab = () => {
        if (!selectedRepo) return null;
        const usingOverride = logOverride && logOverride.repoPath === selectedRepo.path;
        const rawCommits = usingOverride ? logOverride.commits : (selectedRepo.commits || []);
        const hasMore = usingOverride ? logOverride.hasMore : Boolean(selectedRepo.hasMoreCommits);
        const logLoading = usingOverride && logOverride.loading;

        const getCommitTs = (c) => {
          const ts = Date.parse(c.committerIso || c.authorIso || c.isoDate || '');
          return Number.isNaN(ts) ? 0 : ts;
        };
        const commits = [...rawCommits].sort((a, b) => (
          logSortOrder === 'desc' ? getCommitTs(b) - getCommitTs(a) : getCommitTs(a) - getCommitTs(b)
        ));

        const localBranches = selectedRepo.branches || [];
        const remoteBranches = selectedRepo.remoteBranches || [];
        const details = commitDetailsState.data;
        const detailCommit = details ? details.commit : selectedCommit;
        const detailFiles = details && Array.isArray(details.files) ? details.files : [];
        const commitFilesTree = detailFiles.length > 0 ? buildCompressedTree(detailFiles) : null;

        return h(React.Fragment, null,
          h('div', { className: 'mgv-log-filter-bar' },
            h('button', {
              type: 'button',
              className: `mgv-icon-btn${showLogBranches ? ' mgv-icon-btn-active' : ''}`,
              title: t('log.branchesToggle'),
              onClick: () => { setShowLogBranches((v) => !v); },
            }, Icons.sidebar()),
            h('input', {
              type: 'search',
              className: 'mgv-input',
              style: { width: '190px' },
              value: logQuery,
              placeholder: t('log.searchPlaceholder'),
              onChange: (e) => { setLogQuery(e.target.value); },
            }),
            h('select', {
              className: 'mgv-select',
              style: { maxWidth: '160px' },
              value: logBranch,
              onChange: (e) => { setLogBranch(e.target.value); },
            },
              h('option', { value: '__current__' }, t('log.branchHead')),
              h('option', { value: '__all__' }, t('log.branchAll')),
              localBranches.map(b => h('option', { key: `l:${b.name}`, value: b.name }, b.name)),
              remoteBranches.map(b => h('option', { key: `r:${b.name}`, value: b.name }, b.name)),
            ),
            h('input', {
              type: 'search',
              className: 'mgv-input',
              style: { width: '120px' },
              value: logAuthor,
              placeholder: t('log.authorPlaceholder'),
              onChange: (e) => { setLogAuthor(e.target.value); },
            }),
            h('button', {
              type: 'button',
              className: 'mgv-icon-btn',
              title: logSortOrder === 'desc' ? t('log.sortDesc') : t('log.sortAsc'),
              onClick: () => { setLogSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc')); },
            }, logSortOrder === 'desc' ? Icons.arrowDown() : Icons.arrowUp(), h('span', null, logSortOrder === 'desc' ? t('log.sortDesc') : t('log.sortAsc'))),
            (selectedRepo.commits && selectedRepo.commits.length > 0)
              ? h('button', {
                type: 'button',
                className: 'mgv-icon-btn mgv-icon-btn-danger',
                style: { marginLeft: 'auto' },
                disabled: Boolean(selectedBusy),
                title: t('log.undoTooltip'),
                onClick: () => { setConfirmModal({ kind: 'undo_commit', repo: selectedRepo }); },
              }, Icons.rollback(), h('span', null, t('log.undoCommit')))
              : null,
          ),
          h('div', { className: 'mgv-log-3pane' },
            showLogBranches
              ? h(React.Fragment, null,
                h('div', { className: 'mgv-log-branches', style: { width: `${layout.logBranchesWidth}px` } },
                h('div', {
                  className: `mgv-log-branch-item${logBranch === '__current__' ? ' mgv-log-branch-item-active' : ''}`,
                  onClick: () => { setLogBranch('__current__'); },
                },
                  h('button', { type: 'button', className: 'mgv-log-branch-btn' },
                    Icons.branch('var(--mgv-st-add)'),
                    h('span', { className: 'mgv-log-branch-text', style: { fontWeight: 600 } }, t('log.branchHead')),
                  ),
                ),
                h('div', {
                  className: `mgv-log-branch-item${logBranch === '__all__' ? ' mgv-log-branch-item-active' : ''}`,
                  onClick: () => { setLogBranch('__all__'); },
                },
                  h('button', { type: 'button', className: 'mgv-log-branch-btn' },
                    Icons.branch(),
                    h('span', { className: 'mgv-log-branch-text' }, t('log.branchAll')),
                  ),
                ),
                h('div', { className: 'mgv-log-branch-section' },
                  h('span', null, t('branches.local')),
                  h('button', {
                    type: 'button',
                    className: 'mgv-icon-btn',
                    style: { height: '22px', minWidth: '22px' },
                    title: t('branches.createBtn'),
                    onClick: () => { setOpenPopover('branches'); },
                  }, Icons.plus()),
                ),
                localBranches.map((b) => h('div', {
                  key: `lb:${b.name}`,
                  className: `mgv-log-branch-item${logBranch === b.name ? ' mgv-log-branch-item-active' : ''}`,
                },
                  h('button', {
                    type: 'button',
                    className: 'mgv-log-branch-btn',
                    title: b.name,
                    onClick: () => { setLogBranch(b.name); },
                  },
                    Icons.branch(b.current ? 'var(--mgv-st-add)' : 'var(--mgv-accent)'),
                    h('span', {
                      className: 'mgv-log-branch-text',
                      style: b.current ? { fontWeight: 600 } : undefined,
                    }, b.name),
                  ),
                  !b.current
                    ? h('div', { className: 'mgv-log-branch-acts' },
                      h('button', {
                        type: 'button',
                        className: 'mgv-icon-btn',
                        style: { height: '21px', fontSize: '11.5px', padding: '0 6px' },
                        disabled: Boolean(selectedBusy),
                        onClick: (e) => { e.stopPropagation(); void runGitAction('checkout', { branch: b.name }, selectedRepo); },
                      }, t('branches.checkout')),
                    )
                    : null,
                )),
                remoteBranches.length > 0
                  ? h(React.Fragment, null,
                    h('div', { className: 'mgv-log-branch-section' }, h('span', null, t('branches.remote'))),
                    remoteBranches.slice(0, 30).map((rb) => h('div', {
                      key: `rb:${rb.name}`,
                      className: `mgv-log-branch-item${logBranch === rb.name ? ' mgv-log-branch-item-active' : ''}`,
                    },
                      h('button', {
                        type: 'button',
                        className: 'mgv-log-branch-btn',
                        title: rb.name,
                        onClick: () => { setLogBranch(rb.name); },
                      },
                        Icons.branch('var(--dsw-alias-state-done-primary, var(--dsw-alias-label-secondary))'),
                        h('span', { className: 'mgv-log-branch-text' }, rb.name),
                      ),
                      h('div', { className: 'mgv-log-branch-acts' },
                        h('button', {
                          type: 'button',
                          className: 'mgv-icon-btn',
                          style: { height: '21px', fontSize: '11.5px', padding: '0 6px' },
                          disabled: Boolean(selectedBusy),
                          onClick: (e) => { e.stopPropagation(); void runGitAction('checkout_remote', { remoteBranch: rb.name }, selectedRepo); },
                        }, t('branches.checkout')),
                      ),
                    )),
                  )
                  : null,
              ),
              h(ResizeHandle, {
                orientation: 'vertical',
                side: 'left',
                className: 'mgv-log-branches-splitter',
                size: layout.logBranchesWidth,
                min: 140,
                max: 380,
                defaultSize: DEFAULT_LAYOUT.logBranchesWidth,
                title: t('splitter.dragTip'),
                onChange: (next) => { updateLayout({ logBranchesWidth: next }); },
              }),
              )
              : null,
            h('div', { className: 'mgv-log-table-wrap' },
              h('div', { className: 'mgv-log-thead' },
                h('span', null, t('log.colMessage')),
                h('span', null, t('log.colAuthor')),
                h('span', { style: { textAlign: 'right' } }, t('log.colDate')),
              ),
              h('div', { className: 'mgv-log-tbody' },
                logLoading && commits.length === 0
                  ? h('div', { className: 'mgv-empty' }, t('log.loading'))
                  : commits.length === 0
                    ? h('div', { className: 'mgv-empty' }, t('log.empty'))
                    : h(React.Fragment, null,
                      commits.map((commit, idx) => {
                        const isSelected = selectedCommit && selectedCommit.hash === commit.hash;
                        const primaryIso = commit.committerIso || commit.authorIso || commit.isoDate || '';
                        const relTime = formatRelativeIso(primaryIso, t);
                        const commitTimeText = formatIsoLocal(primaryIso);
                        const authorIso = commit.authorIso || commit.isoDate || '';
                        const timeTitle = (authorIso && commit.committerIso && authorIso !== commit.committerIso)
                          ? t('log.authorTimeDiff', { commitTime: commitTimeText, authorTime: formatIsoLocal(authorIso) })
                          : t('log.committedAt', { commitTime: commitTimeText });

                        return h('button', {
                          key: commit.hash,
                          type: 'button',
                          className: `mgv-log-tr${isSelected ? ' mgv-log-tr-active' : ''}`,
                          onClick: () => {
                            if (isSelected) {
                              if (commitDetailsAbortRef.current) commitDetailsAbortRef.current.abort();
                              if (commitFileDiffAbortRef.current) commitFileDiffAbortRef.current.abort();
                              setSelectedCommit(null);
                              setSelectedCommitFile(null);
                              setCommitDetailsState({ loading: false, data: null, error: null });
                              setCommitFileDiffState({ loading: false, data: null, error: null });
                            } else {
                              void openCommitDetails(selectedRepo.path, commit);
                            }
                          },
                        },
                          h('span', { className: 'mgv-log-cell-msg' },
                            h(CommitGraphNode, { isFirst: idx === 0, isLast: idx === commits.length - 1, isMerge: Boolean(commit.isMerge) }),
                            (commit.refs || []).map((ref, rIdx) => {
                              const refCls = ref.kind === 'head'
                                ? 'mgv-ref-head'
                                : ref.kind === 'tag'
                                  ? 'mgv-ref-tag'
                                  : ref.kind === 'remote'
                                    ? 'mgv-ref-remote'
                                    : 'mgv-ref-local';
                              return h('span', { key: `${rIdx}:${ref.label}`, className: `mgv-ref-pill ${refCls}` }, ref.label);
                            }),
                            h('span', { className: 'mgv-log-subj', title: `${commit.shortHash}  ${commit.subject}` }, commit.subject),
                          ),
                          h('span', { className: 'mgv-log-cell-meta', title: commit.author }, commit.author),
                          h('span', { className: 'mgv-log-cell-date', title: timeTitle }, relTime),
                        );
                      }),
                      hasMore
                        ? h('div', { style: { padding: '6px', textAlign: 'center' } },
                          h('button', {
                            type: 'button',
                            className: 'mgv-btn mgv-btn-sm',
                            disabled: logLoading,
                            onClick: () => { void fetchFilteredLog(selectedRepo.path, { skip: rawCommits.length, append: true }); },
                          }, logLoading ? t('log.loading') : t('log.loadMore')),
                        )
                        : null,
                    ),
              ),
            ),
            !selectedCommit
              ? null
              : h(React.Fragment, null,
                h(ResizeHandle, {
                  orientation: 'vertical',
                  side: 'right',
                  size: layout.logInspectorWidth,
                  min: 280,
                  max: 960,
                  defaultSize: DEFAULT_LAYOUT.logInspectorWidth,
                  title: t('splitter.dragTip'),
                  onChange: (next) => { updateLayout({ logInspectorWidth: next }); },
                }),
                h('div', { className: 'mgv-log-inspector', style: { width: `${layout.logInspectorWidth}px` } },
                  h('div', { className: 'mgv-inspector-top', style: { height: `${layout.logFilesHeight}px` } },
                    h('div', { className: 'mgv-inspector-files' },
                      commitDetailsState.loading
                        ? h('div', { className: 'mgv-empty' }, t('diff.loading'))
                        : commitDetailsState.error
                          ? h('div', { className: 'mgv-empty', style: { color: 'var(--mgv-st-conf)' } }, commitDetailsState.error)
                          : commitFilesTree
                            ? h(React.Fragment, null,
                              renderInspectorTreeDirs(commitFilesTree.dirs, detailCommit.hash, 0),
                              commitFilesTree.files.map((f) => renderInspectorFileRow(f, detailCommit.hash, 0)),
                            )
                            : null,
                    ),
                    h('div', { className: 'mgv-inspector-meta' },
                      h('div', { className: 'mgv-inspector-meta-top' },
                        h('span', { className: 'mgv-inspector-subj', title: detailCommit.subject }, detailCommit.subject),
                        h('div', { className: 'mgv-controls' },
                          h('button', {
                            type: 'button',
                            className: 'mgv-btn mgv-btn-sm',
                            disabled: Boolean(selectedBusy),
                            onClick: () => { void runGitAction('cherry_pick', { hash: detailCommit.hash }, selectedRepo); },
                          }, selectedBusy === 'cherry_pick' ? t('log.cherryPicking') : t('log.cherryPick')),
                          h('button', {
                            type: 'button',
                            className: 'mgv-icon-btn',
                            title: `${t('log.copyHash')}: ${detailCommit.shortHash}`,
                            onClick: () => { void handleCopy(`hash:${detailCommit.hash}`, detailCommit.hash); },
                          }, Icons.copy(), h('span', null, copiedKey === `hash:${detailCommit.hash}` ? t('header.copied') : detailCommit.shortHash)),
                          h('button', {
                            type: 'button',
                            className: 'mgv-icon-btn',
                            title: t('inspector.closeTooltip'),
                            onClick: () => {
                              if (commitDetailsAbortRef.current) commitDetailsAbortRef.current.abort();
                              if (commitFileDiffAbortRef.current) commitFileDiffAbortRef.current.abort();
                              setSelectedCommit(null);
                              setSelectedCommitFile(null);
                              setCommitDetailsState({ loading: false, data: null, error: null });
                              setCommitFileDiffState({ loading: false, data: null, error: null });
                            },
                          }, Icons.close()),
                        ),
                      ),
                      h('div', { className: 'mgv-inspector-sub' },
                        h('span', null, `${detailCommit.author}${detailCommit.email ? ` <${detailCommit.email}>` : ''}`),
                        h('span', null, formatIsoLocal(detailCommit.committerIso || detailCommit.authorIso || detailCommit.isoDate)),
                      ),
                    ),
                  ),
                  h(ResizeHandle, {
                    orientation: 'horizontal',
                    side: 'top',
                    size: layout.logFilesHeight,
                    min: 110,
                    max: 560,
                    defaultSize: DEFAULT_LAYOUT.logFilesHeight,
                    title: t('splitter.dragTip'),
                    onChange: (next) => { updateLayout({ logFilesHeight: next }); },
                  }),
                  h(IdeaDiffPane, {
                    titlePath: selectedCommitFile ? selectedCommitFile.path : null,
                    statusChar: selectedCommitFile ? selectedCommitFile.status : null,
                    diffState: commitFileDiffState,
                    diffMode,
                    onDiffModeChange: setDiffMode,
                    emptyText: t('log.selectFileHint'),
                    t,
                  }),
                ),
              ),
          ),
        );
      };

      const renderBranchesPopover = () => {
        if (openPopover !== 'branches' || !selectedRepo) return null;
        const q = branchFilter.trim().toLowerCase();
        const locals = (selectedRepo.branches || []).filter(b => !q || b.name.toLowerCase().includes(q));
        const remotesList = (selectedRepo.remoteBranches || []).filter(b => !q || b.name.toLowerCase().includes(q));
        const remotes = selectedRepo.remotes || [];
        const newBranchName = branchDrafts[selectedRepo.path] || '';
        const canCreate = newBranchName.trim().length > 0 && !selectedBusy;

        return h('div', { ref: popoverRef, className: 'mgv-popover', role: 'dialog', 'aria-label': t('branches.local') },
          h('div', { className: 'mgv-popover-head' },
            h('input', {
              type: 'search',
              className: 'mgv-input',
              value: branchFilter,
              placeholder: t('branches.filterPlaceholder'),
              onChange: (e) => { setBranchFilter(e.target.value); },
            }),
            h('div', { className: 'mgv-popover-head-row' },
              h('input', {
                type: 'text',
                className: 'mgv-input',
                style: { flex: 1 },
                value: newBranchName,
                placeholder: t('branches.createPlaceholder'),
                disabled: Boolean(selectedBusy),
                onChange: (e) => {
                  const val = e.target.value;
                  setBranchDrafts((prev) => ({ ...prev, [selectedRepo.path]: val }));
                },
                onKeyDown: (e) => {
                  if (e.key === 'Enter' && canCreate) {
                    e.preventDefault();
                    void runGitAction('create_branch', { branch: newBranchName }, selectedRepo);
                  }
                },
              }),
              h('button', {
                type: 'button',
                className: 'mgv-btn mgv-btn-sm mgv-btn-primary',
                disabled: !canCreate,
                onClick: () => { void runGitAction('create_branch', { branch: newBranchName }, selectedRepo); },
              }, selectedBusy === 'create_branch' ? t('branches.creating') : t('branches.createBtn')),
            ),
          ),
          h('div', { className: 'mgv-popover-body' },
            h('div', null,
              h('div', { className: 'mgv-popover-sec' }, `${t('branches.local')} (${locals.length})`),
              locals.length === 0
                ? h('div', { style: { padding: '4px 6px', color: 'var(--dsw-alias-label-secondary)' } }, t('branches.empty'))
                : locals.map((b) => h('div', { key: b.name, className: 'mgv-popover-row' },
                  h('div', { style: { minWidth: 0, flex: 1 } },
                    h('div', { style: { display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 } },
                      Icons.branch(b.current ? 'var(--mgv-st-add)' : 'var(--mgv-accent)'),
                      h('span', {
                        style: { fontFamily: 'var(--mgv-code-font)', fontSize: '13px', fontWeight: b.current ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                        title: b.name,
                      }, b.name),
                      b.current ? h('span', { className: 'mgv-ref-pill mgv-ref-head' }, t('branches.current')) : null,
                    ),
                  ),
                  !b.current
                    ? h('div', { className: 'mgv-controls' },
                      h('button', {
                        type: 'button',
                        className: 'mgv-btn mgv-btn-sm',
                        disabled: Boolean(selectedBusy),
                        onClick: () => { void runGitAction('checkout', { branch: b.name }, selectedRepo); },
                      }, t('branches.checkout')),
                      h('button', {
                        type: 'button',
                        className: 'mgv-icon-btn',
                        disabled: Boolean(selectedBusy),
                        onClick: () => { void runGitAction('merge_branch', { branch: b.name }, selectedRepo); },
                      }, t('branches.merge')),
                      h('button', {
                        type: 'button',
                        className: 'mgv-icon-btn mgv-icon-btn-danger',
                        disabled: Boolean(selectedBusy),
                        onClick: () => {
                          setOpenPopover(null);
                          setConfirmModal({ kind: 'delete_branch', repo: selectedRepo, branch: b.name });
                        },
                      }, t('branches.delete')),
                    )
                    : null,
                )),
            ),
            remotesList.length > 0
              ? h('div', null,
                h('div', { className: 'mgv-popover-sec' }, `${t('branches.remote')} (${remotesList.length})`),
                remotesList.slice(0, 35).map((rb) => h('div', { key: rb.name, className: 'mgv-popover-row' },
                  h('div', { style: { display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 } },
                    Icons.branch('var(--dsw-alias-state-done-primary, var(--dsw-alias-label-secondary))'),
                    h('span', {
                      style: { fontFamily: 'var(--mgv-code-font)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                      title: rb.name,
                    }, rb.name),
                  ),
                  h('button', {
                    type: 'button',
                    className: 'mgv-icon-btn',
                    disabled: Boolean(selectedBusy),
                    onClick: () => { void runGitAction('checkout_remote', { remoteBranch: rb.name }, selectedRepo); },
                  }, t('branches.checkout')),
                )),
              )
              : null,
            h('div', null,
              h('div', { className: 'mgv-popover-sec' }, `${t('remotes.title')} (${remotes.length})`),
              remotes.length === 0
                ? h('div', { style: { padding: '4px 6px', color: 'var(--dsw-alias-label-secondary)' } }, t('remotes.empty'))
                : remotes.map((r) => {
                  const url = r.fetchUrl || r.pushUrl || '';
                  const key = `remote:${selectedRepo.path}:${r.name}`;
                  return h('div', { key: r.name, className: 'mgv-popover-row' },
                    h('div', { style: { minWidth: 0, flex: 1 } },
                      h('div', { style: { fontWeight: 600, fontSize: '12.5px' } }, r.name),
                      h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, title: url }, url),
                    ),
                    url
                      ? h('button', {
                        type: 'button',
                        className: 'mgv-icon-btn',
                        onClick: () => { void handleCopy(key, url); },
                      }, copiedKey === key ? t('header.copied') : t('remotes.copyUrl'))
                      : null,
                  );
                }),
            ),
          ),
        );
      };

      const renderStashPopover = () => {
        if (openPopover !== 'stash' || !selectedRepo) return null;
        const stashes = selectedRepo.stashes || [];
        return h('div', { ref: popoverRef, className: 'mgv-popover mgv-popover-right', role: 'dialog', 'aria-label': t('header.stashTooltip') },
          h('div', { className: 'mgv-popover-head' },
            h('div', { className: 'mgv-popover-head-row' },
              h('input', {
                type: 'text',
                className: 'mgv-input',
                style: { flex: 1 },
                value: stashDraft,
                placeholder: t('stash.placeholder'),
                disabled: Boolean(selectedBusy) || !selectedRepo.dirty,
                onChange: (e) => { setStashDraft(e.target.value); },
              }),
              h('button', {
                type: 'button',
                className: 'mgv-btn mgv-btn-sm mgv-btn-primary',
                disabled: Boolean(selectedBusy) || !selectedRepo.dirty,
                onClick: () => { void runGitAction('stash_save', { message: stashDraft }, selectedRepo); },
              }, selectedBusy === 'stash_save' ? t('stash.saving') : t('stash.saveBtn')),
            ),
          ),
          h('div', { className: 'mgv-popover-body' },
            stashes.length === 0
              ? h('div', { style: { padding: '8px', color: 'var(--dsw-alias-label-secondary)' } }, t('stash.empty'))
              : stashes.map((s) => h('div', { key: s.ref, className: 'mgv-popover-row' },
                h('div', { style: { minWidth: 0, flex: 1 } },
                  h('div', { style: { display: 'flex', alignItems: 'center', gap: '5px' } },
                    h('span', { className: 'mgv-ref-pill mgv-ref-local' }, s.ref),
                    h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, formatRelativeIso(s.committerIso, t)),
                  ),
                  h('div', { style: { fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }, title: s.message }, s.message),
                ),
                h('div', { className: 'mgv-controls' },
                  h('button', {
                    type: 'button',
                    className: 'mgv-icon-btn',
                    disabled: Boolean(selectedBusy),
                    onClick: () => { void runGitAction('stash_apply', { ref: s.ref }, selectedRepo); },
                  }, t('stash.apply')),
                  h('button', {
                    type: 'button',
                    className: 'mgv-btn mgv-btn-sm',
                    disabled: Boolean(selectedBusy),
                    onClick: () => { void runGitAction('stash_pop', { ref: s.ref }, selectedRepo); },
                  }, t('stash.pop')),
                  h('button', {
                    type: 'button',
                    className: 'mgv-icon-btn mgv-icon-btn-danger',
                    disabled: Boolean(selectedBusy),
                    onClick: () => {
                      setOpenPopover(null);
                      setConfirmModal({ kind: 'drop_stash', repo: selectedRepo, ref: s.ref, message: s.message });
                    },
                  }, t('stash.drop')),
                ),
              )),
          ),
        );
      };

      const renderActiveModal = () => {
        if (!confirmModal) return null;
        if (confirmModal.kind === 'rollback_single') {
          return h(ConfirmModal, {
            title: t('modal.rollbackTitle'),
            body: confirmModal.untracked
              ? t('modal.rollbackSingleUntracked', { repo: confirmModal.repo.name, file: confirmModal.filePath })
              : t('modal.rollbackSingleTracked', { repo: confirmModal.repo.name, file: confirmModal.filePath }),
            cancelLabel: t('modal.cancel'),
            confirmLabel: confirmModal.untracked ? t('modal.confirmDelete') : t('modal.confirmRollback'),
            confirmDanger: true,
            onCancel: () => { setConfirmModal(null); },
            onConfirm: () => {
              const target = confirmModal;
              setConfirmModal(null);
              void runGitAction('rollback', target.untracked
                ? { trackedPaths: [], untrackedPaths: [target.filePath] }
                : { trackedPaths: [target.filePath], untrackedPaths: [] }, target.repo);
            },
          });
        }
        if (confirmModal.kind === 'rollback_batch') {
          return h(ConfirmModal, {
            title: t('modal.rollbackTitle'),
            body: t('modal.rollbackBody', {
              repo: confirmModal.repo.name,
              tracked: confirmModal.trackedPaths.length,
              untracked: confirmModal.untrackedPaths.length,
            }),
            cancelLabel: t('modal.cancel'),
            confirmLabel: t('modal.confirmRollback'),
            confirmDanger: true,
            onCancel: () => { setConfirmModal(null); },
            onConfirm: () => {
              const target = confirmModal;
              setConfirmModal(null);
              void runGitAction('rollback', {
                trackedPaths: target.trackedPaths, untrackedPaths: target.untrackedPaths,
              }, target.repo);
            },
          });
        }
        if (confirmModal.kind === 'undo_commit') {
          return h(ConfirmModal, {
            title: t('modal.undoTitle'),
            body: t('modal.undoBody', { repo: confirmModal.repo.name }),
            cancelLabel: t('modal.cancel'),
            confirmLabel: t('modal.confirmUndo'),
            confirmDanger: true,
            onCancel: () => { setConfirmModal(null); },
            onConfirm: () => {
              const target = confirmModal;
              setConfirmModal(null);
              void runGitAction('undo_commit', {}, target.repo);
            },
          });
        }
        if (confirmModal.kind === 'delete_branch') {
          return h(ConfirmModal, {
            title: t('modal.deleteBranchTitle'),
            body: t('modal.deleteBranchBody', { repo: confirmModal.repo.name, branch: confirmModal.branch }),
            cancelLabel: t('modal.cancel'),
            confirmLabel: t('modal.confirmDelete'),
            confirmDanger: true,
            onCancel: () => { setConfirmModal(null); },
            onConfirm: () => {
              const target = confirmModal;
              setConfirmModal(null);
              void runGitAction('delete_branch', { branch: target.branch }, target.repo);
            },
          });
        }
        if (confirmModal.kind === 'drop_stash') {
          return h(ConfirmModal, {
            title: t('modal.dropStashTitle'),
            body: t('modal.dropStashBody', { repo: confirmModal.repo.name, ref: confirmModal.ref, message: confirmModal.message }),
            cancelLabel: t('modal.cancel'),
            confirmLabel: t('modal.confirmDelete'),
            confirmDanger: true,
            onCancel: () => { setConfirmModal(null); },
            onConfirm: () => {
              const target = confirmModal;
              setConfirmModal(null);
              void runGitAction('stash_drop', { ref: target.ref }, target.repo);
            },
          });
        }
        return null;
      };

      const renderShellBody = () => {
        if (!primaryRoot) {
          return h('div', { className: 'mgv-empty' },
            h('div', { style: { fontWeight: 600 } }, t('empty.title')),
            h('div', null, t('empty.noDir')),
          );
        }
        if (scanPhase === 'scanning' && repos.length === 0) {
          return h('div', { className: 'mgv-empty', 'aria-busy': 'true' }, t('toolbar.scanning'));
        }
        if (!gitAvailable) {
          return h('div', { className: 'mgv-empty' },
            h('div', { style: { fontWeight: 600 } }, t('error.gitMissing')),
            h('button', { type: 'button', className: 'mgv-btn', onClick: () => { void runFullScan(); } }, t('error.retry')),
          );
        }
        if (scanError && repos.length === 0) {
          return h('div', { className: 'mgv-empty' },
            h('div', { style: { color: 'var(--mgv-st-conf)' } }, scanError),
            h('button', { type: 'button', className: 'mgv-btn', onClick: () => { void runFullScan(); } }, t('error.retry')),
          );
        }
        if (repos.length === 0) {
          return h('div', { className: 'mgv-empty' },
            h('div', { style: { fontWeight: 600 } }, t('empty.title')),
            h('div', null, t('empty.desc', { path: rootPath || primaryRoot, dirs: scannedDirs })),
            h('button', { type: 'button', className: 'mgv-btn', onClick: () => { void runFullScan(); } }, t('empty.rescan')),
          );
        }

        return h('div', { className: 'mgv-shell' },
          showReposRail
            ? h(React.Fragment, null,
              h('div', { className: 'mgv-repo-rail', style: { width: `${layout.railWidth}px` } },
              h('div', { className: 'mgv-rail-head' },
                h('input', {
                  type: 'search',
                  className: 'mgv-input',
                  style: { flex: 1 },
                  value: searchQuery,
                  placeholder: t('rail.searchPlaceholder'),
                  onChange: (e) => { setSearchQuery(e.target.value); },
                }),
                h('button', {
                  type: 'button',
                  className: `mgv-icon-btn${dirtyOnly ? ' mgv-icon-btn-active' : ''}`,
                  'aria-pressed': dirtyOnly,
                  title: t('rail.dirtyOnly'),
                  onClick: () => { setDirtyOnly((v) => !v); },
                }, Icons.funnel()),
              ),
              h('div', { className: 'mgv-rail-list', role: 'list' },
                filteredRepos.length === 0
                  ? h('div', { className: 'mgv-empty' },
                    h('div', null, t('repo.noMatches')),
                    h('button', {
                      type: 'button',
                      className: 'mgv-btn mgv-btn-sm',
                      onClick: () => { setSearchQuery(''); setDirtyOnly(false); },
                    }, t('repo.clearFilters')),
                  )
                  : filteredRepos.map((repo) => {
                    const isSelected = selectedRepo && selectedRepo.path === repo.path;
                    const branchLabel = repo.detached ? t('repo.detached') : (repo.branch || 'HEAD');
                    const abText = formatAheadBehind(repo.ahead, repo.behind);
                    const total = repo.counts ? repo.counts.total : 0;
                    return h('button', {
                      key: repo.path,
                      type: 'button',
                      role: 'listitem',
                      className: `mgv-repo-row${isSelected ? ' mgv-repo-row-active' : ''}`,
                      title: `${repo.path}\n${branchLabel}`,
                      onClick: () => { setSelectedRepoPath(repo.path); },
                    },
                      Icons.repo(repo.dirty),
                      h('div', { className: 'mgv-repo-row-main' },
                        h('div', { className: 'mgv-repo-row-line1' },
                          h('span', { className: 'mgv-repo-row-name' }, repo.name),
                          total > 0
                            ? h('span', { className: 'mgv-repo-row-count' }, String(total))
                            : abText
                              ? h('span', { className: 'mgv-ab-pill' }, abText)
                              : null,
                        ),
                        h('div', { className: 'mgv-repo-row-line2' },
                          h('span', { className: 'mgv-repo-branch-sub' }, branchLabel),
                          repo.relativePath !== '.' ? h('span', { className: 'mgv-tree-path-muted' }, `· ${repo.relativePath}`) : null,
                        ),
                      ),
                    );
                  }),
              ),
              hiddenCleanCount > 0
                ? h('div', { className: 'mgv-rail-footer' },
                  h('span', null, t('rail.hiddenClean', { count: hiddenCleanCount })),
                  h('button', {
                    type: 'button',
                    className: 'mgv-icon-btn',
                    style: { color: 'var(--mgv-accent)' },
                    onClick: () => { setDirtyOnly(false); },
                  }, t('rail.showAll')),
                )
                : null,
              ),
              h(ResizeHandle, {
                orientation: 'vertical',
                side: 'left',
                size: layout.railWidth,
                min: 160,
                max: 440,
                defaultSize: DEFAULT_LAYOUT.railWidth,
                title: t('splitter.dragTip'),
                onChange: (next) => { updateLayout({ railWidth: next }); },
              }),
            )
            : null,
          h('div', { className: 'mgv-main' },
            !selectedRepo
              ? h('div', { className: 'mgv-empty' }, t('detail.selectPrompt'))
              : (selectedRepo.error
                ? h('div', { className: 'mgv-banner mgv-banner-error', role: 'alert' }, selectedRepo.error)
                : null),
            selectedRepo
              ? (detailTab === 'commit' ? renderCommitTab() : renderGitLogTab())
              : null,
          ),
        );
      };

      const branchLabel = selectedRepo
        ? (selectedRepo.detached ? `${t('repo.detached')} (${selectedRepo.shortOid || '?'})` : (selectedRepo.branch || 'HEAD'))
        : '';
      const abText = selectedRepo ? formatAheadBehind(selectedRepo.ahead, selectedRepo.behind) : '';
      const hasRemote = Boolean(selectedRepo && Array.isArray(selectedRepo.remotes) && selectedRepo.remotes.length > 0);
      const canPullPush = Boolean(hasRemote && selectedRepo && !selectedRepo.detached);
      const pullPushHint = !hasRemote
        ? t('detail.noRemote')
        : (selectedRepo && selectedRepo.detached) ? t('detail.detachedHint') : undefined;
      const totalChanged = selectedRepo && selectedRepo.counts ? selectedRepo.counts.total : 0;

      return h('div', { className: 'mgv-root', 'data-conversation-composer-overlay': '' },
        // Single Sleek IDE Header Toolbar
        h('div', { className: 'mgv-ide-header' },
          h('div', { className: 'mgv-ide-header-left' },
            h('button', {
              type: 'button',
              className: `mgv-icon-btn${showReposRail ? ' mgv-icon-btn-active' : ''}`,
              title: t('header.reposToggle'),
              onClick: () => { setShowReposRail((v) => !v); },
            }, Icons.sidebar(), repos.length > 0 ? h('span', null, String(repos.length)) : null),
            selectedRepo
              ? h(React.Fragment, null,
                h('span', {
                  style: {
                    fontWeight: 600,
                    fontSize: '13.5px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '180px',
                  },
                  title: selectedRepo.path,
                }, selectedRepo.name),
                h('div', { className: 'mgv-popover-anchor' },
                  h('button', {
                    type: 'button',
                    className: 'mgv-branch-widget',
                    'aria-haspopup': 'dialog',
                    'aria-expanded': openPopover === 'branches',
                    title: t('header.branchTooltip'),
                    onClick: () => { setOpenPopover((v) => (v === 'branches' ? null : 'branches')); },
                  },
                    Icons.branch('var(--mgv-accent)'),
                    h('span', { className: 'mgv-branch-widget-name' }, branchLabel),
                    abText ? h('span', { className: 'mgv-ab-pill' }, abText) : null,
                    Icons.caretDown(),
                  ),
                  renderBranchesPopover(),
                ),
                h('div', { className: 'mgv-vsep' }),
                h('div', { className: 'mgv-ide-tabs', role: 'tablist' },
                  h('button', {
                    type: 'button',
                    role: 'tab',
                    'aria-selected': detailTab === 'commit',
                    className: `mgv-ide-tab${detailTab === 'commit' ? ' mgv-ide-tab-active' : ''}`,
                    onClick: () => { setDetailTab('commit'); },
                  }, t('header.tab.commit'), totalChanged > 0 ? h('span', { className: 'mgv-ide-tab-badge' }, String(totalChanged)) : null),
                  h('button', {
                    type: 'button',
                    role: 'tab',
                    'aria-selected': detailTab === 'log',
                    className: `mgv-ide-tab${detailTab === 'log' ? ' mgv-ide-tab-active' : ''}`,
                    onClick: () => { setDetailTab('log'); },
                  }, t('header.tab.log')),
                ),
              )
              : null,
          ),
          h('div', { className: 'mgv-ide-header-right' },
            selectedRepo
              ? h(React.Fragment, null,
                h('button', {
                  type: 'button',
                  className: 'mgv-icon-btn',
                  title: pullPushHint || t('header.updateTooltip'),
                  disabled: Boolean(selectedBusy) || !canPullPush,
                  onClick: () => { void runGitAction('pull', {}, selectedRepo); },
                }, Icons.pull()),
                h('button', {
                  type: 'button',
                  className: 'mgv-icon-btn',
                  title: pullPushHint || t('header.pushTooltip'),
                  disabled: Boolean(selectedBusy) || !canPullPush,
                  onClick: () => { void runGitAction('push', {}, selectedRepo); },
                }, Icons.push()),
                h('button', {
                  type: 'button',
                  className: 'mgv-icon-btn',
                  title: !hasRemote ? t('detail.noRemote') : t('header.fetchTooltip'),
                  disabled: Boolean(selectedBusy) || !hasRemote,
                  onClick: () => { void runGitAction('fetch', {}, selectedRepo); },
                }, Icons.fetch()),
                h('div', { className: 'mgv-popover-anchor' },
                  h('button', {
                    type: 'button',
                    className: `mgv-icon-btn${openPopover === 'stash' ? ' mgv-icon-btn-active' : ''}`,
                    title: t('header.stashTooltip'),
                    'aria-haspopup': 'dialog',
                    'aria-expanded': openPopover === 'stash',
                    onClick: () => { setOpenPopover((v) => (v === 'stash' ? null : 'stash')); },
                  },
                    Icons.stash(),
                    selectedRepo.stashCount > 0 ? h('span', { className: 'mgv-icon-dot' }) : null,
                  ),
                  renderStashPopover(),
                ),
                h('div', { className: 'mgv-vsep' }),
                h('button', {
                  type: 'button',
                  className: 'mgv-icon-btn',
                  title: `${t('header.copyPathTooltip')}: ${selectedRepo.path}`,
                  onClick: () => { void handleCopy('path', selectedRepo.path); },
                }, Icons.copy(), copiedKey === 'path' ? h('span', null, t('header.copied')) : null),
                h('button', {
                  type: 'button',
                  className: 'mgv-icon-btn',
                  title: `${t('header.copyGitCTooltip')}: git -C "${selectedRepo.path}" status`,
                  onClick: () => { void handleCopy('gitc', `git -C "${selectedRepo.path}" status`); },
                }, h('span', { style: { fontFamily: 'var(--mgv-code-font)', fontSize: '12px' } }, copiedKey === 'gitc' ? t('header.copied') : 'git -C')),
                h('div', { className: 'mgv-vsep' }),
              )
              : null,
            repos.length > 1
              ? h('button', {
                type: 'button',
                className: `mgv-icon-btn${scanPhase === 'fetchingAll' ? ' mgv-icon-btn-active' : ''}`,
                title: t('header.fetchAllTooltip'),
                disabled: scanPhase !== 'idle' || !primaryRoot,
                onClick: () => { void runFetchAll(); },
              }, Icons.fetchAll())
              : null,
            h('button', {
              type: 'button',
              className: `mgv-icon-btn${scanPhase === 'refreshing' ? ' mgv-spin mgv-icon-btn-active' : ''}`,
              title: t('header.refreshTooltip'),
              disabled: scanPhase !== 'idle' || !primaryRoot,
              onClick: () => { void runLightRefresh(); },
            }, Icons.refresh()),
            h('button', {
              type: 'button',
              className: 'mgv-icon-btn',
              title: `${t('header.rescanTooltip')} (${rootPath || primaryRoot || ''})`,
              disabled: scanPhase !== 'idle' || !primaryRoot,
              onClick: () => { void runFullScan(); },
            }, Icons.rescan()),
          ),
        ),
        truncated ? h('div', { className: 'mgv-banner mgv-banner-warn' }, h('span', null, t('toolbar.truncated'))) : null,
        (scanError && repos.length > 0)
          ? h('div', { className: 'mgv-banner mgv-banner-error', role: 'alert' },
            h('div', { className: 'mgv-banner-text' }, scanError),
            h('button', { type: 'button', className: 'mgv-btn mgv-btn-sm', onClick: () => { void runFullScan(); } }, t('error.retry')),
          )
          : null,
        feedback
          ? h('div', {
            className: `mgv-banner ${feedback.kind === 'error' ? 'mgv-banner-error' : 'mgv-banner-ok'}`,
            role: feedback.kind === 'error' ? 'alert' : 'status',
            'aria-live': 'polite',
          },
            h('div', { className: 'mgv-banner-text' }, feedback.text),
            h('button', { type: 'button', className: 'mgv-btn mgv-btn-sm', onClick: () => { setFeedback(null); } }, t('feedback.dismiss')),
          )
          : null,
        renderShellBody(),
        renderActiveModal(),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          const disposeZh = ctx.locale.register(NS, 'zh', ZH);
          const disposeEn = ctx.locale.register(NS, 'en', EN);
          return () => {
            if (typeof disposeZh === 'function') disposeZh();
            if (typeof disposeEn === 'function') disposeEn();
          };
        }, 'multi-git-view: locales');

        ctx.effect(() => {
          if (typeof document === 'undefined') return undefined;
          let styleEl = document.getElementById(STYLE_ID);
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            document.head.appendChild(styleEl);
          }
          styleEl.textContent = CSS;
          return () => {
            const current = document.getElementById(STYLE_ID);
            if (current && current.parentNode) current.parentNode.removeChild(current);
          };
        }, 'multi-git-view: styles');

        const t = ctx.locale.bind(NS);
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'multi-git',
          order: 35,
          locale: NS,
          label: () => t('view.tab'),
        }, MultiGitView));
      },
    };
  },
});
