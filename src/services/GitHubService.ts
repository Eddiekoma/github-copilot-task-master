import { Octokit } from '@octokit/rest';
import * as vscode from 'vscode';

export interface GitHubIssue {
    id: number;
    title: string;
    body: string;
    state: 'open' | 'closed';
    labels: string[];
    assignees: string[];
    milestone?: string;
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
        // Try to detect from git remote
        const gitExtension = vscode.extensions.getExtension('vscode.git');
        if (gitExtension) {
            const git = gitExtension.exports.getAPI(1);
            const repo = git.repositories[0];
            if (repo) {
                const remotes = await repo.getRemotes();
                const origin = remotes.find(r => r.name === 'origin');
                if (origin && origin.fetchUrl) {
                    const match = origin.fetchUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
                    if (match) {
                        this.owner = match[1];
                        this.repo = match[2];
                    }
                }
            }
        }
    }

    async createIssue(title: string, body: string, labels: string[] = []): Promise<GitHubIssue | null> {
        if (!this.octokit || !this.owner || !this.repo) {
            vscode.window.showErrorMessage('GitHub not configured properly');
            return null;
        }

        try {
            const response = await this.octokit.issues.create({
                owner: this.owner,
                repo: this.repo,
                title,
                body,
                labels
            });

            return {
                id: response.data.number,
                title: response.data.title,
                body: response.data.body || '',
                state: response.data.state as 'open' | 'closed',
                labels: response.data.labels.map(l => typeof l === 'string' ? l : l.name || ''),
                assignees: response.data.assignees?.map(a => a.login) || []
            };
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create issue: ${error}`);
            return null;
        }
    }

    async getIssues(): Promise<GitHubIssue[]> {
        if (!this.octokit || !this.owner || !this.repo) {
            return [];
        }

        try {
            const response = await this.octokit.issues.listForRepo({
                owner: this.owner,
                repo: this.repo,
                state: 'all'
            });

            return response.data.map(issue => ({
                id: issue.number,
                title: issue.title,
                body: issue.body || '',
                state: issue.state as 'open' | 'closed',
                labels: issue.labels.map(l => typeof l === 'string' ? l : l.name || ''),
                assignees: issue.assignees?.map(a => a.login) || []
            }));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to fetch issues: ${error}`);
            return [];
        }
    }

    async updateIssue(issueNumber: number, updates: Partial<GitHubIssue>): Promise<boolean> {
        if (!this.octokit || !this.owner || !this.repo) {
            return false;
        }

        try {
            await this.octokit.issues.update({
                owner: this.owner,
                repo: this.repo,
                issue_number: issueNumber,
                title: updates.title,
                body: updates.body,
                state: updates.state,
                labels: updates.labels
            });
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to update issue: ${error}`);
            return false;
        }
    }
}
