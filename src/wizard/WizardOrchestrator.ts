import * as vscode from 'vscode';
import { ProjectFile, ProjectPurpose, TechnicalContext, Feature, Architecture, AITask, ProjectReview } from '../types/projectModels';
import { AIService } from '../services/AIService';

/**
 * Orchestrates the multi-step wizard flow
 * Manages state transitions and data collection across all wizard steps
 */
export class WizardOrchestrator {
    private currentStep: number = 1;
    private readonly totalSteps: number = 6;
    private wizardData: Partial<ProjectFile> = {};

    constructor(
        private context: vscode.ExtensionContext,
        private webview: vscode.Webview,
        private aiService: AIService
    ) {}

    /**
     * Initialize and start the wizard from step 1
     */
    async startWizard(): Promise<void> {
        this.currentStep = 1;
        this.wizardData = {
            version: '1.0.0',
            projectId: `project_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.showStep(1);
    }

    /**
     * Advance to the next step after saving current step data
     */
    async nextStep(data: any): Promise<void> {
        console.log(`[WizardOrchestrator] Moving from step ${this.currentStep} to next step`);
        
        // Save current step data
        await this.saveStepData(this.currentStep, data);
        
        // Move to next step
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            await this.showStep(this.currentStep);
        } else {
            await this.completeWizard();
        }
    }

    /**
     * Go back to the previous step
     */
    async previousStep(): Promise<void> {
        if (this.currentStep > 1) {
            this.currentStep--;
            await this.showStep(this.currentStep);
        }
    }

    /**
     * Display a specific wizard step
     */
    private async showStep(stepNumber: number): Promise<void> {
        console.log(`[WizardOrchestrator] Showing step ${stepNumber}`);
        
        const stepData = this.getStepData(stepNumber);
        
        this.webview.postMessage({
            command: 'showStep',
            step: stepNumber,
            totalSteps: this.totalSteps,
            data: stepData,
            wizardData: this.wizardData
        });
    }

    /**
     * Save data collected in a specific step
     */
    private async saveStepData(step: number, data: any): Promise<void> {
        console.log(`[WizardOrchestrator] Saving data for step ${step}`);
        
        switch (step) {
            case 1: // Project Purpose
                this.wizardData.purpose = data as ProjectPurpose;
                break;
            case 2: // Technical Context
                this.wizardData.technicalContext = data as TechnicalContext;
                break;
            case 3: // Features
                this.wizardData.features = data as Feature[];
                break;
            case 4: // Architecture
                this.wizardData.architecture = data as Architecture;
                break;
            case 5: // Task Breakdown
                this.wizardData.tasks = data as AITask[];
                break;
            case 6: // Review
                this.wizardData.review = data as ProjectReview;
                break;
        }
        
        this.wizardData.updatedAt = new Date();
    }

    /**
     * Get data for a specific step (for display purposes)
     */
    private getStepData(step: number): any {
        switch (step) {
            case 1:
                return this.wizardData.purpose || {};
            case 2:
                return this.wizardData.technicalContext || {};
            case 3:
                return this.wizardData.features || [];
            case 4:
                return this.wizardData.architecture || {};
            case 5:
                return this.wizardData.tasks || [];
            case 6:
                return {
                    purpose: this.wizardData.purpose,
                    technicalContext: this.wizardData.technicalContext,
                    features: this.wizardData.features,
                    architecture: this.wizardData.architecture,
                    tasks: this.wizardData.tasks
                };
            default:
                return {};
        }
    }

    /**
     * Complete the wizard and create the project
     */
    private async completeWizard(): Promise<void> {
        console.log('[WizardOrchestrator] Completing wizard');
        
        // Validate all required data is present
        if (!this.validateWizardData()) {
            vscode.window.showErrorMessage('Please complete all required steps before finishing.');
            return;
        }

        // Notify webview that wizard is complete
        this.webview.postMessage({
            command: 'wizardComplete',
            projectFile: this.wizardData
        });

        vscode.window.showInformationMessage('Project definition created successfully!');
    }

    /**
     * Validate that all required wizard data has been collected
     */
    private validateWizardData(): boolean {
        return !!(
            this.wizardData.purpose &&
            this.wizardData.technicalContext &&
            this.wizardData.features &&
            this.wizardData.architecture &&
            this.wizardData.tasks &&
            this.wizardData.review
        );
    }

    /**
     * Get the complete wizard data
     */
    getWizardData(): Partial<ProjectFile> {
        return this.wizardData;
    }

    /**
     * Reset wizard to initial state
     */
    reset(): void {
        this.currentStep = 1;
        this.wizardData = {
            version: '1.0.0',
            projectId: `project_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}
