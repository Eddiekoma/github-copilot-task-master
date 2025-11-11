import { GitHubClient } from './githubClient';

export interface GitHubIssue {
    id: number;
    title: string;
    body: string;
    state: 'open' | 'closed';
    labels: string[];
    assignee?: string;
    created_at: string;
    updated_at: string;
}

export class IssueManager {
    constructor(private githubClient: GitHubClient) {}

    async createIssue(owner: string, repo: string, title: string, body: string, labels?: string[]) {
        const client = this.githubClient.getClient();
        
        const response = await client.issues.create({
            owner,
            repo,
            title,
            body,
            labels
        });

        return response.data;
    }

    async listIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
        const client = this.githubClient.getClient();
        
        const response = await client.issues.listForRepo({
            owner,
            repo,
            state
        });

        return response.data;
    }

    async updateIssue(owner: string, repo: string, issueNumber: number, updates: Partial<GitHubIssue>) {
        const client = this.githubClient.getClient();
        
        const response = await client.issues.update({
            owner,
            repo,
            issue_number: issueNumber,
            ...updates
        });

        return response.data;
    }

    async closeIssue(owner: string, repo: string, issueNumber: number) {
        return this.updateIssue(owner, repo, issueNumber, { state: 'closed' });
    }
}