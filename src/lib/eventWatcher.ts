/**
 * Event Watcher Service
 * Persists Syncthing events to localStorage for long-term history
 */

const STORAGE_KEY = 'nauticsync-event-history';
const MAX_EVENTS = 500; // Keep last 500 events

export interface StoredEvent {
    id: number;
    type: string;
    time: string;
    data: {
        folder?: string;
        item?: string;
        action?: string;
        type?: string;
        modifiedBy?: string;
        error?: string;
    };
}

// Get all stored events
export const getStoredEvents = (): StoredEvent[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Get events for a specific folder
export const getEventsForFolder = (folderId: string, limit = 50): StoredEvent[] => {
    const events = getStoredEvents();
    return events
        .filter(e => e.data.folder === folderId)
        .slice(0, limit);
};

// Store new events (merges with existing, deduplicates by id)
export const storeEvents = (newEvents: StoredEvent[]): void => {
    if (!newEvents.length) return;

    const existing = getStoredEvents();
    const existingIds = new Set(existing.map(e => e.id));

    // Add only new events
    const uniqueNew = newEvents.filter(e => !existingIds.has(e.id));

    if (!uniqueNew.length) return;

    // Merge and sort by time (newest first)
    const merged = [...uniqueNew, ...existing]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, MAX_EVENTS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
};

// Clear all stored events
export const clearEventHistory = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};

// Clear events for a specific folder (used when folder is deleted)
export const clearEventsForFolder = (folderId: string): void => {
    const events = getStoredEvents();
    const filtered = events.filter(e => e.data.folder !== folderId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Get recent activity summary
export const getActivitySummary = (folderId?: string): {
    totalEvents: number;
    todayCount: number;
    lastActivity: Date | null;
    topFiles: { name: string; count: number }[];
} => {
    const events = folderId ? getEventsForFolder(folderId, 500) : getStoredEvents();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEvents = events.filter(e => new Date(e.time) >= today);

    // Count file occurrences
    const fileCounts: Record<string, number> = {};
    events.forEach(e => {
        if (e.data.item) {
            fileCounts[e.data.item] = (fileCounts[e.data.item] || 0) + 1;
        }
    });

    const topFiles = Object.entries(fileCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        totalEvents: events.length,
        todayCount: todayEvents.length,
        lastActivity: events.length > 0 ? new Date(events[0].time) : null,
        topFiles
    };
};
