import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectFile } from '../types/projectModels';

/**
 * Service for managing project file (.github-copilot-task-master.json)
 * Handles saving, loading, and updating project definitions
 */
export class ProjectFileService {
    private readonly fileName = '.github-copilot-task-master.json';

    /**
     * Save complete project file to workspace
     */
    async saveProjectFile(projectFile: ProjectFile): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open. Please open a folder to save the project file.');
        }

        const filePath = path.join(workspaceFolder.uri.fsPath, this.fileName);
        
        try {
            // Serialize with proper date handling
            const jsonData = JSON.stringify(projectFile, null, 2);
            await fs.writeFile(filePath, jsonData, 'utf8');
            
            console.log(`[ProjectFileService] Project file saved: ${filePath}`);
            vscode.window.showInformationMessage(`✅ Project file saved: ${this.fileName}`);
        } catch (error) {
            console.error('[ProjectFileService] Error saving project file:', error);
            throw new Error(`Failed to save project file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Load project file from workspace
     */
    async loadProjectFile(): Promise<ProjectFile | null> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return null;
        }

        const filePath = path.join(workspaceFolder.uri.fsPath, this.fileName);
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const projectFile = JSON.parse(content);
            
            // Parse dates
            projectFile.createdAt = new Date(projectFile.createdAt);
            projectFile.updatedAt = new Date(projectFile.updatedAt);
            if (projectFile.tasks) {
                projectFile.tasks.forEach((task: any) => {
                    task.createdAt = new Date(task.createdAt);
                    task.updatedAt = new Date(task.updatedAt);
                });
            }
            if (projectFile.aiContext?.keyDecisions) {
                projectFile.aiContext.keyDecisions.forEach((decision: any) => {
                    decision.timestamp = new Date(decision.timestamp);
                });
            }
            
            console.log(`[ProjectFileService] Project file loaded: ${projectFile.purpose?.name}`);
            return projectFile;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                console.log('[ProjectFileService] No project file found');
                return null;
            }
            console.error('[ProjectFileService] Error loading project file:', error);
            throw error;
        }
    }

    /**
     * Update existing project file with partial updates
     */
    async updateProjectFile(updates: Partial<ProjectFile>): Promise<void> {
        const existing = await this.loadProjectFile();
        if (!existing) {
            throw new Error('No project file found to update');
        }

        const updated: ProjectFile = { 
            ...existing, 
            ...updates, 
            updatedAt: new Date() 
        };
        
        await this.saveProjectFile(updated);
    }

    /**
     * Check if project file exists in workspace
     */
    async projectFileExists(): Promise<boolean> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return false;
        }

        const filePath = path.join(workspaceFolder.uri.fsPath, this.fileName);
        
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get project file path
     */
    getProjectFilePath(): string | null {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return null;
        }

        return path.join(workspaceFolder.uri.fsPath, this.fileName);
    }

    /**
     * Delete project file
     */
    async deleteProjectFile(): Promise<void> {
        const filePath = this.getProjectFilePath();
        if (!filePath) {
            throw new Error('No workspace folder open');
        }

        try {
            await fs.unlink(filePath);
            vscode.window.showInformationMessage('Project file deleted');
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
        }
    }
}
