import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AIService } from '../services/AIService';
import { ProjectRequirements, Task } from '../types';

export interface AIAssistantContext {
    projectIdea: string;
    previousRequirements?: ProjectRequirements;
    userFeedback?: string;
}

export class AIAssistant {
    constructor(private aiService: AIService) {}

    /**
     * Generates initial project requirements from a project idea
     */
    async generateRequirements(projectIdea: string): Promise<ProjectRequirements | null> {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating project requirements with AI...",
                cancellable: false
            }, async () => {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
            });

            const requirements = await this.aiService.generateProjectRequirements(projectIdea);
            return requirements;
        } catch (error) {
            console.error('Failed to generate requirements:', error);
            vscode.window.showErrorMessage('Failed to generate requirements with AI');
            return null;
        }
    }

    /**
     * Refines requirements based on user feedback
     */
    async refineRequirements(
        context: AIAssistantContext
    ): Promise<ProjectRequirements | null> {
        if (!context.previousRequirements || !context.userFeedback) {
            return null;
        }

        try {
            const refinedPrompt = this.buildRefinementPrompt(context);
            const refined = await this.aiService.generateProjectRequirements(refinedPrompt);
            return refined;
        } catch (error) {
            console.error('Failed to refine requirements:', error);
            return null;
        }
    }

    /**
     * Generates smart suggestions for the project
     */
    async generateSuggestions(requirements: ProjectRequirements): Promise<string[]> {
        const suggestions: string[] = [];

        // Analyze requirements and provide suggestions
        if (requirements.tasks.length === 0) {
            suggestions.push('Add specific tasks to break down your project');
        }

        if (requirements.tasks.length > 20) {
            suggestions.push('Consider grouping tasks into phases or milestones');
        }

        const highPriorityCount = requirements.tasks.filter((t: Task) => t.priority === 'high').length;
        if (highPriorityCount > requirements.tasks.length * 0.5) {
            suggestions.push('Too many high-priority tasks. Consider re-evaluating priorities');
        }

        if (!requirements.architecture || requirements.architecture.length < 100) {
            suggestions.push('Expand the architecture description for better clarity');
        }

        if (requirements.techStack.length === 0) {
            suggestions.push('Define the technology stack for your project');
        }

        // Check for task dependencies
        const hasDependencies = requirements.tasks.some((t: Task) => t.dependencies && t.dependencies.length > 0);
        if (!hasDependencies && requirements.tasks.length > 3) {
            suggestions.push('Consider adding task dependencies to establish workflow');
        }

        return suggestions;
    }

    /**
     * Validates if the AI-generated content is appropriate
     */
    validateContent(content: string): boolean {
        // Basic validation to ensure content is appropriate
        const inappropriatePatterns = [
            /harmful|illegal|unethical/i,
            /\b(hack|crack|exploit)\b/i
        ];

        return !inappropriatePatterns.some(pattern => pattern.test(content));
    }

    /**
     * Generates a project summary from requirements
     */
    generateProjectSummary(requirements: ProjectRequirements): string {
        const totalHours = requirements.tasks.reduce((sum: number, task: Task) => sum + (task.estimatedHours || 0), 0);
        const tasksByPriority = {
            high: requirements.tasks.filter((t: Task) => t.priority === 'high').length,
            medium: requirements.tasks.filter((t: Task) => t.priority === 'medium').length,
            low: requirements.tasks.filter((t: Task) => t.priority === 'low').length
        };

        return `## Project Summary: ${requirements.title}

### Overview
${requirements.description}

### Statistics
- **Total Tasks**: ${requirements.tasks.length}
- **Estimated Hours**: ${totalHours} hours
- **High Priority**: ${tasksByPriority.high} tasks
- **Medium Priority**: ${tasksByPriority.medium} tasks
- **Low Priority**: ${tasksByPriority.low} tasks

### Technology Stack
${requirements.techStack.join(', ')}

### Key Features
${requirements.features.map(f => `- ${f}`).join('\n')}
`;
    }

    /**
     * Builds a refinement prompt from context
     */
    private buildRefinementPrompt(context: AIAssistantContext): string {
        return `
Project Idea: ${context.projectIdea}

Current Requirements:
${JSON.stringify(context.previousRequirements, null, 2)}

User Feedback for Refinement:
${context.userFeedback}

Please refine the project requirements based on the feedback provided.
Keep all existing good parts and improve based on the feedback.
        `.trim();
    }

    /**
     * Generates task templates based on project type
     */
    async generateTaskTemplates(projectType: string): Promise<unknown[]> {
        const templates: Record<string, unknown[]> = {
            webApp: [
                { title: 'Setup development environment', estimatedHours: 2, priority: 'high' },
                { title: 'Design database schema', estimatedHours: 4, priority: 'high' },
                { title: 'Implement authentication', estimatedHours: 8, priority: 'high' },
                { title: 'Create API endpoints', estimatedHours: 16, priority: 'medium' },
                { title: 'Build frontend components', estimatedHours: 20, priority: 'medium' },
                { title: 'Add unit tests', estimatedHours: 12, priority: 'medium' },
                { title: 'Deploy to production', estimatedHours: 4, priority: 'low' }
            ],
            cliTool: [
                { title: 'Define CLI interface', estimatedHours: 3, priority: 'high' },
                { title: 'Implement core functionality', estimatedHours: 12, priority: 'high' },
                { title: 'Add command parsing', estimatedHours: 4, priority: 'high' },
                { title: 'Create help documentation', estimatedHours: 2, priority: 'medium' },
                { title: 'Add configuration support', estimatedHours: 4, priority: 'medium' },
                { title: 'Package for distribution', estimatedHours: 2, priority: 'low' }
            ],
            api: [
                { title: 'Design API architecture', estimatedHours: 4, priority: 'high' },
                { title: 'Setup server framework', estimatedHours: 2, priority: 'high' },
                { title: 'Implement endpoints', estimatedHours: 16, priority: 'high' },
                { title: 'Add authentication/authorization', estimatedHours: 8, priority: 'high' },
                { title: 'Create API documentation', estimatedHours: 4, priority: 'medium' },
                { title: 'Add rate limiting', estimatedHours: 3, priority: 'medium' },
                { title: 'Setup monitoring', estimatedHours: 3, priority: 'low' }
            ]
        };

        return templates[projectType] || [];
    }

    /**
     * Analyzes code context to provide better AI suggestions
     */
    async analyzeCodeContext(workspaceFolder?: string): Promise<{
        hasGitRepo: boolean;
        hasPackageJson: boolean;
        hasTsConfig: boolean;
        frameworks: string[];
        suggestedImprovements: string[];
    }> {
        const context = {
            hasGitRepo: false,
            hasPackageJson: false,
            hasTsConfig: false,
            frameworks: [] as string[],
            suggestedImprovements: [] as string[]
        };

        if (!workspaceFolder) {
            return context;
        }

        try {
            // Check for git repository
            if (fs.existsSync(path.join(workspaceFolder, '.git'))) {
                context.hasGitRepo = true;
            }

            // Check for package.json
            const packageJsonPath = path.join(workspaceFolder, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                context.hasPackageJson = true;
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
                    dependencies?: Record<string, string>;
                    devDependencies?: Record<string, string>;
                };
                
                // Detect frameworks
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (deps['react']) {context.frameworks.push('React');}
                if (deps['vue']) {context.frameworks.push('Vue');}
                if (deps['angular']) {context.frameworks.push('Angular');}
                if (deps['express']) {context.frameworks.push('Express');}
                if (deps['next']) {context.frameworks.push('Next.js');}
            }

            // Check for TypeScript
            if (fs.existsSync(path.join(workspaceFolder, 'tsconfig.json'))) {
                context.hasTsConfig = true;
            }

            // Generate suggestions based on context
            if (!context.hasGitRepo) {
                context.suggestedImprovements.push('Initialize a Git repository for version control');
            }
            if (!context.hasTsConfig && context.hasPackageJson) {
                context.suggestedImprovements.push('Consider adding TypeScript for better type safety');
            }
        } catch (error) {
            console.error('Error analyzing code context:', error);
        }

        return context;
    }
}