import fs from 'fs';
import path from 'path';

export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modifiedTime: Date;
    children?: FileEntry[]; // For recursive, though we might load on demand
}

export class FileSystemService {

    public async readDirectory(dirPath: string): Promise<FileEntry[]> {
        try {
            if (!fs.existsSync(dirPath)) {
                throw new Error(`Directory not found: ${dirPath}`);
            }

            const items = await fs.promises.readdir(dirPath, { withFileTypes: true });

            const entries: FileEntry[] = items.map((item) => {
                const fullPath = path.join(dirPath, item.name);
                let size = 0;
                let modifiedTime = new Date();

                try {
                    const stats = fs.statSync(fullPath);
                    size = stats.size;
                    modifiedTime = stats.mtime;
                } catch (e) {
                    // Ignore access errors
                }

                return {
                    name: item.name,
                    path: fullPath,
                    isDirectory: item.isDirectory(),
                    size,
                    modifiedTime
                };
            });

            // Sort: Directories first, then files
            entries.sort((a, b) => {
                if (a.isDirectory === b.isDirectory) {
                    return a.name.localeCompare(b.name);
                }
                return a.isDirectory ? -1 : 1;
            });

            return entries;
        } catch (error) {
            console.error('Failed to read directory:', error);
            throw error;
        }
    }

    public async copyFile(sourcePath: string, destPath: string): Promise<void> {
        try {
            await fs.promises.copyFile(sourcePath, destPath);
        } catch (error) {
            console.error(`Failed to copy file from ${sourcePath} to ${destPath}:`, error);
            throw error;
        }
    }

    public async createDirectory(dirPath: string): Promise<void> {
        try {
            await fs.promises.mkdir(dirPath, { recursive: true });
        } catch (error) {
            console.error(`Failed to create directory at ${dirPath}:`, error);
            throw error;
        }
    }

    public async rename(oldPath: string, newPath: string): Promise<void> {
        try {
            await fs.promises.rename(oldPath, newPath);
        } catch (error) {
            console.error(`Failed to rename from ${oldPath} to ${newPath}:`, error);
            throw error;
        }
    }

    public async trashItem(itemPath: string): Promise<void> {
        try {
            const { shell } = require('electron');
            await shell.trashItem(itemPath);
        } catch (error) {
            console.error(`Failed to trash item at ${itemPath}:`, error);
            throw error;
        }
    }
}
