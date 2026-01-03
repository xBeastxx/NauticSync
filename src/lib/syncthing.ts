import axios, { type AxiosInstance } from 'axios';

export class SyncthingClient {
    private api: AxiosInstance | null = null;
    private apiKey: string | null = null;
    private url: string | null = null;
    private initPromise: Promise<void> | null = null;
    private initialized = false;

    constructor() { }

    isReady(): boolean {
        return this.initialized && this.api !== null;
    }

    async init(): Promise<void> {
        // If already initialized, return immediately
        if (this.initialized && this.api) return;

        // If init is already in progress, wait for it
        if (this.initPromise) {
            return this.initPromise;
        }

        // Start initialization
        this.initPromise = this.doInit();
        try {
            await this.initPromise;
        } finally {
            this.initPromise = null;
        }
    }

    private async doInit(): Promise<void> {
        let retries = 0;
        const maxRetries = 5; // Reduced from 10

        while (retries < maxRetries) {
            try {
                const config = await window.electronAPI.getSyncthingConfig();
                if (config && config.apiKey && config.url) {
                    this.apiKey = config.apiKey;
                    this.url = config.url;

                    this.api = axios.create({
                        baseURL: this.url,
                        headers: {
                            'X-API-Key': this.apiKey,
                        },
                        timeout: 3000, // 3 second timeout per request
                    });

                    this.initialized = true;
                    console.log('Syncthing client initialized:', this.url);
                    return;
                }
            } catch (err) {
                console.warn(`Attempt ${retries + 1}/${maxRetries} to get Syncthing config failed`, err);
            }

            retries++;
            // Wait 500ms before retrying (faster than before)
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.error('Failed to init Syncthing client after multiple attempts');
        throw new Error('Could not connect to Syncthing');
    }

    async getSystemStatus() {
        await this.init();
        if (!this.api) throw new Error('Client not initialized');
        const res = await this.api.get('/rest/system/status');
        return res.data;
    }

    async getConnections() {
        await this.init();
        if (!this.api) throw new Error('Client not initialized');
        const res = await this.api.get('/rest/system/connections');
        return res.data;
    }

    async getConfig() {
        await this.init();
        if (!this.api) throw new Error('Client not initialized');
        const res = await this.api.get('/rest/system/config');
        return res.data;
    }

    async getEvents(since = 0) {
        await this.init();
        if (!this.api) throw new Error('Client not initialized');
        // Add timeout=1 to prevent long-polling (returns immediately with events since 'since')
        // limit=50 to avoid huge responses
        const res = await this.api.get('/rest/events', {
            params: { since, timeout: 1, limit: 50 }
        });
        return res.data;
    }

    async getDbNeed(folderId: string) {
        await this.init();
        if (!this.api) throw new Error('Client not initialized');
        const res = await this.api.get('/rest/db/need', { params: { folder: folderId } });
        return res.data;
    }

    async setConfig(config: any) {
        await this.init();
        if (!this.api) throw new Error('Client not initialized');
        const res = await this.api.post('/rest/system/config', config);
        return res.data;
    }

    async patchOptions(options: Partial<{ globalAnnounceEnabled: boolean; relaysEnabled: boolean; localAnnounceEnabled: boolean }>) {
        const currentConfig = await this.getConfig();
        const newConfig = {
            ...currentConfig,
            options: {
                ...currentConfig.options,
                ...options
            }
        };
        return this.setConfig(newConfig);
    }

    async addFolder(folderConfig: { id: string; label: string; path: string; devices: string[]; type?: 'sendreceive' | 'sendonly' | 'receiveonly' }) {
        const currentConfig = await this.getConfig();

        // Check if folder already exists
        if (currentConfig.folders.some((f: any) => f.id === folderConfig.id || f.path === folderConfig.path)) {
            throw new Error("Folder with this ID or Path already exists.");
        }

        const newFolder = {
            id: folderConfig.id,
            label: folderConfig.label,
            path: folderConfig.path,
            type: folderConfig.type || 'sendreceive',
            devices: folderConfig.devices.map(deviceId => ({ deviceID: deviceId })),
            rescanIntervalS: 3600,
            fsWatcherEnabled: true,
            fsWatcherDelayS: 10,
            ignorePerms: false,
            autoNormalize: true
        };

        const newConfig = {
            ...currentConfig,
            folders: [...currentConfig.folders, newFolder]
        };

        return this.setConfig(newConfig);
    }

    /**
     * Force rescan a folder to pick up new .stignore patterns
     */
    async rescanFolder(folderId: string): Promise<void> {
        await this.init();
        if (!this.api) throw new Error('Client not initialized');
        await this.api.post('/rest/db/scan', null, { params: { folder: folderId } });
        console.log('Triggered rescan for folder:', folderId);
    }

    async getFolderStatus(folderId: string) {
        await this.init();
        if (!this.api) throw new Error('Client not initialized');
        const res = await this.api.get('/rest/db/status', { params: { folder: folderId } });
        return res.data;
    }

    async getIgnores(folderId: string) {
        await this.init();
        if (!this.api) throw new Error('Client not initialized');
        const res = await this.api.get('/rest/db/ignores', { params: { folder: folderId } });
        return res.data;
    }
}

export const syncthing = new SyncthingClient();
