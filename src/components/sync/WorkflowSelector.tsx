import { useWorkflowStore } from '../../store/workflowStore';
import { ChevronDown, Plus, Check, FolderGit2 } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

export const WorkflowSelector = () => {
    const { workflows, activeWorkflowId, setActiveWorkflow, createWorkflow } = useWorkflowStore();
    const [isOpen, setIsOpen] = useState(false);

    const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);

    const handleCreate = () => {
        const name = `Project ${workflows.length + 1}`;
        const id = createWorkflow(name);
        setActiveWorkflow(id);
        setIsOpen(false);
    };

    return (
        <div className="relative mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-700", {
                        "bg-yellow-500/20 text-yellow-500": activeWorkflowId
                    })}>
                        <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Current Workflow</p>
                        <p className="text-sm font-semibold text-white truncate max-w-[120px]">
                            {activeWorkflow?.name || "No Selection"}
                        </p>
                    </div>
                </div>
                <ChevronDown className={clsx("w-4 h-4 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden text-sm">
                    <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                        <button
                            onClick={() => { setActiveWorkflow(null); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-between"
                        >
                            <span>All Folders (Default)</span>
                            {!activeWorkflowId && <Check className="w-3 h-3 text-yellow-500" />}
                        </button>

                        {workflows.map(wf => (
                            <button
                                key={wf.id}
                                onClick={() => { setActiveWorkflow(wf.id); setIsOpen(false); }}
                                className="w-full text-left px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/50 group-hover:bg-yellow-500 transition-colors" />
                                    <span className="truncate max-w-[150px]">{wf.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {activeWorkflowId === wf.id && <Check className="w-3 h-3 text-yellow-500" />}
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete workflow "${wf.name}" and all local folder references?`)) {
                                                useWorkflowStore.getState().removeWorkflow(wf.id);
                                                if (activeWorkflowId === wf.id) setActiveWorkflow(null);
                                            }
                                        }}
                                        className="p-1 hover:bg-red-500/20 rounded text-zinc-600 hover:text-red-500 transition-colors"
                                        title="Delete Workflow"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="p-2 border-t border-zinc-800 bg-zinc-900/50">
                        <button
                            onClick={handleCreate}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors text-xs font-medium"
                        >
                            <Plus className="w-3 h-3" />
                            New Workflow
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
