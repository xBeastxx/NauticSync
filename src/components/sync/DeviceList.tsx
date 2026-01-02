import { useConnections, useConfig } from '../../lib/api/hooks';
import { Card } from '../ui/Card';
import { Monitor, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AddDeviceModal } from './AddDeviceModal';
import { clsx } from 'clsx';
import { syncthing } from '../../lib/syncthing';
import { useQueryClient } from '@tanstack/react-query';

export const DeviceList = () => {
    const { data: connections } = useConnections();
    const { data: config } = useConfig();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const devices = config?.devices || [];

    // Map devices to their connection state
    const deviceStates = devices.map((dev: any) => {
        const conn = connections?.connections?.[dev.deviceID];
        return {
            ...dev,
            connected: !!conn?.connected,
            address: conn?.clientVersion || 'Offline', // Using version as placeholder for detail
            lastSeen: conn?.lastSeen
        };
    });

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
        <Card title="Connected Nodes"
            action={
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-lg text-xs font-bold transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Pair Device
                </button>
            }
            className="lg:col-span-2 min-h-[300px]"
        >
            {isModalOpen && <AddDeviceModal onClose={() => setIsModalOpen(false)} />}

            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {deviceStates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                        <Monitor className="w-12 h-12 text-zinc-800 mb-3" />
                        <p>No devices paired yet.</p>
                    </div>
                ) : (
                    deviceStates.map((dev: any) => (
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
        </Card>
    );
};
