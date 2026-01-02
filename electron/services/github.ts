import { Octokit } from '@octokit/rest';
// import Store from 'electron-store'; // Cannot import ESM in CJS directly

interface GitHubStore {
    token: string | null;
}

export class GitHubService {
    private octokit: Octokit | null = null;
    private store: any = null; // Dynamically loaded

    constructor() { }

    async init() {
        const { default: Store } = await import('electron-store');
        this.store = new Store<GitHubStore>({
            name: 'github-config',
            defaults: { token: null }
        });

        const existingToken = this.store.get('token');
        if (existingToken) {
            this.initializeClient(existingToken);
        }
    }

    private initializeClient(token: string) {
        this.octokit = new Octokit({ auth: token });
    }

    async login(token: string) {
        try {
            const octokit = new Octokit({ auth: token });
            // Verify token by getting user
            const { data: user } = await octokit.users.getAuthenticated();

            // If success, save and set
            this.store.set('token', token);
            this.octokit = octokit;
            return user;
        } catch (error) {
            console.error('GitHub Login Failed:', error);
            throw new Error('Invalid Token or Network Error');
        }
    }

    async logout() {
        this.store.delete('token');
        this.octokit = null;
    }

    async getUser() {
        if (!this.octokit) return null;
        try {
            const { data } = await this.octokit.users.getAuthenticated();
            return data;
        } catch (error) {
            console.error('Failed to get user:', error);
            return null;
        }
    }

    async getRepos(page = 1, perPage = 30) {
        if (!this.octokit) throw new Error('Not authenticated');
        try {
            const { data } = await this.octokit.repos.listForAuthenticatedUser({
                sort: 'updated',
                per_page: perPage,
                page: page,
                affiliation: 'owner,collaborator,organization_member'
            });
            return data;
        } catch (error) {
            throw error;
        }
    }

    async getRepoContents(owner: string, repo: string, path: string = '') {
        if (!this.octokit) throw new Error('Not authenticated');
        try {
            const { data } = await this.octokit.repos.getContent({
                owner,
                repo,
                path
            });
            return data;
        } catch (error) {
            console.error('Failed to fetch contents:', error);
            throw error;
        }
    }

    async downloadFile(url: string, targetPath: string) {
        try {
            const axios = await import('axios');
            const fs = await import('fs');

            const response = await axios.default({
                url,
                method: 'GET',
                responseType: 'stream',
            });

            const writer = fs.createWriteStream(targetPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }
}
