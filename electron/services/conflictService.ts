import { promises as fs } from 'fs';
import * as path from 'path';

export interface ConflictItem {
    id: string; // unique id (path)
    path: string; // absolute path to conflict file
    originalPath: string; // absolute path to original file (active version)
    filename: string;
    folderPath: string; // root sync folder
    modificationTime: Date;
    size: number;
    conflictType: 'sync-conflict';
}

// Syncthing conflict format: filename.sync-conflict-YYYYMMDD-HHMMSS-MODIFIEDBY.ext
const CONFLICT_REGEX = /^(.*)\.sync-conflict-(\d{8}-\d{6}-\w+)(\.[^.]+)?$/;

export class ConflictService {
    async scanFolder(folderPath: string): Promise<ConflictItem[]> {
        const conflicts: ConflictItem[] = [];

        try {
            await this.scanRecursively(folderPath, folderPath, conflicts);
        } catch (error) {
            console.error(`Error scanning for conflicts in ${folderPath}:`, error);
        }

        return conflicts;
    }

    private async scanRecursively(currentPath: string, rootFolder: string, results: ConflictItem[]) {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);

            // Ignore common hidden folders
            if (entry.isDirectory()) {
                if (entry.name === '.stfolder' || entry.name === '.git' || entry.name === 'node_modules') continue;
                await this.scanRecursively(fullPath, rootFolder, results);
            } else if (entry.isFile()) {
                if (entry.name.includes('.sync-conflict-')) {
                    const match = entry.name.match(CONFLICT_REGEX);
                    if (match) {
                        try {
                            const originalBase = match[1];
                            const ext = match[3] || '';
                            const originalFilename = originalBase + ext;
                            const originalPath = path.join(currentPath, originalFilename);

                            const stats = await fs.stat(fullPath);

                            results.push({
                                id: fullPath,
                                path: fullPath,
                                originalPath: originalPath,
                                filename: originalFilename, // The name of the file it conflicts with
                                folderPath: rootFolder,
                                modificationTime: stats.mtime,
                                size: stats.size,
                                conflictType: 'sync-conflict'
                            });
                        } catch (err) {
                            console.warn("Failed to process potential conflict file:", fullPath, err);
                        }
                    }
                }
            }
        }
    }

    async resolveConflict(conflictPath: string, strategy: 'keep-mine' | 'keep-theirs'): Promise<void> {
        // 'keep-mine': Delete the conflict file (the one downloaded/created by Syncthing as conflict)
        // 'keep-theirs': Overwrite the original file with the conflict file, then delete conflict file.

        const match = path.basename(conflictPath).match(CONFLICT_REGEX);
        if (!match) throw new Error("Invalid conflict file path");

        if (strategy === 'keep-mine') {
            await fs.unlink(conflictPath);
        } else if (strategy === 'keep-theirs') {
            const originalBase = match[1];
            const ext = match[3] || '';
            const originalFilename = originalBase + ext;
            const originalPath = path.join(path.dirname(conflictPath), originalFilename);

            // Rename conflict file to original path (overwriting)
            await fs.rename(conflictPath, originalPath);
        }
    }
}

export const conflictService = new ConflictService();
