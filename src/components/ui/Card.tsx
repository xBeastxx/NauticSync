import { type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    action?: ReactNode;
    id?: string;
}

export const Card = ({ children, className, title, action, id }: CardProps) => {
    return (
        <div id={id} className={twMerge("bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm", className)}>
            {(title || action) && (
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                    {title && <h3 className="font-medium text-zinc-300">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-5">
                {children}
            </div>
        </div>
    );
};
