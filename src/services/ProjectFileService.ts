import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectFile } from '../types/projectModels';

export class ProjectFileService {
  private readonly fileName = '.github-copilot-task-master.json';

  async saveProjectFile(projectFile: ProjectFile): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('No workspace folder open');
    }

    const filePath = path.join(workspaceFolder.uri.fsPath, this.fileName);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(projectFile, null, 2), 'utf8');
      vscode.window.showInformationMessage(`Project file saved: ${this.fileName}`);
    } catch (error) {
      console.error('Error saving project file:', error);
      throw new Error(`Failed to save project file: ${error}`);
    }
  }

  async loadProjectFile(): Promise<ProjectFile | null> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return null;
    }

    const filePath = path.join(workspaceFolder.uri.fsPath, this.fileName);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      // File doesn't exist or is invalid
      return null;
    }
  }

  async updateProjectFile(updates: Partial<ProjectFile>): Promise<void> {
    const existing = await this.loadProjectFile();
    if (!existing) {
      throw new Error('No project file found');
    }

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    await this.saveProjectFile(updated);
  }

  async deleteProjectFile(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    const filePath = path.join(workspaceFolder.uri.fsPath, this.fileName);
    
    try {
      await fs.unlink(filePath);
      vscode.window.showInformationMessage('Project file deleted');
    } catch (error) {
      // File doesn't exist, ignore
    }
  }
}
