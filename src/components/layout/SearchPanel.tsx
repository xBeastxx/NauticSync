import { useState, useEffect, useCallback } from 'react';
import { Search, FileIcon, Folder, X, ExternalLink } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { formatBytes } from '../../lib/utils';

interface SearchResult {
    name: string;
    path: string;
    type: 'file' | 'folder';
    folder: string;
    size?: number;
    modified?: number;
}

interface SearchPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchPanel = ({ isOpen, onClose }: SearchPanelProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { workflows } = useWorkflowStore();

    // Get all folder paths from all workflows
    const allFolderPaths = workflows.flatMap(w => w.folders.map(f => f.path));

    const search = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const searchResults = await window.electronAPI.searchFiles(allFolderPaths, searchQuery);
            setResults(searchResults);
        } catch (err) {
            console.error('Search failed:', err);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [allFolderPaths]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            search(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    const openInExplorer = (path: string) => {
        window.electronAPI.openPath(path);
    };

    // Group results by folder
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.folder]) acc[result.folder] = [];
        acc[result.folder].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className="fixed left-[210px] top-0 h-full w-[400px] bg-zinc-900 border-r border-zinc-800 z-[100] flex flex-col shadow-2xl"
                style={{ WebkitAppRegion: 'no-drag' } as any}
            >
                {/* Header */}
                <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Search className="w-5 h-5 text-yellow-500" />
                            Global Search
                        </h2>
                        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
                            <button
                                onClick={onClose}
                                className="group relative p-2 rounded-full hover:bg-zinc-800 transition-all duration-200 cursor-pointer z-[9999]"
                                title="Close Search"
                            >
                                <X className="w-5 h-5 text-zinc-400 group-hover:text-red-500 transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search files and folders..."
                            autoFocus
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-yellow-500/50"
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isSearching ? (
                        <div className="flex items-center justify-center py-8 text-zinc-500">
                            <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mr-2" />
                            Searching...
                        </div>
                    ) : query.length < 2 ? (
                        <div className="text-center py-8 text-zinc-500">
                            <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Type at least 2 characters to search</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                            <p className="text-sm">No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(groupedResults).map(([folder, items]) => (
                                <div key={folder}>
                                    <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                                        {folder}
                                    </h3>
                                    <div className="space-y-1">
                                        {items.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 group cursor-pointer"
                                                onClick={() => openInExplorer(item.path)}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {item.type === 'folder' ? (
                                                        <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
                                                    ) : (
                                                        <FileIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                                                    )}
                                                    <span className="text-sm text-white truncate" title={item.path}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {item.size && (
                                                        <span className="text-xs text-zinc-500">
                                                            {formatBytes(item.size)}
                                                        </span>
                                                    )}
                                                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-zinc-800 text-xs text-zinc-500 text-center">
                    Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Esc</kbd> to close
                </div>
            </div>
        </>
    );
};
