import { useRecoveryLogStore } from '../../store/recoveryLogStore';
import { Card } from '../ui/Card';
import { RotateCcw, Trash2, FileCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const RecoveryLog = () => {
    const { entries, clearEntries } = useRecoveryLogStore();

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (entries.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center p-12 text-zinc-500 border-dashed">
                <FileCheck className="w-12 h-12 text-zinc-600 mb-4" />
                <h3 className="text-lg font-medium text-white">No Recovery History</h3>
                <p>Restored files will appear here for reference.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-500">
                    <RotateCcw className="w-5 h-5" />
                    <span className="font-medium">{entries.length} recovered file{entries.length !== 1 ? 's' : ''}</span>
                </div>
                <button
                    onClick={() => {
                        if (confirm('Clear all recovery logs? This only removes the log entries, not the actual files.')) {
                            clearEntries();
                        }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear Logs
                </button>
            </div>

            {/* List */}
            <div className="space-y-2">
                {entries.map((entry) => (
                    <Card key={entry.id} className="flex items-center justify-between p-3 bg-emerald-500/5 border-emerald-500/20">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0">
                                <FileCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-medium text-white truncate">{entry.fileName}</h4>
                                <p className="text-xs text-zinc-500 truncate">{entry.originalPath}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 text-sm text-zinc-500">
                            <span>{formatSize(entry.size)}</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDistanceToNow(new Date(entry.recoveredAt))} ago
                            </span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
