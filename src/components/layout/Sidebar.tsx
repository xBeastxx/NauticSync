import { useState, useEffect } from 'react';
import { useNavigationStore, type AppModule } from '../../store/navigationStore';
import { LayoutDashboard, Image, Archive, Settings, Activity, ChevronLeft, ChevronRight, Search, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SearchPanel } from './SearchPanel';

export const Sidebar = () => {
    const { activeModule, setActiveModule } = useNavigationStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const mainNavItems: { id: AppModule; label: string; icon: React.ComponentType<any> }[] = [
        { id: 'sync', label: 'Sync Center', icon: LayoutDashboard },
        { id: 'media', label: 'Media Hub', icon: Image },
        { id: 'backup', label: 'Smart Backup', icon: Archive },
        { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
    ];

    return (
        <>
            <SearchPanel isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <aside className={clsx(
                "h-full bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 ease-in-out relative",
                isCollapsed ? "w-16" : "w-64"
            )}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-zinc-800 border-y border-l border-zinc-700 border-r-0 text-zinc-400 hover:text-white p-1 pl-1.5 rounded-l-lg shadow-md z-10 hover:bg-zinc-700 transition-colors"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>

                {/* Header / Brand */}
                <div className={clsx("p-6 flex items-center gap-2 overflow-hidden whitespace-nowrap", isCollapsed && "px-4 justify-center")}>
                    <div className="flex items-center gap-2 text-primary shrink-0">
                        <Activity className="w-6 h-6 text-yellow-500" />
                        {!isCollapsed && <span className="text-xl font-bold tracking-tight text-white transition-opacity duration-300">NauticSync</span>}
                    </div>
                </div>

                {/* Search Button */}
                <div className="px-3 mb-2">
                    <button
                        id="sidebar-search-btn"
                        onClick={() => setIsSearchOpen(true)}
                        className={clsx(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all group",
                            isCollapsed && "justify-center px-2"
                        )}
                        title="Search files (Ctrl+K)"
                    >
                        <Search className="w-4 h-4 shrink-0 group-hover:text-yellow-500 transition-colors" />
                        {!isCollapsed && (
                            <div className="flex items-center justify-between flex-1">
                                <span>Search</span>
                                <span className="text-xs px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-500 group-hover:border-zinc-600 group-hover:text-zinc-400">Ctrl K</span>
                            </div>
                        )}
                    </button>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-x-hidden">
                    {mainNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeModule === item.id;
                        return (
                            <button
                                key={item.id}
                                id={`sidebar-nav-${item.id}`}
                                onClick={() => setActiveModule(item.id as AppModule)}
                                title={isCollapsed ? item.label : undefined}
                                className={twMerge(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                                    isActive
                                        ? "bg-yellow-500/10 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)] border border-yellow-500/20"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800",
                                    isCollapsed && "justify-center px-2"
                                )}
                            >
                                <Icon className={clsx("w-5 h-5 shrink-0", isActive ? "text-yellow-500" : "text-zinc-500 group-hover:text-white")} />
                                {!isCollapsed && <span className="whitespace-nowrap overflow-hidden transition-all duration-300">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Connected Nodes */}

                {/* Footer / Settings */}
                <div className={clsx("p-3 mt-auto border-t border-zinc-800", isCollapsed && "px-2")}>
                    <button
                        onClick={() => setActiveModule('settings')}
                        title={isCollapsed ? "Settings" : undefined}
                        className={twMerge(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            activeModule === 'settings'
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800",
                            isCollapsed && "justify-center px-2"
                        )}
                    >
                        <Settings className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span>Settings</span>}
                    </button>

                    {!isCollapsed && (
                        <div className="mt-4 px-3 py-2 bg-zinc-950/50 rounded border border-zinc-800/50">
                            <div className="flex items-center justify-between text-xs text-zinc-500">
                                <span>Status</span>
                                <span className="flex items-center gap-1.5 text-emerald-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Online
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};
