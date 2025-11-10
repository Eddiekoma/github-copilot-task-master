import * as vscode from 'vscode';
import { ProjectManager } from '../managers/ProjectManager';

export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, projectManager: ProjectManager) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel._panel.reveal(column);
            DashboardPanel.currentPanel._update();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'taskMasterDashboard',
            'Task Master Dashboard',
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

        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, projectManager);
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
                    case 'refreshData':
                        this._update();
                        break;
                    case 'updateTask':
                        // Handle task updates
                        break;
                    case 'syncGitHub':
                        await this.projectManager.syncWithGitHub();
                        this._update();
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        DashboardPanel.currentPanel = undefined;
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
        const project = this.projectManager.getProject();
        
        this._panel.webview.html = this._getHtmlForWebview(webview);
        
        // Send project data to webview
        if (project) {
            this._panel.webview.postMessage({
                command: 'loadProject',
                project
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'dashboard.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'dashboard.css')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Task Master Dashboard</title>
            </head>
            <body>
                <div class="dashboard-container">
                    <header>
                        <h1>📊 Project Dashboard</h1>
                        <div class="actions">
                            <button id="refreshBtn">🔄 Refresh</button>
                            <button id="syncBtn">🔗 Sync GitHub</button>
                        </div>
                    </header>

                    <div class="stats">
                        <div class="stat-card">
                            <h3>Total Tasks</h3>
                            <div class="stat-value" id="totalTasks">0</div>
                        </div>
                        <div class="stat-card">
                            <h3>Completed</h3>
                            <div class="stat-value" id="completedTasks">0</div>
                        </div>
                        <div class="stat-card">
                            <h3>In Progress</h3>
                            <div class="stat-value" id="inProgressTasks">0</div>
                        </div>
                        <div class="stat-card">
                            <h3>Progress</h3>
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressBar"></div>
                            </div>
                        </div>
                    </div>

                    <div class="tasks-section">
                        <h2>Tasks Overview</h2>
                        <div class="tasks-grid" id="tasksGrid">
                            <!-- Tasks will be populated here -->
                        </div>
                    </div>

                    <div class="chart-section">
                        <h2>Project Analytics</h2>
                        <canvas id="progressChart"></canvas>
                    </div>
                </div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
