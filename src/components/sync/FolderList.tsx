import { Folder, HardDrive, MoreVertical, RefreshCw, Plus } from 'lucide-react';
import { useWorkflowStore, type SyncedFolder } from '../../store/workflowStore';
import { Card } from '../ui/Card';
import { ProfileBadge } from '../ui/ProfileBadge';
import { AddFolderWizard } from './AddFolderWizard';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GranularSelector } from './GranularSelector';
import { clsx } from 'clsx';

export const FolderList = () => {
    const { workflows, activeWorkflowId } = useWorkflowStore();
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);
    const foldersToCheck = activeWorkflow ? activeWorkflow.folders : [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Synced Folders</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (!activeWorkflowId) {
                                alert("Please create or select a Workflow first.");
                                return;
                            }
                            setIsWizardOpen(true);
                        }}
                        className={clsx(
                            "p-2 rounded-lg transition-colors",
                            activeWorkflowId
                                ? "hover:bg-zinc-800 text-zinc-400 hover:text-yellow-500"
                                : "text-zinc-600 cursor-not-allowed"
                        )}
                        title="Add Folder"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isWizardOpen && <AddFolderWizard onClose={() => setIsWizardOpen(false)} />}

            {foldersToCheck.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-zinc-500 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                        <Folder className="w-6 h-6 text-zinc-600" />
                    </div>
                    <p>No folders in this workflow yet.</p>
                </div>
            ) : (
                <div className="max-h-[400px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {foldersToCheck.map((folder) => (
                            <FolderCard key={folder.id} folder={folder} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const FolderCard = ({ folder }: { folder: SyncedFolder }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const [isEditing, setIsEditing] = useState(false);
    const [newPatterns, setNewPatterns] = useState<string[]>([]);
    const [detectedProfile, setDetectedProfile] = useState<string | null>(folder.profile || null);

    useEffect(() => {
        // Auto-detect profile if not set
        if (!folder.profile && !detectedProfile) {
            window.electronAPI.detectProfile(folder.path)
                .then(profile => setDetectedProfile(profile))
                .catch(console.error);
        }
    }, [folder.path, folder.profile]);

    const handleSaveRules = () => {
        // Transform absolute/relative
        // GranularSelector returns generic paths (currently absolute due to previous impl).
        // Store expects relative.
        // We know GranularSelector outputs: Set<string> of excluded paths.

        // Simple normalization for now (this matches Wizard logic)
        const relativePatterns = newPatterns.map(p => {
            const relative = p.replace(folder.path, '').replace(/^[\\/]/, '');
            return relative;
        });

        useWorkflowStore.getState().updateFolderRules(
            useWorkflowStore.getState().activeWorkflowId!,
            folder.id,
            relativePatterns.map(p => ({ pattern: p, type: 'exclude' }))
        );
        setIsEditing(false);
    };

    const profile = folder.profile || detectedProfile;

    return (
        <>
            <Card className="hover:border-zinc-700 transition-colors group cursor-pointer relative">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                            <Folder className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">{folder.label}</h4>
                                {profile && profile !== 'generic' && (
                                    <ProfileBadge profile={profile as any} size="sm" />
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 truncate" title={folder.path}>{folder.path}</p>
                        </div>
                    </div>

                    <div className="relative z-20 shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPos({
                                    top: rect.bottom + window.scrollY + 4,
                                    left: rect.right + window.scrollX - 160
                                });
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            className={clsx(
                                "p-1.5 rounded-lg transition-colors border border-zinc-700 bg-zinc-800 text-white shadow-sm hover:bg-zinc-700",
                                isMenuOpen && "ring-1 ring-yellow-500"
                            )}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Menu Portal */}
                        {isMenuOpen && createPortal(
                            <>
                                <div
                                    className="fixed inset-0 z-[100] cursor-default"
                                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                                />

                                <div
                                    className="fixed w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-[101] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
                                    style={{
                                        top: menuPos.top,
                                        left: menuPos.left,
                                    }}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMenuOpen(false);
                                            setIsEditing(true);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Edit Rules
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMenuOpen(false);
                                            window.electronAPI.openPath(folder.path);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Open in Explorer
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMenuOpen(false);
                                            if (confirm(`Stop syncing "${folder.label}"?`)) {
                                                useWorkflowStore.getState().removeFolderFromWorkflow(useWorkflowStore.getState().activeWorkflowId!, folder.id);
                                            }
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Remove
                                    </button>
                                </div>
                            </>,
                            document.body
                        )}
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                        <HardDrive className="w-3 h-3" />
                        <span>Local</span>
                    </div>
                    <span className="text-emerald-500">Up to date</span>
                </div>
            </Card>

            {/* Edit Modal */}
            {isEditing && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col h-[600px] overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
                            <h3 className="text-lg font-bold text-white">Edit Ignored Files</h3>
                            <button onClick={() => setIsEditing(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col p-4 bg-zinc-950/30">
                            <p className="text-sm text-zinc-400 mb-2 shrink-0">Uncheck items to exclude them from synchronization (update .stignore).</p>
                            <GranularSelector
                                rootPath={folder.path}
                                initialPatterns={folder.rules.map(r => r.pattern)}
                                onPatternsChange={setNewPatterns}
                            />
                        </div>

                        <div className="flex justify-end shrink-0 p-4 border-t border-zinc-800 gap-2 bg-zinc-900">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRules}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500 text-black hover:bg-yellow-400 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
