import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { X, Minus, Square } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

interface AppLayoutProps {
    children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-white selection:bg-yellow-500/20">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full min-w-0 bg-black/20">
                {/* Titlebar / Drag Region */}
                <div className="h-8 w-full flex items-center justify-end px-4 drag-region select-none" style={{ WebkitAppRegion: 'drag' } as any}>
                    {/* Window Controls */}
                    <button
                        onClick={() => window.electronAPI.minimizeWindow()}
                        className="p-1 px-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors no-drag cursor-pointer z-50"
                        style={{ WebkitAppRegion: 'no-drag' } as any}
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => window.electronAPI.toggleMaximizeWindow()}
                        className="p-1 px-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors no-drag cursor-pointer z-50 mx-1"
                        style={{ WebkitAppRegion: 'no-drag' } as any}
                    >
                        <Square className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => window.electronAPI.closeWindow()}
                        className="p-1 px-2 hover:bg-red-500 hover:text-white rounded-md transition-colors no-drag cursor-pointer z-50"
                        style={{ WebkitAppRegion: 'no-drag' } as any}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* View Content */}
                <div className="flex-1 overflow-auto p-6 pb-12 scroll-smooth">
                    {children}
                </div>
            </main>
            <Toaster position="bottom-right" toastOptions={{
                className: '!bg-zinc-800 !text-white !border !border-zinc-700',
                duration: 4000
            }} />
        </div>
    );
};
