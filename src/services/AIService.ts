import * as vscode from 'vscode';
import { Task, ProjectRequirements } from '../types';

export { Task, ProjectRequirements };

// Helper type for parsing unknown data
interface ParsedTaskData {
    id?: string;
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    estimatedHours?: number;
    assignee?: string;
    dueDate?: string;
    labels?: unknown[];
    acceptanceCriteria?: unknown[];
    dependencies?: unknown[];
}

export class AIService {
    constructor(private context: vscode.ExtensionContext) {}

    private async isCopilotAvailable(): Promise<boolean> {
        const copilotExtension = vscode.extensions.getExtension('GitHub.copilot-chat');
        return copilotExtension !== undefined && copilotExtension.isActive;
    }

    private validateAndNormalizeRequirements(data: unknown): ProjectRequirements {
        const obj = data as Record<string, unknown>;
        const tasks = Array.isArray(obj.tasks) ? obj.tasks : [];
        
        return {
            title: (obj.title as string) || 'Untitled Project',
            description: (obj.description as string) || '',
            features: Array.isArray(obj.features) ? obj.features as string[] : [],
            tasks: tasks.map((t: unknown, index: number) => {
                const task = t as ParsedTaskData;
                return {
                    id: task.id || `task_${Date.now()}_${index}`,
                    title: task.title || 'Untitled Task',
                    description: task.description || '',
                    status: (task.status === 'todo' || task.status === 'in-progress' || task.status === 'completed') 
                        ? task.status 
                        : 'todo',
                    priority: (task.priority === 'low' || task.priority === 'medium' || task.priority === 'high') 
                        ? task.priority 
                        : 'medium',
                    estimatedHours: task.estimatedHours,
                    assignee: task.assignee,
                    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
                    labels: Array.isArray(task.labels) ? task.labels as string[] : [],
                    acceptanceCriteria: Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria as string[] : [],
                    dependencies: Array.isArray(task.dependencies) ? task.dependencies as string[] : []
                };
            }),
            techStack: Array.isArray(obj.techStack) ? obj.techStack as string[] : [],
            architecture: (obj.architecture as string) || ''
        };
    }

    async generateProjectRequirements(description: string): Promise<ProjectRequirements> {
        console.log('[AIService] Starting generateProjectRequirements for:', description);
        
        if (!await this.isCopilotAvailable()) {
            const errorMsg = 'GitHub Copilot Chat is not available. Please install and activate the GitHub Copilot Chat extension.';
            console.error('[AIService]', errorMsg);
            vscode.window.showErrorMessage(errorMsg);
            throw new Error('GitHub Copilot Chat not available');
        }

        console.log('[AIService] Copilot Chat is available');

        const prompt = `Based on the following project description, generate detailed project requirements in JSON format:

Description: ${description}

Provide a JSON object with:
- title: Clear project title
- description: Detailed description  
- features: Array of key features (strings)
- tasks: Array with id, title, description, priority ("low"|"medium"|"high"), status ("todo"), estimatedHours
- techStack: Array of technologies
- architecture: Architecture overview

Return ONLY valid JSON.`;

        try {
            console.log('[AIService] Selecting Copilot models...');
            const models = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4' });
            console.log('[AIService] Found models:', models.length);
            
            if (models.length === 0) {
                throw new Error('No Copilot models available. Make sure GitHub Copilot is properly configured.');
            }

            console.log('[AIService] Sending request to Copilot...');
            const response = await models[0].sendRequest(
                [vscode.LanguageModelChatMessage.User(prompt)],
                {},
                new vscode.CancellationTokenSource().token
            );
            
            console.log('[AIService] Receiving response...');
            let fullResponse = '';
            for await (const fragment of response.text) {
                fullResponse += fragment;
            }

            console.log('[AIService] Full response received:', fullResponse.substring(0, 200) + '...');

            const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/) || fullResponse.match(/```\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : fullResponse;
            console.log('[AIService] Parsing JSON...');
            const parsed = JSON.parse(jsonString.trim());
            
            console.log('[AIService] Successfully generated requirements');
            vscode.window.showInformationMessage('Project requirements generated successfully!');
            return this.validateAndNormalizeRequirements(parsed);
        } catch (error) {
            console.error('[AIService] Error generating requirements:', error);
            const errorMsg = `Failed to generate requirements: ${error instanceof Error ? error.message : String(error)}`;
            vscode.window.showErrorMessage(errorMsg);
            return {
                title: 'New Project',
                description: description,
                features: [],
                tasks: [],
                techStack: [],
                architecture: ''
            };
        }
    }

    async generateTasksFromRequirements(requirements: string): Promise<Task[]> {
        if (!await this.isCopilotAvailable()) {
            return [];
        }

        const prompt = `Generate tasks in JSON array format for: ${requirements}

Each task needs: id, title, description, priority ("low"|"medium"|"high"), status ("todo"), estimatedHours.
Return ONLY JSON array.`;

        try {
            const models = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4' });
            if (models.length === 0) {
                return [];
            }

            const response = await models[0].sendRequest(
                [vscode.LanguageModelChatMessage.User(prompt)],
                {},
                new vscode.CancellationTokenSource().token
            );
            
            let fullResponse = '';
            for await (const fragment of response.text) {
                fullResponse += fragment;
            }

            const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/) || fullResponse.match(/```\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : fullResponse;
            const tasksData = JSON.parse(jsonString.trim());

            return Array.isArray(tasksData) ? tasksData.map((task: unknown, index: number) => {
                const t = task as ParsedTaskData;
                return {
                    id: t.id || `task_${Date.now()}_${index}`,
                    title: t.title || 'Untitled Task',
                    description: t.description || '',
                    status: 'todo' as const,
                    priority: (t.priority === 'low' || t.priority === 'medium' || t.priority === 'high') 
                        ? t.priority 
                        : 'medium',
                    estimatedHours: t.estimatedHours,
                    assignee: undefined,
                    dueDate: undefined,
                    labels: []
                };
            }) : [];
        } catch (error) {
            console.error('Error generating tasks:', error);
            return [];
        }
    }

    async optimizeCode(code: string, language: string): Promise<string> {
        if (!await this.isCopilotAvailable()) {
            return code;
        }

        try {
            const models = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4' });
            if (models.length === 0) {
                return code;
            }

            const response = await models[0].sendRequest(
                [vscode.LanguageModelChatMessage.User(`Optimize this ${language} code:\n\n${code}`)],
                {},
                new vscode.CancellationTokenSource().token
            );
            
            let fullResponse = '';
            for await (const fragment of response.text) {
                fullResponse += fragment;
            }

            return fullResponse || code;
        } catch (error) {
            console.error('Error optimizing code:', error);
            return code;
        }
    }

    /**
     * Generic method to generate structured responses from Copilot
     * Returns the parsed response or fallback value
     */
    async generateStructuredResponse<T>(prompt: string, fallback: T): Promise<T> {
        console.log('[AIService] Generating structured response...');
        
        if (!await this.isCopilotAvailable()) {
            console.warn('[AIService] Copilot not available, using fallback');
            return fallback;
        }

        try {
            const models = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4' });
            if (models.length === 0) {
                console.warn('[AIService] No models available, using fallback');
                return fallback;
            }

            const response = await models[0].sendRequest(
                [vscode.LanguageModelChatMessage.User(prompt)],
                {},
                new vscode.CancellationTokenSource().token
            );
            
            let fullResponse = '';
            for await (const fragment of response.text) {
                fullResponse += fragment;
            }

            console.log('[AIService] Response received, parsing...');
            
            // Try to extract JSON from response
            const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/) || fullResponse.match(/```\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : fullResponse;
            
            const parsed = JSON.parse(jsonString.trim());
            console.log('[AIService] Successfully parsed structured response');
            return parsed as T;
        } catch (error) {
            console.error('[AIService] Error generating structured response:', error);
            return fallback;
        }
    }
}
