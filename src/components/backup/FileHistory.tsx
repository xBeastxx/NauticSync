import { Clock, RotateCcw, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import type { VersionedFile } from './SmartBackup';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Card } from '../ui/Card';
import { formatDistanceToNow } from 'date-fns';

interface FileHistoryProps {
    groupedVersions: Record<string, VersionedFile[]>;
    onRestore: (version: VersionedFile) => void;
}

export const FileHistory = ({ groupedVersions, onRestore }: FileHistoryProps) => {
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

    const toggleFile = (path: string) => {
        setExpandedFiles(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileName = (path: string) => {
        return path.split(/[\\/]/).pop() || path;
    };

    const getRelativePath = (path: string) => {
        const parts = path.split(/[\\/]/);
        return parts.slice(-3, -1).join('/');
    };

    return (
        <div className="space-y-3">
            {Object.entries(groupedVersions).map(([originalPath, versions]) => {
                const isExpanded = expandedFiles.has(originalPath);
                const fileName = getFileName(originalPath);
                const relativePath = getRelativePath(originalPath);

                return (
                    <Card key={originalPath} className="overflow-hidden">
                        {/* File Header */}
                        <button
                            onClick={() => toggleFile(originalPath)}
                            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 text-left">
                                    <h4 className="font-medium text-white truncate">{fileName}</h4>
                                    <p className="text-xs text-zinc-500 truncate">{relativePath}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                                <span className="text-sm text-zinc-500">
                                    {versions.length} version{versions.length > 1 ? 's' : ''}
                                </span>
                                {isExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-zinc-500" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                                )}
                            </div>
                        </button>

                        {/* Version Timeline */}
                        {isExpanded && (
                            <div className="border-t border-zinc-800 bg-zinc-900/50">
                                {versions.map((version, index) => (
                                    <div
                                        key={version.id}
                                        className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className={clsx(
                                                    "w-3 h-3 rounded-full",
                                                    index === 0 ? "bg-blue-500" : "bg-zinc-600"
                                                )} />
                                                {index < versions.length - 1 && (
                                                    <div className="absolute top-3 left-1/2 w-0.5 h-8 bg-zinc-700 -translate-x-1/2" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span className="text-white">
                                                        {formatDistanceToNow(new Date(version.timestamp))} ago
                                                    </span>
                                                    {index === 0 && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-500 rounded">
                                                            LATEST
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                                                    <span>{new Date(version.timestamp).toLocaleString()}</span>
                                                    <span>{formatSize(version.size)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRestore(version)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Restore
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
};
