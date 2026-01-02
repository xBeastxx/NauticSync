import { useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { Card } from '../ui/Card';
import { Folder, X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { GranularSelector } from './GranularSelector';

export const AddFolderWizard = ({ onClose }: { onClose: () => void }) => {
    const [step, setStep] = useState(1);
    const { activeWorkflowId, addFolderToWorkflow } = useWorkflowStore();

    // Form State
    const [label, setLabel] = useState('');
    const [path, setPath] = useState('');
    const [ignorePatterns, setIgnorePatterns] = useState<string[]>([]);

    const handleNext = () => {
        if (step === 1 && label && path) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleCreate = () => {
        if (!activeWorkflowId) return;

        // Transform absolute ignore patterns to relative for .stignore if possible.
        // Syncthing expects relative paths.
        // Simple normalization:
        const relativePatterns = ignorePatterns.map(p => {
            // If p = "C:\Users\foo\bar" and root = "C:\Users\foo"
            // relative = "bar"
            const relative = p.replace(path, '').replace(/^[\\/]/, '');
            return relative;
        });

        // Add to local store
        addFolderToWorkflow(activeWorkflowId, {
            label,
            path,
            syncthingFolderId: `folder-${Date.now()}`,
            rules: relativePatterns.map(p => ({ pattern: p, type: 'exclude' }))
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg bg-zinc-900 border-zinc-700 animate-in fade-in zoom-in-95 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Folder className="w-5 h-5 text-yellow-500" />
                        {step === 1 ? 'Add Synced Folder' : 'Select Files'}
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                    {step === 1 ? (
                        <div className="space-y-4 overflow-y-auto p-1">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Folder Label</label>
                                <input
                                    type="text"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                                    placeholder="e.g. Project Documents"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Local Path</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                                        placeholder="Absolute path..."
                                        value={path}
                                        onChange={(e) => setPath(e.target.value)}
                                    />
                                    <button
                                        onClick={async () => {
                                            try {
                                                const selectedPath = await window.electronAPI.openDirectory();
                                                if (selectedPath) {
                                                    setPath(selectedPath);
                                                }
                                            } catch (err) {
                                                console.error('Failed to open directory dialog', err);
                                            }
                                        }}
                                        className="px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700 hover:bg-zinc-700 font-medium text-sm text-zinc-300 hover:text-white transition-colors"
                                    >
                                        Browse
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0">
                            <p className="text-sm text-zinc-400 mb-2 shrink-0">Uncheck items to exclude them from synchronization (create .stignore rules).</p>
                            <GranularSelector
                                rootPath={path}
                                onPatternsChange={setIgnorePatterns}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-between shrink-0 pt-4 border-t border-zinc-800">
                    {step === 2 ? (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white"
                        >
                            Cancel
                        </button>
                    )}

                    {step === 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={!label || !path}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-100 text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500 text-black hover:bg-yellow-400"
                        >
                            <Check className="w-4 h-4" />
                            Create & Sync (Save)
                        </button>
                    )}
                </div>
            </Card>
        </div>
    );
};
