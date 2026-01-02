import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
const { minimatch } = require('minimatch');

export interface MediaFile {
    id: string;
    path: string;
    name: string;
    type: 'image' | 'video';
    extension: string;
    size: number;
    modifiedTime: Date;
    isIgnored?: boolean;
}

/**
 * Scan a folder recursively for media files
 */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.flv'];

export async function scanMediaFiles(folderPath: string, ignorePatterns: string[] = []): Promise<MediaFile[]> {
    const results: MediaFile[] = [];

    async function scan(dir: string) {
        try {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(folderPath, fullPath);

                // Standard system ignores
                if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '__pycache__') {
                    continue;
                }

                // Check against provided .stignore patterns
                // Note: .stignore patterns often use /, so we normalize checks
                // Syncthing logic is complex, but basic glob matching covers 90%
                let isIgnored = false;
                try {
                    const normalizedPath = relativePath.split(path.sep).join('/');
                    isIgnored = ignorePatterns.some(pattern => {
                        return minimatch(normalizedPath, pattern, { dot: true, matchBase: true });
                    });
                } catch (err) {
                    console.error('Error checking ignore pattern:', err);
                }

                if (entry.isDirectory()) {
                    // Start recurse
                    await scan(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    let type: 'image' | 'video' | null = null;

                    if (IMAGE_EXTENSIONS.includes(ext)) {
                        type = 'image';
                    } else if (VIDEO_EXTENSIONS.includes(ext)) {
                        type = 'video';
                    }

                    if (type) {
                        try {
                            const stats = await fs.promises.stat(fullPath);
                            results.push({
                                id: Buffer.from(fullPath).toString('base64'),
                                path: fullPath,
                                name: entry.name,
                                type,
                                extension: ext,
                                size: stats.size,
                                modifiedTime: stats.mtime,
                                isIgnored: isIgnored // Now correctly populated
                            });
                        } catch {
                            // Skip files we can't stat
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error scanning ${dir}:`, error);
        }
    }

    await scan(folderPath);
    return results;
}

/**
 * Calculate MD5 hash of a file for duplicate detection
 */
export async function hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

/**
 * Find duplicate files based on hash
 */
export async function findDuplicates(files: MediaFile[]): Promise<Map<string, MediaFile[]>> {
    const hashMap = new Map<string, MediaFile[]>();

    for (const file of files) {
        try {
            const hash = await hashFile(file.path);

            if (!hashMap.has(hash)) {
                hashMap.set(hash, []);
            }
            hashMap.get(hash)!.push(file);
        } catch (error) {
            console.error(`Error hashing ${file.path}:`, error);
        }
    }

    // Filter to only duplicates (more than one file with same hash)
    const duplicates = new Map<string, MediaFile[]>();
    for (const [hash, files] of hashMap) {
        if (files.length > 1) {
            duplicates.set(hash, files);
        }
    }

    return duplicates;
}
