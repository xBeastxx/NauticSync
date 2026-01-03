import { useRef, useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import NetworkGraph from './NetworkGraph';
import { X, Activity, ArrowUp, ArrowDown, FileText, Folder, ChevronRight, Menu, FolderOpen, Monitor, Laptop, Smartphone, Tablet, Server } from 'lucide-react';
import { syncthing } from '../../lib/syncthing';
import clsx from 'clsx';
import type { DeviceNode, SyncedFolder } from './types';
import { getDeviceType, type DeviceType } from '../onboarding/WelcomeWizard';
import { storeEvents, getEventsForFolder, type StoredEvent } from '../../lib/eventWatcher';

// Map device types to icons
const DEVICE_TYPE_ICONS: Record<DeviceType | 'default', typeof Monitor> = {
    laptop: Laptop,
    desktop: Monitor,
    phone: Smartphone,
    tablet: Tablet,
    server: Server,
    default: Monitor
};

interface DeviceNetworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFolderId?: string;
}

export const DeviceNetworkModal = ({ isOpen, onClose, currentFolderId }: DeviceNetworkModalProps) => {
    // State
    const [activeFolderId, setActiveFolderId] = useState<string | null>(currentFolderId || null);
    const [folders, setFolders] = useState<SyncedFolder[]>([]);
    const [devices, setDevices] = useState<DeviceNode[]>([]);
    const [fileHistory, setFileHistory] = useState<{ filename: string, action: string, time: Date }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // UI State
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

    // Graph Dimensions
    const graphContainerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        if (!graphContainerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        resizeObserver.observe(graphContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [isSidebarOpen]);

    // Fetch Data
    const fetchData = async () => {
        try {
            const [config, connections, status, events] = await Promise.all([
                syncthing.getConfig(),
                syncthing.getConnections(),
                syncthing.getSystemStatus(),
                syncthing.getEvents(0)
            ]);

            // Process Events for History - Store to localStorage for persistence
            const itemFinishedEvents = events.filter((e: any) => e.type === 'ItemFinished');
            if (itemFinishedEvents.length > 0) {
                storeEvents(itemFinishedEvents.map((e: any) => ({
                    id: e.id,
                    type: e.type,
                    time: e.time,
                    data: e.data
                })));
            }

            // Load from persistent storage (includes past sessions)
            const storedEvents = activeFolderId
                ? getEventsForFolder(activeFolderId, 30)
                : [];

            setFileHistory(storedEvents.map((e: StoredEvent) => ({
                filename: e.data.item || 'Unknown',
                action: e.data.action || 'sync',
                time: new Date(e.time)
            })));

            const folderList = config.folders.map((f: any) => ({
                id: f.id,
                label: f.label || f.id,
                path: f.path,
                devices: f.devices
            }));
            setFolders(folderList);

            if (!activeFolderId && folderList.length > 0) {
                setActiveFolderId(folderList[0].id);
            }

            const deviceMap: DeviceNode[] = config.devices.map((d: any) => {
                const conn = connections.connections[d.deviceID];
                const isOnline = !!conn && conn.connected;
                return {
                    id: d.deviceID,
                    name: d.name || d.deviceID.substring(0, 7),
                    status: isOnline ? 'online' : 'offline',
                    inBytesTotal: conn ? conn.inBytesTotal : 0,
                    outBytesTotal: conn ? conn.outBytesTotal : 0,
                    address: conn ? conn.address : '',
                    clientVersion: conn ? conn.clientVersion : '',
                    isLocal: d.deviceID === status.myID
                };
            });

            // Mark Local Device
            const localDeviceIndex = deviceMap.findIndex(d => d.id === status.myID);
            if (localDeviceIndex !== -1) {
                deviceMap[localDeviceIndex].isLocal = true;
                deviceMap[localDeviceIndex].name = "This Device (You)";
                deviceMap[localDeviceIndex].status = 'online';
            }

            setDevices(deviceMap);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            setIsLoading(false);
        }
    };

    // Polling
    useEffect(() => {
        if (isOpen) {
            fetchData();
            const interval = setInterval(fetchData, 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen, activeFolderId]);

    // Derived State
    const selectedDevice = useMemo(() =>
        devices.find(d => d.id === selectedDeviceId) || null,
        [devices, selectedDeviceId]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="w-full max-w-7xl h-[92vh] min-h-[600px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex overflow-hidden relative">


                {/* 1. SIDEBAR: Folder Selection + Toggle */}
                <div className="flex h-full">
                    {/* Sidebar Content */}
                    <div className={clsx(
                        "flex flex-col border-r border-zinc-800 bg-zinc-900/50 transition-all duration-300 overflow-hidden flex-shrink-0",
                        isSidebarOpen ? "w-48" : "w-0"
                    )}>
                        {isSidebarOpen && (
                            <>
                                <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
                                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <FolderOpen className="w-4 h-4" /> Synced Folders
                                    </h2>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    {folders.map(folder => (
                                        <button
                                            key={folder.id}
                                            onClick={() => setActiveFolderId(folder.id)}
                                            className={clsx(
                                                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3",
                                                activeFolderId === folder.id
                                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                                            )}
                                        >
                                            <Folder className={clsx("w-4 h-4", activeFolderId === folder.id ? "fill-current" : "")} />
                                            <span className="truncate flex-1">{folder.label}</span>
                                            {activeFolderId === folder.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sidebar Toggle - Attached to sidebar edge */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="self-center bg-zinc-800 border border-l-0 border-zinc-700 p-1 rounded-r-lg shadow-lg hover:bg-zinc-700 text-zinc-400 -ml-px"
                    >
                        {isSidebarOpen ? <Menu className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>

                {/* 2. MAIN VISUALIZATION */}
                <div className="flex-1 min-w-0 relative flex flex-col bg-[#050505]">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-6 z-10 pointer-events-none flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Neural Grid</span>
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-mono">LIVE</span>
                            </h1>
                            <p className="text-zinc-500 text-sm max-w-md">
                                Real-time topology of {activeFolderId ? `folder "${folders.find(f => f.id === activeFolderId)?.label}"` : 'your network'}.
                            </p>
                        </div>
                    </div>

                    {/* Graph Container - Physics-Based Visualization */}
                    <div ref={graphContainerRef} className="flex-1 w-full h-full relative">
                        <NetworkGraph
                            activeFolderId={activeFolderId}
                            folders={folders}
                            devices={devices}
                            width={dimensions.width}
                            height={dimensions.height}
                            onNodeClick={(node: any) => {
                                if (node.type === 'device') setSelectedDeviceId(node.id);
                            }}
                        />

                        {/* Loading Overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                                <span className="animate-pulse text-blue-400 font-mono">Initializing Neural Link...</span>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-6 left-6 z-10 p-4 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                            <span>Active Folder</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <span>Online Device</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-zinc-600" />
                            <span>Offline</span>
                        </div>
                    </div>
                </div>

                {/* 3. INTELLIGENCE PANEL */}
                <div className="w-72 min-w-[260px] flex-shrink-0 border-l border-zinc-800 bg-zinc-900/50 flex flex-col overflow-hidden">
                    {/* Close Button in Panel Header */}
                    <div className="flex items-center justify-end p-2 border-b border-zinc-800/50">
                        <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
                            <X className="w-4 h-4 text-zinc-500" />
                        </button>
                    </div>
                    {selectedDevice ? (
                        <>
                            <div className="p-6 border-b border-zinc-800 bg-zinc-900/80">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                                        {(() => {
                                            const deviceType = getDeviceType(selectedDevice.id);
                                            const IconComponent = deviceType ? DEVICE_TYPE_ICONS[deviceType] : DEVICE_TYPE_ICONS.default;
                                            return <IconComponent className="w-6 h-6 text-zinc-400" />;
                                        })()}
                                    </div>
                                    <div className={clsx(
                                        "px-2 py-1 rounded-full text-xs font-medium border",
                                        selectedDevice.status === 'online'
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            : "bg-zinc-800 text-zinc-500 border-zinc-700"
                                    )}>
                                        {selectedDevice.status.toUpperCase()}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white truncate">{selectedDevice.name}</h3>
                                <code className="text-[10px] bg-zinc-950 px-2 py-1 rounded text-zinc-500 font-mono border border-zinc-800 block mt-2 truncate">
                                    {selectedDevice.id}
                                </code>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                {/* Traffic Stats */}
                                {selectedDevice.status === 'online' && (
                                    <div className="mb-6 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <Activity className="w-3 h-3" /> Session Traffic
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-zinc-300">
                                                    <ArrowDown className="w-3 h-3 text-emerald-400" />
                                                    <span className="text-sm">Inbound</span>
                                                </div>
                                                <span className="font-mono text-sm text-white">{((selectedDevice.inBytesTotal || 0) / 1024 / 1024).toFixed(1)} MB</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-zinc-300">
                                                    <ArrowUp className="w-3 h-3 text-blue-400" />
                                                    <span className="text-sm">Outbound</span>
                                                </div>
                                                <span className="font-mono text-sm text-white">{((selectedDevice.outBytesTotal || 0) / 1024 / 1024).toFixed(1)} MB</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* File History */}
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Recent Activity
                                    </h3>
                                    {fileHistory.length > 0 ? (
                                        <div className="relative border-l border-zinc-800 ml-2 space-y-4">
                                            {fileHistory.slice(0, 10).map((file, idx) => (
                                                <div key={`${file.filename}-${idx}`} className="relative pl-5">
                                                    <div className={clsx(
                                                        "absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-950",
                                                        file.action === 'delete' ? "bg-red-500" : "bg-emerald-500"
                                                    )} />
                                                    <span className="text-sm text-zinc-200 break-all block">{file.filename}</span>
                                                    <span className="text-xs text-zinc-500">{file.time.toLocaleTimeString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-zinc-600 border border-dashed border-zinc-800 rounded-lg">
                                            <Activity className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                            <p className="text-xs">No recent activity</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 border border-zinc-700">
                                <Activity className="w-8 h-8 opacity-50" />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-300 mb-2">Select a Node</h3>
                            <p className="text-sm">Click on any device to view detailed intelligence.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
