import React, { useState, useEffect } from 'react';
import { Lock, LogOut, Github, Code2, Download, RefreshCw, Folder, File, ChevronRight, CornerUpLeft, ArrowLeft } from 'lucide-react';
import { Card } from '../ui/Card';

interface GitHubUser {
    login: string;
    avatar_url: string;
    html_url: string;
}

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
    private: boolean;
    html_url: string;
    description: string | null;
    updated_at: string;
    language: string | null;
}

interface RepoContent {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: 'file' | 'dir';
}

export const GitHubDashboard: React.FC = () => {
    const [token, setToken] = useState('');
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // File Browser State
    const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
    const [currentPath, setCurrentPath] = useState('');
    const [contents, setContents] = useState<RepoContent[]>([]);
    const [browserLoading, setBrowserLoading] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const currentUser = await window.electronAPI.githubUser();
            if (currentUser) {
                setUser(currentUser);
                fetchRepos();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const user = await window.electronAPI.githubLogin(token);
            setUser(user);
            fetchRepos();
        } catch (err) {
            setError("Authentication failed. " + err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await window.electronAPI.githubLogout();
        setUser(null);
        setRepos([]);
        setToken('');
        setSelectedRepo(null);
    };

    const fetchRepos = async () => {
        setLoading(true);
        try {
            const data = await window.electronAPI.githubRepos();
            setRepos(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Browser Logic ---
    const openRepoBrowser = (repo: GitHubRepo) => {
        setSelectedRepo(repo);
        setCurrentPath('');
        loadContents(repo, '');
    };

    const loadContents = async (repo: GitHubRepo, path: string) => {
        setBrowserLoading(true);
        try {
            const data = await window.electronAPI.getRepoContents(repo.owner.login, repo.name, path);
            // Sort: folders first, then files
            const sorted = Array.isArray(data) ? data.sort((a: any, b: any) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'dir' ? -1 : 1;
            }) : [data]; // Single file case (rare here)

            setContents(sorted);
            setCurrentPath(path);
        } catch (err) {
            console.error("Failed to load contents", err);
            alert("Failed to load folder contents.");
        } finally {
            setBrowserLoading(false);
        }
    };

    const handleNavigate = (folderName: string) => {
        if (!selectedRepo) return;
        const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        loadContents(selectedRepo, newPath);
    };

    const handleGoUp = () => {
        if (!selectedRepo) return;
        const parts = currentPath.split('/');
        parts.pop();
        const newPath = parts.join('/');
        loadContents(selectedRepo, newPath);
    };

    const handleDownloadFile = async (file: RepoContent) => {
        if (!file.download_url) return;
        if (!confirm(`Download ${file.name}?`)) return;

        try {
            // Simplified for prototype: download to Downloads folder or request path
            // For now, let's just use a hardcoded safe path logic or simple alert
            // Ideally we'd open a save dialog. 
            // Since we don't have a dialog API exposed, we'll download to a 'Downloads' subfolder in the userData logic
            // But we have downloadFile taking a targetPath.
            // Let's ask user to confirm it goes to "Downloads/MegaSync_Downloads/{filename}"

            // Wait, we can't easily get the user's home dir here without an API.
            // Let's just mock the path for the example or assume a specific one.
            // Or better: ask the main process to pick a location? 
            // For this iteration, let's assume we save to the current User Data / Downloads folder.

            // Actually, let's try to just download it to the default app path for now to prove it works.
            // window.electronAPI.downloadFile(file.download_url, ...);

            // FIXME: We need a 'saveFile' dialog exposure or a default download path.
            // For now, show alert not implemented fully or try a fixed temp path.
            alert("Download started in background (Mock). Implementation requires 'save dialog' API.");

            // Real call would be:
            // await window.electronAPI.downloadFile(file.download_url, `C:/Downloads/${file.name}`);

        } catch (err) {
            alert("Download failed: " + err);
        }
    };


    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-gray-400">
                <Github size={64} className="mb-6 text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-100 mb-2">Connect to GitHub</h2>
                <p className="mb-6 text-center max-w-md">
                    Enter a Personal Access Token to manage your repositories directly within SyncMaster.
                </p>

                <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-4">
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                        <input
                            type="password"
                            placeholder="Personal Access Token (ghp_...)"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-gray-100 focus:outline-none focus:border-amber-500 transition-colors"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gray-100 hover:bg-white text-black font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Connecting...' : 'Connect to GitHub'}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                        We store your token securely in the local keystore. It is never sent to our servers.
                    </p>
                </form>
            </div>
        );
    }

    // --- BROWSER VIEW ---
    if (selectedRepo) {
        return (
            <div className="h-full flex flex-col gap-4">
                {/* Browser Header */}
                <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <button
                        onClick={() => setSelectedRepo(null)}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            {selectedRepo.private && <Lock className="w-4 h-4 text-amber-500" />}
                            {selectedRepo.name}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono mt-1">
                            <span>root</span>
                            {currentPath.split('/').filter(Boolean).map((part, i) => (
                                <React.Fragment key={i}>
                                    <ChevronRight className="w-3 h-3" />
                                    <span>{part}</span>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-y-auto">
                    {browserLoading ? (
                        <div className="flex h-full items-center justify-center text-zinc-500 gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin" /> Loading...
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800/50">
                            {currentPath && (
                                <button
                                    onClick={handleGoUp}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/50 text-amber-500 text-sm font-medium text-left transition-colors"
                                >
                                    <CornerUpLeft className="w-4 h-4" />
                                    ..
                                </button>
                            )}

                            {contents.map((item) => (
                                <div
                                    key={item.sha}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 group transition-colors"
                                >
                                    <button
                                        onClick={() => item.type === 'dir' ? handleNavigate(item.name) : null}
                                        className={`flex-1 flex items-center gap-3 text-sm text-left ${item.type === 'dir' ? 'text-zinc-200 font-medium' : 'text-zinc-400'}`}
                                    >
                                        {item.type === 'dir' ? (
                                            <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                                        ) : (
                                            <File className="w-4 h-4 text-zinc-600" />
                                        )}
                                        {item.name}
                                    </button>

                                    {item.type === 'file' && (
                                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                                            <span>{(item.size / 1024).toFixed(1)} KB</span>
                                            <button
                                                onClick={() => handleDownloadFile(item)}
                                                className="p-1.5 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100"
                                                title="Download File"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {contents.length === 0 && (
                                <div className="p-8 text-center text-zinc-500 text-sm">Empty directory</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- REPO LIST VIEW ---
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between border border-gray-700">
                <div className="flex items-center gap-4">
                    <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-full border border-gray-600" />
                    <div>
                        <h3 className="text-white font-medium">{user.login}</h3>
                        <a href={user.html_url} target="_blank" rel="noreferrer" className="text-amber-500 text-xs hover:underline">View Profile</a>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchRepos} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm transition-colors">
                        <LogOut size={14} />
                        Disconnect
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {repos.map((repo) => (
                    <div key={repo.id} className="bg-[#111111] hover:bg-[#161616] border border-gray-800 hover:border-gray-600 rounded-xl p-4 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                                <h4 className="text-gray-100 font-medium truncate flex items-center gap-2">
                                    {repo.private && <Lock size={12} className="text-amber-500" />}
                                    {repo.name}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">{repo.full_name}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2 h-10 mb-4">
                            {repo.description || 'No description provided.'}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                            <div className="flex items-center gap-3">
                                {repo.language && (
                                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
                                        {repo.language}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openRepoBrowser(repo)}
                                    className="p-1.5 hover:bg-gray-700 rounded-md text-gray-500 group-hover:text-amber-400 transition-colors"
                                    title="Browse Files"
                                >
                                    <Code2 size={16} />
                                </button>
                                <button className="p-1.5 hover:bg-gray-700 rounded-md text-gray-500 group-hover:text-green-400 transition-colors" title="Clone to Sync Folder">
                                    <Download size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
