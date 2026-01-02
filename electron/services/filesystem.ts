import fs from 'fs';
import path from 'path';

export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileEntry[]; // For recursive, though we might load on demand
}

export class FileSystemService {

    public async readDirectory(dirPath: string): Promise<FileEntry[]> {
        try {
            if (!fs.existsSync(dirPath)) {
                throw new Error(`Directory not found: ${dirPath}`);
            }

            const items = await fs.promises.readdir(dirPath, { withFileTypes: true });

            const entries: FileEntry[] = items.map((item) => ({
                name: item.name,
                path: path.join(dirPath, item.name),
                isDirectory: item.isDirectory(),
            }));

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
}
