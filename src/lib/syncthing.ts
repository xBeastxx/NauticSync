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
}

export const syncthing = new SyncthingClient();
