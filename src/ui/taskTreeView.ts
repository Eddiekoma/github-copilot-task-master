import * as vscode from 'vscode';
import { TaskController } from '../tasks/taskController';

export class TaskTreeView {
    private treeView: vscode.TreeView<unknown>;

    constructor(
        private taskController: TaskController,
        private treeDataProvider: vscode.TreeDataProvider<unknown>
    ) {
        this.treeView = vscode.window.createTreeView('taskMaster.taskView', {
            treeDataProvider: this.treeDataProvider,
            showCollapseAll: true
        });
    }

    reveal(item: unknown): void {
        this.treeView.reveal(item, {
            select: true,
            focus: true,
            expand: true
        });
    }

    dispose(): void {
        this.treeView.dispose();
    }
}