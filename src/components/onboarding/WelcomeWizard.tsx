import { useState, useEffect } from 'react';
import { Check, Activity, Laptop, Monitor, Smartphone, Tablet, Server } from 'lucide-react';
import { useSystemStatus } from '../../lib/api/hooks';
import { syncthing } from '../../lib/syncthing';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';

interface WelcomeWizardProps {
    onComplete: () => void;
}

// Device Types
export const DEVICE_TYPES = [
    { id: 'laptop', label: 'Laptop', icon: Laptop },
    { id: 'desktop', label: 'Desktop PC', icon: Monitor },
    { id: 'phone', label: 'Phone', icon: Smartphone },
    { id: 'tablet', label: 'Tablet', icon: Tablet },
    { id: 'server', label: 'Server', icon: Server },
] as const;

export type DeviceType = typeof DEVICE_TYPES[number]['id'];

// Helper to get/set device types from localStorage
export const getDeviceTypes = (): Record<string, DeviceType> => {
    try {
        return JSON.parse(localStorage.getItem('nauticsync-device-types') || '{}');
    } catch {
        return {};
    }
};

export const setDeviceType = (deviceId: string, type: DeviceType) => {
    const types = getDeviceTypes();
    types[deviceId] = type;
    localStorage.setItem('nauticsync-device-types', JSON.stringify(types));
};

export const getDeviceType = (deviceId: string): DeviceType | null => {
    return getDeviceTypes()[deviceId] || null;
};

export const WelcomeWizard = ({ onComplete }: WelcomeWizardProps) => {
    const { data: status } = useSystemStatus();
    const queryClient = useQueryClient();

    // Step 1: Naming
    const [deviceName, setDeviceName] = useState('');
    const [deviceType, setDeviceTypeState] = useState<DeviceType>('desktop');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (status?.myID) {
            syncthing.getConfig().then(config => {
                const myDevice = config.devices.find((d: any) => d.deviceID === status.myID);
                if (myDevice?.name) setDeviceName(myDevice.name);
            }).catch(console.error);

            // Load existing device type if any
            const existingType = getDeviceType(status.myID);
            if (existingType) setDeviceTypeState(existingType);
        }
    }, [status?.myID]);

    const handleSaveName = async () => {
        setIsSaving(true);
        try {
            const config = await syncthing.getConfig();
            const myDeviceIndex = config.devices.findIndex((d: any) => d.deviceID === status?.myID);

            if (myDeviceIndex >= 0) {
                const newDevices = [...config.devices];
                newDevices[myDeviceIndex] = { ...newDevices[myDeviceIndex], name: deviceName };
                await syncthing.setConfig({ ...config, devices: newDevices });
            }

            // Save device type to localStorage
            if (status?.myID) {
                setDeviceType(status.myID, deviceType);
            }

            await queryClient.invalidateQueries({ queryKey: ['system', 'config'] });
            onComplete();
        } catch (err) {
            console.error(err);
            onComplete();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-8">
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-4">
                            <Activity className="w-6 h-6" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Identify this Node</h2>
                            <p className="text-zinc-400">
                                Give this computer a recognizable name so you can spot it easily on your other devices.
                            </p>
                        </div>

                        {/* Device Name Input */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">Device Name</label>
                            <input
                                type="text"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-lg"
                                placeholder="e.g. Workstation, Manuel's Laptop..."
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Device Type Selector */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wider">Device Type</label>
                            <div className="grid grid-cols-5 gap-2">
                                {DEVICE_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setDeviceTypeState(type.id)}
                                        className={clsx(
                                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                                            deviceType === type.id
                                                ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500"
                                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                                        )}
                                    >
                                        <type.icon className="w-5 h-5" />
                                        <span className="text-[10px] font-medium">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSaveName}
                            disabled={!deviceName || isSaving}
                            onKeyDown={(e) => e.key === 'Enter' && deviceName && handleSaveName()}
                            className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {isSaving ? 'Saving...' : 'Save & Get Started'}
                            <Check className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
