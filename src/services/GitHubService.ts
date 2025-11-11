import { Octokit } from '@octokit/rest';
import * as vscode from 'vscode';

export interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    labels?: Array<{ name: string }>;
}

export class GitHubService {
    private octokit: Octokit | null = null;
    private owner: string = '';
    private repo: string = '';

    constructor(private context: vscode.ExtensionContext) {
        this.initialize();
    }

    private async initialize() {
        const config = vscode.workspace.getConfiguration('taskMaster');
        const token = config.get<string>('github.token');
        
        if (token) {
            this.octokit = new Octokit({ auth: token });
            await this.detectRepository();
        }
    }

    private async detectRepository() {
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (gitExtension && gitExtension.isActive) {
                const git = gitExtension.exports.getAPI(1);
                if (git.repositories.length > 0) {
                    const repo = git.repositories[0];
                    const remotes = await repo.getRemotes();
                    const origin = remotes.find((r: { name: string }) => r.name === 'origin');
                    if (origin && origin.fetchUrl) {
                        const match = origin.fetchUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
                        if (match) {
                            this.owner = match[1];
                            this.repo = match[2];
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to detect repository:', error);
        }
    }

    async getIssues(repoName?: string): Promise<GitHubIssue[]> {
        if (!this.octokit) {
            throw new Error('GitHub not authenticated');
        }

        try {
            const response = await this.octokit.issues.listForRepo({
                owner: 'user', // This should be dynamically determined
                repo: repoName || 'repo',  // Use repoName parameter
                state: 'all'
            });

            return response.data.map((issue) => ({
                id: issue.id,
                number: issue.number,
                title: issue.title,
                body: issue.body ?? null,
                state: issue.state as 'open' | 'closed',
                labels: issue.labels.map(label => 
                    typeof label === 'string' ? { name: label } : { name: label.name ?? '' }
                ),
                assignees: issue.assignees?.map(a => ({ login: a?.login ?? '' })) ?? []
            }));
        } catch (error: unknown) {
            console.error('Error fetching issues:', error);
            throw error;
        }
    }

    async createIssue(title: string, body?: string, labels?: string[]): Promise<void> {
        if (!this.octokit) {
            throw new Error('GitHub not authenticated');
        }

        try {
            await this.octokit.issues.create({
                owner: 'user', // This should be dynamically determined
                repo: 'repo',  // This should be dynamically determined
                title,
                body: body || '',
                labels
            });
        } catch (error: unknown) {
            console.error('Error creating issue:', error);
            throw error;
        }
    }

    async updateIssueStatus(issueNumber: number, state: 'open' | 'closed'): Promise<void> {
        if (!this.octokit) {
            throw new Error('GitHub not authenticated');
        }

        try {
            await this.octokit.issues.update({
                owner: 'user', // This should be dynamically determined
                repo: 'repo',  // This should be dynamically determined
                // eslint-disable-next-line @typescript-eslint/naming-convention
                issue_number: issueNumber,
                state
            });
        } catch (error: unknown) {
            console.error('Error updating issue:', error);
            throw error;
        }
    }

    async createRepository(name: string, description?: string): Promise<void> {
        if (!this.octokit) {
            throw new Error('GitHub not authenticated');
        }

        try {
            await this.octokit.repos.createForAuthenticatedUser({
                name,
                description,
                private: false,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                auto_init: true
            });
        } catch (error: unknown) {
            console.error('Error creating repository:', error);
            throw error;
        }
    }
}
