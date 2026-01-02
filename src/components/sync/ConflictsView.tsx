import { useWorkflowStore } from '../../store/workflowStore';
import type { ConflictItem } from '../../store/workflowStore';
import { RotateCcw, Trash2, Check, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

export const ConflictsView = () => {
    const { conflicts, scanAllConflicts, resolveConflict } = useWorkflowStore();
    const [isScanning, setIsScanning] = useState(false);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    useEffect(() => {
        handleScan();
    }, []);

    const handleScan = async () => {
        setIsScanning(true);
        await scanAllConflicts();
        setIsScanning(false);
    };

    const handleResolve = async (conflict: ConflictItem, strategy: 'keep-mine' | 'keep-theirs') => {
        setResolvingId(conflict.id);
        try {
            await resolveConflict(conflict, strategy);
        } finally {
            setResolvingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Sync Conflicts</h2>
                    <p className="text-zinc-400">Resolve file version discrepancies.</p>
                </div>
                <button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                >
                    <RotateCcw className={clsx("w-5 h-5", isScanning && "animate-spin")} />
                </button>
            </div>

            {conflicts.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-zinc-500 border-dashed">
                    <Check className="w-12 h-12 text-emerald-500 mb-4" />
                    <h3 className="text-lg font-medium text-white">All Good!</h3>
                    <p>No sync conflicts detected.</p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {conflicts.map(conflict => (
                        <Card key={conflict.id} className="group relative overflow-hidden border-yellow-500/20">
                            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/50" />
                            <div className="flex items-start gap-4 p-4">
                                <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500 shrink-0">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-white truncate text-lg">{conflict.filename}</h4>
                                        <span className="px-2 py-0.5 text-xs font-mono bg-zinc-800 text-zinc-400 rounded">
                                            {conflict.folderPath}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-400 truncate mb-4" title={conflict.path}>
                                        Constraint: {conflict.path}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                                        <div className="flex flex-col">
                                            <span className="uppercase tracking-wider font-bold text-zinc-600 mb-1">Conflict Version</span>
                                            <span className="text-white">{formatDistanceToNow(new Date(conflict.modificationTime))} ago</span>
                                            <span>{(conflict.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            disabled={resolvingId === conflict.id}
                                            onClick={() => handleResolve(conflict, 'keep-mine')}
                                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                                            title="Delete this conflict file (Keep the other one)"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Discard Conflict
                                        </button>
                                        <button
                                            disabled={resolvingId === conflict.id}
                                            onClick={() => handleResolve(conflict, 'keep-theirs')}
                                            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                                            title="Overwrite original with this version"
                                        >
                                            <Check className="w-4 h-4" />
                                            Keep This Version
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
