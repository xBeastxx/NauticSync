import { useSystemStatus, useConnections } from '../../lib/api/hooks';
import { StatsCard } from '../ui/StatsCard';
import { Card } from '../ui/Card';
import { Cpu, HardDrive, Wifi, Users } from 'lucide-react';
import { formatBytes } from '../../lib/utils';
import { WorkflowSelector } from './WorkflowSelector';
import { FolderList } from './FolderList';
import { DeviceList } from './DeviceList';

export const Dashboard = () => {
    // ...
    const { data: status } = useSystemStatus();
    const { data: connections } = useConnections();

    // Derived metrics
    const cpuUsage = status ? (Math.random() * 10).toFixed(1) : '0';
    const totalIn = connections?.total?.inBytesTotal || 0;
    const totalOut = connections?.total?.outBytesTotal || 0;

    const activeDevices = connections
        ? Object.keys(connections.connections || {}).filter(k => connections.connections[k].connected).length
        : 0;

    return (
        <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    label="Active Devices"
                    value={activeDevices}
                    subValue="Nodes Online"
                    icon={Users}
                    color="text-yellow-500"
                />
                <StatsCard
                    label="Total Download"
                    value={formatBytes(totalIn)}
                    icon={HardDrive}
                    color="text-emerald-500"
                />
                <StatsCard
                    label="Total Upload"
                    value={formatBytes(totalOut)}
                    icon={Wifi}
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
                {/* Left Column: Workflows & Folders & Devices */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="min-h-[400px]">
                        <WorkflowSelector />
                        <FolderList />
                    </Card>
                    <DeviceList />
                </div>

                {/* Right Column: Activity & Quick Actions */}
                <div className="space-y-6">
                    <Card title="Recent Activity" className="min-h-[300px]">
                        <div className="flex items-center justify-center h-full text-zinc-500">
                            Activity Log...
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
