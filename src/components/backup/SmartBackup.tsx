import { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useRecoveryLogStore } from '../../store/recoveryLogStore';
import { Card } from '../ui/Card';
import { FileHistory } from './FileHistory';
import { BackupConfig } from './BackupConfig';
import { RecoveryLog } from './RecoveryLog';
import { Clock, FolderOpen, RefreshCw, Archive, HardDrive, History, Settings, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

export interface VersionedFile {
    id: string;
    originalName: string;
    originalPath: string;
    versionPath: string;
    timestamp: Date;
    size: number;
}

export const SmartBackup = () => {
    const { workflows, activeWorkflowId } = useWorkflowStore();
    const { addEntry } = useRecoveryLogStore();
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [versions, setVersions] = useState<VersionedFile[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [activeTab, setActiveTab] = useState<'history' | 'config' | 'recovered'>('history');

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
        if (!selectedFolder) return;
        setIsScanning(true);
        try {
            const files = await window.electronAPI.getFileVersions(selectedFolder);
            setVersions(files);
        } catch (err) {
            console.error('Failed to scan versions:', err);
            setVersions([]);
        } finally {
            setIsScanning(false);
        }
    };

    const handleRestore = async (version: VersionedFile) => {
        if (confirm(`Restore "${version.originalName}" to version from ${new Date(version.timestamp).toLocaleString()}?`)) {
            try {
                await window.electronAPI.restoreFileVersion(version.versionPath, version.originalPath);

                // Log the recovery
                addEntry({
                    fileName: version.originalName,
                    originalPath: version.originalPath,
                    size: version.size,
                });

                // Remove from versions list (it's now restored)
                setVersions(prev => prev.filter(v => v.id !== version.id));

                alert('File restored successfully! Check Recovery Log for history.');
            } catch (err) {
                console.error('Failed to restore:', err);
                alert('Failed to restore file');
            }
        }
    };

    const handleDeleteVersion = async (version: VersionedFile) => {
        if (confirm(`Are you sure you want to delete this backup version of "${version.originalName}"?`)) {
            try {
                await window.electronAPI.deleteFileVersion(version.versionPath);

                // Remove from versions list
                setVersions(prev => prev.filter(v => v.id !== version.id));
            } catch (err) {
                console.error('Failed to delete version:', err);
                alert('Failed to delete version');
            }
        }
    };

    // Group versions by original file name
    const groupedVersions = versions.reduce((acc, version) => {
        const key = version.originalPath;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(version);
        return acc;
    }, {} as Record<string, VersionedFile[]>);

    const uniqueFiles = Object.keys(groupedVersions).length;
    const totalVersions = versions.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            {/* Header - Title handled by AppLayout */}
            <div className="flex items-center justify-end">
                <button
                    onClick={handleScan}
                    disabled={isScanning || !selectedFolder}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={clsx("w-4 h-4", isScanning && "animate-spin")} />
                    Scan
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('history')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        activeTab === 'history'
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                            : "bg-zinc-800 text-zinc-400 hover:text-white"
                    )}
                >
                    <History className="w-4 h-4" />
                    File History
                </button>
                <button
                    onClick={() => setActiveTab('config')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        activeTab === 'config'
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400 hover:text-white"
                    )}
                >
                    <Settings className="w-4 h-4" />
                    Configure Backup
                </button>
                <button
                    onClick={() => setActiveTab('recovered')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        activeTab === 'recovered'
                            ? "bg-purple-500/10 text-purple-500 border border-purple-500/30"
                            : "bg-zinc-800 text-zinc-400 hover:text-white"
                    )}
                >
                    <RotateCcw className="w-4 h-4" />
                    Recovery Log
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
                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                                : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                        )}
                    >
                        <FolderOpen className="w-4 h-4" />
                        {folder.label}
                    </button>
                ))}
            </div>

            {/* Stats */}
            {versions.length > 0 && (
                <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg">
                        <Archive className="w-4 h-4" />
                        {uniqueFiles} files with history
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg">
                        <Clock className="w-4 h-4" />
                        {totalVersions} total versions
                    </span>
                </div>
            )}

            {/* Content */}
            {activeTab === 'history' ? (
                <>
                    {!selectedFolder ? (
                        <Card className="flex flex-col items-center justify-center p-12 text-zinc-500 border-dashed">
                            <FolderOpen className="w-12 h-12 text-zinc-600 mb-4" />
                            <h3 className="text-lg font-medium text-white">No Folder Selected</h3>
                            <p>Select a synced folder to view its backup history.</p>
                        </Card>
                    ) : versions.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center p-12 text-zinc-500 border-dashed">
                            <HardDrive className="w-12 h-12 text-zinc-600 mb-4" />
                            <h3 className="text-lg font-medium text-white">
                                {isScanning ? 'Scanning...' : 'No Backup History'}
                            </h3>
                            <p>{isScanning ? 'Looking for versioned files...' : 'No .stversions folder found. Enable versioning in Syncthing settings.'}</p>
                        </Card>
                    ) : (
                        <FileHistory
                            groupedVersions={groupedVersions}
                            onRestore={handleRestore}
                            onDelete={handleDeleteVersion}
                        />
                    )}
                </>
            ) : activeTab === 'config' ? (
                <BackupConfig folderPath={selectedFolder || ''} />
            ) : (
                <RecoveryLog />
            )}
        </div>
    );
};
