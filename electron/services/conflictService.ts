import * as fs from 'fs';
import * as path from 'path';

export interface ConflictGroup {
    originalFile: string;
    originalPath: string;
    conflicts: {
        path: string;
        filename: string;
        modified: number;
        size: number;
        deviceId: string;
        date: Date;
    }[];
}

export async function scanConflicts(folders: string[]): Promise<ConflictGroup[]> {
    const conflictGroups = new Map<string, ConflictGroup>();

    for (const folder of folders) {
        try {
            await scanDirectoryForConflicts(folder, folder, conflictGroups);
        } catch (error) {
            console.error(`Failed to scan ${folder} for conflicts:`, error);
        }
    }

    return Array.from(conflictGroups.values());
}

async function scanDirectoryForConflicts(
    basePath: string,
    currentPath: string,
    groups: Map<string, ConflictGroup>
): Promise<void> {
    const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
            // Skip hidden folders
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

            // Limit recursion depth
            const depth = fullPath.replace(basePath, '').split(path.sep).length;
            if (depth < 8) {
                await scanDirectoryForConflicts(basePath, fullPath, groups);
            }
            continue;
        }

        // Check for conflict file pattern: name.sync-conflict-YYYYMMDD-HHMMSS-DEV.ext
        if (entry.name.includes('.sync-conflict-')) {
            try {
                // Parse conflict filename
                // Example: MyFile.sync-conflict-20240101-120000-ABC1234.txt
                const match = entry.name.match(/(.+)\.sync-conflict-(\d{8}-\d{6})-([^\.]+)(\..+)?$/);

                if (match) {
                    const [_, baseName, dateStr, deviceId, ext] = match;
                    const originalName = baseName + (ext || '');
                    const originalPath = path.join(currentPath, originalName);

                    // Key is full path to original file
                    if (!groups.has(originalPath)) {
                        groups.set(originalPath, {
                            originalFile: originalName,
                            originalPath: originalPath,
                            conflicts: []
                        });
                    }

                    const stats = await fs.promises.stat(fullPath);
                    const group = groups.get(originalPath)!;

                    // Parse Date: YYYYMMDD-HHMMSS
                    const year = parseInt(dateStr.substring(0, 4));
                    const month = parseInt(dateStr.substring(4, 6)) - 1;
                    const day = parseInt(dateStr.substring(6, 8));
                    const hour = parseInt(dateStr.substring(9, 11));
                    const minute = parseInt(dateStr.substring(11, 13));
                    const second = parseInt(dateStr.substring(13, 15));

                    group.conflicts.push({
                        path: fullPath,
                        filename: entry.name,
                        modified: stats.mtimeMs,
                        size: stats.size,
                        deviceId: deviceId,
                        date: new Date(year, month, day, hour, minute, second)
                    });
                }
            } catch (err) {
                console.error(`Error processing conflict file ${entry.name}:`, err);
            }
        }
    }
}

export async function resolveConflict(
    conflictPath: string,
    originalPath: string,
    strategy: 'keep-local' | 'keep-remote'
): Promise<void> {
    if (strategy === 'keep-local') {
        // Keep original (local), delete conflict file (remote/other)
        await fs.promises.unlink(conflictPath);
    } else if (strategy === 'keep-remote') {
        // Keep conflict (remote), replace original with conflict
        // 1. Create backup of original? (Optional, maybe later)
        // 2. Rename conflict to original (overwriting)
        await fs.promises.copyFile(conflictPath, originalPath);
        await fs.promises.unlink(conflictPath);
    }
}
