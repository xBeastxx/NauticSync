import { useMutation, useQueryClient } from '@tanstack/react-query';
import { syncthing } from '../../lib/syncthing';
import { Card } from '../ui/Card';
import { Shield, Globe, Lock, Power } from 'lucide-react';
import { clsx } from 'clsx';
import { useConfig } from '../../lib/api/hooks';
import { BandwidthScheduler } from '../sync/BandwidthScheduler';
import { SelectiveSync } from '../sync/SelectiveSync';
import { useState, useEffect } from 'react';
import { Switch } from '../ui/Switch';
import { TermsModal, EulaModal, CreditsModal, PrivacyModal } from './LegalModals';

export const Settings = () => {
    const { data: config, isLoading } = useConfig();
    const queryClient = useQueryClient();
    const [autoStartEnabled, setAutoStartEnabled] = useState(true);
    const [closeToTray, setCloseToTray] = useState(true);

    // Modals
    const [showTerms, setShowTerms] = useState(false);
    const [showEula, setShowEula] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showCredits, setShowCredits] = useState(false);

    // Load settings on mount
    useEffect(() => {
        window.electronAPI.getAutoStart().then(setAutoStartEnabled).catch(() => { });
        window.electronAPI.getCloseToTray().then(setCloseToTray).catch(() => { });
    }, []);

    const toggleAutoStart = async () => {
        const newValue = !autoStartEnabled;
        try {
            await window.electronAPI.setAutoStart(newValue);
            setAutoStartEnabled(newValue);
        } catch (e) {
            console.error('Failed to set auto-start:', e);
        }
    };

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
        <div className="max-w-4xl mx-auto space-y-6 pb-20">


            {/* System Settings */}
            <Card className="border-l-4 border-l-blue-500">
                <div className="space-y-6">
                    {/* Start with Windows */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Power className="w-5 h-5 text-blue-500" />
                            <div>
                                <h3 className="font-medium text-white">Start with Windows</h3>
                                <p className="text-xs text-zinc-500">Launch NauticSync automatically when you log in</p>
                            </div>
                        </div>
                        <Switch
                            checked={autoStartEnabled}
                            onChange={toggleAutoStart}
                        />
                    </div>

                    <div className="h-px bg-zinc-800" />

                    {/* Close to Tray */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-medium text-white">Minimize to Tray</h3>
                                <p className="text-xs text-zinc-500"><span className="text-emerald-500 font-medium">Recommended.</span> Ensures files continue to sync in the background.</p>
                            </div>
                        </div>
                        <Switch
                            checked={closeToTray}
                            onChange={async () => {
                                const newVal = !closeToTray;
                                await window.electronAPI.setCloseToTray(newVal);
                                setCloseToTray(newVal);
                            }}
                        />
                    </div>
                </div>
            </Card>

            {/* Selective Sync */}
            <SelectiveSync />

            {/* Privacy Mode */}
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

            {/* Bandwidth Scheduler */}
            <BandwidthScheduler />


            {/* Legal Footer */}
            <div className="pt-8 mt-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
                <div className="flex items-center gap-6">
                    <button onClick={() => setShowTerms(true)} className="hover:text-zinc-300 transition-colors">Terms & Conditions</button>
                    <button onClick={() => setShowPrivacy(true)} className="hover:text-zinc-300 transition-colors">Privacy Policy</button>
                    <button onClick={() => setShowEula(true)} className="hover:text-zinc-300 transition-colors">EULA</button>
                    <button onClick={() => setShowCredits(true)} className="hover:text-zinc-300 transition-colors">Credits</button>
                </div>
                <div>
                    © {new Date().getFullYear()} NauticGames™
                </div>
            </div>

            {/* Modals */}
            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
            <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
            <EulaModal isOpen={showEula} onClose={() => setShowEula(false)} />
            <CreditsModal isOpen={showCredits} onClose={() => setShowCredits(false)} />
        </div >
    );
};
