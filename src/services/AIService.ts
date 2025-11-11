import * as vscode from 'vscode';
import OpenAI from 'openai';
import { Task, ProjectRequirements } from '../types';

export { Task, ProjectRequirements };  // Re-export from types

export class AIService {
    private openai: OpenAI | undefined;

    constructor(private context: vscode.ExtensionContext) {
        this.initializeOpenAI();
    }

    private initializeOpenAI() {
        const config = vscode.workspace.getConfiguration('taskMaster');
        const apiKey = config.get<string>('ai.apiKey');
        
        if (apiKey) {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
        }
    }

    async generateProjectRequirements(description: string): Promise<ProjectRequirements> {
        if (!this.openai) {
            throw new Error('OpenAI API not configured');
        }

        const prompt = `Based on the following project description, generate detailed project requirements:
        
        Description: ${description}
        
        Please provide:
        1. A clear title
        2. A detailed description
        3. A list of key features
        4. A list of tasks to implement
        5. Recommended tech stack
        6. Architecture overview
        
        Format the response as JSON.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: vscode.workspace.getConfiguration('taskMaster').get('ai.model') || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that generates project requirements.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                max_tokens: 1000
            });

            const content = response.choices[0]?.message?.content;
            if (content) {
                return JSON.parse(content);
            }
        } catch (error) {
            console.error('Error generating requirements:', error);
            throw error;
        }

        // Return default requirements if generation fails
        return {
            title: 'New Project',
            description: description,
            features: [],
            tasks: [],
            techStack: [],
            architecture: ''
        };
    }

    async generateTasksFromRequirements(requirements: string): Promise<Task[]> {
        if (!this.openai) {
            throw new Error('OpenAI API not configured');
        }

        const prompt = `Based on the following project requirements, generate a list of tasks:
        
        Requirements: ${requirements}
        
        For each task, provide:
        - title
        - description
        - priority (low, medium, high)
        - estimatedHours
        
        Format the response as a JSON array of tasks.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: vscode.workspace.getConfiguration('taskMaster').get('ai.model') || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that generates project tasks.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                max_tokens: 1500
            });

            const content = response.choices[0]?.message?.content;
            if (content) {
                const tasksData = JSON.parse(content);
                return tasksData.map((task: {
                    title: string;
                    description: string;
                    priority?: 'low' | 'medium' | 'high';
                    estimatedHours?: number;
                }, index: number) => ({
                    id: `task_${Date.now()}_${index}`,
                    title: task.title,
                    description: task.description,
                    status: 'todo' as const,
                    priority: task.priority || 'medium',
                    estimatedHours: task.estimatedHours
                }));
            }
        } catch (error) {
            console.error('Error generating tasks:', error);
        }

        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async generateSuggestions(_context: string): Promise<string[]> {
        // Placeholder for generating suggestions
        return [];
    }
}
