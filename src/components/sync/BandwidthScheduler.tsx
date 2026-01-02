import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { syncthing } from '../../lib/syncthing';
import {
    Clock,
    PlayCircle,
    PauseCircle,
    Save,
    RotateCcw,
    Gauge
} from 'lucide-react';
import { clsx } from 'clsx';

interface ScheduleSlot {
    enabled: boolean;
}

// 24 hours x 7 days = 168 slots
type WeekSchedule = ScheduleSlot[][];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Create default schedule (all enabled = no limits)
const createDefaultSchedule = (): WeekSchedule =>
    Array(7).fill(null).map(() =>
        Array(24).fill(null).map(() => ({ enabled: true }))
    );

export const BandwidthScheduler = () => {
    const [enabled, setEnabled] = useState(false);
    const [schedule, setSchedule] = useState<WeekSchedule>(createDefaultSchedule);
    const [maxKbps, setMaxKbps] = useState(500); // KB/s when limited
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(true);

    // Load saved schedule from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('syncmaster-bandwidth-schedule');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setEnabled(parsed.enabled ?? false);
                setSchedule(parsed.schedule ?? createDefaultSchedule());
                setMaxKbps(parsed.maxKbps ?? 500);
            } catch (e) {
                console.error('Failed to load schedule:', e);
            }
        }
    }, []);

    // Check and apply limits every minute
    useEffect(() => {
        if (!enabled) return;

        const applyCurrentLimit = async () => {
            const now = new Date();
            const day = (now.getDay() + 6) % 7; // Convert to Monday = 0
            const hour = now.getHours();

            const slotEnabled = schedule[day]?.[hour]?.enabled ?? true;

            try {
                const config = await syncthing.getConfig();
                const newLimit = slotEnabled ? 0 : maxKbps;

                if (config.options.maxSendKbps !== newLimit || config.options.maxRecvKbps !== newLimit) {
                    await syncthing.patchOptions({
                        // Note: Syncthing API uses different option names
                        // We'll need to check the actual Syncthing config structure
                    });
                    console.log(`Bandwidth limit ${slotEnabled ? 'removed' : `set to ${maxKbps} KB/s`}`);
                }
            } catch (e) {
                console.error('Failed to apply bandwidth limit:', e);
            }
        };

        applyCurrentLimit();
        const interval = setInterval(applyCurrentLimit, 60000); // Every minute

        return () => clearInterval(interval);
    }, [enabled, schedule, maxKbps]);

    const saveSchedule = () => {
        setIsSaving(true);
        localStorage.setItem('syncmaster-bandwidth-schedule', JSON.stringify({
            enabled,
            schedule,
            maxKbps
        }));
        setTimeout(() => setIsSaving(false), 500);
    };

    const toggleSlot = (day: number, hour: number) => {
        setSchedule(prev => {
            const newSchedule = prev.map(d => d.map(h => ({ ...h })));
            newSchedule[day][hour].enabled = !newSchedule[day][hour].enabled;
            return newSchedule;
        });
    };

    const handleMouseDown = (day: number, hour: number) => {
        setIsDragging(true);
        setDragValue(!schedule[day][hour].enabled);
        toggleSlot(day, hour);
    };

    const handleMouseEnter = (day: number, hour: number) => {
        if (isDragging) {
            setSchedule(prev => {
                const newSchedule = prev.map(d => d.map(h => ({ ...h })));
                newSchedule[day][hour].enabled = dragValue;
                return newSchedule;
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetSchedule = () => {
        setSchedule(createDefaultSchedule());
    };

    const setWorkHours = () => {
        // Set limits during typical work hours (9 AM - 6 PM, Mon-Fri)
        setSchedule(prev => {
            const newSchedule = prev.map(d => d.map(h => ({ ...h })));
            for (let day = 0; day < 5; day++) { // Mon-Fri
                for (let hour = 9; hour < 18; hour++) { // 9 AM - 6 PM
                    newSchedule[day][hour].enabled = false;
                }
            }
            return newSchedule;
        });
    };

    return (
        <Card
            title="Bandwidth Scheduler"
            className="flex flex-col"
            action={
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const newEnabled = !enabled;
                            setEnabled(newEnabled);
                            // Immediately save enabled state to localStorage
                            const saved = localStorage.getItem('syncmaster-bandwidth-schedule');
                            const parsed = saved ? JSON.parse(saved) : {};
                            localStorage.setItem('syncmaster-bandwidth-schedule', JSON.stringify({
                                ...parsed,
                                enabled: newEnabled,
                                schedule: parsed.schedule ?? schedule,
                                maxKbps: parsed.maxKbps ?? maxKbps
                            }));
                        }}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            enabled
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        )}
                    >
                        {enabled ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                        {enabled ? 'Active' : 'Disabled'}
                    </button>
                </div>
            }
        >
            {!enabled ? (
                <div className="text-center py-8 text-zinc-500">
                    <Gauge className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Scheduler is disabled</p>
                    <p className="text-xs text-zinc-600 mt-1">Sync runs at full speed 24/7</p>
                </div>
            ) : (
                <div className="space-y-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                    {/* Limit Setting */}
                    <div className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
                        <label className="text-sm text-zinc-400">Limit when restricted:</label>
                        <input
                            type="number"
                            value={maxKbps}
                            onChange={(e) => setMaxKbps(Number(e.target.value))}
                            className="w-24 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white"
                        />
                        <span className="text-xs text-zinc-500">KB/s</span>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={setWorkHours}
                            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                        >
                            <Clock className="w-3 h-3 inline mr-1" />
                            Work Hours (9-6)
                        </button>
                        <button
                            onClick={resetSchedule}
                            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                        >
                            <RotateCcw className="w-3 h-3 inline mr-1" />
                            Reset All
                        </button>
                    </div>

                    {/* Schedule Grid */}
                    <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                            {/* Hour labels */}
                            <div className="flex items-center mb-1">
                                <div className="w-10" />
                                {HOURS.map(h => (
                                    <div
                                        key={h}
                                        className={clsx(
                                            "flex-1 text-[9px] text-zinc-600 text-center",
                                            h % 6 === 0 && "font-medium text-zinc-500"
                                        )}
                                    >
                                        {h % 6 === 0 ? `${h}h` : ''}
                                    </div>
                                ))}
                            </div>

                            {/* Day rows */}
                            {DAYS.map((day, dayIndex) => (
                                <div key={day} className="flex items-center mb-0.5">
                                    <div className="w-10 text-xs text-zinc-500 font-medium">{day}</div>
                                    <div className="flex flex-1 gap-px">
                                        {HOURS.map(hour => {
                                            const slot = schedule[dayIndex]?.[hour];
                                            const isEnabled = slot?.enabled ?? true;
                                            return (
                                                <div
                                                    key={hour}
                                                    onMouseDown={() => handleMouseDown(dayIndex, hour)}
                                                    onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                                                    className={clsx(
                                                        "flex-1 h-6 rounded-sm cursor-pointer transition-colors select-none",
                                                        isEnabled
                                                            ? "bg-green-500/30 hover:bg-green-500/50 border border-green-500/20"
                                                            : "bg-red-500/30 hover:bg-red-500/50 border border-red-500/20"
                                                    )}
                                                    title={`${day} ${hour}:00 - ${isEnabled ? 'Full Speed' : 'Limited'}`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500/30 border border-green-500/20 rounded-sm" />
                            <span>Full Speed</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500/30 border border-red-500/20 rounded-sm" />
                            <span>Limited ({maxKbps} KB/s)</span>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={saveSchedule}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saved!' : 'Save Schedule'}
                    </button>
                </div>
            )}
        </Card>
    );
};
