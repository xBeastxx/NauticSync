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
