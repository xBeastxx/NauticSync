import fs from 'fs';
import path from 'path';

export class ImportsService {
    async ensureImportsDir(projectPath: string) {
        const importsDir = path.join(projectPath, '.imports');
        if (!fs.existsSync(importsDir)) {
            fs.mkdirSync(importsDir);
        }

        // Add to .gitignore if not present
        const gitignorePath = path.join(projectPath, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const content = fs.readFileSync(gitignorePath, 'utf8');
            if (!content.includes('.imports/')) {
                fs.appendFileSync(gitignorePath, '\n# MegaSync Imports\n.imports/\n');
            }
        } else {
            fs.writeFileSync(gitignorePath, '# MegaSync Imports\n.imports/\n');
        }

        return importsDir;
    }

    async saveImport(projectPath: string, fileName: string, content: any, isBinary = false) {
        const importsDir = await this.ensureImportsDir(projectPath);
        const filePath = path.join(importsDir, fileName);

        // Ensure subdirectories exist if fileName contains path
        const fileDir = path.dirname(filePath);
        if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
        }

        if (isBinary) {
            // For binary (like images), content should be a Buffer or generic stream mostly handled by 'downloadFile'
            // This method might be used for text code saving
            fs.writeFileSync(filePath, content);
        } else {
            fs.writeFileSync(filePath, content, 'utf8');
        }

        return filePath;
    }

    // List immediate children of .imports/subPath
    async listImports(projectPath: string, subPath: string = '') {
        const importsDir = path.join(projectPath, '.imports', subPath);
        if (!fs.existsSync(importsDir)) return [];

        // Check if it's actually a directory
        const dirStat = fs.statSync(importsDir);
        if (!dirStat.isDirectory()) return [];

        const items = fs.readdirSync(importsDir);

        const result = items.map(name => {
            const fullPath = path.join(importsDir, name);
            const stat = fs.statSync(fullPath);
            // Normalize to forward slashes for consistent frontend handling
            const relativePath = path.join(subPath, name).split(path.sep).join('/');

            return {
                name,
                path: relativePath,
                fullPath,
                size: stat.size,
                updatedAt: stat.mtime,
                type: stat.isDirectory() ? 'dir' : 'file'
            };
        });

        // Sort: Folders first, then files
        return result.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'dir' ? -1 : 1;
        });
    }

    async readImport(projectPath: string, relativePath: string) {
        const target = path.join(projectPath, '.imports', relativePath);
        if (fs.existsSync(target)) {
            // Check if binary? simple check
            // For now assume text for code viewer
            return fs.readFileSync(target, 'utf8');
        }
        throw new Error('File not found');
    }

    async deleteImport(projectPath: string, relativePath: string) {
        const target = path.join(projectPath, '.imports', relativePath);
        if (fs.existsSync(target)) {
            const stat = fs.statSync(target);
            if (stat.isDirectory()) {
                fs.rmSync(target, { recursive: true, force: true });
            } else {
                fs.unlinkSync(target);
            }
            return true;
        }
        return false;
    }

    async promoteImport(projectPath: string, relativePath: string, destPath: string) {
        // destPath is relative to project root
        // relativePath is relative to .imports

        const source = path.join(projectPath, '.imports', relativePath);
        const destination = path.join(projectPath, destPath); // destPath should include filename?
        // Or if destPath is a directory, append filename.

        // Let's assume destPath IS the full target path including filename for precision

        const destDir = path.dirname(destination);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        fs.renameSync(source, destination); // Move file
        return true;
    }

    async downloadImport(projectPath: string, fileName: string, url: string) {
        const importsDir = await this.ensureImportsDir(projectPath);
        const targetPath = path.join(importsDir, fileName);

        // Ensure parent directory exists
        const fileDir = path.dirname(targetPath);
        if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
        }

        try {
            const axios = await import('axios');
            const fs = await import('fs');

            const response = await axios.default({
                url,
                method: 'GET',
                responseType: 'stream',
            });

            const writer = fs.createWriteStream(targetPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(targetPath));
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('Import download failed:', error);
            throw error;
        }
    }
}
