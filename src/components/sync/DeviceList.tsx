import { useConnections, useConfig, useSystemStatus } from '../../lib/api/hooks';
import { Monitor, Plus, Trash2, ChevronDown, ChevronRight, Laptop } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AddDeviceModal } from './AddDeviceModal';
import { clsx } from 'clsx';
import { syncthing } from '../../lib/syncthing';
import { useQueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'syncmaster-devices-collapsed';

export const DeviceList = () => {
    const { data: connections } = useConnections();
    const { data: config } = useConfig();
    const { data: status } = useSystemStatus();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === 'true';
    });
    const queryClient = useQueryClient();

    // Persist collapsed state
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    }, [isCollapsed]);

    const myID = status?.myID;
    const devices = config?.devices || [];

    // Map devices to their connection state
    const deviceStates = devices.map((dev: any) => {
        const conn = connections?.connections?.[dev.deviceID];
        return {
            ...dev,
            connected: !!conn?.connected,
            address: conn?.clientVersion || 'Offline',
            lastSeen: conn?.lastSeen,
            isLocal: dev.deviceID === myID
        };
    });

    // Separate local device and remote devices
    const localDevice = deviceStates.find((d: any) => d.isLocal);
    const remoteDevices = deviceStates.filter((d: any) => !d.isLocal);
    const onlineCount = remoteDevices.filter((d: any) => d.connected).length;

    // Remove logic
    const handleRemove = async (id: string) => {
        if (!confirm('Are you sure you want to remove this device?')) return;
        try {
            const currentConfig = await syncthing.getConfig();
            const newConfig = {
                ...currentConfig,
                devices: currentConfig.devices.filter((d: any) => d.deviceID !== id)
            };
            await syncthing.setConfig(newConfig);
            await queryClient.invalidateQueries({ queryKey: ['system', 'connections'] });
            await queryClient.invalidateQueries({ queryKey: ['system', 'config'] });
        } catch (err) {
            console.error("Failed to remove device", err);
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl">
            {/* Collapsible Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-3">
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-zinc-500" />
                    )}
                    <h3 className="text-lg font-semibold text-white">Connected Nodes</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        {onlineCount}/{remoteDevices.length} online
                    </span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-lg text-xs font-bold transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Pair Device
                </button>
            </div>

            {isModalOpen && <AddDeviceModal onClose={() => setIsModalOpen(false)} />}

            {/* Collapsible Content */}
            {!isCollapsed && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Local Device (This Device) */}
                    {localDevice && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                    <Laptop className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                        {localDevice.name || 'This Computer'}
                                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                                            This Device
                                        </span>
                                    </h4>
                                    <p className="text-xs text-zinc-500 font-mono">{localDevice.deviceID.substring(0, 12)}...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Remote Devices */}
                    <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
                        {remoteDevices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                                <Monitor className="w-10 h-10 text-zinc-800 mb-2" />
                                <p className="text-sm">No remote devices paired yet.</p>
                            </div>
                        ) : (
                            remoteDevices.map((dev: any) => (
                                <div key={dev.deviceID} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center",
                                            dev.connected ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                                        )}>
                                            <Monitor className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                                {dev.name || 'Unnamed Device'}
                                                {dev.connected && <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Online</span>}
                                            </h4>
                                            <p className="text-xs text-zinc-500 font-mono">{dev.deviceID.substring(0, 12)}...</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRemove(dev.deviceID)}
                                        className="p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Forget Device"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
