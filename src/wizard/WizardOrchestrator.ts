import * as vscode from 'vscode';
import { ProjectFile, ProjectPurpose, TechnicalContext, Feature, Architecture, AITask, ProjectReview } from '../types/projectModels';
import { PurposeStep } from './steps/PurposeStep';
import { TechnicalContextStep } from './steps/TechnicalContextStep';
import { FeaturesStep } from './steps/FeaturesStep';
import { ArchitectureStep } from './steps/ArchitectureStep';
import { TaskBreakdownStep } from './steps/TaskBreakdownStep';
import { ReviewStep } from './steps/ReviewStep';
import { AIService } from '../services/AIService';
import { ProjectFileService } from '../services/ProjectFileService';

/**
 * Orchestrates the multi-step wizard flow
 */
export class WizardOrchestrator {
  private currentStep: number = 1;
  private readonly totalSteps: number = 6;
  private wizardData: Partial<ProjectFile> = {
    version: '1.0.0',
    projectId: `project-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    aiContext: {
      projectSummary: '',
      keyDecisions: [],
      conventions: {
        codeStyle: '',
        namingConventions: '',
        folderStructure: '',
        gitStrategy: '',
        testingStrategy: ''
      }
    }
  };

  // Step handlers
  private purposeStep: PurposeStep;
  private technicalStep: TechnicalContextStep;
  private featuresStep: FeaturesStep;
  private architectureStep: ArchitectureStep;
  private taskBreakdownStep: TaskBreakdownStep;
  private reviewStep: ReviewStep;
  private projectFileService: ProjectFileService;

  constructor(
    private context: vscode.ExtensionContext,
    private webview: vscode.Webview,
    private aiService: AIService
  ) {
    this.purposeStep = new PurposeStep(aiService);
    this.technicalStep = new TechnicalContextStep(aiService);
    this.featuresStep = new FeaturesStep(aiService);
    this.architectureStep = new ArchitectureStep(aiService);
    this.taskBreakdownStep = new TaskBreakdownStep(aiService);
    this.reviewStep = new ReviewStep(aiService);
    this.projectFileService = new ProjectFileService();
  }

  /**
   * Start the wizard from step 1
   */
  async startWizard() {
    console.log('Starting multi-step wizard...');
    this.currentStep = 1;
    await this.showStep(1);
  }

  /**
   * Move to the next step with data from current step
   */
  async nextStep(data: any) {
    console.log(`Processing step ${this.currentStep} data:`, data);
    
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
   * Move to the previous step
   */
  async previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      await this.showStep(this.currentStep);
    }
  }

  /**
   * Display a specific step
   */
  private async showStep(stepNumber: number) {
    const stepHtml = await this.getStepHtml(stepNumber);
    
    this.webview.postMessage({
      command: 'showStep',
      step: stepNumber,
      totalSteps: this.totalSteps,
      html: stepHtml,
      data: this.wizardData
    });
  }

  /**
   * Get HTML content for a specific step
   */
  private async getStepHtml(stepNumber: number): Promise<string> {
    switch (stepNumber) {
      case 1:
        return this.getStep1Html();
      case 2:
        return this.getStep2Html();
      case 3:
        return this.getStep3Html();
      case 4:
        return this.getStep4Html();
      case 5:
        return this.getStep5Html();
      case 6:
        return this.getStep6Html();
      default:
        return '';
    }
  }

  /**
   * Save data from a specific step
   */
  private async saveStepData(step: number, data: any) {
    switch (step) {
      case 1: // Purpose
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
   * Complete the wizard and save the project
   */
  private async completeWizard() {
    try {
      // Final validation
      if (!this.validateProjectData()) {
        vscode.window.showErrorMessage('Project data is incomplete. Please review all steps.');
        return;
      }

      // Save project file
      await this.projectFileService.saveProjectFile(this.wizardData as ProjectFile);
      
      // Show success message
      vscode.window.showInformationMessage(
        'Project successfully created! GitHub issues will be created in the background.'
      );
      
      // Trigger GitHub issue creation
      this.webview.postMessage({
        command: 'wizardComplete',
        projectFile: this.wizardData
      });
    } catch (error) {
      console.error('Error completing wizard:', error);
      vscode.window.showErrorMessage(`Failed to complete wizard: ${error}`);
    }
  }

  /**
   * Validate that all required data is present
   */
  private validateProjectData(): boolean {
    return !!(
      this.wizardData.purpose &&
      this.wizardData.technicalContext &&
      this.wizardData.features &&
      this.wizardData.architecture &&
      this.wizardData.tasks &&
      this.wizardData.tasks.length > 0
    );
  }

  // HTML generation methods for each step
  private getStep1Html(): string {
    return `
      <div class="step" id="step1-purpose">
        <h2>Step 1: Define Project Purpose</h2>
        
        <div class="form-group">
          <label>Project Name</label>
          <input type="text" id="projectName" placeholder="My Awesome Project" required>
        </div>
        
        <div class="form-group">
          <label>What problem are you solving?</label>
          <textarea id="problemStatement" rows="4" placeholder="Describe the problem this project will solve..." required></textarea>
        </div>
        
        <div class="form-group">
          <label>Target Audience (comma-separated)</label>
          <input type="text" id="targetAudience" placeholder="developers, businesses, consumers">
        </div>
        
        <div class="form-group">
          <label>Primary Goals (one per line)</label>
          <textarea id="primaryGoals" rows="3" placeholder="Goal 1\nGoal 2\nGoal 3"></textarea>
        </div>
        
        <div class="form-group">
          <label>Success Metrics (one per line)</label>
          <textarea id="successMetrics" rows="3" placeholder="100 active users\n5-star rating\n99% uptime"></textarea>
        </div>
        
        <button id="analyzeWithAI" class="ai-button">🤖 Analyze & Enhance with AI</button>
        
        <div id="aiQuestions" class="ai-questions" style="display:none;">
          <!-- AI-generated questions appear here -->
        </div>
        
        <div class="button-group">
          <button id="nextStep1" class="primary">Next: Technical Context →</button>
        </div>
      </div>
    `;
  }

  private getStep2Html(): string {
    return `
      <div class="step" id="step2-technical">
        <h2>Step 2: Technical Context</h2>
        
        <div class="form-group">
          <label>Platform</label>
          <select id="platform" required>
            <option value="">Select platform...</option>
            <option value="web">Web Application</option>
            <option value="mobile">Mobile App</option>
            <option value="desktop">Desktop Application</option>
            <option value="cloud">Cloud Service</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Existing Systems to Integrate</label>
          <div id="existingSystems">
            <button id="addSystem" type="button">+ Add System</button>
          </div>
        </div>
        
        <div class="form-group">
          <label>Technical Constraints</label>
          <textarea id="constraints" rows="3" placeholder="Budget limits, technology restrictions, timeline constraints..."></textarea>
        </div>
        
        <div class="form-group">
          <label>Performance Requirements</label>
          <textarea id="performanceReqs" rows="3" placeholder="Response time < 100ms\n1000 concurrent users\n99.9% availability"></textarea>
        </div>
        
        <div class="form-group">
          <label>Security Requirements</label>
          <textarea id="securityReqs" rows="3" placeholder="OAuth 2.0 authentication\nEnd-to-end encryption\nGDPR compliance"></textarea>
        </div>
        
        <button id="suggestTechStack" class="ai-button">🤖 Suggest Tech Stack</button>
        
        <div id="aiSuggestions" class="ai-suggestions">
          <!-- AI suggestions appear here -->
        </div>
        
        <div class="button-group">
          <button id="backStep2">← Back</button>
          <button id="nextStep2" class="primary">Next: Features →</button>
        </div>
      </div>
    `;
  }

  private getStep3Html(): string {
    return `
      <div class="step" id="step3-features">
        <h2>Step 3: Features Deep Dive</h2>
        
        <button id="generateFeatures" class="ai-button">🤖 Generate Features with AI</button>
        
        <div id="featuresList" class="features-list">
          <!-- Generated features appear here -->
        </div>
        
        <button id="addFeature" type="button">+ Add Custom Feature</button>
        
        <div class="button-group">
          <button id="backStep3">← Back</button>
          <button id="nextStep3" class="primary">Next: Architecture →</button>
        </div>
      </div>
    `;
  }

  private getStep4Html(): string {
    return `
      <div class="step" id="step4-architecture">
        <h2>Step 4: Architecture & Design</h2>
        
        <button id="generateArchitecture" class="ai-button">🤖 Generate Architecture</button>
        
        <div id="architectureDisplay" class="architecture-display">
          <!-- Architecture details appear here -->
        </div>
        
        <div class="button-group">
          <button id="backStep4">← Back</button>
          <button id="nextStep4" class="primary">Next: Task Breakdown →</button>
        </div>
      </div>
    `;
  }

  private getStep5Html(): string {
    return `
      <div class="step" id="step5-tasks">
        <h2>Step 5: Task Breakdown</h2>
        
        <button id="generateTasks" class="ai-button">🤖 Generate AI-Ready Tasks</button>
        
        <div id="tasksList" class="tasks-list">
          <!-- Generated tasks appear here -->
        </div>
        
        <div class="task-stats">
          <span id="totalTasks">0 tasks</span>
          <span id="totalHours">0 hours estimated</span>
        </div>
        
        <div class="button-group">
          <button id="backStep5">← Back</button>
          <button id="nextStep5" class="primary">Next: Review →</button>
        </div>
      </div>
    `;
  }

  private getStep6Html(): string {
    return `
      <div class="step" id="step6-review">
        <h2>Step 6: Review & Refine</h2>
        
        <button id="runReview" class="ai-button">🤖 AI Project Review</button>
        
        <div id="reviewResults" class="review-results">
          <!-- Review results appear here -->
        </div>
        
        <div class="form-group">
          <label>GitHub Repository URL (optional)</label>
          <input type="text" id="githubRepo" placeholder="https://github.com/username/repo">
        </div>
        
        <div class="form-group">
          <label>Issue Prefix</label>
          <input type="text" id="issuePrefix" placeholder="TASK-" value="TASK-">
        </div>
        
        <div class="button-group">
          <button id="backStep6">← Back</button>
          <button id="createProject" class="primary">🚀 Create Project & Issues</button>
        </div>
      </div>
    `;
  }
}
