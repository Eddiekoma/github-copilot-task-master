import { GitHubClient } from './githubClient';

export interface GitHubProject {
    id: number;
    name: string;
    body: string;
    state: 'open' | 'closed';
    created_at: string;
    updated_at: string;
}

export class GitHubProjectManager {
    constructor(private githubClient: GitHubClient) {}

    async createProject(owner: string, repo: string, name: string, body: string) {
        const client = this.githubClient.getClient();
        
        // Note: Projects v2 requires GraphQL API
        // This is a simplified version
        const response = await client.request('POST /repos/{owner}/{repo}/projects', {
            owner,
            repo,
            name,
            body,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        return response.data;
    }

    async listProjects(owner: string, repo: string) {
        const client = this.githubClient.getClient();
        
        const response = await client.request('GET /repos/{owner}/{repo}/projects', {
            owner,
            repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        return response.data;
    }
}