import * as vscode from 'vscode';
import { ProjectManager } from '../managers/ProjectManager';
import { Task } from '../services/AIService';

export class TaskCommands {
    constructor(private projectManager: ProjectManager) {}

    /**
     * Creates a new task
     */
    async createTask(): Promise<void> {
        const title = await vscode.window.showInputBox({
            prompt: 'Enter task title',
            placeHolder: 'e.g., Implement user authentication'
        });

        if (!title) {
            return;
        }

        const description = await vscode.window.showInputBox({
            prompt: 'Enter task description',
            placeHolder: 'Detailed description of the task'
        });

        const priority = await vscode.window.showQuickPick(
            ['low', 'medium', 'high'],
            { placeHolder: 'Select priority' }
        );

        const task: Task = {
            id: `task-${Date.now()}`,
            title,
            description: description || '',
            priority: (priority || 'medium') as 'low' | 'medium' | 'high',
            status: 'todo' as const,
            assignee: undefined,
            dueDate: undefined,
            labels: [],
            estimatedHours: undefined
        };

        await this.projectManager.createTask(task);
        vscode.window.showInformationMessage(`Task "${title}" created successfully!`);
    }

    /**
     * Marks a task as complete
     */
    async completeTask(taskId: string): Promise<void> {
        try {
            await this.projectManager.completeTask(taskId);
            vscode.window.showInformationMessage('Task marked as complete!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to complete task: ${error}`);
        }
    }

    /**
     * Deletes a task
     */
    async deleteTask(taskId: string): Promise<void> {
        const confirm = await vscode.window.showWarningMessage(
            'Are you sure you want to delete this task?',
            'Yes', 'No'
        );

        if (confirm === 'Yes') {
            try {
                await this.projectManager.deleteTask(taskId);
                vscode.window.showInformationMessage('Task deleted successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to delete task: ${error}`);
            }
        }
    }

    /**
     * Updates a task
     */
    async updateTask(taskId: string): Promise<void> {
        const task = await this.projectManager.getTask(taskId);
        if (!task) {
            vscode.window.showErrorMessage('Task not found');
            return;
        }

        const updatedTitle = await vscode.window.showInputBox({
            prompt: 'Update task title',
            value: task.title
        });

        if (updatedTitle === undefined) {
            return; // User cancelled
        }

        const updatedDescription = await vscode.window.showInputBox({
            prompt: 'Update task description',
            value: task.description
        });

        if (updatedDescription === undefined) {
            return; // User cancelled
        }

        const updatedTask = {
            ...task,
            title: updatedTitle || task.title,
            description: updatedDescription || task.description
        };

        await this.projectManager.updateTask(taskId, updatedTask);
        vscode.window.showInformationMessage('Task updated successfully!');
    }

    /**
     * Shows all tasks
     */
    async showAllTasks(): Promise<void> {
        const tasks = await this.projectManager.getAllTasks();
        
        if (tasks.length === 0) {
            vscode.window.showInformationMessage('No tasks found');
            return;
        }

        const taskItems = tasks.map(task => ({
            label: task.title,
            description: `[${task.priority}] - ${task.estimatedHours}h`,
            detail: task.description,
            task
        }));

        const selected = await vscode.window.showQuickPick(taskItems, {
            placeHolder: 'Select a task to view details'
        });

        if (selected) {
            const action = await vscode.window.showQuickPick(
                ['Complete', 'Edit', 'Delete', 'Cancel'],
                { placeHolder: `What would you like to do with "${selected.task.title}"?` }
            );

            if (action === 'Complete' && selected.task.id) {
                await this.completeTask(selected.task.id);
            } else if (action === 'Edit' && selected.task.id) {
                await this.updateTask(selected.task.id);
            } else if (action === 'Delete' && selected.task.id) {
                await this.deleteTask(selected.task.id);
            }
        }
    }

    /**
     * Refreshes the task view
     */
    async refreshTasks(): Promise<void> {
        await this.projectManager.refreshTasks();
        vscode.window.showInformationMessage('Tasks refreshed!');
    }

    /**
     * Exports tasks to markdown
     */
    async exportTasks(): Promise<void> {
        const tasks = await this.projectManager.getAllTasks();
        
        if (tasks.length === 0) {
            vscode.window.showWarningMessage('No tasks to export');
            return;
        }

        let markdown = '# Project Tasks\n\n';
        
        const highPriorityTasks = tasks.filter(t => t.priority === 'high');
        const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium');
        const lowPriorityTasks = tasks.filter(t => t.priority === 'low');

        if (highPriorityTasks.length > 0) {
            markdown += '## High Priority\n\n';
            highPriorityTasks.forEach(task => {
                markdown += `- **${task.title}** (${task.estimatedHours}h)\n`;
                if (task.description) {
                    markdown += `  ${task.description}\n`;
                }
            });
            markdown += '\n';
        }

        if (mediumPriorityTasks.length > 0) {
            markdown += '## Medium Priority\n\n';
            mediumPriorityTasks.forEach(task => {
                markdown += `- **${task.title}** (${task.estimatedHours}h)\n`;
                if (task.description) {
                    markdown += `  ${task.description}\n`;
                }
            });
            markdown += '\n';
        }

        if (lowPriorityTasks.length > 0) {
            markdown += '## Low Priority\n\n';
            lowPriorityTasks.forEach(task => {
                markdown += `- **${task.title}** (${task.estimatedHours}h)\n`;
                if (task.description) {
                    markdown += `  ${task.description}\n`;
                }
            });
        }

        // Create a new untitled document with the markdown content
        const doc = await vscode.workspace.openTextDocument({
            content: markdown,
            language: 'markdown'
        });
        
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('Tasks exported to markdown!');
    }
}