import { useState, useEffect } from 'react';
import { Folder, File, ArrowLeft, ArrowRight, ArrowUp, X, HardDrive, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { clsx } from 'clsx';

interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modifiedTime: Date;
}

interface FileExplorerProps {
    initialPath: string;
    onClose: () => void;
}

export const FileExplorer = ({ initialPath, onClose }: FileExplorerProps) => {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [future, setFuture] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileEntry } | null>(null);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [renameTarget, setRenameTarget] = useState<FileEntry | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const loadDirectory = async (path: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const entries = await window.electronAPI.readDirectory(path);
            setFiles(entries);
        } catch (err) {
            console.error('Failed to load directory:', err);
            setError('Failed to load directory. Access denied or path invalid.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDirectory(currentPath);
    }, [currentPath]);

    // Close menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleNavigate = (path: string) => {
        setHistory(prev => [...prev, currentPath]);
        setFuture([]); // Clear future when navigating to a new path
        setCurrentPath(path);
        setSelectedPath(null);
    };

    const handleBack = () => {
        if (history.length > 0) {
            const newHistory = [...history];
            const prevPath = newHistory.pop()!;
            setHistory(newHistory);
            setFuture(prev => [currentPath, ...prev]);
            setCurrentPath(prevPath);
        }
    };

    const handleForward = () => {
        if (future.length > 0) {
            const newFuture = [...future];
            const nextPath = newFuture.shift()!;
            setFuture(newFuture);
            setHistory(prev => [...prev, currentPath]);
            setCurrentPath(nextPath);
        }
    };

    const handleUp = () => {
        const parent = currentPath.split(/[\\/]/).slice(0, -1).join('\\') || currentPath;
        if (parent !== currentPath) {
            handleNavigate(parent);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '--';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
    };

    const handleRenameSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!renameTarget || !renameValue.trim() || renameValue === renameTarget.name) {
            setRenameTarget(null);
            return;
        }

        try {
            // Construct new path preserving the directory
            // We assume Windows backslashes based on currentPath, but we should be robust
            const separator = currentPath.includes('/') ? '/' : '\\';
            const newPath = `${currentPath}${separator}${renameValue.trim()}`;

            await window.electronAPI.rename(renameTarget.path, newPath);
            loadDirectory(currentPath);
        } catch (err) {
            console.error('Rename failed:', err);
            alert(`Failed to rename: ${err}`);
        } finally {
            setRenameTarget(null);
        }
    };

    const handleItemClick = (file: FileEntry) => {
        setSelectedPath(file.path);
    };

    const handleItemDoubleClick = async (file: FileEntry) => {
        if (file.isDirectory) {
            handleNavigate(file.path);
        } else {
            await window.electronAPI.openPath(file.path);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, file: FileEntry) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedPath(file.path);
        setContextMenu({ x: e.clientX, y: e.clientY, file });
    };

    const handleAction = async (action: 'open' | 'system' | 'copy' | 'rename' | 'delete') => {
        if (!contextMenu) return;
        const { file } = contextMenu;
        setContextMenu(null);

        try {
            switch (action) {
                case 'open':
                    if (file.isDirectory) {
                        handleNavigate(file.path);
                    } else {
                        await window.electronAPI.openPath(file.path);
                    }
                    break;
                case 'system':
                    await window.electronAPI.showInFolder(file.path);
                    break;
                case 'copy':
                    await window.electronAPI.writeClipboard(file.path);
                    // Could add a toast here, for now relying on no-error means success
                    break;
                case 'rename':
                    setRenameValue(file.name);
                    setRenameTarget(file);
                    break;
                case 'delete':
                    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
                        await window.electronAPI.trashItem(file.path);
                        loadDirectory(currentPath);
                    }
                    break;
            }
        } catch (err) {
            console.error(`Action ${action} failed:`, err);
            alert(`Failed to perform action: ${err}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Expanded Container */}
            <div className="w-[95vw] max-w-[1800px] h-[90vh] flex flex-col p-0 overflow-hidden bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-1 text-zinc-400">
                            <button
                                onClick={handleBack}
                                disabled={history.length === 0}
                                className="p-1.5 hover:bg-zinc-800 rounded-lg disabled:opacity-30 transition-colors"
                                title="Back"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleForward}
                                disabled={future.length === 0}
                                className="p-1.5 hover:bg-zinc-800 rounded-lg disabled:opacity-30 transition-colors"
                                title="Forward"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-zinc-800 mx-1" />
                            <button
                                onClick={handleUp}
                                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                                title="Up to parent folder"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/50 rounded-lg border border-zinc-800 flex-1 overflow-hidden font-mono text-xs text-zinc-300">
                            <HardDrive className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500" />
                            <span className="truncate" title={currentPath}>
                                {currentPath}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 pl-2 border-l border-zinc-800/50">
                        <div className="flex bg-zinc-950/50 rounded-lg p-0.5 border border-zinc-800/50 mr-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={clsx("p-1.5 rounded transition-all", viewMode === 'grid' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={clsx("p-1.5 rounded transition-all", viewMode === 'list' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => loadDirectory(currentPath)}
                            className={clsx("p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors", isLoading && "animate-spin")}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 bg-zinc-950/30 min-h-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2">
                            <span className="font-medium">Error</span>
                            <span className="text-sm">{error}</span>
                        </div>
                    ) : (
                        <div className="min-h-full">
                            {viewMode === 'list' ? (
                                <div className="grid grid-cols-1 auto-rows-min min-h-full content-start">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50 mb-2 sticky top-0 bg-zinc-900/95 backdrop-blur z-10 shadow-sm">
                                        <span className="w-5"></span>
                                        <span>Name</span>
                                        <span className="w-24 text-right">Size</span>
                                        <span className="w-36 text-right">Modified</span>
                                    </div>

                                    {files.length === 0 && !isLoading ? (
                                        <div className="py-12 text-center text-zinc-600 text-sm flex flex-col items-center gap-2">
                                            <Folder className="w-8 h-8 opacity-20" />
                                            <span>Empty folder</span>
                                        </div>
                                    ) : (
                                        files.map((file) => (
                                            <div
                                                key={file.path}
                                                onClick={() => handleItemClick(file)}
                                                onDoubleClick={() => handleItemDoubleClick(file)}
                                                onContextMenu={(e) => handleContextMenu(e, file)}
                                                className={clsx(
                                                    "grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 items-center rounded-lg border border-transparent transition-all group select-none hover:bg-zinc-800/30",
                                                    selectedPath === file.path ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "text-zinc-400",
                                                    contextMenu?.file.path === file.path && "bg-zinc-800/60 border-zinc-700"
                                                )}
                                            >
                                                <div className="w-5 flex justify-center">
                                                    {file.isDirectory ? (
                                                        <Folder className="w-4 h-4 text-yellow-500/80 group-hover:text-yellow-400" />
                                                    ) : (
                                                        <File className="w-4 h-4 text-blue-500/80 group-hover:text-blue-400" />
                                                    )}
                                                </div>
                                                <span className="truncate font-medium text-sm">{file.name}</span>
                                                <span className="text-xs text-right font-mono tabular-nums opacity-60">
                                                    {file.isDirectory ? '--' : formatSize(file.size)}
                                                </span>
                                                <span className="text-xs text-right font-mono tabular-nums opacity-60">
                                                    {formatDate(file.modifiedTime)}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                // Grid View
                                <div className="p-2 min-h-full">
                                    {files.length === 0 && !isLoading ? (
                                        <div className="py-24 text-center text-zinc-600 text-sm flex flex-col items-center gap-3">
                                            <Folder className="w-12 h-12 opacity-20" />
                                            <span>Empty folder</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 content-start">
                                            {files.map((file) => (
                                                <div
                                                    key={file.path}
                                                    onClick={() => handleItemClick(file)}
                                                    onDoubleClick={() => handleItemDoubleClick(file)}
                                                    onContextMenu={(e) => handleContextMenu(e, file)}
                                                    className={clsx(
                                                        "flex flex-col items-center gap-2 p-3 rounded-xl border border-transparent transition-all group select-none relative aspect-[10/9]",
                                                        selectedPath === file.path ? "bg-zinc-800 border-zinc-700 shadow-sm" : "hover:bg-zinc-800/30",
                                                        contextMenu?.file.path === file.path && "bg-zinc-800/60 border-zinc-700"
                                                    )}
                                                >
                                                    <div className={clsx(
                                                        "w-12 h-12 flex items-center justify-center rounded-xl shadow-inner",
                                                        file.isDirectory ? "bg-yellow-500/10" : "bg-blue-500/10"
                                                    )}>
                                                        {file.isDirectory ? (
                                                            <Folder className="w-7 h-7 text-yellow-500/80 group-hover:text-yellow-400 transition-colors" />
                                                        ) : (
                                                            <File className="w-7 h-7 text-blue-500/80 group-hover:text-blue-400 transition-colors" />
                                                        )}
                                                    </div>
                                                    <span className="text-center text-xs font-medium truncate w-full px-1" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                    <span className="text-center text-[10px] text-zinc-600 font-mono w-full truncate">
                                                        {file.isDirectory ? 'FOLDER' : formatSize(file.size)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center text-xs text-zinc-500 px-4">
                    <span>{files.length} items</span>
                    <span>{files.filter(f => !f.isDirectory).reduce((acc, f) => acc + f.size, 0) > 0 ? formatSize(files.filter(f => !f.isDirectory).reduce((acc, f) => acc + f.size, 0)) : ''}</span>
                </div>
            </div>

            {/* Rename Modal */}
            {renameTarget && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-[1px] animate-in fade-in duration-200" onClick={() => setRenameTarget(null)}>
                    <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-2xl w-full max-w-sm flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-medium text-white">Rename Item</h3>
                        <form onSubmit={handleRenameSubmit} className="flex flex-col gap-4">
                            <input
                                autoFocus
                                type="text"
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                placeholder="Enter new name"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRenameTarget(null)}
                                    className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-colors font-medium"
                                >
                                    Rename
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Context Menu Portal */}
            {contextMenu && (
                <div
                    className="fixed z-[100] bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="py-1">
                        <button onClick={() => handleAction('open')} className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2">
                            {contextMenu.file.isDirectory ? <Folder className="w-3.5 h-3.5" /> : <File className="w-3.5 h-3.5" />}
                            Open
                        </button>
                        <button onClick={() => handleAction('system')} className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2">
                            <HardDrive className="w-3.5 h-3.5" />
                            Show in Explorer
                        </button>
                        <div className="h-px bg-zinc-700 my-1 font-bold" />
                        <button onClick={() => handleAction('copy')} className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2">
                            Copy Path
                        </button>
                        <button onClick={() => handleAction('rename')} className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2">
                            Rename
                        </button>
                        <div className="h-px bg-zinc-700 my-1" />
                        <button onClick={() => handleAction('delete')} className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                            <X className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
