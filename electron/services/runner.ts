import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export class SyncthingRunner {
    private child: ChildProcess | null = null;
    private binPath: string;
    private apiKey: string | null = null;
    private guiUrl: string | null = null;

    // Default config folder for syncthing
    private configDir: string;

    constructor(binPath: string) {
        this.binPath = binPath;
        this.configDir = path.join(app.getPath('userData'), 'syncthing-config');
    }

    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log('Starting Syncthing from:', this.binPath);

            // Ensure config dir exists
            if (!fs.existsSync(this.configDir)) {
                fs.mkdirSync(this.configDir, { recursive: true });
            }

            // Attempt to read config immediately in case it's already generated from a previous run
            this.readConfig();

            // Spawn process
            // -home sets the config directory
            // -no-browser prevents opening default browser
            // -no-restart prevents internal restart loops managed by us
            this.child = spawn(this.binPath, ['-home', this.configDir, '-no-browser', '-no-restart'], {
                stdio: 'pipe',
            });

            this.child.on('error', (err) => {
                console.error('Syncthing process error:', err);
                // Even if spawn fails, if we have config, we might resolve? 
                // But usually spawn error means binary missing.
                reject(err);
            });

            // Parse stdout for API Key and URL
            this.child.stdout?.on('data', (data) => {
                const output = data.toString();
                console.log('[Syncthing]', output.trim());

                // Detect Ready state OR Already Running state
                if (output.includes('Ready to synchronize') || output.includes('is another Syncthing instance already running')) {
                    this.readConfig(); // Refresh config just in case
                    resolve();
                }
            });

            this.child.stderr?.on('data', (data) => {
                console.error('[Syncthing Error]', data.toString());
            });
        });
    }

    public stop() {
        if (this.child) {
            console.log('Stopping Syncthing...');
            this.child.kill();
            this.child = null;
        }
    }

    private readConfig() {
        // Parse config.xml in this.configDir to get API Key
        try {
            const configPath = path.join(this.configDir, 'config.xml');
            if (fs.existsSync(configPath)) {
                const xml = fs.readFileSync(configPath, 'utf-8');
                const match = xml.match(/<apikey>(.*?)<\/apikey>/);
                if (match) {
                    this.apiKey = match[1];
                    console.log('Detected API Key:', this.apiKey);
                }

                // Also detect address
                // We specifically want the address inside the <gui> block
                // <gui enabled="true" tls="false" debugging="false">
                //    <address>127.0.0.1:8384</address>
                // </gui>
                const guiMatch = xml.match(/<gui[^>]*>[\s\S]*?<address>(.*?)<\/address>[\s\S]*?<\/gui>/);
                if (guiMatch) {
                    this.guiUrl = 'http://' + guiMatch[1];
                } else {
                    // Fallback to simple address match if not found in block (legacy) 
                    // but usually parsing the first <address> is dangerous if it's "dynamic"
                    const addrMatch = xml.match(/<address>([0-9.:]+)<\/address>/);
                    if (addrMatch) {
                        this.guiUrl = 'http://' + addrMatch[1];
                    }
                }
            }
        } catch (err) {
            console.error('Failed to read config.xml', err);
        }
    }

    public getApiKey() {
        return this.apiKey;
    }

    public getUrl() {
        return this.guiUrl || 'http://127.0.0.1:8384';
    }
}
