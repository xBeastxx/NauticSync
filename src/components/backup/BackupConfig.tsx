import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { ChevronRight, Clock, ArrowRight, Check, HardDrive, Folder, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { useBackupStore, type VersioningType } from '../../store/backupStore';

interface BackupConfigProps {
    folderPath: string;
    onComplete?: () => void;
}

interface VersioningOption {
    id: VersioningType;
    name: string;
    description: string;
    icon: typeof HardDrive;
    recommended?: boolean;
}

const versioningOptions: VersioningOption[] = [
    {
        id: 'simple',
        name: 'Simple',
        description: 'Keep old versions indefinitely. Simple but storage heavy.',
        icon: HardDrive,
    },
    {
        id: 'staggered',
        name: 'Staggered',
        description: 'Keep versions with decreasing frequency over time. Best balance.',
        icon: Clock,
        recommended: true,
    },
    {
        id: 'trashcan',
        name: 'Trash Can',
        description: 'Keep deleted files for a set period. Good for quick recovery.',
        icon: Folder,
    },
    {
        id: 'external',
        name: 'External',
        description: 'Use an external script to handle versioning.',
        icon: RefreshCw,
    },
];

export const BackupConfig = ({ folderPath, onComplete }: BackupConfigProps) => {
    const { setFolderConfig, getFolderConfig } = useBackupStore();
    const existingConfig = getFolderConfig(folderPath);

    const [step, setStep] = useState<1 | 2 | 3>(existingConfig ? 3 : 1);
    const [selectedType, setSelectedType] = useState<VersioningType>(existingConfig?.type || 'staggered');
    const [keepDays, setKeepDays] = useState(existingConfig?.keepDays || 30);
    const [isConfiguring, setIsConfiguring] = useState(false);

    // Reset when folder changes
    useEffect(() => {
        const config = getFolderConfig(folderPath);
        if (config) {
            setSelectedType(config.type);
            setKeepDays(config.keepDays);
            setStep(3);
        } else {
            setStep(1);
        }
    }, [folderPath, getFolderConfig]);

    const handleComplete = async () => {
        setIsConfiguring(true);
        // Simulate network/config delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Persist to store
        setFolderConfig(folderPath, {
            type: selectedType,
            keepDays,
            configuredAt: new Date().toISOString(),
        });

        setIsConfiguring(false);
        setStep(3);
        onComplete?.();
    };

    return (
        <Card className="overflow-hidden">
            {/* Progress Header */}
            <div className="flex items-center gap-4 p-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                // On step 3 (completion), all steps are green
                                step === 3
                                    ? "bg-emerald-500 text-white"
                                    : s === step
                                        ? "bg-blue-500 text-white"
                                        : s < step
                                            ? "bg-emerald-500 text-white"
                                            : "bg-zinc-800 text-zinc-500"
                            )}
                        >
                            {(step === 3 || s < step) ? <Check className="w-4 h-4" /> : s}
                        </div>
                    ))}
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-white">
                        {step === 1 && 'Choose Versioning Type'}
                        {step === 2 && 'Configure Settings'}
                        {step === 3 && 'Configuration Complete'}
                    </h3>
                    <p className="text-xs text-zinc-500">{folderPath}</p>
                </div>
            </div>

            {/* Step 1: Choose Type */}
            {step === 1 && (
                <div className="p-4 space-y-3">
                    {versioningOptions.map(option => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.id}
                                onClick={() => setSelectedType(option.id)}
                                className={clsx(
                                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                                    selectedType === option.id
                                        ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20"
                                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                )}
                            >
                                <div className={clsx(
                                    "p-3 rounded-lg",
                                    selectedType === option.id ? "bg-blue-500/20 text-blue-500" : "bg-zinc-800 text-zinc-400"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">{option.name}</span>
                                        {option.recommended && (
                                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-500 rounded">
                                                RECOMMENDED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-500 mt-0.5">{option.description}</p>
                                </div>
                                <ChevronRight className={clsx(
                                    "w-5 h-5",
                                    selectedType === option.id ? "text-blue-500" : "text-zinc-600"
                                )} />
                            </button>
                        );
                    })}

                    <div className="pt-2 flex justify-end">
                        <button
                            onClick={() => setStep(2)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Configure */}
            {step === 2 && (
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Keep versions for
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={7}
                                max={365}
                                value={keepDays}
                                onChange={(e) => setKeepDays(Number(e.target.value))}
                                className="flex-1 accent-blue-500"
                            />
                            <span className="w-24 text-right font-mono text-white">
                                {keepDays} days
                            </span>
                        </div>
                    </div>

                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <h4 className="text-sm font-medium text-white mb-2">Summary</h4>
                        <ul className="text-sm text-zinc-400 space-y-1">
                            <li>• Versioning type: <span className="text-white">{versioningOptions.find(o => o.id === selectedType)?.name}</span></li>
                            <li>• Keep old versions for: <span className="text-white">{keepDays} days</span></li>
                            <li>• Auto-cleanup enabled</li>
                        </ul>
                    </Card>

                    <div className="pt-2 flex justify-between">
                        <button
                            onClick={() => setStep(1)}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleComplete}
                            disabled={isConfiguring}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isConfiguring ? 'Configuring...' : 'Apply Configuration'}
                            {!isConfiguring && <Check className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Complete */}
            {step === 3 && (
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Configuration Complete!</h3>
                    <p className="text-zinc-400 mb-4">
                        Your backup settings have been applied. Syncthing will now use <span className="text-white font-medium">{versioningOptions.find(o => o.id === selectedType)?.name}</span> versioning.
                    </p>
                    <button
                        onClick={() => setStep(1)}
                        className="px-4 py-2 text-blue-500 hover:text-blue-400 transition-colors"
                    >
                        Reconfigure
                    </button>
                </div>
            )}
        </Card>
    );
};
