import { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useBackupStore } from '../../store/backupStore';
import { Card } from '../ui/Card';
import { ThumbnailGrid } from './ThumbnailGrid';
import { Lightbox } from './Lightbox';
import { DuplicateFinder } from './DuplicateFinder';
import { Image, FolderOpen, RefreshCw, Grid3X3, Search, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface MediaFile {
    id: string;
    path: string;
    name: string;
    type: 'image' | 'video' | 'audio' | 'model';
    extension: string;
    size: number;
    modifiedTime: Date;
    isIgnored?: boolean;
}

export const MediaHub = () => {
    const { workflows, activeWorkflowId } = useWorkflowStore();
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lightboxFile, setLightboxFile] = useState<MediaFile | null>(null);
    const [activeTab, setActiveTab] = useState<'explorer' | 'duplicates'>('explorer');
    const [viewOptions, setViewOptions] = useState<{
        groupBy: 'type' | 'date' | 'none';
        sortBy: 'date' | 'name' | 'size';
    }>({
        groupBy: 'type',
        sortBy: 'date'
    });

    // Selection mode for multi-delete
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

    const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);
    const folders = activeWorkflow?.folders || [];

    useEffect(() => {
        if (folders.length > 0 && !selectedFolder) {
            setSelectedFolder(folders[0].path);
        }
    }, [folders, selectedFolder]);

    useEffect(() => {
        if (selectedFolder) {
            handleScan();
        }
    }, [selectedFolder]);

    const handleScan = async () => {
        if (!selectedFolder || !activeWorkflow) return;
        setIsScanning(true);
        try {
            // Find current folder rules
            const currentFolder = activeWorkflow.folders.find(f => f.path === selectedFolder);
            // Transform rules to simple pattern strings for glob matching
            // Note: GranularSelector stores them as relative paths
            const ignorePatterns = currentFolder?.rules
                .filter(r => r.type === 'exclude')
                .map(r => r.pattern) || [];

            const files = await window.electronAPI.scanMedia(selectedFolder, ignorePatterns);
            setMediaFiles(files);
        } catch (err) {
            console.error('Failed to scan media:', err);
            setMediaFiles([]);
        } finally {
            setIsScanning(false);
        }
    };

    const { isVersioningEnabled, getFolderConfig } = useBackupStore();

    const handleDelete = async (file: MediaFile) => {
        const hasVersioning = selectedFolder ? isVersioningEnabled(selectedFolder) : false;
        const config = selectedFolder ? getFolderConfig(selectedFolder) : null;

        if (!config) {
            // Not configured yet
            const setupFirst = confirm(
                `⚠️ Backup not configured for this folder.\n\n` +
                `"${file.name}" will be permanently deleted.\n\n` +
                `Do you want to proceed? (We recommend configuring backup first in Smart Backup tab)`
            );
            if (!setupFirst) return;
        } else if (hasVersioning) {
            // Versioning enabled - file is recoverable
            const proceed = confirm(
                `🔄 "${file.name}" will be moved to .stversions.\n\n` +
                `You can restore it later from Smart Backup > File History.\n` +
                `(Versions kept for ${config.keepDays} days)\n\n` +
                `Continue?`
            );
            if (!proceed) return;
        } else {
            // Versioning explicitly disabled
            const proceed = confirm(
                `⚠️ "${file.name}" will be permanently deleted.\n\n` +
                `This action cannot be undone.\n\n` +
                `Continue?`
            );
            if (!proceed) return;
        }

        try {
            // Use backup-aware delete if versioning is configured
            if (hasVersioning && selectedFolder) {
                await window.electronAPI.deleteFileWithBackup(file.path, selectedFolder);
            } else {
                await window.electronAPI.deleteFile(file.path);
            }
            // Remove from local state
            setMediaFiles(prev => prev.filter(f => f.id !== file.id));
            // Close lightbox if currently viewing deleted file
            if (lightboxFile?.id === file.id) {
                setLightboxFile(null);
            }
        } catch (err) {
            console.error('Failed to delete file:', err);
            alert('Failed to delete file. It may be in use or protected.');
        }
    };

    const imageCount = mediaFiles.filter(f => f.type === 'image').length;
    const videoCount = mediaFiles.filter(f => f.type === 'video').length;
    const audioCount = mediaFiles.filter(f => f.type === 'audio').length;
    const modelCount = mediaFiles.filter(f => f.type === 'model').length;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                {/* View Controls */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <div className="p-1 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-1">
                        <span className="text-xs text-zinc-500 font-medium px-2">Group:</span>
                        {(['type', 'date', 'none'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewOptions(prev => ({ ...prev, groupBy: mode }))}
                                className={clsx(
                                    "px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors",
                                    viewOptions.groupBy === mode
                                        ? "bg-zinc-800 text-white shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    <div className="p-1 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-1">
                        <span className="text-xs text-zinc-500 font-medium px-2">Sort:</span>
                        {(['date', 'name', 'size'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewOptions(prev => ({ ...prev, sortBy: mode }))}
                                className={clsx(
                                    "px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors",
                                    viewOptions.sortBy === mode
                                        ? "bg-zinc-800 text-white shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                    {isSelectMode ? (
                        <>
                            <span className="text-sm text-zinc-400 mr-2">
                                {selectedFiles.size} selected
                            </span>
                            <button
                                onClick={async () => {
                                    if (selectedFiles.size === 0) {
                                        alert('Select files to delete first');
                                        return;
                                    }
                                    const filesToDelete = mediaFiles.filter(f => selectedFiles.has(f.id));
                                    for (const file of filesToDelete) {
                                        await handleDelete(file);
                                    }
                                    setSelectedFiles(new Set());
                                    setIsSelectMode(false);
                                }}
                                disabled={selectedFiles.size === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete ({selectedFiles.size})
                            </button>
                            <button
                                onClick={() => {
                                    setIsSelectMode(false);
                                    setSelectedFiles(new Set());
                                }}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsSelectMode(true)}
                                disabled={mediaFiles.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                            <button
                                onClick={handleScan}
                                disabled={isScanning || !selectedFolder}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={clsx("w-4 h-4", isScanning && "animate-spin")} />
                                Scan
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('explorer')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        activeTab === 'explorer'
                            ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                            : "bg-zinc-800 text-zinc-400 hover:text-white"
                    )}
                >
                    <Grid3X3 className="w-4 h-4" />
                    Explorer
                </button>
                <button
                    onClick={() => setActiveTab('duplicates')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        activeTab === 'duplicates'
                            ? "bg-orange-500/10 text-orange-500 border border-orange-500/30"
                            : "bg-zinc-800 text-zinc-400 hover:text-white"
                    )}
                >
                    <Search className="w-4 h-4" />
                    Find Duplicates
                </button>
            </div>

            {/* Folder Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {folders.map(folder => (
                    <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder.path)}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0",
                            selectedFolder === folder.path
                                ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                                : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                        )}
                    >
                        <FolderOpen className="w-4 h-4" />
                        {folder.label}
                    </button>
                ))}
            </div>

            {/* Stats */}
            {mediaFiles.length > 0 && (
                <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                    <span>{imageCount} images</span>
                    <span>{videoCount} videos</span>
                    {audioCount > 0 && <span>{audioCount} audio</span>}
                    {modelCount > 0 && <span>{modelCount} models</span>}
                    <span className="text-zinc-400 border-l border-zinc-800 pl-4">{mediaFiles.length} total</span>
                </div>
            )}

            {/* Content */}
            {activeTab === 'explorer' ? (
                <>
                    {!selectedFolder ? (
                        <Card className="flex flex-col items-center justify-center p-12 text-zinc-500 border-dashed">
                            <FolderOpen className="w-12 h-12 text-zinc-600 mb-4" />
                            <h3 className="text-lg font-medium text-white">No Folder Selected</h3>
                            <p>Select a synced folder to browse its media files.</p>
                        </Card>
                    ) : mediaFiles.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center p-12 text-zinc-500 border-dashed">
                            <Image className="w-12 h-12 text-zinc-600 mb-4" />
                            <h3 className="text-lg font-medium text-white">
                                {isScanning ? 'Scanning...' : 'No Media Found'}
                            </h3>
                            <p>{isScanning ? 'Looking for images and videos...' : 'This folder contains no media files.'}</p>
                        </Card>
                    ) : (
                        <ThumbnailGrid
                            files={mediaFiles}
                            viewOptions={viewOptions}
                            onSelect={isSelectMode ? undefined : setLightboxFile}
                            isSelectMode={isSelectMode}
                            selectedFiles={selectedFiles}
                            onToggleSelect={(fileId: string) => {
                                setSelectedFiles(prev => {
                                    const next = new Set(prev);
                                    if (next.has(fileId)) {
                                        next.delete(fileId);
                                    } else {
                                        next.add(fileId);
                                    }
                                    return next;
                                });
                            }}
                        />
                    )}
                </>
            ) : (
                <DuplicateFinder folderPath={selectedFolder} />
            )}

            {/* Lightbox */}
            {lightboxFile && (
                <Lightbox
                    file={lightboxFile}
                    files={mediaFiles}
                    onClose={() => setLightboxFile(null)}
                    onNavigate={setLightboxFile}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
};
