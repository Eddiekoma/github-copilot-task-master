import * as vscode from 'vscode';
import { Task } from '../types';
import { TaskController } from './taskController';

export class TaskProvider implements vscode.TreeDataProvider<TaskItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<TaskItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private taskController: TaskController) {
        taskController.onDidChangeTasks(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TaskItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TaskItem): Thenable<TaskItem[]> {
        if (!element) {
            const tasks = this.taskController.getTasks();
            return Promise.resolve(
                tasks.map((task: Task) => new TaskItem(
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
        this.tooltip = `${this.task.title} - ${this.task.status}`;
        this.description = this.task.status;
        
        this.iconPath = this.getIconPath();
    }

    private getIconPath(): vscode.ThemeIcon {
        switch (this.task.status) {
            case 'completed':
                return new vscode.ThemeIcon('check');
            case 'in-progress':
                return new vscode.ThemeIcon('sync~spin');
            default:
                return new vscode.ThemeIcon('circle-outline');
        }
    }
}