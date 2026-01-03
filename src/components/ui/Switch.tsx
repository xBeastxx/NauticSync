import { clsx } from "clsx";

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
}

export const Switch = ({ checked, onChange, disabled = false, size = 'md' }: SwitchProps) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={clsx(
                "relative rounded-full transition-all duration-300 ease-in-out border",
                // Sizes
                size === 'sm' ? "w-9 h-5" : "w-11 h-6",
                // Checked/Unchecked States
                checked
                    ? "bg-yellow-500 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                    : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700",
                // Disabled
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <span
                className={clsx(
                    "absolute top-1/2 -translate-y-1/2 bg-white rounded-full shadow-sm transition-all duration-300",
                    // Knob sizing
                    size === 'sm' ? "w-3.5 h-3.5" : "w-4.5 h-4.5",
                    // Knob positioning
                    checked
                        ? (size === 'sm' ? "left-[calc(100%-1.125rem)]" : "left-[calc(100%-1.375rem)]")
                        : "left-1"
                )}
            />
        </button>
    );
};
