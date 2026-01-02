import * as fs from 'fs';
import * as path from 'path';

export type ProjectProfile = 'node' | 'python' | 'go' | 'rust' | 'generic';

interface ProfileDetection {
    id: ProjectProfile;
    detectFiles: string[];
}

const PROFILE_DETECTIONS: ProfileDetection[] = [
    { id: 'node', detectFiles: ['package.json'] },
    { id: 'python', detectFiles: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'] },
    { id: 'rust', detectFiles: ['Cargo.toml'] },
    { id: 'go', detectFiles: ['go.mod'] },
];

/**
 * Detect the project profile for a given folder path
 * Based on marker files present in the root directory
 */
export async function detectProfile(folderPath: string): Promise<ProjectProfile> {
    try {
        const files = await fs.promises.readdir(folderPath);
        const fileSet = new Set(files);

        for (const profile of PROFILE_DETECTIONS) {
            for (const detectFile of profile.detectFiles) {
                if (fileSet.has(detectFile)) {
                    console.log(`Detected ${profile.id} profile in ${folderPath} (found ${detectFile})`);
                    return profile.id;
                }
            }
        }

        return 'generic';
    } catch (error) {
        console.error(`Error detecting profile for ${folderPath}:`, error);
        return 'generic';
    }
}

/**
 * Get all detected profiles for multiple folders
 */
export async function detectProfilesForFolders(folderPaths: string[]): Promise<Record<string, ProjectProfile>> {
    const results: Record<string, ProjectProfile> = {};

    for (const folderPath of folderPaths) {
        results[folderPath] = await detectProfile(folderPath);
    }

    return results;
}
