import * as vscode from 'vscode';
import { GitHubService } from '../services/GitHubService';
import { AIService } from '../services/AIService';
import { Project, Task, ProjectData } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectManager {
    private projects: Project[] = [];
    private currentProject: Project | undefined;
    private storagePath: string;

    constructor(
        private context: vscode.ExtensionContext,
        private githubService: GitHubService,
        private aiService: AIService
    ) {
        this.storagePath = path.join(context.globalStorageUri.fsPath, 'projects.json');
        this.loadProjects();
    }

    private loadProjects(): void {
        if (fs.existsSync(this.storagePath)) {
            const data = fs.readFileSync(this.storagePath, 'utf8');
            this.projects = JSON.parse(data);
            if (this.projects.length > 0) {
                this.currentProject = this.projects[0];
            }
        }
    }

    private async saveProjects(): Promise<void> {
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.storagePath, JSON.stringify(this.projects, null, 2));
    }

    async createProject(projectData: ProjectData): Promise<Project> {
        const project: Project = {
            id: `project_${Date.now()}`,
            name: projectData.name,
            description: projectData.description,
            requirements: projectData.requirements,
            tasks: [],
            githubRepo: projectData.githubRepo,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.projects.push(project);
        this.currentProject = project;
        await this.saveProjects();

        if (projectData.createGitHub) {
            await this.githubService.createRepository(project.name, project.description);
        }

        return project;
    }

    async generateTasks(requirements: string): Promise<Task[]> {
        const tasks = await this.aiService.generateTasksFromRequirements(requirements);
        if (this.currentProject) {
            this.currentProject.tasks = tasks;
            await this.saveProjects();
        }
        return tasks;
    }

    async syncWithGitHub(): Promise<void> {
        if (!this.currentProject?.githubRepo) {
            vscode.window.showWarningMessage('No GitHub repository configured');
            return;
        }

        try {
            const issues = await this.githubService.getIssues(this.currentProject.githubRepo);
            
            for (const issue of issues) {
                const existingTask = this.currentProject.tasks.find(
                    t => t.githubIssueNumber === issue.number
                );
                
                if (!existingTask) {
                    const task: Task = {
                        id: `task_${issue.number}`,
                        title: issue.title,
                        description: issue.body || '',
                        status: issue.state === 'open' ? 'todo' : 'completed',
                        priority: 'medium',
                        githubIssueNumber: issue.number,
                        labels: issue.labels?.map((l: { name: string }) => l.name) || []
                    };
                    this.currentProject.tasks.push(task);
                }
            }
            
            await this.saveProjects();
        } catch (error) {
            vscode.window.showErrorMessage(`GitHub sync failed: ${error}`);
        }
    }

    getTasks(): Task[] {
        return this.currentProject?.tasks || [];
    }

    async createTask(task: Omit<Task, 'id'>): Promise<void> {
        const newTask: Task = {
            ...task,
            id: `task_${Date.now()}`
        };
        if (this.currentProject) {
            this.currentProject.tasks.push(newTask);
            await this.saveProjects();
        }
    }

    async completeTask(taskId: string): Promise<void> {
        if (this.currentProject) {
            const task = this.currentProject.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = 'completed';
                await this.saveProjects();
            }
        }
    }

    async deleteTask(taskId: string): Promise<void> {
        if (this.currentProject) {
            const index = this.currentProject.tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                this.currentProject.tasks.splice(index, 1);
                await this.saveProjects();
            }
        }
    }

    async getTask(taskId: string): Promise<Task | undefined> {
        return this.currentProject?.tasks.find(t => t.id === taskId);
    }

    async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
        if (this.currentProject) {
            const task = this.currentProject.tasks.find(t => t.id === taskId);
            if (task) {
                Object.assign(task, updates);
                await this.saveProjects();
            }
        }
    }

    async getAllTasks(): Promise<Task[]> {
        return this.currentProject?.tasks || [];
    }

    async refreshTasks(): Promise<void> {
        if (this.currentProject?.githubRepo) {
            await this.syncWithGitHub();
        }
    }

    getCurrentProject(): Project | undefined {
        return this.currentProject;
    }

    getProjects(): Project[] {
        return this.projects;
    }
}
