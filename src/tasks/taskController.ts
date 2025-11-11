import * as vscode from 'vscode';
import { Task } from '../services/AIService';

export class TaskController {
    private tasks: Map<string, Task> = new Map();
    private onDidChangeTasksEmitter = new vscode.EventEmitter<void>();
    public readonly onDidChangeTasks = this.onDidChangeTasksEmitter.event;

    addTask(task: Task): string {
        const id = this.generateTaskId();
        this.tasks.set(id, task);
        this.onDidChangeTasksEmitter.fire();
        return id;
    }

    getTask(id: string): Task | undefined {
        return this.tasks.get(id);
    }

    getTasks(): Task[] {
        return Array.from(this.tasks.values());
    }

    updateTask(id: string, updates: Partial<Task>): boolean {
        const task = this.tasks.get(id);
        if (!task) {
            return false;
        }

        Object.assign(task, updates);
        this.onDidChangeTasksEmitter.fire();
        return true;
    }

    deleteTask(id: string): boolean {
        const deleted = this.tasks.delete(id);
        if (deleted) {
            this.onDidChangeTasksEmitter.fire();
        }
        return deleted;
    }

    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}