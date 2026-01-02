import fs from 'fs';
import path from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { app } from 'electron';

const SYNCTHING_VERSION = 'v1.27.2'; // Update as needed
// Detect platform: windows-amd64 usually
const PLATFORM = 'windows-amd64';
const BINARY_NAME = 'syncthing.exe';
const DOWNLOAD_URL = `https://github.com/syncthing/syncthing/releases/download/${SYNCTHING_VERSION}/syncthing-${PLATFORM}-${SYNCTHING_VERSION}.zip`;

export class SyncthingInstaller {
    private binDir: string;
    private exePath: string;

    constructor() {
        this.binDir = path.join(app.getPath('userData'), 'bin');
        this.exePath = path.join(this.binDir, BINARY_NAME);
    }

    public async ensureInstalled(): Promise<string> {
        if (this.isInstalled()) {
            console.log('Syncthing binary found at:', this.exePath);
            return this.exePath;
        }

        console.log('Syncthing binary not found. Starting download...');
        await this.downloadAndExtract();
        return this.exePath;
    }

    private isInstalled(): boolean {
        return fs.existsSync(this.exePath);
    }

    private async downloadAndExtract(): Promise<void> {
        // ensure bin dir exists
        if (!fs.existsSync(this.binDir)) {
            fs.mkdirSync(this.binDir, { recursive: true });
        }

        const zipPath = path.join(this.binDir, 'syncthing.zip');

        try {
            // 1. Download
            console.log(`Downloading from ${DOWNLOAD_URL}...`);
            const response = await axios({
                url: DOWNLOAD_URL,
                method: 'GET',
                responseType: 'arraybuffer',
            });

            fs.writeFileSync(zipPath, response.data);
            console.log('Download complete.');

            // 2. Extract
            console.log('Extracting...');
            const zip = new AdmZip(zipPath);

            // The zip usually contains a folder "syncthing-windows-amd64-v1.27.0/"
            // We want to extract the exe from inside that to our binDir
            const zipEntries = zip.getEntries();

            zipEntries.forEach((entry) => {
                if (entry.entryName.endsWith(BINARY_NAME)) {
                    // Extract just the exe to binDir
                    // AdmZip extractEntryTo(entry, targetPath, maintainEntryPath, overwrite)
                    // Extracting to binDir but we need to flatten the structure if possible or just use the extracted path
                    // simpler: extract all to binDir, then find the exe and move it?
                    // Or just read the buffer and write it.
                    const buffer = entry.getData();
                    fs.writeFileSync(this.exePath, buffer);
                    // make executable (not needed on windows strictly but good practice)
                }
            });

            console.log('Extraction complete.');

            // Cleanup
            fs.unlinkSync(zipPath);

        } catch (error) {
            console.error('Failed to download syncthing:', error);
            throw error;
        }
    }

    public getBinaryPath(): string {
        return this.exePath;
    }
}
