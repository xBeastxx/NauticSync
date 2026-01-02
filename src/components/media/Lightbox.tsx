import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, ExternalLink, Music, Box } from 'lucide-react';
import type { MediaFile } from './MediaHub';
import { createPortal } from 'react-dom';

interface LightboxProps {
    file: MediaFile;
    files: MediaFile[];
    onClose: () => void;
    onNavigate: (file: MediaFile) => void;
    onDelete?: (file: MediaFile) => void;
}

export const Lightbox = ({ file, files, onClose, onNavigate, onDelete }: LightboxProps) => {
    const currentIndex = files.findIndex(f => f.id === file.id);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < files.length - 1;

    const handlePrev = useCallback(() => {
        if (hasPrev) onNavigate(files[currentIndex - 1]);
    }, [hasPrev, currentIndex, files, onNavigate]);

    const handleNext = useCallback(() => {
        if (hasNext) onNavigate(files[currentIndex + 1]);
    }, [hasNext, currentIndex, files, onNavigate]);

    const handleDelete = useCallback(() => {
        if (!onDelete) return;
        // MediaHub handles confirmation with versioning checks
        onDelete(file);
    }, [file, onDelete]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'Delete') handleDelete();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, handlePrev, handleNext, handleDelete]);

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center">
            {/* Top buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                {onDelete && (
                    <button
                        onClick={handleDelete}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-500 transition-colors"
                        title="Delete file (Del)"
                    >
                        <Trash2 className="w-6 h-6" />
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Navigation - Prev */}
            {hasPrev && (
                <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-white transition-colors z-10"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
            )}

            {/* Navigation - Next */}
            {hasNext && (
                <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-white transition-colors z-10"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            )}

            {/* Content */}
            <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center">
                {file.type === 'image' ? (
                    <img
                        src={`file://${file.path}`}
                        alt={file.name}
                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                    />
                ) : file.type === 'video' ? (
                    <div className="relative">
                        <video
                            src={`file://${file.path}`}
                            controls
                            autoPlay
                            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                        />
                    </div>
                ) : file.type === 'audio' ? (
                    <div className="bg-zinc-900/90 p-12 rounded-2xl flex flex-col items-center gap-6 border border-zinc-800 shadow-2xl backdrop-blur-md">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-900/20 flex items-center justify-center border border-green-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <Music className="w-16 h-16 text-green-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-1">{file.name}</h3>
                            <p className="text-zinc-500 text-sm uppercase tracking-wider">{file.extension.slice(1)} Audio</p>
                        </div>
                        <audio
                            src={`file://${file.path}`}
                            controls
                            autoPlay
                            className="w-full min-w-[300px]"
                        />
                    </div>
                ) : (
                    <div className="bg-zinc-900/90 p-12 rounded-2xl flex flex-col items-center gap-6 border border-zinc-800 shadow-2xl backdrop-blur-md">
                        <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-900/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                            <Box className="w-16 h-16 text-blue-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-1">{file.name}</h3>
                            <p className="text-zinc-500 text-sm uppercase tracking-wider">3D Model Preview Not Available</p>
                        </div>
                        <button
                            onClick={() => window.electronAPI.openPath(file.path)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-900/20 hover:-translate-y-0.5"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open in Default 3D Viewer
                        </button>
                    </div>
                )}

                {/* File info */}
                <div className="mt-4 flex items-center gap-4 text-zinc-400 text-sm">
                    <span className="font-medium text-white">{file.name}</span>
                    <span>{formatSize(file.size)}</span>
                    <span className="uppercase text-xs px-2 py-0.5 bg-zinc-800 rounded">
                        {file.extension.slice(1)}
                    </span>
                    <span className="text-zinc-600">
                        {currentIndex + 1} / {files.length}
                    </span>
                </div>
            </div>
        </div>,
        document.body
    );
};
