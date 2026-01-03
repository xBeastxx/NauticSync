import { useState, useEffect, useCallback } from 'react';
import { syncthing } from '../../lib/syncthing';
import {
    ArrowDown,
    FolderSync,
    Pause,
    Play,
    ExternalLink,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatBytes } from '../../lib/utils';

interface NeedFile {
    name: string;
    size: number;
}

interface FolderNeed {
    folderId: string;
    folderLabel: string;
    files: NeedFile[];
    paused: boolean;
}

export const ActiveTransfers = () => {
    const [folders, setFolders] = useState<FolderNeed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pausingFolder, setPausingFolder] = useState<string | null>(null);

    const loadTransfers = useCallback(async () => {
        try {
            const config = await syncthing.getConfig();
            const folderConfigs = config.folders || [];

            const folderNeeds: FolderNeed[] = [];

            for (const folder of folderConfigs) {
                try {
                    // Get files needed for this folder
                    const needData = await syncthing.getDbNeed(folder.id);
                    const files = (needData?.progress || []).concat(needData?.queued || []).slice(0, 10);

                    folderNeeds.push({
                        folderId: folder.id,
                        folderLabel: folder.label || folder.id,
                        files: files.map((f: any) => ({ name: f.name, size: f.size })),
                        paused: folder.paused || false
                    });
                } catch (e) {
                    // Folder might have no pending files
                }
            }

            setFolders(folderNeeds);
        } catch (err) {
            console.error('Failed to load transfers:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTransfers();
        const interval = setInterval(loadTransfers, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [loadTransfers]);

    const togglePauseFolder = async (folderId: string, currentlyPaused: boolean) => {
        setPausingFolder(folderId);
        try {
            const config = await syncthing.getConfig();
            const updatedFolders = config.folders.map((f: any) => {
                if (f.id === folderId) {
                    return { ...f, paused: !currentlyPaused };
                }
                return f;
            });

            await syncthing.setConfig({ ...config, folders: updatedFolders });

            // Update local state
            setFolders(prev => prev.map(f =>
                f.folderId === folderId ? { ...f, paused: !currentlyPaused } : f
            ));
        } catch (e) {
            console.error('Failed to toggle pause:', e);
        } finally {
            setPausingFolder(null);
        }
    };

    const openInExplorer = async (folderLabel: string) => {
        // Use Electron to open the folder
        try {
            const config = await syncthing.getConfig();
            const folder = config.folders.find((f: any) => f.label === folderLabel || f.id === folderLabel);
            if (folder?.path) {
                window.electronAPI.openPath(folder.path);
            }
        } catch (e) {
            console.error('Failed to open folder:', e);
        }
    };

    const totalPending = folders.reduce((acc, f) => acc + f.files.length, 0);
    const activeFolders = folders.filter(f => f.files.length > 0);

    if (isLoading) {
        return (
            <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-center py-4 text-zinc-500 text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Loading transfers...
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <ArrowDown className="w-4 h-4 text-cyan-400" />
                    Active Transfers
                </h4>
                <span className="text-xs text-zinc-600">
                    {totalPending} pending
                </span>
            </div>

            {activeFolders.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-zinc-600">
                    <CheckCircle2 className="w-5 h-5 mr-2 text-green-500/50" />
                    <span className="text-sm">All synced!</span>
                </div>
            ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {activeFolders.map(folder => (
                        <div key={folder.folderId} className="bg-zinc-800/50 rounded-lg p-3">
                            {/* Folder Header */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <FolderSync className={clsx(
                                        "w-4 h-4",
                                        folder.paused ? "text-zinc-500" : "text-yellow-500"
                                    )} />
                                    <span className="text-sm font-medium text-zinc-300">
                                        {folder.folderLabel}
                                    </span>
                                    {folder.paused && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-zinc-700 text-zinc-400 rounded">
                                            PAUSED
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => togglePauseFolder(folder.folderId, folder.paused)}
                                        disabled={pausingFolder === folder.folderId}
                                        className={clsx(
                                            "p-1.5 rounded-lg transition-colors",
                                            folder.paused
                                                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                : "bg-zinc-700 text-zinc-400 hover:text-yellow-400"
                                        )}
                                        title={folder.paused ? "Resume sync" : "Pause sync"}
                                    >
                                        {pausingFolder === folder.folderId ? (
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : folder.paused ? (
                                            <Play className="w-3.5 h-3.5" />
                                        ) : (
                                            <Pause className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => openInExplorer(folder.folderLabel)}
                                        className="p-1.5 rounded-lg bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                        title="Open in Explorer"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* File List */}
                            <div className="space-y-1">
                                {folder.files.slice(0, 5).map((file, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between py-1.5 px-2 rounded bg-zinc-900/50 text-xs"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <ArrowDown className="w-3 h-3 text-cyan-400 shrink-0" />
                                            <span className="text-zinc-400 truncate" title={file.name}>
                                                {file.name}
                                            </span>
                                        </div>
                                        <span className="text-zinc-600 shrink-0 ml-2">
                                            {formatBytes(file.size)}
                                        </span>
                                    </div>
                                ))}
                                {folder.files.length > 5 && (
                                    <p className="text-[10px] text-zinc-600 text-center py-1">
                                        +{folder.files.length - 5} more files
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
