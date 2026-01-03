import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { SyncthingInstaller } from './services/installer';
import { SyncthingRunner } from './services/runner';
import { FileSystemService } from './services/filesystem';
// ... (existing imports)

// ... (existing helper code)

let mainWindow: BrowserWindow | null = null;
let syncRunner: SyncthingRunner | null = null;
let tray: Tray | null = null;

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

const createTray = () => {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    const iconPath = isDev
        ? path.join(__dirname, '../public/icon.ico')
        : path.join(process.resourcesPath, 'icon.ico');

    // Fallback to default icon if custom icon not found
    let trayIcon;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        if (trayIcon.isEmpty()) {
            trayIcon = nativeImage.createEmpty();
        }
    } catch {
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    tray.setToolTip('NauticSync');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show NauticSync',
            click: () => {
                mainWindow?.show();
                mainWindow?.focus();
            }
        },
        { type: 'separator' },
        {
            label: 'Sync Status: Running',
            enabled: false
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);

    // Double click shows window
    tray.on('double-click', () => {
        mainWindow?.show();
        mainWindow?.focus();
    });
};


app.on('ready', async () => {
    createWindow();
    createTray();
    const fsService = new FileSystemService();

    // IPC Handlers
    ipcMain.handle('get-syncthing-config', () => {
        if (!syncRunner) return { apiKey: null, url: null };
        return {
            apiKey: syncRunner.getApiKey(),
            url: syncRunner.getUrl()
        };
    });

    // Auto-start handlers
    ipcMain.handle('get-auto-start', () => {
        const settings = app.getLoginItemSettings();
        return settings.openAtLogin;
    });

    ipcMain.handle('set-auto-start', (event, enabled: boolean) => {
        app.setLoginItemSettings({
            openAtLogin: enabled,
            openAsHidden: false
        });
        return enabled;
    });

    // FS handlers
    ipcMain.handle('read-directory', async (event, dirPath) => {
        return await fsService.readDirectory(dirPath);
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

    // Global Search
    ipcMain.handle('search-files', async (event, { folders, query }: { folders: string[]; query: string }) => {
        const { searchFiles } = await import('./services/searchService');
        return await searchFiles(folders, query, 50);
    });

    // Conflict Service
    ipcMain.handle('scan-conflicts', async (event, folders: string[]) => {
        const { scanConflicts } = await import('./services/conflictService');
        return await scanConflicts(folders);
    });

    ipcMain.handle('resolve-conflict', async (event, { conflictPath, originalPath, strategy }: { conflictPath: string; originalPath: string; strategy: 'keep-local' | 'keep-remote' }) => {
        const { resolveConflict } = await import('./services/conflictService');
        return await resolveConflict(conflictPath, originalPath, strategy);
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

    ipcMain.handle('delete-file-version', async (event, versionPath: string) => {
        const fs = await import('fs');
        try {
            await fs.promises.unlink(versionPath);
        } catch (e) {
            console.error('Failed to delete version:', e);
            throw e;
        }
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

    ipcMain.handle('read-file', async (_, filePath) => {
        try {
            const fs = await import('fs');
            // Security check: ensure file exists
            await fs.promises.access(filePath);

            // Limit size to avoid memory issues (e.g. 10MB)
            const stats = await fs.promises.stat(filePath);
            if (stats.size > 10 * 1024 * 1024) {
                throw new Error("File too large to preview");
            }

            // Check if binary or text
            const content = await fs.promises.readFile(filePath, 'utf-8');
            return content;
        } catch (error) {
            console.error('Failed to read file:', error);
            throw error;
        }
    });

    ipcMain.handle('write-file', async (_, { filePath, content }) => {
        try {
            const fs = await import('fs');
            await fs.promises.writeFile(filePath, content, 'utf-8');
        } catch (error) {
            console.error('Failed to write file:', error);
            throw error;
        }
    });

    // Window Controls
    ipcMain.handle('show-save-dialog', async (event, defaultName) => {
        const { dialog } = require('electron');
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            defaultPath: defaultName,
            properties: ['createDirectory', 'showOverwriteConfirmation']
        });
        return filePath;
    });

    ipcMain.handle('open-path', async (event, pathStr) => {
        const { shell } = require('electron');
        const fs = await import('fs');
        try {
            const stats = await fs.promises.stat(pathStr);
            if (stats.isFile()) {
                shell.showItemInFolder(pathStr);
                return;
            }
        } catch {
            // Ignore error, fallback to openPath
        }
        return await shell.openPath(pathStr);
    });

    ipcMain.handle('close-window', () => {
        mainWindow?.close();
    });

    ipcMain.handle('minimize-window', () => {
        mainWindow?.minimize();
    });

    ipcMain.handle('toggle-maximize-window', () => {
        if (!mainWindow) return;
        if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
        } else {
            mainWindow.setFullScreen(true);
        }
    });

    // Imports Workflow Handlers
    ipcMain.handle('list-imports', async (event, { projectPath, subPath }) => {
        const { ImportsService } = await import('./services/imports');
        return await new ImportsService().listImports(projectPath, subPath);
    });

    ipcMain.handle('read-import', async (event, { projectPath, relativePath }) => {
        const { ImportsService } = await import('./services/imports');
        return await new ImportsService().readImport(projectPath, relativePath);
    });

    ipcMain.handle('delete-import', async (event, { projectPath, relativePath }) => {
        const { ImportsService } = await import('./services/imports');
        return await new ImportsService().deleteImport(projectPath, relativePath);
    });

    ipcMain.handle('promote-import', async (event, { projectPath, relativePath, destPath }) => {
        const { ImportsService } = await import('./services/imports');
        return await new ImportsService().promoteImport(projectPath, relativePath, destPath);
    });

    ipcMain.handle('ensure-imports-dir', async (event, projectPath) => {
        const { ImportsService } = await import('./services/imports');
        return await new ImportsService().ensureImportsDir(projectPath);
    });

    ipcMain.handle('download-import', async (event, { projectPath, fileName, url }) => {
        const { ImportsService } = await import('./services/imports');
        return await new ImportsService().downloadImport(projectPath, fileName, url);
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
