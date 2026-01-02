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

    // Actions
    setFolderConfig: (folderPath: string, config: BackupConfig) => void;
    getFolderConfig: (folderPath: string) => BackupConfig | null;
    isVersioningEnabled: (folderPath: string) => boolean;
}

export const useBackupStore = create<BackupStore>()(
    persist(
        (set, get) => ({
            folderConfigs: {},

            setFolderConfig: (folderPath, config) => {
                set((state) => ({
                    folderConfigs: {
                        ...state.folderConfigs,
                        [folderPath]: config,
                    },
                }));
            },

            getFolderConfig: (folderPath) => {
                return get().folderConfigs[folderPath] || null;
            },

            isVersioningEnabled: (folderPath) => {
                const config = get().folderConfigs[folderPath];
                return config ? config.type !== 'none' : false;
            },
        }),
        {
            name: 'megasync-backup-config',
        }
    )
);
