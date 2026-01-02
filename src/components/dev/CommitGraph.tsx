import { useState, useEffect } from 'react';
import { Gitgraph, templateExtend, TemplateName } from '@gitgraph/react';
import { Card } from '../ui/Card';
import { Loader2 } from 'lucide-react';

interface CommitGraphProps {
    repoPath: string;
    refreshTrigger: number; // Increment to force refresh
}

export const CommitGraph = ({ repoPath, refreshTrigger }: CommitGraphProps) => {
    const [commits, setCommits] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                // Use the new getGraphData API which returns deduplicated commits from all branches
                const logs = await window.electronAPI.gitGraphData(repoPath);
                setCommits(logs);
            } catch (err) {
                console.error(err);
                setCommits([]);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [repoPath, refreshTrigger]);

    if (isLoading && commits.length === 0) {
        return <div className="p-8 flex items-center justify-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    }

    if (commits.length === 0) {
        return <div className="p-8 text-center text-zinc-500">No commits found.</div>;
    }

    return (
        <Card className="h-full overflow-hidden flex flex-col pt-4 bg-zinc-900/50 border-zinc-800">
            <div className="flex-1 overflow-auto px-4 custom-scrollbar">
                <Gitgraph options={{
                    template: templateExtend(TemplateName.Metro, {
                        colors: ["#3b82f6", "#eab308", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"],
                        branch: {
                            label: {
                                display: true,
                                borderRadius: 4,
                                font: "bold 10px Inter"
                            }
                        },
                        commit: {
                            message: {
                                displayAuthor: true,
                                displayHash: false,
                            },
                            dot: {
                                size: 6,
                                strokeWidth: 2
                            }
                        }
                    })
                }}>
                    {(gitgraph) => {
                        const reversed = [...commits].reverse();
                        const master = gitgraph.branch("History");

                        reversed.forEach(c => {
                            master.commit({
                                subject: c.message,
                                author: c.author,
                                hash: c.oid,
                                // Use 'tag' for simple label display to avoid TS errors with 'refs'
                                // if the library requires it.
                                tag: c.refs && c.refs.length > 0 ? c.refs[0] : undefined
                            });
                        });
                    }}
                </Gitgraph>
            </div>
        </Card>
    );
};
