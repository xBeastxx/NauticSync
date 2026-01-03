import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../ui/Card';
import { syncthing } from '../../lib/syncthing';
import {
    RefreshCw,
    FileCheck,
    FolderSync,
    Wifi,
    WifiOff,
    AlertCircle,
    Clock,
    ArrowDown,
    ArrowUp,
    Pause,
    Play,
    Trash2
} from 'lucide-react';
import { clsx } from 'clsx';

interface SyncEvent {
    id: number;
    type: string;
    time: string;
    data: Record<string, any>;
}

// Event type to icon/color mapping
const EVENT_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
    'ItemFinished': { icon: FileCheck, color: 'text-green-400', label: 'File Synced' },
    'FolderCompletion': { icon: FolderSync, color: 'text-blue-400', label: 'Folder Complete' },
    'DeviceConnected': { icon: Wifi, color: 'text-emerald-400', label: 'Device Connected' },
    'DeviceDisconnected': { icon: WifiOff, color: 'text-red-400', label: 'Device Disconnected' },
    'StateChanged': { icon: RefreshCw, color: 'text-yellow-400', label: 'State Changed' },
    'DownloadProgress': { icon: ArrowDown, color: 'text-cyan-400', label: 'Downloading' },
    'LocalIndexUpdated': { icon: ArrowUp, color: 'text-purple-400', label: 'Local Update' },
    'RemoteIndexUpdated': { icon: ArrowDown, color: 'text-indigo-400', label: 'Remote Update' },
    'default': { icon: AlertCircle, color: 'text-zinc-400', label: 'Event' }
};

export const ActivityTimeline = () => {
    const [events, setEvents] = useState<SyncEvent[]>([]);
    const [isPolling, setIsPolling] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const lastEventId = useRef(0);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);
    const initialLoadDone = useRef(false);

    const isFetching = useRef(false);

    const fetchEvents = useCallback(async () => {
        if (isFetching.current) return;
        isFetching.current = true;

        try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            const eventsPromise = syncthing.getEvents(lastEventId.current);
            const newEvents = await Promise.race([eventsPromise, timeoutPromise]) as SyncEvent[];

            if (newEvents && newEvents.length > 0) {
                // Update last event ID
                lastEventId.current = newEvents[newEvents.length - 1].id;

                // Prepend new events (newest first)
                setEvents(prev => {
                    // Filter duplicates based on ID
                    const existingIds = new Set(prev.map(e => e.id));
                    const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id));

                    if (uniqueNewEvents.length === 0) return prev;

                    const combined = [...uniqueNewEvents.reverse(), ...prev];
                    // Keep only last 500 events
                    return combined.slice(0, 500);
                });
            }
            setError(null);
        } catch (err) {
            console.error('Failed to fetch events:', err);
            if (!initialLoadDone.current) {
                setError('Could not connect to Syncthing');
            }
        } finally {
            setIsLoading(false);
            initialLoadDone.current = true;
            isFetching.current = false;
        }
    }, []);

    useEffect(() => {
        fetchEvents();

        if (isPolling) {
            pollInterval.current = setInterval(fetchEvents, 2000);
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [isPolling, fetchEvents]);

    const togglePolling = () => {
        setIsPolling(!isPolling);
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    };

    const clearEvents = () => {
        setEvents([]);
    };

    const formatTime = (isoTime: string) => {
        const date = new Date(isoTime);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getEventDetails = (event: SyncEvent): string => {
        const { type, data } = event;

        switch (type) {
            case 'ItemFinished':
                return `${data.item || data.file || 'File'} → ${data.folder || 'Unknown Folder'}`;
            case 'FolderCompletion':
                return `${data.folder || 'Folder'} (${data.completion?.toFixed(1) || 100}%)`;
            case 'DeviceConnected':
            case 'DeviceDisconnected':
                return data.id?.substring(0, 8) || 'Device';
            case 'StateChanged':
                return `${data.folder || 'Folder'}: ${data.from || '?'} → ${data.to || '?'}`;
            default:
                return data.folder || data.device || JSON.stringify(data).substring(0, 50);
        }
    };

    return (
        <Card
            title="Activity Timeline"
            className="flex flex-col h-full"
            action={
                <div className="flex items-center gap-2">
                    <button
                        onClick={togglePolling}
                        className={clsx(
                            "p-1.5 rounded-lg transition-colors",
                            isPolling ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"
                        )}
                        title={isPolling ? "Pause live updates" : "Resume live updates"}
                    >
                        {isPolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={clearEvents}
                        className="p-1.5 rounded-lg bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Clear events"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-zinc-500 font-mono">
                        {events.length}
                    </span>
                </div>
            }
        >
            <div className="overflow-y-auto -mx-4 px-4 max-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32 text-zinc-500">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                        Loading events...
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                        <AlertCircle className="w-8 h-8 mb-2 text-red-400 opacity-50" />
                        <p className="text-red-400">{error}</p>
                        <p className="text-xs text-zinc-600 mt-1">Check if Syncthing is running</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                        <Clock className="w-8 h-8 mb-2 opacity-50" />
                        <p>No events yet</p>
                        <p className="text-xs text-zinc-600">Events will appear as files sync</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {events.map((event) => {
                            const config = EVENT_CONFIG[event.type] || EVENT_CONFIG['default'];
                            const Icon = config.icon;

                            return (
                                <div
                                    key={event.id}
                                    className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors group"
                                >
                                    <div className={clsx("mt-0.5", config.color)}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={clsx("text-sm font-medium", config.color)}>
                                                {config.label}
                                            </span>
                                            <span className="text-[10px] text-zinc-600 font-mono">
                                                {formatTime(event.time)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 truncate">
                                            {getEventDetails(event)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Live indicator */}
            {isPolling && (
                <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live updates active
                </div>
            )}
        </Card>
    );
};
