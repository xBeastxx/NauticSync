import { useQuery } from '@tanstack/react-query';
import { syncthing } from '../syncthing';

export const useSystemStatus = () => {
    return useQuery({
        queryKey: ['system', 'status'],
        queryFn: () => syncthing.getSystemStatus(),
        refetchInterval: 5000, // Poll every 5s
    });
};

export const useConnections = () => {
    return useQuery({
        queryKey: ['system', 'connections'],
        queryFn: () => syncthing.getConnections(),
        refetchInterval: 5000,
    });
};

export const useConfig = () => {
    return useQuery({
        queryKey: ['system', 'config'],
        queryFn: () => syncthing.getConfig(),
        // Config doesn't change often, rely on events or manual invalidation usually, but polling is safe for now
        refetchInterval: 10000,
        staleTime: 30000, // Consider data fresh for 30s to prevent loading screens on nav
    });
};

const DEFAULT_IGNORES = new Set([
    '.git', '.gitignore', 'node_modules', '.DS_Store', 'Thumbs.db', '*.sync-conflict-*'
]);

export const useWorkflowStats = (folderIds: string[]) => {
    return useQuery({
        queryKey: ['workflow', 'stats', folderIds],
        queryFn: async () => {
            if (folderIds.length === 0) return { globalFiles: 0, globalBytes: 0, inSyncBytes: 0, needBytes: 0, ignoredItems: 0 };

            const promises = folderIds.map(async id => {
                const [status, ignores] = await Promise.all([
                    syncthing.getFolderStatus(id).catch(() => ({ globalFiles: 0, globalBytes: 0, inSyncBytes: 0, needBytes: 0 })),
                    syncthing.getIgnores(id).catch(() => ({ ignore: [] }))
                ]);

                // Filter out defaults and empty/comments
                const customIgnores = (ignores.ignore || []).filter((p: string) => {
                    const pattern = p.trim();
                    if (!pattern) return false;
                    if (pattern.startsWith('//') || pattern.startsWith('#')) return false;
                    return !DEFAULT_IGNORES.has(pattern);
                });

                return { ...status, ignoredCount: customIgnores.length };
            });

            const results = await Promise.all(promises);

            return results.reduce((acc, curr) => ({
                globalFiles: acc.globalFiles + (curr.globalFiles || 0),
                globalBytes: acc.globalBytes + (curr.globalBytes || 0),
                inSyncBytes: acc.inSyncBytes + (curr.inSyncBytes || 0),
                needBytes: acc.needBytes + (curr.needBytes || 0),
                ignoredItems: acc.ignoredItems + (curr.ignoredCount || 0)
            }), { globalFiles: 0, globalBytes: 0, inSyncBytes: 0, needBytes: 0, ignoredItems: 0 });
        },
        refetchInterval: 5000,
        enabled: folderIds.length > 0
    });
};
