import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder as FolderIcon, CheckSquare, Square, FileText } from 'lucide-react';
import { clsx } from 'clsx';

interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
}

interface GranularSelectorProps {
    rootPath: string;
    initialPatterns?: string[];
    onPatternsChange: (patterns: string[]) => void;
    className?: string;
}

export const GranularSelector = ({ rootPath, initialPatterns = [], onPatternsChange, className }: GranularSelectorProps) => {
    // ... (state initialization remains same)
    // We track IGNORED paths (Blacklist approach)
    // If a path is in this set, it is unchecked (ignored).
    // Note: initialPatterns are assumed to be RELATIVE. We generally work with absolute in this component 
    // but for now, let's assume specific logic in parent or simpler absolute handling.
    // Actually, store keeps RELATIVE patterns. GranularSelector works with ABSOLUTE.
    // We need to re-construct absolute paths from relative patterns if possible, OR
    // just stick to one convention.
    // Given the complexity, let's assume the parent passes ABSOLUTE paths for now if possible,
    // or we reconstruct them properly. for this MVP, I will assume patterns passed here match what togglePath uses.

    // Correction: AddFolderWizard logic creates relative patterns: p.replace(path, '').
    // So store has RELATIVE paths. GranularSelector uses fullPath.
    // We need to map relative -> absolute for initial state.

    const [ignoredPaths, setIgnoredPaths] = useState<Set<string>>(() => {
        const set = new Set<string>();
        initialPatterns.forEach(p => {
            // Reconstruct absolute path if it is relative
            // checking if p is already absolute (contains rootPath) or not.
            if (p.includes(rootPath)) {
                set.add(p);
            } else {
                // best guess reconstruction for windows
                set.add(`${rootPath}\\${p}`.replace(/[\/]/g, '\\'));
            }
        });
        return set;
    });

    // Toggle exclusion
    const togglePath = (path: string) => {
        const newIgnored = new Set(ignoredPaths);
        if (newIgnored.has(path)) {
            newIgnored.delete(path);
        } else {
            newIgnored.add(path);
        }
        setIgnoredPaths(newIgnored);

        // Convert strict paths to relative patterns for .stignore
        // For now, we just pass absolute paths, but we need to relativize them later
        onPatternsChange(Array.from(newIgnored));
    };

    return (
        <div className={clsx("flex flex-col min-h-0 overflow-hidden", className)}>
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between shrink-0">
                <span className="text-sm font-medium text-zinc-300">Select files to sync</span>
                <span className="text-xs text-zinc-500">{ignoredPaths.size} items ignored</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
                <FileTreeItem
                    name={rootPath.split('\\').pop() || rootPath}
                    fullPath={rootPath}
                    isDirectory={true}
                    level={0}
                    ignoredPaths={ignoredPaths}
                    onToggle={togglePath}
                />
            </div>
        </div>
    );
};

interface FileTreeItemProps {
    name: string;
    fullPath: string;
    isDirectory: boolean;
    level: number;
    ignoredPaths: Set<string>;
    onToggle: (path: string) => void;
}

const FileTreeItem = ({ name, fullPath, isDirectory, level, ignoredPaths, onToggle }: FileTreeItemProps) => {
    const [isExpanded, setIsExpanded] = useState(level === 0); // Always expand root
    const [children, setChildren] = useState<FileEntry[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const isIgnored = ignoredPaths.has(fullPath);

    // Simple indentation
    const paddingLeft = level * 20;

    const fetchChildren = async () => {
        if (!children && !isLoading) {
            setIsLoading(true);
            try {
                const items = await window.electronAPI.readDirectory(fullPath);
                setChildren(items);
            } catch (err) {
                console.error("Failed to read dir", err);
                setChildren([]); // Empty on error to stop infinite loading
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Auto-fetch if initially expanded (e.g. root)
    useEffect(() => {
        if (isExpanded && !children) {
            fetchChildren();
        }
    }, [isExpanded, children]);

    const handleExpand = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isDirectory) return;

        if (!isExpanded) {
            fetchChildren();
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <div>
            <div
                className={clsx(
                    "flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer select-none transition-colors",
                    isIgnored && "opacity-50"
                )}
                style={{ paddingLeft: `${paddingLeft + 8}px` }}
                onClick={() => onToggle(fullPath)}
            >
                {/* Expand Toggle */}
                {isDirectory ? (
                    <div
                        onClick={handleExpand}
                        className="p-0.5 rounded hover:bg-zinc-700 text-zinc-400"
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                ) : (
                    <div className="w-5" /> // Spacer
                )}

                {/* Checkbox */}
                <div className={clsx("text-zinc-400", isIgnored ? "text-zinc-600" : "text-yellow-500")}>
                    {isIgnored ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                </div>

                {/* Icon & Name */}
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                    {isDirectory ? <FolderIcon className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-zinc-500" />}
                    <span className="truncate">{name}</span>
                </div>
            </div>

            {/* Children */}
            {isExpanded && isDirectory && (
                <div>
                    {isLoading ? (
                        <div className="pl-12 py-1 text-xs text-zinc-600 animate-pulse">Loading...</div>
                    ) : children ? (
                        children.map((child) => (
                            <FileTreeItem
                                key={child.path}
                                name={child.name}
                                fullPath={child.path}
                                isDirectory={child.isDirectory}
                                level={level + 1}
                                ignoredPaths={ignoredPaths}
                                onToggle={onToggle}
                            />
                        ))
                    ) : (
                        <div className="pl-12 py-1 text-xs text-zinc-600 italic">Empty</div>
                    )}
                </div>
            )}
        </div>
    );
};
