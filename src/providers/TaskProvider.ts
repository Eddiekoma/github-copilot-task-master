import * as vscode from 'vscode';
import { ProjectManager } from '../managers/ProjectManager';
import { Task } from '../services/AIService';

export class TaskProvider implements vscode.TreeDataProvider<TaskItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TaskItem | undefined | null | void> = new vscode.EventEmitter<TaskItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TaskItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private projectManager: ProjectManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TaskItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TaskItem): Thenable<TaskItem[]> {
        if (!element) {
            const tasks = this.projectManager.getTasks();
            return Promise.resolve(
                tasks.map(task => new TaskItem(
                    task.title,
                    task.description,
                    task.priority,
                    vscode.TreeItemCollapsibleState.None
                ))
            );
        }
        return Promise.resolve([]);
    }
}

class TaskItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private description: string,
        private priority: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}: ${this.description}`;
        this.description = `[${priority}]`;
        
        // Set icon based on priority
        this.iconPath = new vscode.ThemeIcon(
            priority === 'high' ? 'flame' : 
            priority === 'medium' ? 'circle-filled' : 
            'circle-outline'
        );
    }
}
