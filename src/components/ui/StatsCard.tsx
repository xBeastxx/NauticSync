import { type LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { clsx } from 'clsx';

interface StatsCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    color?: string; // Text color class for the icon/value
}

export const StatsCard = ({ label, value, subValue, icon: Icon, color = "text-white" }: StatsCardProps) => {
    return (
        <Card className="relative overflow-visible">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-zinc-500 text-sm font-medium">{label}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <h4 className={clsx("text-2xl font-bold tracking-tight", color)}>
                            {value}
                        </h4>
                        {subValue && (
                            <span className="text-sm text-zinc-500">{subValue}</span>
                        )}
                    </div>
                </div>
                <div className="p-2 bg-zinc-800/50 rounded-lg">
                    <Icon className={clsx("w-5 h-5", color)} />
                </div>
            </div>
        </Card>
    );
};
