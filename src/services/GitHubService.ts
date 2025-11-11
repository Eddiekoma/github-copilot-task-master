import { Octokit } from '@octokit/rest';
import * as vscode from 'vscode';
import { AITask, ProjectFile } from '../types/projectModels';

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

    /**
     * Create a GitHub issue with AI-ready prompt format
     */
    async createAIPromptIssue(task: AITask, projectFile: ProjectFile): Promise<number> {
        if (!this.octokit || !this.owner || !this.repo) {
            throw new Error('GitHub not configured. Please set repository and authentication.');
        }

        const issueBody = this.buildIssueBody(task, projectFile);
        const issuePrefix = projectFile.github?.issuePrefix || 'TASK';
        
        try {
            const issue = await this.octokit.issues.create({
                owner: this.owner,
                repo: this.repo,
                title: `${issuePrefix}-${task.id}: ${task.title}`,
                body: issueBody,
                labels: ['ai-prompt', `priority-${task.priority}`, ...task.labels],
            });
            
            console.log(`[GitHubService] Created issue #${issue.data.number}: ${task.title}`);
            return issue.data.number;
        } catch (error: unknown) {
            console.error('[GitHubService] Error creating AI prompt issue:', error);
            throw error;
        }
    }

    /**
     * Build comprehensive issue body with AI prompt structure
     */
    private buildIssueBody(task: AITask, projectFile: ProjectFile): string {
        const sections: string[] = [];

        // Header
        sections.push(`# 🎯 ${task.title}\n`);

        // Project Context
        sections.push(`## Project Context`);
        sections.push(`**Project:** ${task.aiPrompt.projectContext.projectName}`);
        sections.push(`**Goal:** ${task.aiPrompt.projectContext.projectGoal}`);
        sections.push(`**Architecture:** ${task.aiPrompt.projectContext.architecture}`);
        sections.push(`**Tech Stack:** ${task.aiPrompt.projectContext.technicalStack.join(', ')}\n`);

        // Task Goal
        sections.push(`## 📝 Task Goal`);
        sections.push(`${task.aiPrompt.taskGoal}\n`);

        // Detailed Description
        sections.push(`## 📖 Detailed Description`);
        sections.push(`${task.aiPrompt.detailedDescription}\n`);

        // Acceptance Criteria
        if (task.aiPrompt.acceptanceCriteria.length > 0) {
            sections.push(`## ✅ Acceptance Criteria`);
            task.aiPrompt.acceptanceCriteria.forEach((ac, i) => {
                sections.push(`### Criterion ${i + 1}`);
                sections.push(`- **Given:** ${ac.given}`);
                sections.push(`- **When:** ${ac.when}`);
                sections.push(`- **Then:** ${ac.then}`);
                sections.push('');
            });
        }

        // Technical Requirements
        if (task.aiPrompt.technicalRequirements.length > 0) {
            sections.push(`## 🔧 Technical Requirements`);
            task.aiPrompt.technicalRequirements.forEach(tr => {
                sections.push(`- **${tr.name}** ${tr.version || ''}`);
                sections.push(`  - Purpose: ${tr.reason}`);
                if (tr.documentation) {
                    sections.push(`  - 📚 [Documentation](${tr.documentation})`);
                }
            });
            sections.push('');
        }

        // Code Examples
        if (task.aiPrompt.exampleCode && task.aiPrompt.exampleCode.length > 0) {
            sections.push(`## 💡 Code Examples`);
            task.aiPrompt.exampleCode.forEach(ex => {
                sections.push(`### ${ex.explanation}`);
                sections.push(`\`\`\`${ex.language}`);
                sections.push(ex.code);
                sections.push(`\`\`\``);
                sections.push('');
            });
        }

        // Design Patterns
        if (task.aiPrompt.designPatterns && task.aiPrompt.designPatterns.length > 0) {
            sections.push(`## 🎨 Design Patterns`);
            task.aiPrompt.designPatterns.forEach(pattern => {
                sections.push(`- ${pattern}`);
            });
            sections.push('');
        }

        // Constraints
        if (task.aiPrompt.constraints.length > 0) {
            sections.push(`## ⚠️ Constraints & Considerations`);
            task.aiPrompt.constraints.forEach(c => {
                sections.push(`- **[${c.type}]** ${c.description}`);
            });
            sections.push('');
        }

        // Potential Pitfalls
        if (task.aiPrompt.potentialPitfalls.length > 0) {
            sections.push(`## 🎲 Potential Pitfalls`);
            task.aiPrompt.potentialPitfalls.forEach(p => {
                sections.push(`- ${p}`);
            });
            sections.push('');
        }

        // Testing Strategy
        sections.push(`## 🧪 Testing Strategy`);
        sections.push(`${task.aiPrompt.testingStrategy}\n`);

        // Success Criteria
        if (task.aiPrompt.successCriteria.length > 0) {
            sections.push(`## ✨ Success Criteria`);
            task.aiPrompt.successCriteria.forEach(s => {
                sections.push(`- ${s}`);
            });
            sections.push('');
        }

        // Dependencies
        sections.push(`## 🔗 Dependencies`);
        if (task.aiPrompt.dependencies.length > 0) {
            task.aiPrompt.dependencies.forEach(d => {
                sections.push(`- **${d.type}:** ${d.taskTitle} - ${d.reason}`);
            });
        } else {
            sections.push('No dependencies');
        }
        sections.push('');

        // Documentation & Resources
        if (task.aiPrompt.documentation.length > 0) {
            sections.push(`## 📚 Documentation & Resources`);
            task.aiPrompt.documentation.forEach(doc => {
                sections.push(`- [${doc.title}](${doc.url})${doc.section ? ` - Section: ${doc.section}` : ''}`);
            });
            sections.push('');
        }

        // Footer
        sections.push(`---`);
        sections.push(`🤖 **AI-Ready Prompt** | ⏱️ Estimated: ${task.estimatedHours}h | 🎯 Priority: ${task.priority}`);

        return sections.join('\n');
    }

    /**
     * Create all issues for project tasks with rate limiting
     */
    async createAllIssues(projectFile: ProjectFile): Promise<void> {
        if (!projectFile.tasks || projectFile.tasks.length === 0) {
            vscode.window.showWarningMessage('No tasks to create issues for.');
            return;
        }

        vscode.window.showInformationMessage(`Creating ${projectFile.tasks.length} GitHub issues...`);

        for (const task of projectFile.tasks) {
            try {
                const issueNumber = await this.createAIPromptIssue(task, projectFile);
                task.githubIssueNumber = issueNumber;
                task.githubIssueUrl = `https://github.com/${this.owner}/${this.repo}/issues/${issueNumber}`;
                
                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`[GitHubService] Failed to create issue for task ${task.id}:`, error);
                vscode.window.showErrorMessage(`Failed to create issue for: ${task.title}`);
            }
        }

        vscode.window.showInformationMessage(`Created ${projectFile.tasks.filter(t => t.githubIssueNumber).length} GitHub issues successfully!`);
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
