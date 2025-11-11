export interface TaskStatus {
    id: string;
    status: 'todo' | 'in-progress' | 'completed' | 'blocked';
    startedAt?: Date;
    completedAt?: Date;
    blockedReason?: string;
}

export interface TaskMetrics {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    blockedTasks: number;
    totalEstimatedHours: number;
    completedHours: number;
    remainingHours: number;
    completionRate: number;
    averageCompletionTime: number;
}

export interface TaskProgress {
    taskId: string;
    percentComplete: number;
    hoursSpent: number;
    lastUpdated: Date;
    notes?: string;
}

export class TaskTracking {
    private taskStatuses: Map<string, TaskStatus> = new Map();
    private taskProgress: Map<string, TaskProgress> = new Map();
    private taskCompletionTimes: Map<string, number> = new Map();

    /**
     * Updates the status of a task
     */
    updateTaskStatus(taskId: string, status: TaskStatus['status'], reason?: string): void {
        const currentStatus = this.taskStatuses.get(taskId);
        const now = new Date();

        const newStatus: TaskStatus = {
            id: taskId,
            status,
            startedAt: currentStatus?.startedAt,
            completedAt: currentStatus?.completedAt,
            blockedReason: reason
        };

        // Handle status transitions
        if (status === 'in-progress' && (!currentStatus || currentStatus.status === 'todo')) {
            newStatus.startedAt = now;
        } else if (status === 'completed' && currentStatus?.status !== 'completed') {
            newStatus.completedAt = now;
            
            // Calculate completion time if we have a start time
            if (currentStatus?.startedAt) {
                const completionTime = now.getTime() - currentStatus.startedAt.getTime();
                this.taskCompletionTimes.set(taskId, completionTime);
            }
        } else if (status === 'blocked') {
            newStatus.blockedReason = reason || 'No reason provided';
        }

        this.taskStatuses.set(taskId, newStatus);
    }

    /**
     * Gets the status of a specific task
     */
    getTaskStatus(taskId: string): TaskStatus | undefined {
        return this.taskStatuses.get(taskId);
    }

    /**
     * Updates the progress of a task
     */
    updateTaskProgress(taskId: string, percentComplete: number, hoursSpent: number, notes?: string): void {
        const progress: TaskProgress = {
            taskId,
            percentComplete: Math.min(100, Math.max(0, percentComplete)),
            hoursSpent,
            lastUpdated: new Date(),
            notes
        };

        this.taskProgress.set(taskId, progress);

        // Auto-update status based on progress
        if (percentComplete === 100) {
            this.updateTaskStatus(taskId, 'completed');
        } else if (percentComplete > 0) {
            const status = this.getTaskStatus(taskId);
            if (!status || status.status === 'todo') {
                this.updateTaskStatus(taskId, 'in-progress');
            }
        }
    }

    /**
     * Gets the progress of a specific task
     */
    getTaskProgress(taskId: string): TaskProgress | undefined {
        return this.taskProgress.get(taskId);
    }

    /**
     * Calculates metrics for a set of tasks
     */
    getMetrics(tasks: Array<{id: string, estimatedHours: number}>): TaskMetrics {
        let completedTasks = 0;
        let inProgressTasks = 0;
        let todoTasks = 0;
        let blockedTasks = 0;
        let completedHours = 0;
        let totalEstimatedHours = 0;
        let remainingHours = 0;
        let totalCompletionTime = 0;
        let completionCount = 0;

        for (const task of tasks) {
            const status = this.taskStatuses.get(task.id);
            const progress = this.taskProgress.get(task.id);
            totalEstimatedHours += task.estimatedHours;

            const taskStatus = status?.status || 'todo';
            const hoursCompleted = progress 
                ? (task.estimatedHours * progress.percentComplete / 100)
                : 0;

            switch (taskStatus) {
                case 'completed':
                    completedTasks++;
                    completedHours += task.estimatedHours;
                    const completionTime = this.taskCompletionTimes.get(task.id);
                    if (completionTime) {
                        totalCompletionTime += completionTime;
                        completionCount++;
                    }
                    break;
                case 'in-progress':
                    inProgressTasks++;
                    completedHours += hoursCompleted;
                    remainingHours += task.estimatedHours - hoursCompleted;
                    break;
                case 'blocked':
                    blockedTasks++;
                    remainingHours += task.estimatedHours - hoursCompleted;
                    break;
                case 'todo':
                default:
                    todoTasks++;
                    remainingHours += task.estimatedHours;
                    break;
            }
        }

        const averageCompletionTime = completionCount > 0 
            ? totalCompletionTime / completionCount 
            : 0;

        return {
            totalTasks: tasks.length,
            completedTasks,
            inProgressTasks,
            todoTasks,
            blockedTasks,
            totalEstimatedHours,
            completedHours,
            remainingHours,
            completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
            averageCompletionTime
        };
    }

    /**
     * Gets tasks by status
     */
    getTasksByStatus(status: TaskStatus['status']): string[] {
        const tasks: string[] = [];
        this.taskStatuses.forEach((taskStatus, taskId) => {
            if (taskStatus.status === status) {
                tasks.push(taskId);
            }
        });
        return tasks;
    }

    /**
     * Clears all tracking data
     */
    clearAll(): void {
        this.taskStatuses.clear();
        this.taskProgress.clear();
        this.taskCompletionTimes.clear();
    }

    /**
     * Exports tracking data for persistence
     */
    exportData(): {
        statuses: Array<[string, TaskStatus]>,
        progress: Array<[string, TaskProgress]>,
        completionTimes: Array<[string, number]>
    } {
        return {
            statuses: Array.from(this.taskStatuses.entries()),
            progress: Array.from(this.taskProgress.entries()),
            completionTimes: Array.from(this.taskCompletionTimes.entries())
        };
    }

    /**
     * Imports tracking data from persistence
     */
    importData(data: {
        statuses: Array<[string, TaskStatus]>,
        progress: Array<[string, TaskProgress]>,
        completionTimes: Array<[string, number]>
    }): void {
        this.taskStatuses = new Map(data.statuses);
        this.taskProgress = new Map(data.progress);
        this.taskCompletionTimes = new Map(data.completionTimes);
    }
}