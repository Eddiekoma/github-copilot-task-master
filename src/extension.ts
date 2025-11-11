import * as vscode from 'vscode';
import { WizardPanel } from './panels/WizardPanel';
import { DashboardPanel } from './panels/DashboardPanel';
import { TaskProvider } from './providers/TaskProvider';
import { GitHubService } from './services/GitHubService';
import { AIService } from './services/AIService';
import { ProjectManager } from './managers/ProjectManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('GitHub Copilot Task Master is now active!');

    // Initialize services
    const githubService = new GitHubService(context);
    const aiService = new AIService(context);
    const projectManager = new ProjectManager(context, githubService, aiService);

    // Register task provider for sidebar
    const taskProvider = new TaskProvider(projectManager);
    vscode.window.registerTreeDataProvider('taskMaster.taskView', taskProvider);

    // Register commands
    const showWizard = vscode.commands.registerCommand('taskMaster.showWizard', () => {
        WizardPanel.createOrShow(context.extensionUri, projectManager, context, aiService, githubService);
    });

    const showDashboard = vscode.commands.registerCommand('taskMaster.showDashboard', () => {
        DashboardPanel.createOrShow(context.extensionUri, projectManager);
    });

    const syncGitHub = vscode.commands.registerCommand('taskMaster.syncGitHub', async () => {
        await projectManager.syncWithGitHub();
        vscode.window.showInformationMessage('GitHub sync completed!');
    });

    context.subscriptions.push(showWizard, showDashboard, syncGitHub);

    // Auto-sync on startup if configured
    const config = vscode.workspace.getConfiguration('taskMaster');
    if (config.get('autoSync')) {
        projectManager.syncWithGitHub();
    }
}

export function deactivate() {}