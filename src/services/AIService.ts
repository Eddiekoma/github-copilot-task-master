import * as vscode from 'vscode';
import { Task, ProjectRequirements } from '../types';

export { Task, ProjectRequirements };

export class AIService {
    constructor(private context: vscode.ExtensionContext) {}

    private async isCopilotAvailable(): Promise<boolean> {
        const copilotExtension = vscode.extensions.getExtension('GitHub.copilot-chat');
        return copilotExtension !== undefined && copilotExtension.isActive;
    }

    private validateAndNormalizeRequirements(data: any): ProjectRequirements {
        return {
            title: data.title || 'Untitled Project',
            description: data.description || '',
            features: Array.isArray(data.features) ? data.features : [],
            tasks: Array.isArray(data.tasks) ? data.tasks.map((t: any, index: number) => ({
                id: t.id || `task_${Date.now()}_${index}`,
                title: t.title || 'Untitled Task',
                description: t.description || '',
                status: t.status || 'todo',
                priority: t.priority || 'medium',
                estimatedHours: t.estimatedHours || undefined,
                assignee: t.assignee,
                dueDate: t.dueDate,
                labels: t.labels || [],
                acceptanceCriteria: t.acceptanceCriteria || [],
                dependencies: t.dependencies || []
            })) : [],
            techStack: Array.isArray(data.techStack) ? data.techStack : [],
            architecture: data.architecture || ''
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

            return Array.isArray(tasksData) ? tasksData.map((task: any, index: number) => ({
                id: task.id || `task_${Date.now()}_${index}`,
                title: task.title,
                description: task.description,
                status: 'todo' as const,
                priority: task.priority || 'medium',
                estimatedHours: task.estimatedHours,
                assignee: undefined,
                dueDate: undefined,
                labels: []
            })) : [];
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
}
