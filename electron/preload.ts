import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    ping: () => ipcRenderer.invoke('ping'),
    getSyncthingConfig: () => ipcRenderer.invoke('get-syncthing-config'),
    readDirectory: (path: string) => ipcRenderer.invoke('read-directory', path),
    gitStatus: (path: string) => ipcRenderer.invoke('git-status', path),
    gitLog: (path: string) => ipcRenderer.invoke('git-log', path),
    gitInit: (path: string) => ipcRenderer.invoke('git-init', path),
    gitStage: (repoPath: string, filepath: string) => ipcRenderer.invoke('git-stage', { repoPath, filepath }),
    gitUnstage: (repoPath: string, filepath: string) => ipcRenderer.invoke('git-unstage', { repoPath, filepath }),
    gitCommit: (repoPath: string, message: string, author: { name: string; email: string }) => ipcRenderer.invoke('git-commit', { repoPath, message, author }),
    gitBranches: (path: string) => ipcRenderer.invoke('git-branches', path),
    gitGraphData: (path: string) => ipcRenderer.invoke('git-graph-data', path),
    gitPull: (path: string) => ipcRenderer.invoke('git-pull', path),
    // Dialogs
    openDirectory: () => ipcRenderer.invoke('open-directory'),

    // GitHub
    githubLogin: (token: string) => ipcRenderer.invoke('github-login', token),
    githubLogout: () => ipcRenderer.invoke('github-logout'),
    githubUser: () => ipcRenderer.invoke('github-user'),
    githubRepos: (page?: number, perPage?: number) => ipcRenderer.invoke('github-repos', page, perPage),
    getRepoContents: (owner: string, repo: string, path: string) => ipcRenderer.invoke('get-repo-contents', { owner, repo, path }),
    downloadFile: (url: string, targetPath: string) => ipcRenderer.invoke('download-file', { url, targetPath }),

    // Conflicts
    scanConflicts: (folders: string[]) => ipcRenderer.invoke('scan-conflicts', folders),
    resolveConflict: (conflictPath: string, originalPath: string, strategy: 'keep-local' | 'keep-remote') => ipcRenderer.invoke('resolve-conflict', { conflictPath, originalPath, strategy }),

    // Profile Detection
    detectProfile: (folderPath: string) => ipcRenderer.invoke('detect-profile', folderPath),

    // Ignore Parser
    importGitignore: (folderPath: string) => ipcRenderer.invoke('import-gitignore', folderPath),
    applyProfileIgnores: (folderPath: string, patterns: string[]) => ipcRenderer.invoke('apply-profile-ignores', { folderPath, patterns }),

    // Media Service
    scanMedia: (folderPath: string, ignorePatterns: string[]) => ipcRenderer.invoke('scan-media', { folderPath, ignorePatterns }),
    findDuplicates: (folderPath: string) => ipcRenderer.invoke('find-duplicates', folderPath),

    // Global Search
    searchFiles: (folders: string[], query: string) => ipcRenderer.invoke('search-files', { folders, query }),

    // Backup Service
    getFileVersions: (folderPath: string) => ipcRenderer.invoke('get-file-versions', folderPath),
    restoreFileVersion: (versionPath: string, originalPath: string) => ipcRenderer.invoke('restore-file-version', { versionPath, originalPath }),
    deleteFileVersion: (versionPath: string) => ipcRenderer.invoke('delete-file-version', versionPath),

    // File Operations
    deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
    deleteFileWithBackup: (filePath: string, folderPath: string) => ipcRenderer.invoke('delete-file-with-backup', { filePath, folderPath }),

    // Window Controls
    closeWindow: () => ipcRenderer.invoke('close-window'),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    toggleMaximizeWindow: () => ipcRenderer.invoke('toggle-maximize-window'),
    showSaveDialog: (defaultName: string) => ipcRenderer.invoke('show-save-dialog', defaultName),
    openPath: (path: string) => ipcRenderer.invoke('open-path', path),

    // Auto-start
    getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
    setAutoStart: (enabled: boolean) => ipcRenderer.invoke('set-auto-start', enabled),

    readFile: (path: string) => ipcRenderer.invoke('read-file', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', { filePath: path, content }),

    // Imports
    listImports: (projectPath: string, subPath?: string) => ipcRenderer.invoke('list-imports', { projectPath, subPath }),
    readImport: (projectPath: string, relativePath: string) => ipcRenderer.invoke('read-import', { projectPath, relativePath }),
    deleteImport: (projectPath: string, relativePath: string) => ipcRenderer.invoke('delete-import', { projectPath, relativePath }),
    promoteImport: (projectPath: string, relativePath: string, destPath: string) => ipcRenderer.invoke('promote-import', { projectPath, relativePath, destPath }),
    ensureImportsDir: (projectPath: string) => ipcRenderer.invoke('ensure-imports-dir', projectPath),
    downloadImport: (projectPath: string, fileName: string, url: string) => ipcRenderer.invoke('download-import', { projectPath, fileName, url }),
    downloadImportFolder: (projectPath: string, owner: string, repo: string, path: string, targetDir?: string) => ipcRenderer.invoke('download-import-folder', { projectPath, owner, repo, path, targetDir }),

    // Notifications
});
