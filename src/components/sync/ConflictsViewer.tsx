import { useQuery, useMutation } from '@tanstack/react-query';
import { useWorkflowStore } from '../../store/workflowStore';
import { Card } from '../ui/Card';
import { AlertTriangle, Clock, HardDrive, Check, X, RefreshCw } from 'lucide-react';
import { formatBytes, formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export const ConflictsViewer = () => {
    const { workflows, activeWorkflowId } = useWorkflowStore();

    // Scan for conflicts
    const { data: conflicts, isLoading, refetch } = useQuery({
        queryKey: ['conflicts', activeWorkflowId], // Refetch when workflow changes
        queryFn: async () => {
            const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);
            const foldersToScan = activeWorkflow ? activeWorkflow.folders.map(f => f.path) : [];

            if (foldersToScan.length === 0) return [];

            return await window.electronAPI.scanConflicts(foldersToScan);
        },
        refetchInterval: 30000 // Scan every 30s
    });

    // Resolve mutation
    const resolveMutation = useMutation({
        mutationFn: async ({
            conflictPath,
            originalPath,
            strategy
        }: {
            conflictPath: string;
            originalPath: string;
            strategy: 'keep-local' | 'keep-remote'
        }) => {
            await window.electronAPI.resolveConflict(conflictPath, originalPath, strategy);
        },
        onSuccess: () => {
            toast.success('Conflict resolved');
            refetch();
        },
        onError: () => {
            toast.error('Failed to resolve conflict');
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-12 text-zinc-500">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
                    <p>Scanning for conflicts...</p>
                </div>
            </div>
        );
    }

    if (!conflicts || conflicts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-zinc-500 space-y-4">
                <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Check className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-medium text-white">No Conflicts Found</h3>
                    <p className="text-sm">Your synchronized folders are clean.</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all text-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Scan Again
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        Conflict Resolution
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                        Found {conflicts.length} files with synchronization conflicts
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="Refresh conflicts"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </header>

            <div className="space-y-4">
                {conflicts.map((group) => (
                    <Card key={group.originalPath} className="border-l-4 border-l-yellow-500 overflow-hidden">
                        <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/50">
                            <h3 className="text-lg font-medium text-white truncate" title={group.originalPath}>
                                {group.originalFile}
                            </h3>
                            <p className="text-xs text-zinc-500 font-mono mt-1 break-all">
                                {group.originalPath}
                            </p>
                        </div>

                        <div className="divide-y divide-zinc-800/50">
                            {group.conflicts.map((conflict) => {
                                return (
                                    <div key={conflict.path} className="p-4 hover:bg-zinc-800/30 transition-colors">
                                        <div className="flex items-start gap-4">
                                            {/* Conflict Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase font-bold tracking-wider">
                                                        Conflict Version
                                                    </span>
                                                    <span className="text-xs text-zinc-500">
                                                        from device {conflict.deviceId}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                                                    <div className="text-zinc-400 flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-zinc-500" />
                                                        {formatDate(conflict.date || new Date(conflict.modified))}
                                                    </div>
                                                    <div className="text-zinc-400 flex items-center gap-2">
                                                        <HardDrive className="w-4 h-4 text-zinc-500" />
                                                        {formatBytes(conflict.size)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 shrink-0">
                                                <button
                                                    onClick={() => {
                                                        if (confirm('This will delete the conflict file and keep the original. Continue?')) {
                                                            resolveMutation.mutate({
                                                                conflictPath: conflict.path,
                                                                originalPath: group.originalPath,
                                                                strategy: 'keep-local'
                                                            });
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5 text-red-400" />
                                                    Discard (Delete)
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (confirm('This will OVERWRITE your local original file with this conflict version. Continue?')) {
                                                            resolveMutation.mutate({
                                                                conflictPath: conflict.path,
                                                                originalPath: group.originalPath,
                                                                strategy: 'keep-remote'
                                                            });
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium border border-blue-500/30 transition-colors"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    Keep This Version
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
