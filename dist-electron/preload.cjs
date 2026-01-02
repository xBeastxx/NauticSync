// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => import_electron.ipcRenderer.invoke("ping"),
  getSyncthingConfig: () => import_electron.ipcRenderer.invoke("get-syncthing-config"),
  readDirectory: (path) => import_electron.ipcRenderer.invoke("read-directory", path),
  gitStatus: (path) => import_electron.ipcRenderer.invoke("git-status", path),
  gitLog: (path) => import_electron.ipcRenderer.invoke("git-log", path),
  gitInit: (path) => import_electron.ipcRenderer.invoke("git-init", path),
  gitStage: (repoPath, filepath) => import_electron.ipcRenderer.invoke("git-stage", { repoPath, filepath }),
  gitUnstage: (repoPath, filepath) => import_electron.ipcRenderer.invoke("git-unstage", { repoPath, filepath }),
  gitCommit: (repoPath, message, author) => import_electron.ipcRenderer.invoke("git-commit", { repoPath, message, author }),
  gitBranches: (path) => import_electron.ipcRenderer.invoke("git-branches", path),
  gitGraphData: (path) => import_electron.ipcRenderer.invoke("git-graph-data", path),
  gitPull: (path) => import_electron.ipcRenderer.invoke("git-pull", path),
  // Dialogs
  openDirectory: () => import_electron.ipcRenderer.invoke("open-directory"),
  // GitHub
  githubLogin: (token) => import_electron.ipcRenderer.invoke("github-login", token),
  githubLogout: () => import_electron.ipcRenderer.invoke("github-logout"),
  githubUser: () => import_electron.ipcRenderer.invoke("github-user"),
  githubRepos: (page, perPage) => import_electron.ipcRenderer.invoke("github-repos", page, perPage),
  getRepoContents: (owner, repo, path) => import_electron.ipcRenderer.invoke("get-repo-contents", { owner, repo, path }),
  downloadFile: (url, targetPath) => import_electron.ipcRenderer.invoke("download-file", { url, targetPath }),
  // Conflicts
  scanConflicts: (folderPath) => import_electron.ipcRenderer.invoke("scan-conflicts", folderPath),
  resolveConflict: (conflictPath, strategy) => import_electron.ipcRenderer.invoke("resolve-conflict", { conflictPath, strategy }),
  // Profile Detection
  detectProfile: (folderPath) => import_electron.ipcRenderer.invoke("detect-profile", folderPath),
  // Ignore Parser
  importGitignore: (folderPath) => import_electron.ipcRenderer.invoke("import-gitignore", folderPath),
  applyProfileIgnores: (folderPath, patterns) => import_electron.ipcRenderer.invoke("apply-profile-ignores", { folderPath, patterns }),
  // Media Service
  scanMedia: (folderPath, ignorePatterns) => import_electron.ipcRenderer.invoke("scan-media", { folderPath, ignorePatterns }),
  findDuplicates: (folderPath) => import_electron.ipcRenderer.invoke("find-duplicates", folderPath),
  // Backup Service
  getFileVersions: (folderPath) => import_electron.ipcRenderer.invoke("get-file-versions", folderPath),
  restoreFileVersion: (versionPath, originalPath) => import_electron.ipcRenderer.invoke("restore-file-version", { versionPath, originalPath }),
  // File Operations
  deleteFile: (filePath) => import_electron.ipcRenderer.invoke("delete-file", filePath),
  deleteFileWithBackup: (filePath, folderPath) => import_electron.ipcRenderer.invoke("delete-file-with-backup", { filePath, folderPath }),
  // Window Controls
  closeWindow: () => import_electron.ipcRenderer.invoke("close-window")
});
