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
  scanConflicts: (folders) => import_electron.ipcRenderer.invoke("scan-conflicts", folders),
  resolveConflict: (conflictPath, originalPath, strategy) => import_electron.ipcRenderer.invoke("resolve-conflict", { conflictPath, originalPath, strategy }),
  // Profile Detection
  detectProfile: (folderPath) => import_electron.ipcRenderer.invoke("detect-profile", folderPath),
  // Ignore Parser
  importGitignore: (folderPath) => import_electron.ipcRenderer.invoke("import-gitignore", folderPath),
  applyProfileIgnores: (folderPath, patterns) => import_electron.ipcRenderer.invoke("apply-profile-ignores", { folderPath, patterns }),
  // Media Service
  scanMedia: (folderPath, ignorePatterns) => import_electron.ipcRenderer.invoke("scan-media", { folderPath, ignorePatterns }),
  findDuplicates: (folderPath) => import_electron.ipcRenderer.invoke("find-duplicates", folderPath),
  // Global Search
  searchFiles: (folders, query) => import_electron.ipcRenderer.invoke("search-files", { folders, query }),
  // Backup Service
  getFileVersions: (folderPath) => import_electron.ipcRenderer.invoke("get-file-versions", folderPath),
  restoreFileVersion: (versionPath, originalPath) => import_electron.ipcRenderer.invoke("restore-file-version", { versionPath, originalPath }),
  deleteFileVersion: (versionPath) => import_electron.ipcRenderer.invoke("delete-file-version", versionPath),
  // File Operations
  deleteFile: (filePath) => import_electron.ipcRenderer.invoke("delete-file", filePath),
  deleteFileWithBackup: (filePath, folderPath) => import_electron.ipcRenderer.invoke("delete-file-with-backup", { filePath, folderPath }),
  // Window Controls
  closeWindow: () => import_electron.ipcRenderer.invoke("close-window"),
  minimizeWindow: () => import_electron.ipcRenderer.invoke("minimize-window"),
  toggleMaximizeWindow: () => import_electron.ipcRenderer.invoke("toggle-maximize-window"),
  showSaveDialog: (defaultName) => import_electron.ipcRenderer.invoke("show-save-dialog", defaultName),
  openPath: (path) => import_electron.ipcRenderer.invoke("open-path", path),
  // Auto-start
  getAutoStart: () => import_electron.ipcRenderer.invoke("get-auto-start"),
  setAutoStart: (enabled) => import_electron.ipcRenderer.invoke("set-auto-start", enabled),
  readFile: (path) => import_electron.ipcRenderer.invoke("read-file", path),
  writeFile: (path, content) => import_electron.ipcRenderer.invoke("write-file", { filePath: path, content }),
  // Imports
  listImports: (projectPath, subPath) => import_electron.ipcRenderer.invoke("list-imports", { projectPath, subPath }),
  readImport: (projectPath, relativePath) => import_electron.ipcRenderer.invoke("read-import", { projectPath, relativePath }),
  deleteImport: (projectPath, relativePath) => import_electron.ipcRenderer.invoke("delete-import", { projectPath, relativePath }),
  promoteImport: (projectPath, relativePath, destPath) => import_electron.ipcRenderer.invoke("promote-import", { projectPath, relativePath, destPath }),
  ensureImportsDir: (projectPath) => import_electron.ipcRenderer.invoke("ensure-imports-dir", projectPath),
  downloadImport: (projectPath, fileName, url) => import_electron.ipcRenderer.invoke("download-import", { projectPath, fileName, url }),
  downloadImportFolder: (projectPath, owner, repo, path, targetDir) => import_electron.ipcRenderer.invoke("download-import-folder", { projectPath, owner, repo, path, targetDir })
  // Notifications
});
