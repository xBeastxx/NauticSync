import { Image as ImageIcon, Film, ChevronDown, ChevronRight, Check, EyeOff } from 'lucide-react';
import type { MediaFile } from './MediaHub';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface ThumbnailGridProps {
    files: MediaFile[];
    onSelect?: (file: MediaFile) => void;
    isSelectMode?: boolean;
    selectedFiles?: Set<string>;
    onToggleSelect?: (fileId: string) => void;
}

interface CategorySection {
    id: string;
    label: string;
    icon: typeof ImageIcon;
    files: MediaFile[];
    color: string;
}

const STORAGE_KEY = 'megasync-media-collapsed-sections';

export const ThumbnailGrid = ({ files, onSelect, isSelectMode, selectedFiles, onToggleSelect }: ThumbnailGridProps) => {
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
        // Load from localStorage on mount
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return new Set(JSON.parse(stored));
            }
        } catch {
            // Ignore errors
        }
        return new Set();
    });

    // Persist to localStorage when collapsed sections change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsedSections]));
        } catch {
            // Ignore storage errors
        }
    }, [collapsedSections]);

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const toggleSection = (id: string) => {
        setCollapsedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Group files by type
    const images = files.filter(f => f.type === 'image');
    const videos = files.filter(f => f.type === 'video');

    const categories: CategorySection[] = [
        { id: 'images', label: 'Photos', icon: ImageIcon, files: images, color: 'yellow' },
        { id: 'videos', label: 'Videos', icon: Film, files: videos, color: 'purple' },
    ].filter(cat => cat.files.length > 0);

    return (
        <div className="space-y-6">
            {categories.map((category) => {
                const Icon = category.icon;
                const isCollapsed = collapsedSections.has(category.id);

                return (
                    <div key={category.id}>
                        {/* Section Header */}
                        <button
                            onClick={() => toggleSection(category.id)}
                            className={clsx(
                                "flex items-center gap-2 mb-4 group",
                                category.color === 'yellow' && "text-yellow-500",
                                category.color === 'purple' && "text-purple-500"
                            )}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                            <Icon className="w-5 h-5" />
                            <span className="font-semibold">{category.label}</span>
                            <span className="text-zinc-500 text-sm ml-1">({category.files.length})</span>
                        </button>

                        {/* Grid */}
                        {!isCollapsed && (
                            <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
                                {category.files.map((file) => {
                                    const isSelected = selectedFiles?.has(file.id) || false;
                                    return (
                                        <button
                                            key={file.id}
                                            onClick={() => {
                                                if (isSelectMode && onToggleSelect) {
                                                    onToggleSelect(file.id);
                                                } else if (onSelect) {
                                                    onSelect(file);
                                                }
                                            }}
                                            className={clsx(
                                                "group relative aspect-square bg-zinc-900 rounded-xl overflow-hidden border transition-all hover:scale-[1.02] focus:outline-none",
                                                isSelectMode && isSelected
                                                    ? "border-red-500 ring-2 ring-red-500/50"
                                                    : "border-zinc-800 hover:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/50"
                                            )}
                                        >
                                            {/* Selection checkbox */}
                                            {isSelectMode && (
                                                <div className={clsx(
                                                    "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-colors",
                                                    isSelected
                                                        ? "bg-red-500 text-white"
                                                        : "bg-black/50 text-white border border-white/30"
                                                )}>
                                                    {isSelected && <Check className="w-4 h-4" />}
                                                </div>
                                            )}

                                            {file.type === 'image' ? (
                                                <img
                                                    src={`file://${file.path}`}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                                    <Film className="w-12 h-12 text-zinc-600" />
                                                </div>
                                            )}

                                            {/* Ignored Indicator */}
                                            {file.isIgnored && (
                                                <div className="absolute top-2 right-2 bg-zinc-950/80 backdrop-blur-sm p-1.5 rounded-lg border border-red-500/20 shadow-lg z-10 text-red-400 group/ignore">
                                                    <EyeOff className="w-3.5 h-3.5" />
                                                    <div className="absolute right-0 top-full mt-2 hidden group-hover/ignore:block bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 p-2 rounded-lg whitespace-nowrap z-50 shadow-xl">
                                                        Ignored (Not syncing)
                                                    </div>
                                                </div>
                                            )}

                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                                                    {file.type === 'image' ? (
                                                        <ImageIcon className="w-3 h-3" />
                                                    ) : (
                                                        <Film className="w-3 h-3" />
                                                    )}
                                                    <span className="truncate">{file.name}</span>
                                                </div>
                                                <span className="text-zinc-400 text-[10px]">{formatSize(file.size)}</span>
                                            </div>

                                            {/* Video Badge */}
                                            {file.type === 'video' && (
                                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[10px] font-bold text-white uppercase">
                                                    {file.extension.slice(1)}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
