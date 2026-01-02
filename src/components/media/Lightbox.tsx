import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
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
                ) : (
                    <div className="relative">
                        <video
                            src={`file://${file.path}`}
                            controls
                            autoPlay
                            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                        />
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
