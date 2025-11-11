import * as vscode from 'vscode';
import { WizardOrchestrator } from './WizardOrchestrator';
import { PurposeStep } from './steps/PurposeStep';
import { TechnicalContextStep } from './steps/TechnicalContextStep';
import { FeaturesStep } from './steps/FeaturesStep';
import { ArchitectureStep } from './steps/ArchitectureStep';
import { TaskBreakdownStep } from './steps/TaskBreakdownStep';
import { ReviewStep } from './steps/ReviewStep';
import { AIService } from '../services/AIService';
import { GitHubService } from '../services/GitHubService';
import { ProjectFileService } from '../services/ProjectFileService';
import { CopilotContextProvider } from '../context/CopilotContextProvider';
import { 
    ProjectFile, AIContext, Conventions
} from '../types/projectModels';

/**
 * Master controller for the multi-step wizard
 * Coordinates all wizard steps and services
 */
export class WizardController {
    private orchestrator: WizardOrchestrator;
    private purposeStep: PurposeStep;
    private technicalStep: TechnicalContextStep;
    private featuresStep: FeaturesStep;
    private architectureStep: ArchitectureStep;
    private taskBreakdownStep: TaskBreakdownStep;
    private reviewStep: ReviewStep;
    private projectFileService: ProjectFileService;
    private contextProvider: CopilotContextProvider;

    constructor(
        private context: vscode.ExtensionContext,
        private webview: vscode.Webview,
        private aiService: AIService,
        private githubService: GitHubService
    ) {
        this.orchestrator = new WizardOrchestrator(context, webview, aiService);
        this.purposeStep = new PurposeStep(aiService);
        this.technicalStep = new TechnicalContextStep(aiService);
        this.featuresStep = new FeaturesStep(aiService);
        this.architectureStep = new ArchitectureStep(aiService);
        this.taskBreakdownStep = new TaskBreakdownStep(aiService);
        this.reviewStep = new ReviewStep(aiService);
        this.projectFileService = new ProjectFileService();
        this.contextProvider = new CopilotContextProvider(this.projectFileService, context);
    }

    /**
     * Start the wizard
     */
    async startWizard(): Promise<void> {
        await this.orchestrator.startWizard();
    }

    /**
     * Handle message from webview
     */
    async handleMessage(message: { command: string; [key: string]: unknown }): Promise<void> {
        console.log('[WizardController] Handling message:', message.command);

        switch (message.command) {
            case 'startWizard':
                await this.startWizard();
                break;

            case 'generateQuestions':
                await this.handleGenerateQuestions(String(message.projectIdea || ''));
                break;

            case 'analyzePurpose':
                await this.handleAnalyzePurpose(message.data as { projectName: string; problemStatement: string; responses: Array<{ question: string; answer: string }> });
                break;

            case 'analyzeTechnicalNeeds':
                await this.handleAnalyzeTechnicalNeeds();
                break;

            case 'generateFeatures':
                await this.handleGenerateFeatures();
                break;

            case 'generateArchitecture':
                await this.handleGenerateArchitecture();
                break;

            case 'generateTasks':
                await this.handleGenerateTasks();
                break;

            case 'reviewProject':
                await this.handleReviewProject();
                break;

            case 'completeWizard':
                await this.handleCompleteWizard(message.data as { github?: { repositoryUrl: string; issuePrefix: string; projectBoard?: string }; createGitHubIssues?: boolean });
                break;

            case 'nextStep':
                await this.orchestrator.nextStep(message.data);
                break;

            case 'previousStep':
                await this.orchestrator.previousStep();
                break;

            default:
                console.warn('[WizardController] Unknown command:', message.command);
        }
    }

    /**
     * Generate clarifying questions for project purpose
     */
    private async handleGenerateQuestions(projectIdea: string): Promise<void> {
        try {
            vscode.window.showInformationMessage('Generating clarifying questions...');
            const questions = await this.purposeStep.generateQuestions(projectIdea);
            
            this.webview.postMessage({
                command: 'questionsGenerated',
                questions
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate questions: ${error}`);
            this.webview.postMessage({
                command: 'error',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Analyze purpose from user responses
     */
    private async handleAnalyzePurpose(data: { projectName: string; problemStatement: string; responses: Array<{ question: string; answer: string }> }): Promise<void> {
        try {
            vscode.window.showInformationMessage('Analyzing project purpose...');
            const purpose = await this.purposeStep.analyzePurpose(
                data.projectName,
                data.problemStatement,
                data.responses
            );
            
            await this.orchestrator.nextStep(purpose);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to analyze purpose: ${error}`);
        }
    }

    /**
     * Analyze technical needs based on purpose
     */
    private async handleAnalyzeTechnicalNeeds(): Promise<void> {
        try {
            const wizardData = this.orchestrator.getWizardData();
            if (!wizardData.purpose) {
                throw new Error('Purpose data not available');
            }

            vscode.window.showInformationMessage('Analyzing technical requirements...');
            const suggestions = await this.technicalStep.analyzeTechnicalNeeds(wizardData.purpose);
            
            this.webview.postMessage({
                command: 'technicalSuggestions',
                suggestions
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to analyze technical needs: ${error}`);
        }
    }

    /**
     * Generate features based on purpose and technical context
     */
    private async handleGenerateFeatures(): Promise<void> {
        try {
            const wizardData = this.orchestrator.getWizardData();
            if (!wizardData.purpose || !wizardData.technicalContext) {
                throw new Error('Missing required data for feature generation');
            }

            vscode.window.showInformationMessage('Generating features with AI...');
            const features = await this.featuresStep.generateFeatures(
                wizardData.purpose,
                wizardData.technicalContext
            );
            
            this.webview.postMessage({
                command: 'featuresGenerated',
                features
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate features: ${error}`);
        }
    }

    /**
     * Generate architecture design
     */
    private async handleGenerateArchitecture(): Promise<void> {
        try {
            const wizardData = this.orchestrator.getWizardData();
            if (!wizardData.features || !wizardData.technicalContext) {
                throw new Error('Missing required data for architecture generation');
            }

            vscode.window.showInformationMessage('Designing system architecture...');
            const architecture = await this.architectureStep.generateArchitecture(
                wizardData.features,
                wizardData.technicalContext
            );
            
            this.webview.postMessage({
                command: 'architectureGenerated',
                architecture
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate architecture: ${error}`);
        }
    }

    /**
     * Generate AI-ready tasks
     */
    private async handleGenerateTasks(): Promise<void> {
        try {
            const wizardData = this.orchestrator.getWizardData();
            if (!wizardData.features || !wizardData.architecture || 
                !wizardData.technicalContext || !wizardData.purpose) {
                throw new Error('Missing required data for task generation');
            }

            vscode.window.showInformationMessage('Breaking down features into AI-ready tasks...');
            const tasks = await this.taskBreakdownStep.generateAIReadyTasks(
                wizardData.features,
                wizardData.architecture,
                wizardData.technicalContext,
                wizardData.purpose
            );
            
            this.webview.postMessage({
                command: 'tasksGenerated',
                tasks
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate tasks: ${error}`);
        }
    }

    /**
     * Review complete project
     */
    private async handleReviewProject(): Promise<void> {
        try {
            const wizardData = this.orchestrator.getWizardData();
            
            vscode.window.showInformationMessage('Reviewing project completeness...');
            const review = await this.reviewStep.reviewProject(wizardData);
            const health = this.reviewStep.calculateProjectHealth(review);
            
            this.webview.postMessage({
                command: 'reviewCompleted',
                review,
                health
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to review project: ${error}`);
        }
    }

    /**
     * Complete wizard and save project
     */
    private async handleCompleteWizard(data: { github?: { repositoryUrl: string; issuePrefix: string; projectBoard?: string }; createGitHubIssues?: boolean }): Promise<void> {
        try {
            const wizardData = this.orchestrator.getWizardData();
            
            // Build complete project file
            const projectFile: ProjectFile = {
                version: '1.0.0',
                projectId: wizardData.projectId || `project_${Date.now()}`,
                purpose: wizardData.purpose!,
                technicalContext: wizardData.technicalContext!,
                features: wizardData.features!,
                architecture: wizardData.architecture!,
                tasks: wizardData.tasks!,
                review: wizardData.review!,
                createdAt: wizardData.createdAt || new Date(),
                updatedAt: new Date(),
                github: data.github,
                aiContext: this.buildAIContext(wizardData)
            };

            // Save project file
            vscode.window.showInformationMessage('Saving project file...');
            await this.projectFileService.saveProjectFile(projectFile);

            // Generate Copilot context
            await this.contextProvider.injectIntoWorkspace();

            // Create GitHub issues if requested
            if (data.createGitHubIssues && data.github) {
                vscode.window.showInformationMessage('Creating GitHub issues...');
                await this.githubService.createAllIssues(projectFile);
            }

            // Notify success
            this.webview.postMessage({
                command: 'wizardCompleted',
                projectFile
            });

            vscode.window.showInformationMessage('🎉 Project created successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to complete wizard: ${error}`);
            console.error('[WizardController] Error completing wizard:', error);
        }
    }

    /**
     * Build AI context from wizard data
     */
    private buildAIContext(wizardData: Partial<ProjectFile>): AIContext {
        const summary = `${wizardData.purpose?.problemStatement || ''}\n\nKey Goals: ${
            wizardData.purpose?.primaryGoals.join(', ') || ''
        }`;

        const conventions: Conventions = {
            codeStyle: 'Follow standard TypeScript/JavaScript best practices',
            namingConventions: 'Use camelCase for variables, PascalCase for classes',
            fileStructure: 'Organize by feature/domain',
            testingApproach: 'Write unit tests for all business logic',
            documentationStandards: 'Document all public APIs with JSDoc'
        };

        return {
            projectSummary: summary,
            keyDecisions: [],
            conventions
        };
    }
}
