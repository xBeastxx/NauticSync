import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type { SyncedFolder, DeviceNode } from './types';
import { getDeviceType } from '../onboarding/WelcomeWizard';

interface NetworkGraphProps {
    activeFolderId: string | null;
    folders: SyncedFolder[];
    devices: DeviceNode[];
    width: number;
    height: number;
    onNodeClick?: (node: any) => void;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
    activeFolderId,
    folders,
    devices,
    width,
    height,
    onNodeClick
}) => {
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);

    // 1. Prepare Graph Data
    const graphData = useMemo(() => {
        if (!activeFolderId) return { nodes: [], links: [] };

        const activeFolder = folders.find(f => f.id === activeFolderId);
        if (!activeFolder) return { nodes: [], links: [] };

        const nodes: any[] = [];
        const links: any[] = [];

        // Central Node: The Folder
        nodes.push({
            id: 'folder-root',
            type: 'folder',
            label: activeFolder.label,
            val: 5,
            color: '#fbbf24'
        });

        // Satellite Nodes: Devices
        const relevantDevices = devices.filter(d =>
            activeFolder.devices.some((fd: any) => fd.deviceID === d.id) || d.isLocal
        );

        relevantDevices.forEach(device => {
            const deviceType = getDeviceType(device.id);
            nodes.push({
                id: device.id,
                type: 'device',
                deviceType: deviceType || 'desktop', // Store device type in node
                label: device.name || device.id.substring(0, 6) + '...',
                isLocal: device.isLocal,
                status: device.status,
                val: 3,
                color: device.isLocal ? '#3b82f6' : (device.status === 'online' || device.status === 'syncing' ? '#10b981' : '#71717a')
            });

            // Link to Folder
            links.push({
                source: 'folder-root',
                target: device.id,
                status: device.status,
                particleSpeed: device.status === 'syncing' ? 0.02 : 0,
                particleCount: device.status === 'syncing' ? 4 : 0
            });
        });

        return { nodes, links };
    }, [activeFolderId, folders, devices]);


    // 2. Custom Node Rendering (Canvas) with Device Type Icons
    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.label;
        const fontSize = 10 / globalScale;
        const rad = node.val;

        ctx.save();

        if (node.type === 'folder') {
            // Folder = Square/Rect shape
            ctx.beginPath();
            ctx.rect(node.x - rad, node.y - rad * 0.8, rad * 2, rad * 1.6);
            ctx.fillStyle = node.color;
            ctx.fill();
            // Folder Tab
            ctx.beginPath();
            ctx.rect(node.x - rad, node.y - rad * 1.2, rad * 0.8, rad * 0.4);
            ctx.fill();
        } else {
            // Device - Draw based on device type
            ctx.fillStyle = node.color;
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 1.5 / globalScale;

            switch (node.deviceType) {
                case 'laptop':
                    // Laptop shape: rectangle with base
                    ctx.beginPath();
                    ctx.rect(node.x - rad, node.y - rad * 0.6, rad * 2, rad * 1.2);
                    ctx.fill();
                    // Base/keyboard
                    ctx.beginPath();
                    ctx.rect(node.x - rad * 1.2, node.y + rad * 0.6, rad * 2.4, rad * 0.3);
                    ctx.fill();
                    break;

                case 'phone':
                    // Phone shape: tall rounded rectangle
                    const phoneW = rad * 0.8;
                    const phoneH = rad * 1.6;
                    ctx.beginPath();
                    ctx.roundRect(node.x - phoneW / 2, node.y - phoneH / 2, phoneW, phoneH, 2 / globalScale);
                    ctx.fill();
                    // Screen line
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    ctx.beginPath();
                    ctx.moveTo(node.x - phoneW / 2 + 2 / globalScale, node.y - phoneH / 2 + 3 / globalScale);
                    ctx.lineTo(node.x + phoneW / 2 - 2 / globalScale, node.y - phoneH / 2 + 3 / globalScale);
                    ctx.stroke();
                    break;

                case 'tablet':
                    // Tablet: wider rounded rectangle
                    const tabW = rad * 1.4;
                    const tabH = rad * 1.8;
                    ctx.beginPath();
                    ctx.roundRect(node.x - tabW / 2, node.y - tabH / 2, tabW, tabH, 3 / globalScale);
                    ctx.fill();
                    break;

                case 'server':
                    // Server: stacked rectangles
                    const srvW = rad * 1.6;
                    const srvH = rad * 0.5;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.rect(node.x - srvW / 2, node.y - rad + (i * srvH * 1.1), srvW, srvH);
                        ctx.fill();
                        // LED indicator
                        ctx.beginPath();
                        ctx.arc(node.x + srvW / 2 - 3 / globalScale, node.y - rad + (i * srvH * 1.1) + srvH / 2, 1.5 / globalScale, 0, Math.PI * 2);
                        ctx.fillStyle = node.status === 'online' ? '#22c55e' : '#ef4444';
                        ctx.fill();
                        ctx.fillStyle = node.color;
                    }
                    break;

                case 'desktop':
                default:
                    // Desktop: monitor shape
                    const monW = rad * 1.6;
                    const monH = rad * 1.2;
                    ctx.beginPath();
                    ctx.rect(node.x - monW / 2, node.y - monH / 2, monW, monH);
                    ctx.fill();
                    // Stand
                    ctx.beginPath();
                    ctx.moveTo(node.x - rad * 0.3, node.y + monH / 2);
                    ctx.lineTo(node.x + rad * 0.3, node.y + monH / 2);
                    ctx.lineTo(node.x + rad * 0.5, node.y + monH / 2 + rad * 0.3);
                    ctx.lineTo(node.x - rad * 0.5, node.y + monH / 2 + rad * 0.3);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }

            // Halo for Online devices
            if (node.status === 'online' || node.status === 'syncing') {
                ctx.beginPath();
                ctx.strokeStyle = node.color;
                ctx.lineWidth = 1.5 / globalScale;
                ctx.arc(node.x, node.y, rad * 1.5, 0, 2 * Math.PI, false);
                ctx.stroke();
            }
        }

        // Draw Label
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(label, node.x, node.y + rad * 2 + (6 / globalScale));

        ctx.restore();
    }, []);

    // 3. Force Engine Config - Compact layout
    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('charge')?.strength(-30);
            fgRef.current.d3Force('link')?.distance(40);
        }
    }, []);

    return (
        <ForceGraph2D
            ref={fgRef as any}
            width={width}
            height={height}
            graphData={graphData}
            nodeCanvasObject={paintNode}
            nodeLabel="label"
            nodeRelSize={6} // Makes links stop at outer edge of nodes

            // Link Styling
            linkColor={() => '#3f3f46'}
            linkWidth={1.5}

            // Particles (Data Flow)
            linkDirectionalParticles="particleCount"
            linkDirectionalParticleSpeed="particleSpeed"
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleColor={() => '#10b981'}

            // Interaction
            onNodeClick={onNodeClick}
            backgroundColor="rgba(0,0,0,0)"

            // Physics - DISABLED animation loop (static layout)
            cooldownTicks={0}
            warmupTicks={100}
            onEngineStop={() => {
                // Dynamic padding: more nodes = more padding to keep graph smaller
                const nodeCount = graphData.nodes.length;
                const padding = Math.max(100, nodeCount * 30); // Min 100px, +30px per node
                fgRef.current?.zoomToFit(200, padding);
            }}
        />
    );
};

export default NetworkGraph;
