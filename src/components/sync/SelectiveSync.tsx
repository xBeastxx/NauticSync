import { useState, useEffect } from 'react';
import { Switch } from '../ui/Switch';
import { Card } from '../ui/Card';
import { syncthing } from '../../lib/syncthing';
import {
    FolderSync,
    Laptop,
    Smartphone,
    Server,
    RefreshCw,
    X,
    Trash2
} from 'lucide-react';
import { clsx } from 'clsx';

interface Device {
    deviceID: string;
    name: string;
    connected?: boolean;
}

interface Folder {
    id: string;
    label: string;
    path: string;
    devices: { deviceID: string }[];
}

export const SelectiveSync = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Add timeout to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            const configPromise = syncthing.getConfig();
            const statusPromise = syncthing.getSystemStatus();
            const connectionsPromise = syncthing.getConnections();

            const [config, status, connections] = await Promise.race([
                Promise.all([configPromise, statusPromise, connectionsPromise]),
                timeoutPromise
            ]) as [any, any, any];

            // Get devices excluding local
            const remoteDevices = (config.devices || [])
                .filter((d: Device) => d.deviceID !== status.myID)
                .map((d: Device) => ({
                    ...d,
                    connected: connections?.connections?.[d.deviceID]?.connected || false
                }));

            setDevices(remoteDevices);

            // Filter out invalid folders (empty id) only
            const validFolders = (config.folders || []).filter(
                (f: Folder) => f.id && f.id.trim() !== ''
            );
            setFolders(validFolders);
        } catch (err) {
            console.error('Failed to load config:', err);
            setError('Could not connect to Syncthing');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const isFolderSharedWithDevice = (folder: Folder, deviceId: string): boolean => {
        return folder.devices.some(d => d.deviceID === deviceId);
    };

    const toggleFolderDevice = async (folderId: string, deviceId: string) => {
        // Optimistic update
        setFolders(prev => prev.map(folder => {
            if (folder.id !== folderId) return folder;
            const isCurrentlyShared = isFolderSharedWithDevice(folder, deviceId);
            if (isCurrentlyShared) {
                return { ...folder, devices: folder.devices.filter(d => d.deviceID !== deviceId) };
            } else {
                return { ...folder, devices: [...folder.devices, { deviceID: deviceId }] };
            }
        }));

        try {
            const config = await syncthing.getConfig();
            const updatedConfig = {
                ...config,
                folders: config.folders.map((f: Folder) => {
                    if (f.id === folderId) {
                        const isShared = f.devices.some(d => d.deviceID === deviceId);
                        const newDevices = isShared
                            ? f.devices.filter(d => d.deviceID !== deviceId)
                            : [...f.devices, { deviceID: deviceId }];

                        return { ...f, devices: newDevices };
                    }
                    return f;
                })
            };
            await syncthing.setConfig(updatedConfig);
        } catch (err) {
            console.error('Failed to auto-save:', err);
            // Revert state on error? For now just alert
            alert('Failed to update: ' + err);
        }
    };

    const deleteFolder = async (folderId: string, folderLabel: string) => {
        if (!confirm(`Are you sure you want to remove "${folderLabel}" from Syncthing? This won't delete the files.`)) {
            return;
        }

        try {
            const config = await syncthing.getConfig();
            const updatedConfig = {
                ...config,
                folders: config.folders.filter((f: Folder) => f.id !== folderId)
            };
            await syncthing.setConfig(updatedConfig);

            // Update local state
            setFolders(prev => prev.filter(f => f.id !== folderId));
        } catch (err) {
            console.error('Failed to delete folder:', err);
            alert('Failed to remove folder: ' + err);
        }
    };


    const getDeviceIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('phone') || lower.includes('mobile') || lower.includes('iphone') || lower.includes('android')) {
            return Smartphone;
        }
        if (lower.includes('server') || lower.includes('nas')) {
            return Server;
        }
        return Laptop;
    };

    if (isLoading) {
        return (
            <Card title="Selective Sync" className="flex flex-col">
                <div className="flex items-center justify-center h-32 text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Loading configuration...
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card title="Selective Sync" className="flex flex-col">
                <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                    <X className="w-8 h-8 mb-2 text-red-400 opacity-50" />
                    <p className="text-red-400">{error}</p>
                    <p className="text-xs text-zinc-600 mt-1">Check if Syncthing is running</p>
                </div>
            </Card>
        );
    }

    if (devices.length === 0) {
        return (
            <Card title="Selective Sync" className="flex flex-col">
                <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                    <Laptop className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No remote devices connected</p>
                    <p className="text-xs text-zinc-600 mt-1">Add devices in Syncthing to use Selective Sync</p>
                </div>
            </Card>
        );
    }

    return (
        <Card
            title="Selective Sync"
            className="flex flex-col"
            action={
                <button
                    onClick={loadData}
                    className="p-1.5 rounded-lg bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            }
        >
            <div className="space-y-4">
                <p className="text-xs text-zinc-500">
                    Select which folders sync to each device
                </p>

                {/* Device Cards */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {devices.map(device => {
                        const Icon = getDeviceIcon(device.name);
                        return (
                            <div key={device.deviceID} className="bg-zinc-800/50 rounded-lg p-3">
                                {/* Device Header */}
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-700">
                                    <Icon className={clsx("w-5 h-5", device.connected ? "text-green-400" : "text-zinc-500")} />
                                    <span className="font-medium text-zinc-200">
                                        {device.name || device.deviceID.substring(0, 12)}
                                    </span>
                                    {device.connected ? (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                                            Online
                                        </span>
                                    ) : (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-zinc-700 text-zinc-500 rounded">
                                            Offline
                                        </span>
                                    )}
                                </div>

                                {/* Folder Toggles */}
                                <div className="space-y-2">
                                    {folders.map(folder => {
                                        const isShared = isFolderSharedWithDevice(folder, device.deviceID);
                                        return (
                                            <div
                                                key={folder.id}
                                                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-zinc-900/50 group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FolderSync className="w-4 h-4 text-yellow-500" />
                                                    <span className="text-sm text-zinc-300 truncate max-w-[150px]" title={folder.path}>
                                                        {folder.label || folder.id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={isShared}
                                                        onChange={() => toggleFolderDevice(folder.id, device.deviceID)}
                                                        size="sm"
                                                    />
                                                    <button
                                                        onClick={() => deleteFolder(folder.id, folder.label || folder.id)}
                                                        className="p-1 rounded opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                        title="Remove folder"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </Card>
    );
};
