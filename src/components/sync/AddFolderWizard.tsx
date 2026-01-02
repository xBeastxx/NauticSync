import { useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { Card } from '../ui/Card';
import { Folder, X, ArrowRight, ArrowLeft, Check, Smartphone, Monitor } from 'lucide-react';
import { GranularSelector } from './GranularSelector';
import { useConfig } from '../../lib/api/hooks'; // Import useConfig
import { syncthing } from '../../lib/syncthing'; // Import syncthing client

export const AddFolderWizard = ({ onClose }: { onClose: () => void }) => {
    const [step, setStep] = useState(1);
    const { activeWorkflowId, addFolderToWorkflow } = useWorkflowStore();
    const { data: config } = useConfig(); // Fetch config for devices

    // Form State
    const [label, setLabel] = useState('');
    const [path, setPath] = useState('');
    const [ignorePatterns, setIgnorePatterns] = useState<string[]>([]);
    const [selectedDevices, setSelectedDevices] = useState<string[]>([]); // New state
    const [isCreating, setIsCreating] = useState(false); // Loading state

    const handleNext = () => {
        if (step === 1 && label && path) {
            setStep(2);
        } else if (step === 2) {
            setStep(3); // Go to device selection
        }
    };


    const handleCreate = async () => {
        if (!activeWorkflowId) return;
        setIsCreating(true);

        try {
            const folderId = `folder-${Date.now()}`; // Generate ID

            // 1. Backend: Add to Syncthing Config
            await syncthing.addFolder({
                id: folderId,
                label: label,
                path: path,
                devices: selectedDevices,
                type: 'sendreceive'
            });

            // 2. Frontend: Update Workflow Store (Organization)
            // Transform absolute ignore patterns to relative
            const relativePatterns = ignorePatterns.map(p => {
                const relative = p.replace(path, '').replace(/^[\\/]/, '');
                return relative;
            });

            addFolderToWorkflow(activeWorkflowId, {
                label,
                path,
                syncthingFolderId: folderId,
                rules: relativePatterns.map(p => ({ pattern: p, type: 'exclude' }))
            });

            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to create folder: " + err);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div
                className="w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <Card className="w-full bg-zinc-900 border-zinc-700 animate-in fade-in zoom-in-95 shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Folder className="w-5 h-5 text-yellow-500" />
                            {step === 1 ? 'Add Synced Folder' : step === 2 ? 'Select Files' : 'Share with Devices'}
                        </h3>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col">
                        {step === 1 && (
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
                        )}

                        {step === 2 && (
                            <div className="flex-1 flex flex-col min-h-0">
                                <p className="text-sm text-zinc-400 mb-2 shrink-0">Uncheck items to exclude them from synchronization (create .stignore rules).</p>
                                <GranularSelector
                                    rootPath={path}
                                    onPatternsChange={setIgnorePatterns}
                                />
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4 overflow-y-auto p-1">
                                <p className="text-sm text-zinc-400">Select the devices you want to share this folder with:</p>
                                <div className="space-y-2">
                                    {(config?.devices || []).map((dev: any) => {
                                        const isSelected = selectedDevices.includes(dev.deviceID);
                                        return (
                                            <div
                                                key={dev.deviceID}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedDevices(selectedDevices.filter(id => id !== dev.deviceID));
                                                    } else {
                                                        setSelectedDevices([...selectedDevices, dev.deviceID]);
                                                    }
                                                }}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                                    ? 'bg-yellow-500/10 border-yellow-500/50'
                                                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-zinc-600'}`}>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                                                </div>
                                                <div className="w-10 h-10 rounded bg-zinc-900 flex items-center justify-center text-zinc-500">
                                                    {/* Heuristic for icon: if name contains phone/iphone use Smartphone else Monitor */}
                                                    {dev.name.toLowerCase().includes('phone') ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h4 className={`text-sm font-medium ${isSelected ? 'text-yellow-500' : 'text-white'}`}>
                                                        {dev.name || 'Unnamed Device'}
                                                    </h4>
                                                    <p className="text-xs text-zinc-500 font-mono">{dev.deviceID.substring(0, 12)}...</p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {(config?.devices || []).length === 0 && (
                                        <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                                            <p>No paired devices found.</p>
                                            <p className="text-xs mt-1">Go to Sync Center to pair a device.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-between shrink-0 pt-4 border-t border-zinc-800">
                        {step === 2 || step === 3 ? (
                            <button
                                onClick={() => setStep(step - 1)}
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

                        {step < 3 ? (
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
                                disabled={isCreating}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50"
                            >
                                {isCreating ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Create & Sync
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
