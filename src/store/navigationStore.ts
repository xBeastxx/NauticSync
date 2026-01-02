import { create } from 'zustand';

export type AppModule = 'sync' | 'dev' | 'media' | 'backup' | 'settings' | 'conflicts';

interface NavigationState {
    activeModule: AppModule;
    setActiveModule: (module: AppModule) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    activeModule: 'sync',
    setActiveModule: (module) => set({ activeModule: module }),
}));
