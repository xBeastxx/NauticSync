export interface ElectronAPI {
    ping: () => Promise<string>;
    getSyncthingConfig: () => Promise<{ apiKey: string | null; url: string | null }>;
    readDirectory: (path: string) => Promise<{ name: string; path: string; isDirectory: boolean }[]>;
    gitStatus: (path: string) => Promise<{ path: string; status: string }[]>;
    gitLog: (path: string) => Promise<{ oid: string; message: string; author: string; timestamp: number }[]>;
    gitInit: (path: string) => Promise<void>;
    gitStage: (repoPath: string, filepath: string) => Promise<void>;
    gitUnstage: (repoPath: string, filepath: string) => Promise<void>;
    gitCommit: (repoPath: string, message: string, author: { name: string; email: string }) => Promise<void>;
    gitBranches: (path: string) => Promise<string[]>;
    gitGraphData: (path: string) => Promise<any[]>;
    gitPush: (path: string) => Promise<void>;
    gitPull: (path: string) => Promise<void>;

    // Dialogs
    openDirectory: () => Promise<string | null>;

    // GitHub
    githubLogin: (token: string) => Promise<any>;
    githubLogout: () => Promise<void>;
    githubUser: () => Promise<any>;
    githubUser: () => Promise<any>;
    githubRepos: (page?: number, perPage?: number) => Promise<any[]>;
    getRepoContents: (owner: string, repo: string, path: string) => Promise<any>;
    downloadFile: (url: string, targetPath: string) => Promise<void>;

    // Conflicts
    scanConflicts: (folderPath: string) => Promise<any[]>;
    resolveConflict: (conflictPath: string, strategy: 'keep-mine' | 'keep-theirs') => Promise<void>;

    // Profile Detection
    detectProfile: (folderPath: string) => Promise<string>;

    // Ignore Parser
    importGitignore: (folderPath: string) => Promise<{ imported: number; total: number }>;
    applyProfileIgnores: (folderPath: string, patterns: string[]) => Promise<{ applied: number; total: number }>;

    // Media Service
    scanMedia: (folderPath: string, ignorePatterns?: string[]) => Promise<any[]>;
    findDuplicates: (folderPath: string) => Promise<any[][]>;

    // Backup Service
    getFileVersions: (folderPath: string) => Promise<any[]>;
    restoreFileVersion: (versionPath: string, originalPath: string) => Promise<void>;

    // File Operations
    deleteFile: (filePath: string) => Promise<void>;
    deleteFileWithBackup: (filePath: string, folderPath: string) => Promise<void>;

    // Window Controls
    closeWindow: () => Promise<void>;
    minimizeWindow: () => Promise<void>;
    toggleMaximizeWindow: () => Promise<void>;
    showSaveDialog: (defaultName: string) => Promise<string | null>;
    openPath: (path: string) => Promise<string>;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;

    // Imports Workflow
    listImports: (projectPath: string, subPath?: string) => Promise<any[]>;
    readImport: (projectPath: string, relativePath: string) => Promise<string>;
    deleteImport: (projectPath: string, relativePath: string) => Promise<boolean>;
    promoteImport: (projectPath: string, relativePath: string, destPath: string) => Promise<boolean>;
    ensureImportsDir: (projectPath: string) => Promise<string>;
    downloadImport: (projectPath: string, fileName: string, url: string) => Promise<string>;
    downloadImportFolder: (projectPath: string, owner: string, repo: string, path: string, targetDir?: string) => Promise<boolean>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
