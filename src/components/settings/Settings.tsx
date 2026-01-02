import { useMutation, useQueryClient } from '@tanstack/react-query';
import { syncthing } from '../../lib/syncthing';
import { Card } from '../ui/Card';
import { Shield, Globe, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { useConfig } from '../../lib/api/hooks';

export const Settings = () => {
    const { data: config, isLoading } = useConfig();
    const queryClient = useQueryClient();

    const isLanOnly = config
        ? (!config.options.globalAnnounceEnabled && !config.options.relaysEnabled)
        : false;

    const togglePrivacy = useMutation({
        mutationFn: async (enableStrictPrivacy: boolean) => {
            await syncthing.patchOptions({
                globalAnnounceEnabled: !enableStrictPrivacy,
                relaysEnabled: !enableStrictPrivacy,
                // We always keep localAnnounceEnabled true for LAN sync
                localAnnounceEnabled: true
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system', 'config'] });
        }
    });

    if (isLoading) return <div className="p-8 text-zinc-500">Loading configuration...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

            <Card className="border-l-4 border-l-yellow-500">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-yellow-500" />
                            Privacy Mode
                        </h3>
                        <p className="text-zinc-400 text-sm mt-1 max-w-xl">
                            Configure how your devices find each other. 'Strict LAN' assumes all devices are on the same Wi-Fi/Network and disables public discovery servers.
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => togglePrivacy.mutate(false)}
                        className={clsx(
                            "p-4 rounded-xl border flex flex-col items-center gap-3 transition-all",
                            !isLanOnly
                                ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                : "bg-zinc-900 border-zinc-800 opacity-50 hover:opacity-100"
                        )}
                    >
                        <Globe className={clsx("w-8 h-8", !isLanOnly ? "text-blue-400" : "text-zinc-500")} />
                        <div className="text-center">
                            <span className={clsx("block font-medium", !isLanOnly ? "text-blue-400" : "text-zinc-400")}>Standard</span>
                            <span className="text-xs text-zinc-500">Globals Relays & Discovery Active</span>
                        </div>
                    </button>

                    <button
                        onClick={() => togglePrivacy.mutate(true)}
                        className={clsx(
                            "p-4 rounded-xl border flex flex-col items-center gap-3 transition-all",
                            isLanOnly
                                ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                : "bg-zinc-900 border-zinc-800 opacity-50 hover:opacity-100"
                        )}
                    >
                        <Lock className={clsx("w-8 h-8", isLanOnly ? "text-emerald-400" : "text-zinc-500")} />
                        <div className="text-center">
                            <span className={clsx("block font-medium", isLanOnly ? "text-emerald-400" : "text-zinc-400")}>Strict LAN Only</span>
                            <span className="text-xs text-zinc-500">Direct Connect Only. No Cloud.</span>
                        </div>
                    </button>
                </div>
            </Card>
        </div>
    );
};
