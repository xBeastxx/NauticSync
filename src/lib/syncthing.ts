import axios, { type AxiosInstance } from 'axios';

export class SyncthingClient {
    private api: AxiosInstance | null = null;
    private apiKey: string | null = null;
    private url: string | null = null;

    constructor() { }

    async init() {
        if (this.api) return;

        let retries = 0;
        const maxRetries = 10;

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
                    });
                    return; // Success
                }
            } catch (err) {
                console.warn(`Attempt ${retries + 1}/${maxRetries} to get Syncthing config failed`, err);
            }

            retries++;
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.error('Failed to init Syncthing client after multiple attempts');
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
        const res = await this.api.get('/rest/events', { params: { since } });
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
}

export const syncthing = new SyncthingClient();
