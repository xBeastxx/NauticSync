import * as fs from 'fs';
import * as path from 'path';

export interface VersionedFile {
    id: string;
    originalName: string;
    originalPath: string;
    versionPath: string;
    timestamp: Date;
    size: number;
}

/**
 * Syncthing stores versions in .stversions folder with format:
 * filename~20240101-120000.ext
 */
const VERSION_PATTERN = /^(.+)~(\d{8}-\d{6})(\.[^.]+)?$/;

/**
 * Parse the timestamp from Syncthing version filename
 */
function parseVersionTimestamp(filename: string): { originalName: string; timestamp: Date } | null {
    const match = filename.match(VERSION_PATTERN);
    if (!match) return null;

    const [, baseName, timestampStr, ext = ''] = match;

    // Parse YYYYMMDD-HHMMSS format
    const year = parseInt(timestampStr.slice(0, 4));
    const month = parseInt(timestampStr.slice(4, 6)) - 1;
    const day = parseInt(timestampStr.slice(6, 8));
    const hour = parseInt(timestampStr.slice(9, 11));
    const minute = parseInt(timestampStr.slice(11, 13));
    const second = parseInt(timestampStr.slice(13, 15));

    return {
        originalName: baseName + ext,
        timestamp: new Date(year, month, day, hour, minute, second),
    };
}

/**
 * Scan .stversions folder for versioned files
 */
export async function getVersionedFiles(folderPath: string): Promise<VersionedFile[]> {
    const versionsPath = path.join(folderPath, '.stversions');
    const results: VersionedFile[] = [];

    async function scan(dir: string, relativePath: string = '') {
        try {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relPath = path.join(relativePath, entry.name);

                if (entry.isDirectory()) {
                    await scan(fullPath, relPath);
                } else if (entry.isFile()) {
                    const parsed = parseVersionTimestamp(entry.name);
                    if (parsed) {
                        try {
                            const stats = await fs.promises.stat(fullPath);
                            results.push({
                                id: Buffer.from(fullPath).toString('base64'),
                                originalName: parsed.originalName,
                                originalPath: path.join(folderPath, relativePath, parsed.originalName),
                                versionPath: fullPath,
                                timestamp: parsed.timestamp,
                                size: stats.size,
                            });
                        } catch {
                            // Skip files we can't stat
                        }
                    }
                }
            }
        } catch (error) {
            // .stversions might not exist
            console.log(`No versions folder at ${dir}`);
        }
    }

    await scan(versionsPath);

    // Sort by timestamp descending (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return results;
}

/**
 * Restore a versioned file to its original location
 */
export async function restoreVersion(versionPath: string, originalPath: string): Promise<void> {
    // Create backup of current file if it exists
    try {
        const stats = await fs.promises.stat(originalPath);
        if (stats.isFile()) {
            const backupPath = originalPath + '.backup';
            await fs.promises.copyFile(originalPath, backupPath);
        }
    } catch {
        // Original file doesn't exist, that's ok
    }

    // Copy version to original path
    await fs.promises.copyFile(versionPath, originalPath);

    // Delete the version file since it is now restored (effectively "moving" it back)
    await fs.promises.unlink(versionPath);
}

/**
 * Get all versions of a specific file
 */
export async function getFileHistory(folderPath: string, fileName: string): Promise<VersionedFile[]> {
    const allVersions = await getVersionedFiles(folderPath);
    return allVersions.filter(v => v.originalName === fileName);
}

/**
 * Generate timestamp string in Syncthing format: YYYYMMDD-HHMMSS
 */
function generateVersionTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Move a file to .stversions folder before deletion (keeps backup)
 * Uses Syncthing's versioning format: filename~YYYYMMDD-HHMMSS.ext
 */
export async function moveToVersions(filePath: string, folderPath: string): Promise<void> {
    // Get relative path from folder root
    const relativePath = path.relative(folderPath, filePath);
    const dirName = path.dirname(relativePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);

    // Generate versioned filename: filename~YYYYMMDD-HHMMSS.ext
    const timestamp = generateVersionTimestamp();
    const versionedName = `${baseName}~${timestamp}${ext}`;

    // Create the .stversions directory structure
    const versionsDir = path.join(folderPath, '.stversions', dirName);
    await fs.promises.mkdir(versionsDir, { recursive: true });

    // Copy file to versions folder
    const versionPath = path.join(versionsDir, versionedName);
    await fs.promises.copyFile(filePath, versionPath);

    console.log(`Backed up ${filePath} to ${versionPath}`);

    // Now delete the original
    await fs.promises.unlink(filePath);
}
