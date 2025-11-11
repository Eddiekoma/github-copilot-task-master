import { Octokit } from '@octokit/rest';
import * as vscode from 'vscode';

export class GitHubClient {
    private octokit: Octokit | null = null;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        const config = vscode.workspace.getConfiguration('taskMaster');
        const token = config.get<string>('github.token');

        if (token) {
            this.octokit = new Octokit({ auth: token });
        }
    }

    isAuthenticated(): boolean {
        return this.octokit !== null;
    }

    getClient(): Octokit {
        if (!this.octokit) {
            throw new Error('GitHub client not initialized. Please set your GitHub token.');
        }
        return this.octokit;
    }

    async updateToken(token: string) {
        this.octokit = new Octokit({ auth: token });
        const config = vscode.workspace.getConfiguration('taskMaster');
        await config.update('github.token', token, vscode.ConfigurationTarget.Global);
    }
}