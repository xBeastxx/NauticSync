import { clsx } from 'clsx';
import { Hexagon, Code2, Binary, Cog, Folder } from 'lucide-react';
import { getProfileConfig, type ProjectProfile } from '../../lib/profiles';

interface ProfileBadgeProps {
    profile: ProjectProfile;
    size?: 'sm' | 'md';
}

const IconMap = {
    Hexagon,
    Code2,
    Binary,
    Cog,
    Folder,
};

const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    zinc: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
};

export const ProfileBadge = ({ profile, size = 'sm' }: ProfileBadgeProps) => {
    const config = getProfileConfig(profile);
    const Icon = IconMap[config.icon as keyof typeof IconMap] || Folder;
    const colorClass = colorMap[config.color] || colorMap.zinc;

    return (
        <span
            className={clsx(
                "inline-flex items-center gap-1 rounded-full border font-medium",
                colorClass,
                size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
            )}
            title={`${config.name} Project`}
        >
            <Icon className={clsx(size === 'sm' ? "w-3 h-3" : "w-4 h-4")} />
            {config.name}
        </span>
    );
};
