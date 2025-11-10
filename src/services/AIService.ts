import OpenAI from 'openai';
import * as vscode from 'vscode';

export interface ProjectRequirements {
    title: string;
    description: string;
    features: string[];
    tasks: Task[];
    techStack: string[];
    architecture: string;
}

export interface Task {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedHours: number;
    dependencies: string[];
    acceptanceCriteria: string[];
}

export class AIService {
    private openai: OpenAI | null = null;

    constructor(private context: vscode.ExtensionContext) {
        this.initialize();
    }

    private initialize() {
        const config = vscode.workspace.getConfiguration('taskMaster');
        const apiKey = config.get<string>('ai.apiKey');
        
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        }
    }

    async generateProjectRequirements(projectIdea: string): Promise<ProjectRequirements | null> {
        if (!this.openai) {
            vscode.window.showWarningMessage('AI service not configured. Using fallback mode.');
            return this.getFallbackRequirements(projectIdea);
        }

        try {
            const prompt = `
                Based on the following project idea, generate detailed project requirements:
                "${projectIdea}"
                
                Please provide:
                1. A clear project title
                2. Detailed description
                3. List of main features
                4. Breakdown of tasks with priorities and time estimates
                5. Recommended tech stack
                6. High-level architecture description
                
                Format the response as JSON with the following structure:
                {
                    "title": "string",
                    "description": "string",
                    "features": ["string"],
                    "tasks": [{
                        "title": "string",
                        "description": "string",
                        "priority": "high|medium|low",
                        "estimatedHours": number,
                        "dependencies": ["string"],
                        "acceptanceCriteria": ["string"]
                    }],
                    "techStack": ["string"],
                    "architecture": "string"
                }
            `;

            const response = await this.openai.chat.completions.create({
                model: vscode.workspace.getConfiguration('taskMaster').get('ai.model') || 'gpt-4',
                messages: [
                    { role: 'system', content: 'You are a project planning assistant. Always respond with valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2000
            });

            const content = response.choices[0]?.message?.content;
            if (content) {
                return JSON.parse(content) as ProjectRequirements;
            }
        } catch (error) {
            vscode.window.showErrorMessage(`AI generation failed: ${error}`);
        }

        return null;
    }

    async refineTask(task: Task, context: string): Promise<Task | null> {
        if (!this.openai) {
            return task;
        }

        try {
            const prompt = `
                Refine the following task based on the project context:
                
                Task: ${JSON.stringify(task)}
                Context: ${context}
                
                Improve the task description, add more specific acceptance criteria, 
                and adjust time estimates if needed. Return the refined task as JSON.
            `;

            const response = await this.openai.chat.completions.create({
                model: vscode.workspace.getConfiguration('taskMaster').get('ai.model') || 'gpt-4',
                messages: [
                    { role: 'system', content: 'You are a task refinement assistant. Always respond with valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 1000
            });

            const content = response.choices[0]?.message?.content;
            if (content) {
                return JSON.parse(content) as Task;
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Task refinement failed: ${error}`);
        }

        return null;
    }

    private getFallbackRequirements(projectIdea: string): ProjectRequirements {
        return {
            title: 'New Project',
            description: projectIdea,
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            tasks: [
                {
                    title: 'Setup project structure',
                    description: 'Initialize project with necessary configurations',
                    priority: 'high',
                    estimatedHours: 2,
                    dependencies: [],
                    acceptanceCriteria: ['Project structure created', 'Dependencies installed']
                },
                {
                    title: 'Implement core functionality',
                    description: 'Build the main features of the application',
                    priority: 'high',
                    estimatedHours: 16,
                    dependencies: ['Setup project structure'],
                    acceptanceCriteria: ['Core features working', 'Tests passing']
                }
            ],
            techStack: ['TypeScript', 'Node.js'],
            architecture: 'Modular architecture with clear separation of concerns'
        };
    }
}
