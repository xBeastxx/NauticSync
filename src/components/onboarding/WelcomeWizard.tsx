import { useState, useEffect } from 'react';
import { Check, Laptop } from 'lucide-react';
import { useSystemStatus } from '../../lib/api/hooks';
import { syncthing } from '../../lib/syncthing';
import { useQueryClient } from '@tanstack/react-query';

interface WelcomeWizardProps {
    onComplete: () => void;
}

export const WelcomeWizard = ({ onComplete }: WelcomeWizardProps) => {
    const { data: status } = useSystemStatus();
    const queryClient = useQueryClient();

    // Step 1: Naming
    const [deviceName, setDeviceName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (status?.myID) {
            syncthing.getConfig().then(config => {
                const myDevice = config.devices.find((d: any) => d.deviceID === status.myID);
                if (myDevice?.name) setDeviceName(myDevice.name);
            }).catch(console.error);
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
                            <Laptop className="w-6 h-6" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Identify this Node</h2>
                            <p className="text-zinc-400">
                                Give this computer a recognizable name so you can spot it easily on your other devices.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">Device Name</label>
                            <input
                                type="text"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-lg"
                                placeholder="e.g. Workstation, Manuel's Laptop..."
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && deviceName && handleSaveName()}
                            />
                        </div>

                        <button
                            onClick={handleSaveName}
                            disabled={!deviceName || isSaving}
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
