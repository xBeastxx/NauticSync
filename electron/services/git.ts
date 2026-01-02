import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

export interface GitStatusEntry {
    path: string;
    status: string; // 'staged', 'modified', 'unmodified', etc.
}

export class GitService {

    public async getStatus(repoPath: string): Promise<GitStatusEntry[]> {
        try {
            // Get generic matrix of file statuses
            const files = await git.statusMatrix({ fs, dir: repoPath });

            // Map matrix to readable objects
            // [filepath, head, workdir, stage]
            // 0: unmodified, 1: modified/added/deleted
            const entries: GitStatusEntry[] = files.map(row => {
                const [filepath, head, workdir, stage] = row;

                let status = 'unmodified';
                if (head === 1 && workdir === 0) status = 'deleted';
                if (head === 0 && workdir === 1) status = 'untracked'; // new
                if (head === 1 && workdir === 2) status = 'modified'; // modified
                if (stage === 1 && head === 1 && workdir === 2) status = '*modified'; // staged and modified
                if (stage === 1 && head === 0 && workdir === 1) status = 'added'; // staged new

                return { path: filepath, status };
            }).filter(f => f.status !== 'unmodified');

            return entries;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                // Not a git repo
                return [];
            }
            // console.error("Git status error:", error);
            throw error;
        }
    }

    public async initRepo(repoPath: string) {
        await git.init({ fs, dir: repoPath });
    }

    public async addToStage(repoPath: string, filepath: string) {
        await git.add({ fs, dir: repoPath, filepath });
    }

    public async removeFromStage(repoPath: string, filepath: string) {
        await git.resetIndex({ fs, dir: repoPath, filepath });
    }

    public async commitChanges(repoPath: string, message: string, author: { name: string, email: string }) {
        await git.commit({
            fs,
            dir: repoPath,
            message,
            author
        });
    }

    public async getBranches(repoPath: string): Promise<string[]> {
        try {
            return await git.listBranches({ fs, dir: repoPath });
        } catch (error) {
            return [];
        }
    }

    public async getLog(repoPath: string, depth = 20): Promise<any[]> {
        try {
            const commits = await git.log({ fs, dir: repoPath, depth });
            return commits.map(c => ({
                oid: c.oid,
                message: c.commit.message,
                author: c.commit.author.name,
                timestamp: c.commit.author.timestamp,
                parent: c.commit.parent
            }));
        } catch (error) {
            return [];
        }
    }

    // Fetch logs from all local branches to build a complete graph
    public async getGraphData(repoPath: string, depth = 50): Promise<any[]> {
        try {
            const branches = await git.listBranches({ fs, dir: repoPath }); // e.g. ['master', 'dev']
            let allCommits = new Map<string, any>();

            for (const branch of branches) {
                try {
                    const commits = await git.log({ fs, dir: repoPath, ref: branch, depth });

                    for (let i = 0; i < commits.length; i++) {
                        const c = commits[i];
                        if (!allCommits.has(c.oid)) {
                            allCommits.set(c.oid, {
                                oid: c.oid,
                                message: c.commit.message,
                                author: c.commit.author.name,
                                timestamp: c.commit.author.timestamp,
                                parents: c.commit.parent,
                                refs: (i === 0) ? [branch] : [] // Only tag the tip
                            });
                        } else {
                            // Merge refs if this existing commit is also a tip of another branch
                            if (i === 0) {
                                const existing = allCommits.get(c.oid);
                                if (!existing.refs.includes(branch)) {
                                    existing.refs.push(branch);
                                }
                            }
                        }
                    }
                } catch (e) {
                    // console.warn(`Failed to log branch ${branch}`, e);
                }
            }

            return Array.from(allCommits.values()).sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error("Graph data error:", error);
            return [];
        }
    }

    // --- Decentralized Remote Logic ---

    public async ensureRemote(repoPath: string): Promise<string> {
        const remotePath = path.join(repoPath, '.megasync', 'git-remote');
        try {
            await fs.promises.mkdir(remotePath, { recursive: true });

            // Check if valid repo
            try {
                await git.resolveRef({ fs, dir: remotePath, ref: 'HEAD' });
            } catch (e) {
                // Not a repo, init bare
                await git.init({ fs, dir: remotePath, bare: true });
            }
            // Ensure 'origin' remote exists in main repo
            try {
                // Check if origin exists
                await git.deleteRemote({ fs, dir: repoPath, remote: 'origin' }); // Clean slate for simplicity or check first
            } catch (e) { } // ignore if not exists

            await git.addRemote({ fs, dir: repoPath, remote: 'origin', url: remotePath });

            return remotePath;
        } catch (err) {
            console.error("Failed to ensure remote:", err);
            throw err;
        }
    }

    public async pushToRemote(repoPath: string) {
        await this.ensureRemote(repoPath);
        // We push current branch. Isomorphic git push needs explicit ref usually if not HEAD.
        // Assuming we are on 'master' or HEAD.
        await git.push({
            fs,
            dir: repoPath,
            remote: 'origin',
            ref: 'master', // TODO: Make dynamic based on current branch
            force: false
        });
    }

    public async pullFromRemote(repoPath: string) {
        await this.ensureRemote(repoPath);
        await git.pull({
            fs,
            dir: repoPath,
            remote: 'origin',
            ref: 'master',
            singleBranch: true,
            author: { name: 'MegaSync', email: 'user@megasync.local' }
        });
    }
}
