import * as vscode from 'vscode';

export class Config {
    private static instance: Config;
    
    private constructor() {}

    static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

    get<T>(key: string): T | undefined {
        const config = vscode.workspace.getConfiguration('taskMaster');
        return config.get<T>(key);
    }

    async update(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Promise<void> {
        const config = vscode.workspace.getConfiguration('taskMaster');
        await config.update(key, value, target);
    }

    getGitHubToken(): string | undefined {
        return this.get<string>('github.token');
    }

    getAIApiKey(): string | undefined {
        return this.get<string>('ai.apiKey');
    }

    getAIModel(): string {
        return this.get<string>('ai.model') || 'gpt-4';
    }
}