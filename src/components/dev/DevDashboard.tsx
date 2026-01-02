import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { useWorkflowStore, type SyncedFolder } from '../../store/workflowStore';
import { GitBranch, GitCommit, Play, RefreshCw, FolderGit, Check, Clock, Layers, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { CommitGraph } from './CommitGraph';
import { GitHubDashboard } from './GitHubDashboard';

interface GitStatus {
    path: string;
    status: string;
}

type ViewMode = 'changes' | 'history' | 'github';

export const DevDashboard = () => {
    const { workflows, activeWorkflowId } = useWorkflowStore();
    const [selectedFolder, setSelectedFolder] = useState<SyncedFolder | null>(null);
    const [status, setStatus] = useState<GitStatus[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<ViewMode>('changes');
    const [refreshGraph, setRefreshGraph] = useState(0); // Trigger graph refresh

    // Commit State
    const [commitMessage, setCommitMessage] = useState('');
    const [isCommitting, setIsCommitting] = useState(false);
    const [showCommitOptions, setShowCommitOptions] = useState(false);
    const optionsRef = useRef<HTMLDivElement>(null);

    const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);

    // Derived State
    const staged = status.filter(f => ['added', 'deleted', 'staged'].includes(f.status) || f.status === '*modified');
    const working = status.filter(f => ['modified', 'untracked', '*modified'].includes(f.status));

    useEffect(() => {
        if (activeWorkflow && activeWorkflow.folders.length > 0 && !selectedFolder) {
            setSelectedFolder(activeWorkflow.folders[0]);
        }
    }, [activeWorkflow]);

    useEffect(() => {
        if (selectedFolder) {
            loadStatus(selectedFolder.path);
        }
    }, [selectedFolder]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setShowCommitOptions(false);
            }
        };

        if (showCommitOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCommitOptions]);

    const loadStatus = async (path: string) => {
        setIsLoading(true);
        try {
            const res = await window.electronAPI.gitStatus(path);
            setStatus(res);
        } catch (err) {
            console.error(err);
            setStatus([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInit = async () => {
        if (!selectedFolder) return;
        setIsLoading(true);
        try {
            await window.electronAPI.gitInit(selectedFolder.path);
            await loadStatus(selectedFolder.path);
        } catch (err) {
            alert('Failed to init repo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStage = async (file: GitStatus) => {
        if (!selectedFolder) return;
        try {
            await window.electronAPI.gitStage(selectedFolder.path, file.path);
            loadStatus(selectedFolder.path);
        } catch (err) {
            console.error("Stage failed", err);
        }
    };

    const handleUnstage = async (file: GitStatus) => {
        if (!selectedFolder) return;
        try {
            await window.electronAPI.gitUnstage(selectedFolder.path, file.path);
            loadStatus(selectedFolder.path);
        } catch (err) {
            console.error("Unstage failed", err);
        }
    };

    const handleCommit = async () => {
        if (!selectedFolder || !commitMessage) return;
        setIsCommitting(true);
        try {
            await window.electronAPI.gitCommit(selectedFolder.path, commitMessage, {
                name: "MegaSync User",
                email: "user@megasync.local"
            });
            setCommitMessage('');
            loadStatus(selectedFolder.path);
            if (view === 'history') setRefreshGraph(prev => prev + 1);
        } catch (err) {
            console.error("Commit failed", err);
            alert("Commit failed: " + err);
        } finally {
            setIsCommitting(false);
        }
    };

    const handleCommitAndPush = async () => {
        if (!selectedFolder || !commitMessage) return;
        setIsCommitting(true);
        try {
            // 1. Commit
            await window.electronAPI.gitCommit(selectedFolder.path, commitMessage, {
                name: "MegaSync User",
                email: "user@megasync.local"
            });

            // 2. Push
            await window.electronAPI.gitPush(selectedFolder.path);

            setCommitMessage('');
            loadStatus(selectedFolder.path);
            if (view === 'history') setRefreshGraph(prev => prev + 1);
            alert("Commit & Sync Push Successful");
        } catch (err) {
            console.error("Commit & Push failed", err);
            alert("Operation failed: " + err);
        } finally {
            setIsCommitting(false);
            setShowCommitOptions(false);
        }
    };

    // --- Remote Sync Actions ---
    const handlePushSync = async () => {
        if (!selectedFolder) return;
        if (!confirm('Push local changes to Sync Remote?')) return;
        setIsLoading(true);
        try {
            await window.electronAPI.gitPush(selectedFolder.path);
            alert('Push Successful (Synced)');
        } catch (e) { alert('Push Failed: ' + e); }
        setIsLoading(false);
    };

    const handlePullSync = async () => {
        if (!selectedFolder) return;
        if (!confirm('Pull changes from Sync Remote?')) return;
        setIsLoading(true);
        try {
            await window.electronAPI.gitPull(selectedFolder.path);
            loadStatus(selectedFolder.path);
            setRefreshGraph(p => p + 1);
            alert('Pull Successful');
        } catch (e) { alert('Pull Failed: ' + e); }
        setIsLoading(false);
    };

    const CheckAllDone = () => (
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <GitCommit className="w-6 h-6 text-emerald-500" />
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
            {/* Sidebar: Repositories */}
            <Card className="lg:col-span-1 flex flex-col p-0 overflow-hidden bg-zinc-900/50">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Repositories</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {!activeWorkflow ? (
                        <div className="p-4 text-zinc-500 text-sm text-center">Select a Workflow in Sync Center first.</div>
                    ) : activeWorkflow.folders.length === 0 ? (
                        <div className="p-4 text-zinc-500 text-sm text-center">No folders in this workflow.</div>
                    ) : (
                        activeWorkflow.folders.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder)}
                                className={clsx(
                                    "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors",
                                    selectedFolder?.id === folder.id
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                )}
                            >
                                <GitBranch className="w-4 h-4 shrink-0" />
                                <span className="truncate">{folder.label}</span>
                            </button>
                        ))
                    )}
                </div>
            </Card>

            {/* Main Area */}
            <div className="lg:col-span-3 flex flex-col gap-6">
                {selectedFolder ? (
                    <>
                        {/* Header & Tabs */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <div className="min-w-0">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    {selectedFolder.label}
                                    <span className="text-sm font-normal text-zinc-500 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono">
                                        master
                                    </span>
                                </h2>
                                <p className="text-zinc-500 text-xs font-mono mt-1">{selectedFolder.path}</p>
                            </div>

                            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 self-start">
                                <button
                                    onClick={() => setView('changes')}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                                        view === 'changes' ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    <Layers className="w-4 h-4" />
                                    Changes
                                </button>
                                <button
                                    onClick={() => { setView('history'); setRefreshGraph(prev => prev + 1); }}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                                        view === 'history' ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    <Clock className="w-4 h-4" />
                                    History
                                </button>
                                <button
                                    onClick={() => setView('github')}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                                        view === 'github' ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    <GitBranch className="w-4 h-4" />
                                    GitHub
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        {view === 'changes' ? (
                            <div className="flex flex-col gap-4 flex-1 min-h-0">
                                {/* Commit Bar & Controls */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={commitMessage}
                                            onChange={(e) => setCommitMessage(e.target.value)}
                                            placeholder="Message (e.g. 'Fix login bug')"
                                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none hover:border-zinc-700 transition-colors"
                                        />

                                        {/* Split Button */}
                                        <div className="relative flex shadow-lg shadow-blue-900/20" ref={optionsRef}>
                                            <button
                                                onClick={handleCommit}
                                                disabled={!commitMessage || staged.length === 0 || isCommitting}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-l-lg text-sm font-medium transition-colors flex items-center gap-2 border-r border-blue-700"
                                            >
                                                {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                Commit
                                            </button>
                                            <button
                                                onClick={() => setShowCommitOptions(!showCommitOptions)}
                                                disabled={!commitMessage || staged.length === 0 || isCommitting}
                                                className="px-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-r-lg transition-colors flex items-center justify-center"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>

                                            {/* Dropdown */}
                                            {showCommitOptions && (
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                                    <button
                                                        onClick={handleCommitAndPush}
                                                        className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                                                    >
                                                        <ArrowUp className="w-4 h-4" />
                                                        Commit & Push Sync
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => loadStatus(selectedFolder.path)}
                                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors"
                                            title="Refresh Status"
                                        >
                                            <RefreshCw className={clsx("w-5 h-5", isLoading && "animate-spin")} />
                                        </button>
                                    </div>

                                    {/* Sync Controls (Below the bar) */}
                                    <div className="flex items-center gap-4 px-1">
                                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                                            <span>REMOTE SYNC OPERATIONS:</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handlePullSync}
                                                className="text-xs flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-all"
                                                title="Pull changes from remote sync"
                                            >
                                                <ArrowDown className="w-3.5 h-3.5" />
                                                Pull Sync
                                            </button>
                                            <button
                                                onClick={handlePushSync}
                                                className="text-xs flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-all"
                                                title="Push changes to remote sync"
                                            >
                                                <ArrowUp className="w-3.5 h-3.5" />
                                                Push Sync
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                                    {/* Working Directory */}
                                    <Card title="Changes" className="flex flex-col min-h-0 bg-red-950/5 border-red-500/20">
                                        <div className="flex-1 overflow-y-auto -mx-2 px-2">
                                            {working.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3 opacity-50">
                                                    <CheckAllDone />
                                                    <p>No changes</p>
                                                    {!status.length && !isLoading && (
                                                        <button onClick={handleInit} className="text-xs text-blue-400 hover:underline">Init Repo?</button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {working.map((file) => (
                                                        <div
                                                            key={file.path}
                                                            onClick={() => handleStage(file)}
                                                            className="flex items-center gap-2 p-2 hover:bg-zinc-800/50 rounded cursor-pointer group transition-colors"
                                                        >
                                                            <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0",
                                                                file.status === 'modified' ? "bg-yellow-500" :
                                                                    file.status === 'untracked' ? "bg-red-500" : "bg-zinc-500"
                                                            )} />
                                                            <span className="text-sm text-zinc-300 truncate flex-1">{file.path}</span>
                                                            <span className="text-[10px] text-zinc-600 uppercase group-hover:text-zinc-400">Stage</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </Card>

                                    {/* Staged Area */}
                                    <Card title="Staged Changes" className="flex flex-col min-h-0 bg-emerald-950/5 border-emerald-500/20">
                                        <div className="flex-1 overflow-y-auto -mx-2 px-2">
                                            {staged.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2 opacity-50">
                                                    <FolderGit className="w-12 h-12 text-zinc-800" />
                                                    <p>Stage is empty</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {staged.map((file) => (
                                                        <div
                                                            key={file.path}
                                                            onClick={() => handleUnstage(file)}
                                                            className="flex items-center gap-2 p-2 hover:bg-zinc-800/50 rounded cursor-pointer group transition-colors"
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-500" />
                                                            <span className="text-sm text-zinc-300 truncate flex-1">{file.path}</span>
                                                            <span className="text-[10px] text-zinc-600 uppercase group-hover:text-zinc-400">Unstage</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        ) : view === 'history' ? (
                            // History/Graph View
                            <div className="flex-1 min-h-0">
                                <CommitGraph repoPath={selectedFolder.path} refreshTrigger={refreshGraph} />
                            </div>
                        ) : (
                            // GitHub View
                            <div className="flex-1 min-h-0">
                                <GitHubDashboard />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                        <GitBranch className="w-16 h-16 text-zinc-800 mb-4" />
                        <p className="text-lg">Select a repository to start</p>
                    </div>
                )}
            </div>
        </div>
    );
};
