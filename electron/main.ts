import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { SyncthingInstaller } from './services/installer';
import { SyncthingRunner } from './services/runner';
import { FileSystemService } from './services/filesystem';
import { GitService } from './services/git';
import { GitHubService } from './services/github';
// ... (existing imports)

// ... (existing helper code)

let mainWindow: BrowserWindow | null = null;
let syncRunner: SyncthingRunner | null = null;

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // Allow loading local file:// URLs for media
        },
        frame: false, // Custom frame for modern look
        backgroundColor: '#000000',
        show: false, // Don't show until ready
    });

    // Test dev mode
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();

        // Initialize Syncthing
        const installer = new SyncthingInstaller();
        installer.ensureInstalled()
            .then(async (binPath) => {
                console.log('Syncthing binary ready at:', binPath);
                syncRunner = new SyncthingRunner(binPath);
                try {
                    await syncRunner.start();
                    console.log('Syncthing started successfully');
                } catch (err) {
                    console.error('Failed to start Syncthing:', err);
                }
            })
            .catch((err) => {
                console.error('Failed to install Syncthing:', err);
            });
    });
};


app.on('ready', async () => {
    createWindow();
    const fsService = new FileSystemService();
    const gitService = new GitService();
    const githubService = new GitHubService();
    await githubService.init();

    // IPC Handlers
    ipcMain.handle('get-syncthing-config', () => {
        if (!syncRunner) return { apiKey: null, url: null };
        return {
            apiKey: syncRunner.getApiKey(),
            url: syncRunner.getUrl()
        };
    });

    // ... (existing FS handlers)

    // GitHub Handlers
    ipcMain.handle('github-login', async (event, token) => {
        return await githubService.login(token);
    });

    ipcMain.handle('github-logout', async () => {
        return await githubService.logout();
    });

    ipcMain.handle('github-user', async () => {
        return await githubService.getUser();
    });

    ipcMain.handle('github-repos', async (event, page, perPage) => {
        return await githubService.getRepos(page, perPage);
    });

    ipcMain.handle('read-directory', async (event, dirPath) => {
        return await fsService.readDirectory(dirPath);
    });

    // Git Handlers
    // ... (rest of the file)

    // Git Handlers
    ipcMain.handle('git-status', async (event, repoPath) => {
        return await gitService.getStatus(repoPath);
    });

    ipcMain.handle('git-log', async (event, repoPath) => {
        return await gitService.getLog(repoPath);
    });

    ipcMain.handle('git-init', async (event, repoPath) => {
        return await gitService.initRepo(repoPath);
    });

    ipcMain.handle('git-stage', async (event, { repoPath, filepath }) => {
        return await gitService.addToStage(repoPath, filepath);
    });

    ipcMain.handle('git-unstage', async (event, { repoPath, filepath }) => {
        return await gitService.removeFromStage(repoPath, filepath);
    });

    ipcMain.handle('git-commit', async (event, { repoPath, message, author }) => {
        return await gitService.commitChanges(repoPath, message, author);
    });

    ipcMain.handle('git-branches', async (event, repoPath) => {
        return await gitService.getBranches(repoPath);
    });

    ipcMain.handle('git-graph-data', async (event, repoPath) => {
        return await gitService.getGraphData(repoPath);
    });

    ipcMain.handle('git-push', async (event, repoPath) => {
        return await gitService.pushToRemote(repoPath);
    });

    ipcMain.handle('git-pull', async (event, repoPath) => {
        return await gitService.pullFromRemote(repoPath);
    });

    ipcMain.handle('get-repo-contents', async (event, { owner, repo, path }) => {
        // Use the existing githubService instance
        return await githubService.getRepoContents(owner, repo, path);
    });

    ipcMain.handle('download-file', async (event, { url, targetPath }) => {
        // Use the existing githubService instance
        return await githubService.downloadFile(url, targetPath);
    });

    // Conflict Handlers
    ipcMain.handle('scan-conflicts', async (event, folderPath) => {
        const { conflictService } = await import('./services/conflictService');
        return await conflictService.scanFolder(folderPath);
    });

    ipcMain.handle('resolve-conflict', async (event, { conflictPath, strategy }) => {
        const { conflictService } = await import('./services/conflictService');
        return await conflictService.resolveConflict(conflictPath, strategy);
    });

    // Profile Detection
    ipcMain.handle('detect-profile', async (event, folderPath: string) => {
        const { detectProfile } = await import('./services/profileService');
        return await detectProfile(folderPath);
    });

    // Ignore Parser
    ipcMain.handle('import-gitignore', async (event, folderPath: string) => {
        const { importGitignore } = await import('./services/ignoreParser');
        return await importGitignore(folderPath);
    });

    ipcMain.handle('apply-profile-ignores', async (event, { folderPath, patterns }: { folderPath: string; patterns: string[] }) => {
        const { applyProfileIgnores } = await import('./services/ignoreParser');
        return await applyProfileIgnores(folderPath, patterns);
    });

    // Media Service
    ipcMain.handle('scan-media', async (event, { folderPath, ignorePatterns }: { folderPath: string; ignorePatterns: string[] }) => {
        const { scanMediaFiles } = await import('./services/mediaService');
        return await scanMediaFiles(folderPath, ignorePatterns);
    });

    ipcMain.handle('find-duplicates', async (event, folderPath: string) => {
        const { scanMediaFiles, findDuplicates } = await import('./services/mediaService');
        const files = await scanMediaFiles(folderPath);
        const duplicates = await findDuplicates(files);
        // Convert Map to array of groups
        return Array.from(duplicates.values());
    });

    // Backup Service
    ipcMain.handle('get-file-versions', async (event, folderPath: string) => {
        const { getVersionedFiles } = await import('./services/backupService');
        return await getVersionedFiles(folderPath);
    });

    ipcMain.handle('restore-file-version', async (event, { versionPath, originalPath }: { versionPath: string; originalPath: string }) => {
        const { restoreVersion } = await import('./services/backupService');
        return await restoreVersion(versionPath, originalPath);
    });

    // File Operations
    ipcMain.handle('delete-file', async (event, filePath: string) => {
        const fs = await import('fs');
        await fs.promises.unlink(filePath);
    });

    ipcMain.handle('delete-file-with-backup', async (event, { filePath, folderPath }: { filePath: string; folderPath: string }) => {
        const { moveToVersions } = await import('./services/backupService');
        await moveToVersions(filePath, folderPath);
    });

    // Window Controls
    ipcMain.handle('close-window', () => {
        mainWindow?.close();
    });

    ipcMain.handle('open-directory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (canceled) return null;
        return filePaths[0];
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (syncRunner) {
        syncRunner.stop();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
