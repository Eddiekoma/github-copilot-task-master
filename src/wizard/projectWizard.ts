import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectRequirements } from '../services/AIService';
import { AIAssistant } from './aiAssistant';
import { RequirementsAnalyzer } from './requirementsAnalyzer';

export interface WizardStep {
    id: string;
    title: string;
    description: string;
    inputType: 'text' | 'multiline' | 'select' | 'confirm';
    options?: string[];
    defaultValue?: string;
    validation?: (value: string) => string | null;
}

export interface WizardResult {
    projectName: string;
    description: string;
    projectType: string;
    requirements: ProjectRequirements;
    githubRepo?: string;
}

export class ProjectWizard {
    private steps: WizardStep[] = [
        {
            id: 'projectName',
            title: 'Project Name',
            description: 'Enter a name for your project',
            inputType: 'text',
            validation: (value) => {
                if (!value || value.trim().length < 3) {
                    return 'Project name must be at least 3 characters';
                }
                if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
                    return 'Project name can only contain letters, numbers, hyphens, and underscores';
                }
                return null;
            }
        },
        {
            id: 'projectType',
            title: 'Project Type',
            description: 'Select the type of project you want to create',
            inputType: 'select',
            options: [
                'Web Application',
                'REST API',
                'CLI Tool',
                'VS Code Extension',
                'Library/Package',
                'Mobile App',
                'Desktop Application',
                'Machine Learning Model',
                'Other'
            ]
        },
        {
            id: 'description',
            title: 'Project Description',
            description: 'Describe your project in detail. Be specific about features, goals, and requirements.',
            inputType: 'multiline',
            validation: (value) => {
                if (!value || value.trim().length < 20) {
                    return 'Please provide a more detailed description (at least 20 characters)';
                }
                return null;
            }
        },
        {
            id: 'techStack',
            title: 'Technology Stack',
            description: 'Select the technologies you want to use (comma-separated)',
            inputType: 'text',
            defaultValue: ''
        },
        {
            id: 'githubIntegration',
            title: 'GitHub Integration',
            description: 'Do you want to create a GitHub repository for this project?',
            inputType: 'confirm'
        }
    ];

    constructor(
        private aiAssistant: AIAssistant,
        private requirementsAnalyzer: RequirementsAnalyzer
    ) {}

    /**
     * Runs the project wizard
     */
    async run(): Promise<WizardResult | null> {
        const responses: Record<string, unknown> = {};

        // Execute each step
        for (const step of this.steps) {
            const response = await this.executeStep(step);
            if (response === undefined) {
                // User cancelled
                return null;
            }
            responses[step.id] = response;
        }

        // Generate requirements using AI
        const projectIdea = `
            Project Name: ${responses.projectName}
            Type: ${responses.projectType}
            Description: ${responses.description}
            Tech Stack: ${responses.techStack || 'To be determined'}
        `.trim();

        vscode.window.showInformationMessage('Generating project requirements with AI...');
        
        const requirements = await this.aiAssistant.generateRequirements(projectIdea);
        if (!requirements) {
            vscode.window.showErrorMessage('Failed to generate project requirements');
            return null;
        }

        // Analyze and validate requirements
        const analyzed = await this.requirementsAnalyzer.analyzeProjectIdea(projectIdea);
        if (analyzed && analyzed.suggestions.length > 0) {
            const showSuggestions = await vscode.window.showInformationMessage(
                'AI has suggestions for your project. Would you like to see them?',
                'Yes', 'No'
            );
            
            if (showSuggestions === 'Yes') {
                await vscode.window.showQuickPick(
                    analyzed.suggestions,
                    {
                        placeHolder: 'AI Suggestions',
                        canPickMany: false
                    }
                );
            }
        }

        return {
            projectName: responses.projectName as string,
            description: responses.description as string,
            projectType: responses.projectType as string,
            requirements,
            githubRepo: responses.githubIntegration ? responses.projectName as string : undefined
        };
    }

    /**
     * Executes a single wizard step
     */
    private async executeStep(step: WizardStep): Promise<string | boolean | undefined> {
        switch (step.inputType) {
            case 'text':
                return this.getTextInput(step);
            case 'multiline':
                return this.getMultilineInput(step);
            case 'select':
                return this.getSelectInput(step);
            case 'confirm':
                return this.getConfirmInput(step);
            default:
                return undefined;
        }
    }

    /**
     * Gets text input from user
     */
    private async getTextInput(step: WizardStep): Promise<string | undefined> {
        const input = await vscode.window.showInputBox({
            title: step.title,
            prompt: step.description,
            value: step.defaultValue,
            validateInput: step.validation
        });
        return input;
    }

    /**
     * Gets multiline text input from user
     */
    private async getMultilineInput(step: WizardStep): Promise<string | undefined> {
        // VS Code doesn't have native multiline input, so we'll use a workaround
        const input = await vscode.window.showInputBox({
            title: step.title,
            prompt: step.description + ' (You can use semicolons to separate lines)',
            value: step.defaultValue,
            validateInput: step.validation
        });
        return input;
    }

    /**
     * Gets selection from user
     */
    private async getSelectInput(step: WizardStep): Promise<string | undefined> {
        if (!step.options) {
            return undefined;
        }
        
        const selection = await vscode.window.showQuickPick(step.options, {
            title: step.title,
            placeHolder: step.description
        });
        return selection;
    }

    /**
     * Gets confirmation from user
     */
    private async getConfirmInput(step: WizardStep): Promise<boolean> {
        const response = await vscode.window.showInformationMessage(
            step.description,
            'Yes',
            'No'
        );
        return response === 'Yes';
    }

    /**
     * Creates a project structure based on wizard results
     */
    async createProjectStructure(result: WizardResult, targetPath: string): Promise<void> {
        // Define the project structure based on project type
        const structure = this.getProjectStructure(result.projectType);

        // Create directories and files
        for (const item of structure) {
            const fullPath = path.join(targetPath, item.path);
            
            if (item.type === 'directory') {
                await fs.promises.mkdir(fullPath, { recursive: true });
            } else if (item.type === 'file') {
                const dirPath = path.dirname(fullPath);
                await fs.promises.mkdir(dirPath, { recursive: true });
                await fs.promises.writeFile(fullPath, item.content || '');
            }
        }

        // Create project configuration files
        await this.createConfigFiles(result, targetPath);
    }

    /**
     * Gets project structure based on project type
     */
    private getProjectStructure(projectType: string): Array<{path: string, type: 'file' | 'directory', content?: string}> {
        const baseStructure = [
            { path: 'src', type: 'directory' as const },
            { path: 'tests', type: 'directory' as const },
            { path: 'docs', type: 'directory' as const },
            { path: '.vscode', type: 'directory' as const },
            { path: 'README.md', type: 'file' as const, content: '# Project\n\nProject description here.' },
            { path: '.gitignore', type: 'file' as const, content: 'node_modules/\n.env\ndist/\n*.log' }
        ];

        const typeSpecific: Record<string, Array<{path: string, type: 'file' | 'directory', content?: string}>> = {
            'Web Application': [
                { path: 'src/components', type: 'directory' },
                { path: 'src/pages', type: 'directory' },
                { path: 'src/styles', type: 'directory' },
                { path: 'public', type: 'directory' },
                { path: 'src/index.ts', type: 'file', content: '// Main application entry point\n' }
            ],
            'REST API': [
                { path: 'src/routes', type: 'directory' },
                { path: 'src/controllers', type: 'directory' },
                { path: 'src/models', type: 'directory' },
                { path: 'src/middleware', type: 'directory' },
                { path: 'src/server.ts', type: 'file', content: '// API server entry point\n' }
            ],
            'CLI Tool': [
                { path: 'src/commands', type: 'directory' },
                { path: 'src/utils', type: 'directory' },
                { path: 'src/cli.ts', type: 'file', content: '#!/usr/bin/env node\n// CLI entry point\n' }
            ],
            'VS Code Extension': [
                { path: 'src/extension.ts', type: 'file', content: '// Extension entry point\n' },
                { path: 'src/commands', type: 'directory' },
                { path: 'media', type: 'directory' }
            ]
        };

        const specificStructure = typeSpecific[projectType] || [];
        return [...baseStructure, ...specificStructure];
    }

    /**
     * Creates configuration files for the project
     */
    private async createConfigFiles(result: WizardResult, targetPath: string): Promise<void> {
        // Create package.json
        const packageJson = {
            name: result.projectName.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            description: result.description,
            main: 'dist/index.js',
            scripts: {
                'build': 'tsc',
                'test': 'jest',
                'dev': 'ts-node-dev src/index.ts'
            },
            keywords: [],
            author: '',
            license: 'MIT',
            devDependencies: {
                '@types/node': '^20.0.0',
                'typescript': '^5.0.0',
                'jest': '^29.0.0',
                '@types/jest': '^29.0.0'
            },
            dependencies: {}
        };

        await fs.promises.writeFile(
            path.join(targetPath, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        // Create tsconfig.json
        const tsConfig = {
            compilerOptions: {
                target: 'ES2020',
                module: 'commonjs',
                lib: ['ES2020'],
                outDir: './dist',
                rootDir: './src',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                resolveJsonModule: true,
                declaration: true,
                declarationMap: true,
                sourceMap: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist', 'tests']
        };

        await fs.promises.writeFile(
            path.join(targetPath, 'tsconfig.json'),
            JSON.stringify(tsConfig, null, 2)
        );

        // Create .env.example
        const envExample = `# Environment Variables
NODE_ENV=development
PORT=3000
DATABASE_URL=
API_KEY=
`;

        await fs.promises.writeFile(
            path.join(targetPath, '.env.example'),
            envExample
        );
    }
}