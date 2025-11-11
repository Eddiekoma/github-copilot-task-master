import * as vscode from 'vscode';
import { ProjectManager } from '../managers/ProjectManager';
import { Task } from '../types';

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
                    task,
                    vscode.TreeItemCollapsibleState.None
                ))
            );
        }
        return Promise.resolve([]);
    }
}

class TaskItem extends vscode.TreeItem {
    constructor(
        public readonly task: Task,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(task.title, collapsibleState);
        
        this.tooltip = `${task.title} - ${task.status}`;
        this.description = task.status;
        
        // Set context value based on status
        this.contextValue = task.status;
        
        // Set icon based on priority
        if (task.priority === 'high') {
            this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('testing.iconFailed'));
        } else if (task.priority === 'medium') {
            this.iconPath = new vscode.ThemeIcon('info');
        } else {
            this.iconPath = new vscode.ThemeIcon('circle-outline');
        }
    }
}
