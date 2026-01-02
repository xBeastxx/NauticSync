import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface SyncRule {
    pattern: string;
    type: 'include' | 'exclude';
}

export interface SyncedFolder {
    id: string; // Internal UUID
    syncthingFolderId: string; // The ID used by Syncthing (e.g., "default")
    label: string;
    path: string;
    rules: SyncRule[]; // For granular selection (.stignore)
    profile?: 'node' | 'python' | 'go' | 'rust' | 'generic'; // Project profile
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    folders: SyncedFolder[];
    color?: string; // For UI identification
    icon?: string; // Lucide icon name
}

export interface ConflictItem {
    id: string;
    path: string;
    originalPath: string;
    filename: string;
    folderPath: string;
    modificationTime: Date;
    size: number;
    conflictType: 'sync-conflict';
}

interface WorkflowState {
    workflows: Workflow[];
    conflicts: ConflictItem[];
    activeWorkflowId: string | null;

    createWorkflow: (name: string, description?: string) => string;
    addFolderToWorkflow: (workflowId: string, folder: Omit<SyncedFolder, 'id'>) => void;
    updateFolderRules: (workflowId: string, folderId: string, rules: SyncRule[]) => void;
    removeFolderFromWorkflow: (workflowId: string, folderId: string) => void;
    removeWorkflow: (id: string) => void;
    setActiveWorkflow: (id: string | null) => void;

    // Conflict Actions
    scanAllConflicts: () => Promise<void>;
    resolveConflict: (conflict: ConflictItem, strategy: 'keep-mine' | 'keep-theirs') => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>()(
    persist(
        (set, get) => ({
            workflows: [],
            activeWorkflowId: null,
            conflicts: [],

            createWorkflow: (name, description) => {
                const id = uuidv4();
                set((state) => ({
                    workflows: [
                        ...state.workflows,
                        { id, name, description, folders: [], color: 'yellow' }
                    ]
                }));
                return id;
            },

            addFolderToWorkflow: (workflowId, folder) => {
                set((state) => ({
                    workflows: state.workflows.map((wf) =>
                        wf.id === workflowId
                            ? { ...wf, folders: [...wf.folders, { ...folder, id: uuidv4() }] }
                            : wf
                    )
                }));
            },

            updateFolderRules: (workflowId, folderId, rules) => {
                set((state) => ({
                    workflows: state.workflows.map((wf) =>
                        wf.id === workflowId
                            ? {
                                ...wf,
                                folders: wf.folders.map(f =>
                                    f.id === folderId ? { ...f, rules } : f
                                )
                            }
                            : wf
                    )
                }));
            },

            removeFolderFromWorkflow: (workflowId, folderId) => {
                set((state) => ({
                    workflows: state.workflows.map((wf) =>
                        wf.id === workflowId
                            ? { ...wf, folders: wf.folders.filter(f => f.id !== folderId) }
                            : wf
                    )
                }));
            },

            removeWorkflow: (id) => {
                set((state) => ({
                    workflows: state.workflows.filter((w) => w.id !== id),
                    activeWorkflowId: state.activeWorkflowId === id ? null : state.activeWorkflowId
                }));
            },

            setActiveWorkflow: (id) => set({ activeWorkflowId: id }),

            scanAllConflicts: async () => {
                const state = get();
                // Aggregate all folders from all workflows
                const allFolders = state.workflows.flatMap(w => w.folders.map(f => f.path));
                const uniqueFolders = [...new Set(allFolders)];

                let allConflicts: ConflictItem[] = [];

                for (const folder of uniqueFolders) {
                    try {
                        const conflicts = await window.electronAPI.scanConflicts(folder);
                        allConflicts = [...allConflicts, ...conflicts];
                    } catch (err) {
                        console.error("Failed to scan conflicts for folder", folder, err);
                    }
                }
                set({ conflicts: allConflicts });
            },

            resolveConflict: async (conflict, strategy) => {
                try {
                    await window.electronAPI.resolveConflict(conflict.path, strategy);
                    // Remove from local state immediately
                    set((state) => ({
                        conflicts: state.conflicts.filter(c => c.id !== conflict.id)
                    }));
                } catch (err) {
                    console.error("Failed to resolve conflict", err);
                    throw err;
                }
            }
        }),
        {
            name: 'syncmaster-workflows',
        }
    )
);
