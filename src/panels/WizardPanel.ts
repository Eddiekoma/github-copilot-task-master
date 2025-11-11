import * as vscode from 'vscode';
import { ProjectManager } from '../managers/ProjectManager';
import { getNonce } from '../utils/getNonce';
import { WizardController } from '../wizard/WizardController';
import { AIService } from '../services/AIService';
import { GitHubService } from '../services/GitHubService';

export class WizardPanel {
    public static currentPanel: WizardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private wizardController: WizardController | undefined;

    public static createOrShow(
        extensionUri: vscode.Uri, 
        projectManager: ProjectManager,
        context: vscode.ExtensionContext,
        aiService: AIService,
        githubService: GitHubService
    ) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (WizardPanel.currentPanel) {
            WizardPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'taskMasterWizard',
            'Project Wizard',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out')
                ]
            }
        );

        WizardPanel.currentPanel = new WizardPanel(
            panel, 
            extensionUri, 
            projectManager, 
            context, 
            aiService, 
            githubService
        );
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        private projectManager: ProjectManager,
        private context: vscode.ExtensionContext,
        private aiService: AIService,
        private githubService: GitHubService
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Initialize wizard controller
        this.wizardController = new WizardController(
            this.context,
            this._panel.webview,
            this.aiService,
            this.githubService
        );

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async message => {
                // Handle both old-style messages and new wizard controller messages
                if (message.command === 'generateRequirements') {
                    // Legacy support - convert to new wizard flow
                    try {
                        console.log('[WizardPanel] Received legacy generateRequirements command');
                        vscode.window.showInformationMessage('Generating project requirements with GitHub Copilot...');
                        const requirements = await this.projectManager.generateRequirementsFromIdea(message.projectIdea);
                        console.log('[WizardPanel] Requirements generated:', requirements);
                        this._panel.webview.postMessage({
                            command: 'requirementsGenerated',
                            requirements
                        });
                        vscode.window.showInformationMessage('Requirements generated! Check the wizard for results.');
                    } catch (error) {
                        console.error('[WizardPanel] Error generating requirements:', error);
                        vscode.window.showErrorMessage(`Failed to generate requirements: ${error instanceof Error ? error.message : String(error)}`);
                        this._panel.webview.postMessage({
                            command: 'requirementsError',
                            error: error instanceof Error ? error.message : String(error)
                        });
                    }
                } else if (message.command === 'createProject') {
                    // Legacy support
                    const project = await this.projectManager.createProject(message.projectData);
                    if (project) {
                        this._panel.webview.postMessage({
                            command: 'projectCreated',
                            project
                        });
                    }
                } else if (this.wizardController) {
                    // New wizard controller messages
                    await this.wizardController.handleMessage(message);
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        WizardPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = 'Project Wizard';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'wizard.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'wizard.css')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Project Wizard</title>
            </head>
            <body>
                <div class="wizard-container">
                    <h1>🚀 Project Setup Wizard</h1>
                    <div class="step" id="step1">
                        <h2>Step 1: Describe Your Project</h2>
                        <textarea id="projectIdea" rows="10" placeholder="Describe your project idea in detail..."></textarea>
                        <button id="generateBtn">Generate Requirements with AI</button>
                    </div>
                    <div class="step" id="step2" style="display: none;">
                        <h2>Step 2: Review Generated Requirements</h2>
                        <div id="requirementsContainer">
                            <div class="requirement-section">
                                <h3>📋 Project Title</h3>
                                <p id="projectTitle"></p>
                            </div>
                            <div class="requirement-section">
                                <h3>📝 Description</h3>
                                <p id="projectDescription"></p>
                            </div>
                            <div class="requirement-section">
                                <h3>✨ Features</h3>
                                <ul id="featuresList"></ul>
                            </div>
                            <div class="requirement-section">
                                <h3>📦 Tech Stack</h3>
                                <div id="techStackList"></div>
                            </div>
                            <div class="requirement-section">
                                <h3>🏗️ Architecture</h3>
                                <p id="architectureDescription"></p>
                            </div>
                            <div class="requirement-section">
                                <h3>✅ Tasks</h3>
                                <div id="tasksList"></div>
                            </div>
                        </div>
                        <div class="button-group">
                            <button id="backBtn">← Back</button>
                            <button id="createProjectBtn" class="primary">Create Project</button>
                        </div>
                    </div>
                </div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}
