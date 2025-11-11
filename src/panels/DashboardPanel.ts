import * as vscode from 'vscode';
import { ProjectManager } from '../managers/ProjectManager';
import { getNonce } from '../utils/getNonce';

export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, private projectManager: ProjectManager) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'refresh':
                        this._update();
                        return;
                    case 'syncGitHub':
                        this.projectManager.syncWithGitHub();
                        this._update();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri, projectManager: ProjectManager) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'taskMasterDashboard',
            'Task Master Dashboard',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, projectManager);
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.title = 'Task Master Dashboard';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'dashboard.css'));
        const nonce = getNonce();

        const tasks = this.projectManager.getTasks();
        const stats = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
            todoTasks: tasks.filter(t => t.status === 'todo').length
        };

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <link href="${styleUri}" rel="stylesheet">
                <title>Task Master Dashboard</title>
            </head>
            <body>
                <div class="dashboard-container">
                    <header>
                        <h1>Task Master Dashboard</h1>
                        <div class="actions">
                            <button onclick="syncGitHub()">Sync with GitHub</button>
                            <button onclick="refresh()">Refresh</button>
                        </div>
                    </header>
                    
                    <div class="stats">
                        <div class="stat-card">
                            <h3>Total Tasks</h3>
                            <div class="stat-value">${stats.totalTasks}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Completed</h3>
                            <div class="stat-value">${stats.completedTasks}</div>
                        </div>
                        <div class="stat-card">
                            <h3>In Progress</h3>
                            <div class="stat-value">${stats.inProgressTasks}</div>
                        </div>
                        <div class="stat-card">
                            <h3>To Do</h3>
                            <div class="stat-value">${stats.todoTasks}</div>
                        </div>
                    </div>
                    
                    <div class="progress-section">
                        <h2>Overall Progress</h2>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks * 100) : 0}%"></div>
                        </div>
                    </div>
                </div>
                
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    
                    function syncGitHub() {
                        vscode.postMessage({ command: 'syncGitHub' });
                    }
                    
                    function refresh() {
                        vscode.postMessage({ command: 'refresh' });
                    }
                </script>
            </body>
            </html>`;
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
}
