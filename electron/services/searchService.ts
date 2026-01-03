import * as fs from 'fs';
import * as path from 'path';

export interface SearchResult {
    name: string;
    path: string;
    type: 'file' | 'folder';
    folder: string;
    size?: number;
    modified?: number;
}

export async function searchFiles(
    folders: string[],
    query: string,
    maxResults: number = 50
): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const folderPath of folders) {
        try {
            await searchDirectory(folderPath, folderPath, lowerQuery, results, maxResults);
            if (results.length >= maxResults) break;
        } catch (err) {
            console.error(`Failed to search ${folderPath}:`, err);
        }
    }

    // Sort by relevance: exact name match > starts with > contains
    results.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();

        const aExact = aName === lowerQuery;
        const bExact = bName === lowerQuery;
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;

        const aStarts = aName.startsWith(lowerQuery);
        const bStarts = bName.startsWith(lowerQuery);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;

        return 0;
    });

    return results.slice(0, maxResults);
}

async function searchDirectory(
    basePath: string,
    currentPath: string,
    query: string,
    results: SearchResult[],
    maxResults: number
): Promise<void> {
    if (results.length >= maxResults) return;

    try {
        const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            if (results.length >= maxResults) break;

            // Skip hidden files and common ignored directories
            if (entry.name.startsWith('.') ||
                entry.name === 'node_modules' ||
                entry.name === '.stversions' ||
                entry.name.startsWith('.sync-')) {
                continue;
            }

            const fullPath = path.join(currentPath, entry.name);
            const lowerName = entry.name.toLowerCase();

            if (lowerName.includes(query)) {
                try {
                    const stats = await fs.promises.stat(fullPath);
                    results.push({
                        name: entry.name,
                        path: fullPath,
                        type: entry.isDirectory() ? 'folder' : 'file',
                        folder: path.basename(basePath),
                        size: entry.isFile() ? stats.size : undefined,
                        modified: stats.mtimeMs
                    });
                } catch { }
            }

            // Recurse into subdirectories (limit depth to 5)
            if (entry.isDirectory()) {
                const depth = fullPath.replace(basePath, '').split(path.sep).length;
                if (depth < 5) {
                    await searchDirectory(basePath, fullPath, query, results, maxResults);
                }
            }
        }
    } catch (err) {
        // Ignore permission errors
    }
}
