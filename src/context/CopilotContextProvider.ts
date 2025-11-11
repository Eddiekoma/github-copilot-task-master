import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectFileService } from '../services/ProjectFileService';

/**
 * Provides project context for GitHub Copilot
 * Creates a context file that helps Copilot understand the project
 */
export class CopilotContextProvider {
    constructor(
        private projectFileService: ProjectFileService,
        private context: vscode.ExtensionContext
    ) {}

    /**
     * Generate context content from project file
     */
    async provideContext(): Promise<string> {
        const projectFile = await this.projectFileService.loadProjectFile();
        
        if (!projectFile) {
            return '# No project context available\n\nPlease create a project using the Task Master wizard.';
        }

        const sections: string[] = [];

        // Header
        sections.push(`# 🎯 Project: ${projectFile.purpose.name}\n`);

        // Project Goal
        sections.push(`## Goal`);
        sections.push(`${projectFile.aiContext.projectSummary || projectFile.purpose.problemStatement}\n`);

        // Architecture
        sections.push(`## Architecture`);
        sections.push(`**Style:** ${projectFile.architecture.style}`);
        sections.push(`**Components:** ${projectFile.architecture.components.map(c => c.name).join(', ')}\n`);

        // Tech Stack
        const techStack = projectFile.architecture.components
            .flatMap(c => c.technologies)
            .filter((tech, index, self) => self.indexOf(tech) === index);
        sections.push(`## Tech Stack`);
        sections.push(techStack.join(', ') + '\n');

        // Key Decisions
        if (projectFile.aiContext.keyDecisions && projectFile.aiContext.keyDecisions.length > 0) {
            sections.push(`## Key Decisions`);
            projectFile.aiContext.keyDecisions.forEach(d => {
                sections.push(`- **${d.decision}:** ${d.rationale}`);
            });
            sections.push('');
        }

        // Code Conventions
        if (projectFile.aiContext.conventions) {
            sections.push(`## Code Conventions`);
            if (projectFile.aiContext.conventions.codeStyle) {
                sections.push(`**Code Style:** ${projectFile.aiContext.conventions.codeStyle}`);
            }
            if (projectFile.aiContext.conventions.namingConventions) {
                sections.push(`**Naming:** ${projectFile.aiContext.conventions.namingConventions}`);
            }
            if (projectFile.aiContext.conventions.fileStructure) {
                sections.push(`**File Structure:** ${projectFile.aiContext.conventions.fileStructure}`);
            }
            sections.push('');
        }

        // Active Tasks
        const inProgressTasks = projectFile.tasks.filter(t => t.status === 'in-progress');
        if (inProgressTasks.length > 0) {
            sections.push(`## Active Tasks`);
            inProgressTasks.forEach(t => {
                sections.push(`- ${t.title}${t.githubIssueNumber ? ` (#${t.githubIssueNumber})` : ''}`);
            });
            sections.push('');
        }

        // Current Focus (high priority todo tasks)
        const priorityTasks = projectFile.tasks
            .filter(t => t.status === 'todo' && (t.priority === 'critical' || t.priority === 'high'))
            .slice(0, 5);
        if (priorityTasks.length > 0) {
            sections.push(`## Current Focus`);
            priorityTasks.forEach(t => {
                sections.push(`- ${t.title} (${t.priority})`);
            });
            sections.push('');
        }

        // Features Overview
        if (projectFile.features && projectFile.features.length > 0) {
            sections.push(`## Features`);
            projectFile.features.forEach(f => {
                sections.push(`- **${f.name}** (${f.priority}): ${f.description}`);
            });
            sections.push('');
        }

        // Security Requirements
        if (projectFile.technicalContext.securityRequirements.length > 0) {
            sections.push(`## Security Requirements`);
            projectFile.technicalContext.securityRequirements.forEach(req => {
                sections.push(`- ${req}`);
            });
            sections.push('');
        }

        return sections.join('\n');
    }

    /**
     * Inject context into workspace .vscode folder
     */
    async injectIntoWorkspace(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            console.log('[CopilotContextProvider] No workspace folder available');
            return;
        }

        const context = await this.provideContext();
        
        // Save context to .vscode/copilot-context.md
        const vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode');
        const contextPath = path.join(vscodeDir, 'copilot-context.md');
        
        try {
            // Ensure .vscode directory exists
            await fs.mkdir(vscodeDir, { recursive: true });
            
            // Write context file
            await fs.writeFile(contextPath, context, 'utf8');
            
            console.log(`[CopilotContextProvider] Context injected: ${contextPath}`);
            vscode.window.showInformationMessage('✅ Copilot context file created in .vscode/');
        } catch (error) {
            console.error('[CopilotContextProvider] Error injecting context:', error);
            vscode.window.showErrorMessage(`Failed to create context file: ${error}`);
        }
    }

    /**
     * Update context when project changes
     */
    async updateContext(): Promise<void> {
        await this.injectIntoWorkspace();
    }

    /**
     * Get context as string for display
     */
    async getContextString(): Promise<string> {
        return await this.provideContext();
    }
}
