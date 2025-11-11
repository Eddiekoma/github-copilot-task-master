import { Octokit } from '@octokit/rest';
import * as vscode from 'vscode';
import { AITask } from '../types/projectModels';

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

    /**
     * Create an AI-ready GitHub issue from an AITask
     * The issue body contains the complete prompt for AI consumption
     */
    async createAIReadyIssue(task: AITask, issuePrefix: string = 'TASK-'): Promise<number | undefined> {
        if (!this.octokit || !this.owner || !this.repo) {
            throw new Error('GitHub not authenticated or repository not detected');
        }

        const issueBody = this.formatAIPromptAsIssue(task);
        const labels = [
            `priority:${task.priority}`,
            `status:${task.status}`,
            ...task.labels
        ];

        try {
            const response = await this.octokit.issues.create({
                owner: this.owner,
                repo: this.repo,
                title: `${issuePrefix}${task.title}`,
                body: issueBody,
                labels
            });

            console.log(`Created GitHub issue #${response.data.number} for task: ${task.title}`);
            return response.data.number;
        } catch (error: unknown) {
            console.error('Error creating AI-ready issue:', error);
            throw error;
        }
    }

    /**
     * Format an AITask as a complete AI-ready prompt in the GitHub issue body
     */
    private formatAIPromptAsIssue(task: AITask): string {
        const { aiPrompt } = task;
        
        let body = `# ${task.title}\n\n`;
        
        // Project Context Section
        body += `## 📋 Project Context\n\n`;
        body += `- **Project:** ${aiPrompt.projectContext.projectName}\n`;
        body += `- **Goal:** ${aiPrompt.projectContext.projectGoal}\n`;
        body += `- **Architecture:** ${aiPrompt.projectContext.architecture}\n`;
        body += `- **Tech Stack:** ${aiPrompt.projectContext.technicalStack.join(', ')}\n\n`;
        
        // Task Goal
        body += `## 🎯 Task Goal\n\n${aiPrompt.taskGoal}\n\n`;
        
        // Detailed Description
        body += `## 📝 Detailed Description\n\n${aiPrompt.detailedDescription}\n\n`;
        
        // Constraints
        if (aiPrompt.constraints.length > 0) {
            body += `## ⚠️ Constraints\n\n`;
            aiPrompt.constraints.forEach(c => {
                body += `- **${c.type}:** ${c.description}\n`;
            });
            body += `\n`;
        }
        
        // Technical Requirements
        if (aiPrompt.technicalRequirements.length > 0) {
            body += `## 🔧 Technical Requirements\n\n`;
            aiPrompt.technicalRequirements.forEach(req => {
                body += `- **${req.name}** ${req.version ? `(${req.version})` : ''}\n`;
                body += `  - ${req.reason}\n`;
                if (req.documentation) {
                    body += `  - [Documentation](${req.documentation})\n`;
                }
            });
            body += `\n`;
        }
        
        // Acceptance Criteria
        if (aiPrompt.acceptanceCriteria.length > 0) {
            body += `## ✅ Acceptance Criteria\n\n`;
            aiPrompt.acceptanceCriteria.forEach((ac, i) => {
                body += `${i + 1}. **Given** ${ac.given}\n`;
                body += `   **When** ${ac.when}\n`;
                body += `   **Then** ${ac.then}\n`;
                body += `   ${ac.testable ? '✓ Testable' : '⚠️ Manual verification'}\n\n`;
            });
        }
        
        // Code Examples
        if (aiPrompt.exampleCode && aiPrompt.exampleCode.length > 0) {
            body += `## 💻 Code Examples\n\n`;
            aiPrompt.exampleCode.forEach((example, i) => {
                body += `### Example ${i + 1}: ${example.explanation}\n\n`;
                body += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`;
                if (example.source) {
                    body += `Source: ${example.source}\n\n`;
                }
            });
        }
        
        // Design Patterns
        if (aiPrompt.designPatterns && aiPrompt.designPatterns.length > 0) {
            body += `## 🏗️ Design Patterns\n\n`;
            aiPrompt.designPatterns.forEach(pattern => {
                body += `- ${pattern}\n`;
            });
            body += `\n`;
        }
        
        // Documentation Links
        if (aiPrompt.documentation.length > 0) {
            body += `## 📚 Documentation\n\n`;
            aiPrompt.documentation.forEach(doc => {
                body += `- [${doc.title}](${doc.url})`;
                if (doc.section) {
                    body += ` - ${doc.section}`;
                }
                body += `\n  ${doc.relevance}\n`;
            });
            body += `\n`;
        }
        
        // Relevant Files
        if (aiPrompt.relevantFiles && aiPrompt.relevantFiles.length > 0) {
            body += `## 📁 Relevant Files\n\n`;
            aiPrompt.relevantFiles.forEach(file => {
                body += `- \`${file}\`\n`;
            });
            body += `\n`;
        }
        
        // Dependencies
        if (aiPrompt.dependencies.length > 0) {
            body += `## 🔗 Dependencies\n\n`;
            aiPrompt.dependencies.forEach(dep => {
                body += `- **${dep.type}:** ${dep.taskTitle} (#${dep.taskId})\n`;
                body += `  ${dep.reason}\n`;
            });
            body += `\n`;
        }
        
        // Success Criteria
        if (aiPrompt.successCriteria.length > 0) {
            body += `## 🎉 Success Criteria\n\n`;
            aiPrompt.successCriteria.forEach(sc => {
                body += `- ${sc}\n`;
            });
            body += `\n`;
        }
        
        // Potential Pitfalls
        if (aiPrompt.potentialPitfalls.length > 0) {
            body += `## ⚠️ Potential Pitfalls\n\n`;
            aiPrompt.potentialPitfalls.forEach(pitfall => {
                body += `- ${pitfall}\n`;
            });
            body += `\n`;
        }
        
        // Testing Strategy
        if (aiPrompt.testingStrategy) {
            body += `## 🧪 Testing Strategy\n\n${aiPrompt.testingStrategy}\n\n`;
        }
        
        // Metadata
        body += `---\n\n`;
        body += `**Priority:** ${task.priority} | `;
        body += `**Estimated Hours:** ${task.estimatedHours} | `;
        body += `**Status:** ${task.status}\n`;
        
        return body;
    }

    /**
     * Create multiple AI-ready issues from an array of tasks
     */
    async createAIReadyIssues(tasks: AITask[], issuePrefix: string = 'TASK-'): Promise<Map<string, number>> {
        const taskToIssueMap = new Map<string, number>();
        
        for (const task of tasks) {
            try {
                const issueNumber = await this.createAIReadyIssue(task, issuePrefix);
                if (issueNumber) {
                    taskToIssueMap.set(task.id, issueNumber);
                }
                
                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Failed to create issue for task ${task.id}:`, error);
            }
        }
        
        return taskToIssueMap;
    }

    /**
     * Set repository owner and name for creating issues
     */
    setRepository(owner: string, repo: string) {
        this.owner = owner;
        this.repo = repo;
    }

    /**
     * Parse GitHub repository URL and set owner/repo
     */
    parseAndSetRepository(githubUrl: string): boolean {
        const match = githubUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
        if (match) {
            this.owner = match[1];
            this.repo = match[2];
            return true;
        }
        return false;
    }
}
