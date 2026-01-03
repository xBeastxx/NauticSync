import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VersioningType = 'simple' | 'staggered' | 'trashcan' | 'external' | 'none';

export interface BackupConfig {
    type: VersioningType;
    keepDays: number;
    configuredAt: string; // ISO date string
}

interface BackupStore {
    // Map of folder path -> backup config
    folderConfigs: Record<string, BackupConfig>;

    // Global default config
    globalConfig: BackupConfig;

    // Actions
    setFolderConfig: (folderPath: string, config: BackupConfig) => void;
    setGlobalConfig: (config: BackupConfig) => void;
    getFolderConfig: (folderPath: string) => BackupConfig | null;
    isVersioningEnabled: (folderPath: string) => boolean;
}

export const useBackupStore = create<BackupStore>()(
    persist(
        (set, get) => ({
            folderConfigs: {},
            globalConfig: {
                type: 'simple',
                keepDays: 30,
                configuredAt: new Date().toISOString()
            },

            setGlobalConfig: (config) => {
                set({ globalConfig: config });
            },

            setFolderConfig: (folderPath, config) => {
                set((state) => ({
                    folderConfigs: {
                        ...state.folderConfigs,
                        [folderPath]: config,
                    },
                }));
            },

            getFolderConfig: (folderPath) => {
                const specific = get().folderConfigs[folderPath];
                // Fallback to global if not specifically configured, OR if explicitly set to inherit (todo)
                // For now, if no specific config exists, return global
                return specific || get().globalConfig;
            },

            isVersioningEnabled: (folderPath) => {
                const config = get().getFolderConfig(folderPath); // Use getter to handle fallback
                return config ? config.type !== 'none' : false;
            },
        }),
        {
            name: 'megasync-backup-config',
        }
    )
);
