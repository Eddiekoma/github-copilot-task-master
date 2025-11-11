export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    assignee?: string;
    dueDate?: Date;
    labels?: string[];
    estimatedHours?: number;
    githubIssueNumber?: number;
    acceptanceCriteria?: string[];
    dependencies?: string[];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    requirements: ProjectRequirements;
    tasks: Task[];
    githubRepo?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectRequirements {
    title: string;
    description: string;
    features: string[];
    tasks: Task[];
    techStack: string[];
    architecture: string;
}

export interface AIResponse {
    requirements?: ProjectRequirements;
    tasks?: Task[];
    suggestions?: string[];
}

export interface DashboardStats {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionRate: number;
}

export interface ProjectData {
    name: string;
    description: string;
    requirements: ProjectRequirements;
    githubRepo?: string;
    createGitHub?: boolean;
}
