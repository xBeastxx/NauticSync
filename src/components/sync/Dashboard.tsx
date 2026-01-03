import { useSystemStatus, useConnections, useWorkflowStats, useConfig } from '../../lib/api/hooks';
import { useWorkflowStore } from '../../store/workflowStore';
import { StatsCard } from '../ui/StatsCard';
import { Card } from '../ui/Card';
import { Cpu, Users, FileIcon, Database } from 'lucide-react';
import { formatBytes } from '../../lib/utils';
import { WorkflowSelector } from './WorkflowSelector';
import { FolderList } from './FolderList';
import { DeviceList } from './DeviceList';
import { ActivityTimeline } from './ActivityTimeline';
import { ActiveTransfers } from './ActiveTransfers';

export const Dashboard = () => {
    const { workflows, activeWorkflowId } = useWorkflowStore();
    const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);

    // Get stats for active workflow folders
    const folderIds = activeWorkflow?.folders.map(f => f.syncthingFolderId) || [];
    const { data: workflowStats } = useWorkflowStats(folderIds);
    const { data: status } = useSystemStatus();
    const { data: connections } = useConnections();
    const { data: config } = useConfig();

    // Derived metrics
    const cpuUsage = status ? (Math.random() * 10).toFixed(1) : '0'; // Mock CPU for now as API doesn't provide it directly

    // Filter active devices for THIS workflow
    // 1. Find the real Syncthing folders that match our workflow folders
    const workflowRealFolders = config?.folders.filter((f: any) => folderIds.includes(f.id)) || [];
    // 2. Get all device IDs used in these folders
    const workflowDeviceIds = new Set(workflowRealFolders.flatMap((f: any) => f.devices.map((d: any) => d.deviceID)));

    const activeDevices = connections
        ? Object.keys(connections.connections || {})
            .filter(k => connections.connections[k].connected)
            .filter(k => workflowDeviceIds.has(k)) // Only count devices in this workflow
            .length
        : 0;

    return (
        <div className="space-y-6">
            {/* Connected Nodes Header */}
            <DeviceList className="mb-6" />

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    label="Active Devices"
                    value={activeDevices}
                    subValue="In Workflow"
                    icon={Users}
                    color="text-yellow-500"
                />
                <StatsCard
                    label="Managed Data"
                    value={formatBytes(workflowStats?.globalBytes || 0)}
                    subValue="Total Size"
                    icon={Database}
                    color="text-emerald-500"
                />
                <StatsCard
                    label="Total Files"
                    value={`${(workflowStats?.globalFiles || 0).toLocaleString()} Files`}
                    subValue={`${(workflowStats?.ignoredItems || 0).toLocaleString()} ignored`}
                    subValueClassName="text-orange-400"
                    icon={FileIcon}
                    color="text-blue-500"
                />
                <StatsCard
                    label="CPU Usage"
                    value={`${cpuUsage}%`}
                    subValue="System Load"
                    icon={Cpu}
                    color="text-zinc-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Workflows & Folders & Transfers */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="min-h-[400px]">
                        <WorkflowSelector />
                        <FolderList />
                        <ActiveTransfers />
                    </Card>
                </div>

                {/* Right Column: Activity Timeline */}
                <div className="space-y-6">
                    <div className="min-h-[400px]">
                        <ActivityTimeline />
                    </div>
                </div>
            </div>
        </div>
    );
};
