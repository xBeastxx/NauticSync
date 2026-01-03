import { useState, useEffect } from 'react';
import { X, Smartphone, QrCode as QrIcon, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { useSystemStatus } from '../../lib/api/hooks';
import { syncthing } from '../../lib/syncthing';
import { useQueryClient } from '@tanstack/react-query';

interface AddDeviceModalProps {
    onClose: () => void;
}

export const AddDeviceModal = ({ onClose }: AddDeviceModalProps) => {
    const { data: status } = useSystemStatus();
    const queryClient = useQueryClient();

    // Form State
    const [deviceId, setDeviceId] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // QR State
    const [qrUrl, setQrUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (status?.myID) {
            QRCode.toDataURL(status.myID)
                .then(url => setQrUrl(url))
                .catch(err => console.error(err));
        }
    }, [status?.myID]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleCopy = () => {
        if (status?.myID) {
            navigator.clipboard.writeText(status.myID);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleAdd = async () => {
        setIsSubmitting(true);
        try {
            // Get current config, add device, saving config
            const config = await syncthing.getConfig();
            const newDevice = {
                deviceID: deviceId,
                name: name,
                addresses: ['dynamic'],
                compression: 'metadata',
                introducer: false
            };

            const newConfig = {
                ...config,
                devices: [...config.devices, newDevice]
            };

            await syncthing.setConfig(newConfig);
            await queryClient.invalidateQueries({ queryKey: ['system', 'connections'] });
            await queryClient.invalidateQueries({ queryKey: ['system', 'config'] });
            onClose();
        } catch (err) {
            console.error("Failed to add device", err);
            // Show error toast ideally
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div id="add-device-modal-content" className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl">

                {/* Left: Input Form */}
                <div className="p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Smartphone className="w-6 h-6 text-yellow-500" />
                                Pair New Device
                            </h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Device ID</label>
                                <input
                                    type="text"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-yellow-500 font-mono text-sm"
                                    placeholder="XXXX-XXXX-..."
                                    value={deviceId}
                                    onChange={(e) => setDeviceId(e.target.value)}
                                />
                                <p className="text-xs text-zinc-600 mt-1">Found in the other device's "Show ID" menu.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Device Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-yellow-500"
                                    placeholder="e.g. My Phone"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg text-sm font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!deviceId || !name || isSubmitting}
                            className="flex-1 px-4 py-3 rounded-lg text-sm font-bold bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Device'}
                        </button>
                    </div>
                </div>

                {/* Right: My QR Code */}
                <div className="bg-zinc-950 p-8 flex flex-col items-center justify-center text-center border-l border-zinc-800 relative">
                    <button id="add-device-modal-close-btn" onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>

                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                        <QrIcon className="w-5 h-5 text-zinc-500" />
                        Scan to Pair with Me
                    </h4>

                    <div className="bg-white p-4 rounded-xl mb-6">
                        {qrUrl ? (
                            <img src={qrUrl} alt="Device ID QR" className="w-48 h-48 mix-blend-multiply" />
                        ) : (
                            <div className="w-48 h-48 flex items-center justify-center text-zinc-300">Loading QR...</div>
                        )}
                    </div>

                    <div className="space-y-2 max-w-xs mx-auto">
                        <p className="text-xs text-zinc-500 font-mono break-all select-all">
                            {status?.myID || 'Loading ID...'}
                        </p>
                        <button
                            onClick={handleCopy}
                            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors text-xs"
                        >
                            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied!' : 'Copy ID to Clipboard'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
