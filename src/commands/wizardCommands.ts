import * as vscode from 'vscode';
import { WizardPanel } from '../panels/WizardPanel';
import { MultiStepWizardPanel } from '../panels/MultiStepWizardPanel';
import { ProjectManager } from '../managers/ProjectManager';

export class WizardCommands {
    constructor(
        private context: vscode.ExtensionContext,
        private projectManager: ProjectManager
    ) {}

    showWizard() {
        // Use new 6-step wizard
        MultiStepWizardPanel.createOrShow(this.context.extensionUri, this.context);
    }
    
    showOldWizard() {
        // Keep old wizard available for comparison
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