import * as vscode from 'vscode';
import { AIService } from '../services/AIService';
import { ProjectRequirements, Task } from '../types';

export interface AnalyzedRequirements {
    projectName: string;
    description: string;
    requirements: ProjectRequirements;
    suggestions: string[];
    estimatedComplexity: 'simple' | 'moderate' | 'complex';
}

export class RequirementsAnalyzer {
    constructor(private aiService: AIService) {}

    /**
     * Analyzes project requirements and provides AI-enhanced suggestions
     */
    async analyzeProjectIdea(projectIdea: string): Promise<AnalyzedRequirements | null> {
        try {
            // Get AI-generated requirements
            const requirements = await this.aiService.generateProjectRequirements(projectIdea);
            
            if (!requirements) {
                return null;
            }

            // Analyze complexity based on task count and estimated hours
            const totalHours = requirements.tasks.reduce((sum: number, task: Task) => sum + (task.estimatedHours || 0), 0);
            const complexity = this.determineComplexity(requirements.tasks.length, totalHours);

            // Generate suggestions for improvement
            const suggestions = this.generateSuggestions(requirements);

            return {
                projectName: requirements.title,
                description: requirements.description,
                requirements,
                suggestions,
                estimatedComplexity: complexity
            };
        } catch (error) {
            console.error('Failed to analyze requirements:', error);
            vscode.window.showErrorMessage('Failed to analyze project requirements');
            return null;
        }
    }

    /**
     * Refines existing requirements based on user feedback
     */
    async refineRequirements(
        current: ProjectRequirements,
        feedback: string
    ): Promise<ProjectRequirements | null> {
        try {
            // Use AI to refine based on feedback
            const refinedPrompt = `
                Current project: ${JSON.stringify(current)}
                User feedback: ${feedback}
                Please refine the project requirements based on this feedback.
            `;

            const refined = await this.aiService.generateProjectRequirements(refinedPrompt);
            return refined;
        } catch (error) {
            console.error('Failed to refine requirements:', error);
            return null;
        }
    }

    /**
     * Validates requirements for completeness
     */
    validateRequirements(requirements: ProjectRequirements): string[] {
        const issues: string[] = [];

        if (!requirements.title || requirements.title.length < 3) {
            issues.push('Project title is too short or missing');
        }

        if (!requirements.description || requirements.description.length < 10) {
            issues.push('Project description is insufficient');
        }

        if (requirements.tasks.length === 0) {
            issues.push('No tasks defined');
        }

        requirements.tasks.forEach((task: Task, index: number) => {
            if (!task.title) {
                issues.push(`Task ${index + 1} is missing a title`);
            }
            if (task.estimatedHours && task.estimatedHours <= 0) {
                issues.push(`Task "${task.title}" has invalid time estimate`);
            }
            if (!task.acceptanceCriteria || task.acceptanceCriteria.length === 0) {
                issues.push(`Task "${task.title}" lacks acceptance criteria`);
            }
        });

        if (requirements.techStack.length === 0) {
            issues.push('No technology stack defined');
        }

        return issues;
    }

    /**
     * Converts requirements to GitHub issues format
     */
    convertToGitHubIssues(requirements: ProjectRequirements): Array<{
        title: string;
        body: string;
        labels: string[];
    }> {
        return requirements.tasks.map((task: Task) => ({
            title: task.title,
            body: this.formatTaskBody(task, requirements),
            labels: [
                `priority-${task.priority}`,
                'task-master',
                ...this.getLabelsFromTask(task)
            ]
        }));
    }

    private determineComplexity(taskCount: number, totalHours: number): 'simple' | 'moderate' | 'complex' {
        if (taskCount <= 5 && totalHours <= 40) {
            return 'simple';
        } else if (taskCount <= 15 && totalHours <= 160) {
            return 'moderate';
        } else {
            return 'complex';
        }
    }

    private generateSuggestions(requirements: ProjectRequirements): string[] {
        const suggestions: string[] = [];

        // Check for missing elements
        if (requirements.tasks.some((t: Task) => !t.dependencies || t.dependencies.length === 0)) {
            suggestions.push('Consider adding task dependencies for better project flow');
        }

        if (!requirements.architecture || requirements.architecture.length < 50) {
            suggestions.push('Expand the architecture description for better clarity');
        }

        // Check for task balance
        const priorities = requirements.tasks.map((t: Task) => t.priority);
        if (!priorities.includes('high')) {
            suggestions.push('No high-priority tasks defined - consider marking critical tasks');
        }

        if (requirements.tasks.length > 10) {
            suggestions.push('Consider breaking down the project into phases or milestones');
        }

        // Tech stack suggestions
        if (requirements.techStack.length < 3) {
            suggestions.push('Consider specifying more details about the technology stack');
        }

        return suggestions;
    }

    private formatTaskBody(task: Task, requirements: ProjectRequirements): string {
        return `## Description
${task.description}

## Priority
${task.priority}

## Estimated Time
${task.estimatedHours || 'Not estimated'} hours

## Acceptance Criteria
${task.acceptanceCriteria ? task.acceptanceCriteria.map((ac: string) => `- [ ] ${ac}`).join('\n') : 'None specified'}

## Dependencies
${task.dependencies && task.dependencies.length > 0 ? task.dependencies.map((d: string) => `- ${d}`).join('\n') : 'None'}

## Tech Stack
${requirements.techStack.join(', ')}

---
*Generated by GitHub Copilot Task Master*`;
    }

    private getLabelsFromTask(task: Task): string[] {
        const labels: string[] = [];
        
        // Add labels based on task characteristics
        if (task.estimatedHours && task.estimatedHours > 8) {
            labels.push('large-task');
        }
        
        if (task.dependencies && task.dependencies.length > 2) {
            labels.push('complex-dependencies');
        }

        if (task.title.toLowerCase().includes('test')) {
            labels.push('testing');
        }

        if (task.title.toLowerCase().includes('doc')) {
            labels.push('documentation');
        }

        return labels;
    }

    /**
     * Exports requirements to various formats
     */
    async exportRequirements(
        requirements: ProjectRequirements,
        format: 'json' | 'markdown' | 'yaml'
    ): Promise<string> {
        switch (format) {
            case 'json':
                return JSON.stringify(requirements, null, 2);
            
            case 'markdown':
                return this.convertToMarkdown(requirements);
            
            case 'yaml':
                // Would need a YAML library for proper conversion
                return this.convertToSimpleYaml(requirements);
            
            default:
                return JSON.stringify(requirements, null, 2);
        }
    }

    private convertToMarkdown(requirements: ProjectRequirements): string {
        return `# ${requirements.title}

## Description
${requirements.description}

## Features
${requirements.features.map(f => `- ${f}`).join('\n')}

## Tasks
${requirements.tasks.map((task: Task) => `
### ${task.title}
- **Priority**: ${task.priority}
- **Estimated Hours**: ${task.estimatedHours || 'Not estimated'}
- **Description**: ${task.description}
- **Acceptance Criteria**:
${task.acceptanceCriteria ? task.acceptanceCriteria.map((ac: string) => `  - ${ac}`).join('\n') : '  None specified'}
`).join('\n')}

## Technology Stack
${requirements.techStack.map(tech => `- ${tech}`).join('\n')}

## Architecture
${requirements.architecture}
`;
    }

    private convertToSimpleYaml(requirements: ProjectRequirements): string {
        // Simple YAML conversion without external library
        return `title: ${requirements.title}
description: ${requirements.description}
features:
${requirements.features.map(f => `  - ${f}`).join('\n')}
tasks:
${requirements.tasks.map((task: Task) => `  - title: ${task.title}
    priority: ${task.priority}
    estimatedHours: ${task.estimatedHours || 0}
    description: ${task.description}`).join('\n')}
techStack:
${requirements.techStack.map(tech => `  - ${tech}`).join('\n')}
architecture: |
  ${requirements.architecture}
`;
    }
}