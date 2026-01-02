import { useState } from 'react';
import type { MediaFile } from './MediaHub';
import { Card } from '../ui/Card';
import { Search, Copy, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface DuplicateFinderProps {
    folderPath: string | null;
}

export const DuplicateFinder = ({ folderPath }: DuplicateFinderProps) => {
    const [duplicateGroups, setDuplicateGroups] = useState<MediaFile[][]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [hasScanned, setHasScanned] = useState(false);

    const handleScan = async () => {
        if (!folderPath) return;
        setIsScanning(true);
        setHasScanned(false);
        try {
            const groups = await window.electronAPI.findDuplicates(folderPath);
            setDuplicateGroups(groups);
            setHasScanned(true);
        } catch (err) {
            console.error('Failed to find duplicates:', err);
            setDuplicateGroups([]);
        } finally {
            setIsScanning(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const totalDuplicates = duplicateGroups.reduce((acc, group) => acc + group.length - 1, 0);
    const potentialSavings = duplicateGroups.reduce((acc, group) => {
        return acc + (group.length - 1) * (group[0]?.size || 0);
    }, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-white">Duplicate Finder</h3>
                    <p className="text-sm text-zinc-500">Scan for duplicate files based on content hash.</p>
                </div>
                <button
                    onClick={handleScan}
                    disabled={isScanning || !folderPath}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                        isScanning
                            ? "bg-zinc-800 text-zinc-500 cursor-wait"
                            : "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20"
                    )}
                >
                    <Search className={clsx("w-4 h-4", isScanning && "animate-pulse")} />
                    {isScanning ? 'Scanning...' : 'Find Duplicates'}
                </button>
            </div>

            {hasScanned && duplicateGroups.length === 0 && (
                <Card className="flex flex-col items-center justify-center p-8 text-zinc-500 border-dashed">
                    <Copy className="w-10 h-10 text-emerald-500 mb-3" />
                    <h4 className="text-white font-medium">No Duplicates Found</h4>
                    <p className="text-sm">All files in this folder are unique.</p>
                </Card>
            )}

            {duplicateGroups.length > 0 && (
                <>
                    <div className="flex gap-4 text-sm">
                        <span className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-lg">
                            {duplicateGroups.length} duplicate groups
                        </span>
                        <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg">
                            {totalDuplicates} redundant files
                        </span>
                        <span className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg">
                            {formatSize(potentialSavings)} potential savings
                        </span>
                    </div>

                    <div className="space-y-4">
                        {duplicateGroups.map((group, groupIndex) => (
                            <Card key={groupIndex} className="border-orange-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-medium text-white">
                                        {group.length} identical files ({formatSize(group[0]?.size || 0)} each)
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {group.map((file, fileIndex) => (
                                        <div
                                            key={file.id}
                                            className={clsx(
                                                "flex items-center justify-between p-2 rounded-lg text-sm",
                                                fileIndex === 0 ? "bg-emerald-500/10" : "bg-zinc-800/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                {fileIndex === 0 && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-500 rounded">
                                                        KEEP
                                                    </span>
                                                )}
                                                <span className="truncate text-zinc-300" title={file.path}>
                                                    {file.name}
                                                </span>
                                            </div>
                                            <span className="text-zinc-600 text-xs shrink-0 ml-2" title={file.path}>
                                                {file.path.split(/[\\/]/).slice(-2, -1)[0]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
