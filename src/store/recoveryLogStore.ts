import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecoveryLogEntry {
    id: string;
    fileName: string;
    originalPath: string;
    recoveredAt: string; // ISO date
    size: number;
}

interface RecoveryLogStore {
    entries: RecoveryLogEntry[];

    addEntry: (entry: Omit<RecoveryLogEntry, 'id' | 'recoveredAt'>) => void;
    clearEntries: () => void;
}

export const useRecoveryLogStore = create<RecoveryLogStore>()(
    persist(
        (set) => ({
            entries: [],

            addEntry: (entry) => {
                const newEntry: RecoveryLogEntry = {
                    id: crypto.randomUUID(),
                    ...entry,
                    recoveredAt: new Date().toISOString(),
                };
                set((state) => ({
                    entries: [newEntry, ...state.entries].slice(0, 100), // Keep last 100
                }));
            },

            clearEntries: () => {
                set({ entries: [] });
            },
        }),
        {
            name: 'megasync-recovery-log',
        }
    )
);
