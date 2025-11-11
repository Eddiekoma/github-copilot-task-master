import * as vscode from 'vscode';
import { ProjectManager } from '../managers/ProjectManager';
import { getNonce } from '../utils/getNonce';

export class WizardPanel {
    public static currentPanel: WizardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, projectManager: ProjectManager) {
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

        WizardPanel.currentPanel = new WizardPanel(panel, extensionUri, projectManager);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        private projectManager: ProjectManager
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'createProject':
                        const project = await this.projectManager.createProject(message.projectIdea);
                        if (project) {
                            this._panel.webview.postMessage({
                                command: 'projectCreated',
                                project
                            });
                        }
                        break;
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
                </div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}
