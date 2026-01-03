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

                    <div className="space-y-3 max-w-xs mx-auto">
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

                        {/* Share Buttons */}
                        <div className="flex items-center justify-center gap-2 pt-2">
                            {/* WhatsApp */}
                            <button
                                onClick={() => {
                                    const message = encodeURIComponent(`Connect with me on NauticSync!\n\nMy Device ID:\n${status?.myID}`);
                                    // Use native WhatsApp protocol
                                    window.open(`whatsapp://send?text=${message}`, '_self');
                                }}
                                className="p-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                                title="Share via WhatsApp"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </button>

                            {/* Telegram */}
                            <button
                                onClick={() => {
                                    const message = encodeURIComponent(`Connect with me on NauticSync!\n\nMy Device ID:\n${status?.myID}`);
                                    // Use native Telegram protocol
                                    window.open(`tg://msg?text=${message}`, '_self');
                                }}
                                className="p-2 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/30 text-[#0088cc] hover:bg-[#0088cc]/20 transition-colors"
                                title="Share via Telegram"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                </svg>
                            </button>

                            {/* Discord */}
                            <button
                                onClick={() => {
                                    // Copy to clipboard first, then open Discord
                                    const message = `Connect with me on NauticSync!\n\nMy Device ID:\n${status?.myID}`;
                                    navigator.clipboard.writeText(message);
                                    // Open Discord app
                                    window.open('discord://', '_blank');
                                }}
                                className="p-2 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/20 transition-colors"
                                title="Open Discord (ID copied)"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-[10px] text-zinc-600 text-center">Share your ID via messaging apps</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
