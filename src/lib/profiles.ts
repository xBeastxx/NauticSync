// Profile configuration for different project types

export type ProjectProfile = 'node' | 'python' | 'go' | 'rust' | 'generic';

export interface ProfileConfig {
    id: ProjectProfile;
    name: string;
    icon: string; // Lucide icon name
    color: string; // Tailwind color class
    detectFiles: string[]; // Files that indicate this project type
    defaultIgnores: string[]; // .stignore patterns
}

export const PROFILE_CONFIGS: Record<ProjectProfile, ProfileConfig> = {
    node: {
        id: 'node',
        name: 'Node.js',
        icon: 'Hexagon',
        color: 'emerald',
        detectFiles: ['package.json'],
        defaultIgnores: [
            'node_modules/',
            '.npm/',
            'dist/',
            '.next/',
            '.nuxt/',
            '.output/',
            '.turbo/',
            'coverage/',
            '.cache/',
        ],
    },
    python: {
        id: 'python',
        name: 'Python',
        icon: 'Code2',
        color: 'blue',
        detectFiles: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'],
        defaultIgnores: [
            '__pycache__/',
            '*.pyc',
            '*.pyo',
            '.venv/',
            'venv/',
            '.eggs/',
            '*.egg-info/',
            'dist/',
            'build/',
            '.pytest_cache/',
            '.mypy_cache/',
        ],
    },
    go: {
        id: 'go',
        name: 'Go',
        icon: 'Binary',
        color: 'cyan',
        detectFiles: ['go.mod'],
        defaultIgnores: [
            'vendor/',
            '*.exe',
            '*.test',
        ],
    },
    rust: {
        id: 'rust',
        name: 'Rust',
        icon: 'Cog',
        color: 'orange',
        detectFiles: ['Cargo.toml'],
        defaultIgnores: [
            'target/',
        ],
    },
    generic: {
        id: 'generic',
        name: 'Generic',
        icon: 'Folder',
        color: 'zinc',
        detectFiles: [],
        defaultIgnores: [],
    },
};

/**
 * Get profile config by ID
 */
export function getProfileConfig(profile: ProjectProfile): ProfileConfig {
    return PROFILE_CONFIGS[profile] || PROFILE_CONFIGS.generic;
}

/**
 * Get all profiles sorted by priority (for detection)
 */
export function getAllProfiles(): ProfileConfig[] {
    const order: ProjectProfile[] = ['node', 'python', 'rust', 'go', 'generic'];
    return order.map(id => PROFILE_CONFIGS[id]);
}
