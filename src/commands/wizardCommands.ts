import * as vscode from 'vscode';
import { WizardPanel } from '../panels/WizardPanel';
import { ProjectManager } from '../managers/ProjectManager';

export class WizardCommands {
    constructor(
        private context: vscode.ExtensionContext,
        private projectManager: ProjectManager
    ) {}

    showWizard() {
        WizardPanel.createOrShow(this.context.extensionUri, this.projectManager);
    }

    async quickStart() {
        const projectName = await vscode.window.showInputBox({
            prompt: 'Enter project name',
            placeHolder: 'My Awesome Project'
        });

        if (!projectName) {
            return;
        }

        const projectType = await vscode.window.showQuickPick([
            'Web Application',
            'CLI Tool',
            'REST API',
            'VS Code Extension',
            'Library'
        ], {
            placeHolder: 'Select project type'
        });

        if (!projectType) {
            return;
        }

        const projectData = {
            name: projectName,
            description: '',
            requirements: {
                title: projectName,
                description: '',
                features: [],
                tasks: [],
                techStack: [],
                architecture: ''
            },
            githubRepo: '',
            createGitHub: false
        };

        await this.projectManager.createProject(projectData);

        vscode.window.showInformationMessage(`Project "${projectName}" created successfully!`);
    }
}