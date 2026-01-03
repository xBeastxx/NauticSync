export interface SyncedFolder {
    id: string;
    label: string;
    path: string;
    devices: { deviceID: string }[];
}

export interface DeviceNode {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'syncing';
    inBytesTotal?: number; // Session
    outBytesTotal?: number; // Session
    address?: string;
    clientVersion?: string;
    isLocal?: boolean;
}
