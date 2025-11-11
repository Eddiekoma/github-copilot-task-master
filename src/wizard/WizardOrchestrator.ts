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
import { GitHubService } from '../services/GitHubService';

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
  private githubService: GitHubService;

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
    this.githubService = new GitHubService(context);
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
  async nextStep(data: unknown) {
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
   * Handle AI analysis for current step
   */
  async handleAIAnalysis(step: number, data: unknown) {
    try {
      console.log('[WizardOrchestrator] AI Analysis requested for step:', step);
      console.log('[WizardOrchestrator] Data:', data);
      
      vscode.window.showInformationMessage('🤖 Analyzing with AI...');
      
      let enhancedData: unknown;
      
      switch (step) {
        case 1: // Purpose
          console.log('[WizardOrchestrator] Calling enhancePurpose...');
          enhancedData = await this.purposeStep.enhancePurpose(data as Partial<ProjectPurpose>);
          console.log('[WizardOrchestrator] Enhanced data received:', enhancedData);
          break;
        case 3: // Features
          // For features step, just acknowledge for now
          vscode.window.showInformationMessage('Feature analysis will be available in next update');
          return;
        default:
          vscode.window.showWarningMessage('AI analysis not available for this step');
          return;
      }
      
      // Send enhanced data back to webview
      console.log('[WizardOrchestrator] Sending result to webview');
      this.webview.postMessage({
        command: 'aiAnalysisResult',
        step,
        data: enhancedData
      });
      
      vscode.window.showInformationMessage('✅ AI analysis complete!');
    } catch (error) {
      console.error('[WizardOrchestrator] AI analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[WizardOrchestrator] Error details:', errorMessage);
      vscode.window.showErrorMessage(`Failed to analyze with AI: ${errorMessage}`);
    }
  }

  async handleTechStackSuggestion(step: number, data: unknown) {
    try {
      console.log('[WizardOrchestrator] Tech Stack Suggestion requested');
      console.log('[WizardOrchestrator] Data:', data);
      
      vscode.window.showInformationMessage('🤖 Analyzing technical requirements...');
      
      // Get purpose from wizard data
      const purpose = this.wizardData.purpose;
      
      // Build AI prompt
      const prompt = `Based on this project context, suggest a comprehensive technology stack:

PROJECT PURPOSE:
- Name: ${purpose?.name || 'Unknown'}
- Problem: ${purpose?.problemStatement || 'Not specified'}
- Goals: ${purpose?.primaryGoals?.join(', ') || 'Not specified'}

TECHNICAL CONTEXT:
${JSON.stringify(data, null, 2)}

Please suggest:
1. Backend Framework/Language
2. Frontend Framework
3. Database Technology
4. Cloud Platform/Hosting
5. Authentication/Security
6. API Architecture
7. Development Tools
8. Testing Frameworks

Format as JSON with sections: backend, frontend, database, cloud, security, api, devTools, testing.
Each section should have: technology (string), reasoning (string)`;

      console.log('[WizardOrchestrator] Calling AI with prompt');
      
      const suggestions = await this.aiService.generateStructuredResponse(
        prompt,
        {
          backend: { technology: 'Node.js with Express', reasoning: 'Popular and flexible' },
          frontend: { technology: 'React', reasoning: 'Component-based and widely adopted' },
          database: { technology: 'PostgreSQL', reasoning: 'Robust relational database' },
          cloud: { technology: 'AWS', reasoning: 'Comprehensive cloud services' },
          security: { technology: 'OAuth 2.0', reasoning: 'Industry standard' },
          api: { technology: 'REST', reasoning: 'Simple and widely supported' },
          devTools: { technology: 'VS Code, Git, Docker', reasoning: 'Standard development workflow' },
          testing: { technology: 'Jest', reasoning: 'Comprehensive testing framework' }
        }
      );
      
      console.log('[WizardOrchestrator] Suggestions received:', suggestions);
      
      // Send suggestions to webview
      this.webview.postMessage({
        command: 'techStackSuggestions',
        suggestions
      });
      
      vscode.window.showInformationMessage('✅ Tech stack suggestions ready!');
    } catch (error) {
      console.error('[WizardOrchestrator] Tech stack suggestion error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Failed to suggest tech stack: ${errorMessage}`);
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
  private async saveStepData(step: number, data: unknown) {
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
      
      // Create GitHub issues in background
      this.createGitHubIssuesAsync(this.wizardData as ProjectFile);
      
      // Trigger completion
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
   * Create GitHub issues asynchronously
   */
  private async createGitHubIssuesAsync(projectFile: ProjectFile) {
    try {
      // Check if GitHub repo is configured
      if (!projectFile.github?.repositoryUrl) {
        console.log('No GitHub repository configured, skipping issue creation');
        return;
      }

      // Parse and set repository
      const success = this.githubService.parseAndSetRepository(projectFile.github.repositoryUrl);
      if (!success) {
        vscode.window.showWarningMessage('Invalid GitHub repository URL');
        return;
      }

      vscode.window.showInformationMessage('Creating GitHub issues...');

      // Create issues for all tasks
      const issuePrefix = projectFile.github.issuePrefix || 'TASK-';
      const taskToIssueMap = await this.githubService.createAIReadyIssues(
        projectFile.tasks,
        issuePrefix
      );

      // Update project file with issue numbers
      projectFile.tasks.forEach(task => {
        const issueNumber = taskToIssueMap.get(task.id);
        if (issueNumber) {
          task.githubIssueNumber = issueNumber;
          task.githubIssueUrl = `${projectFile.github!.repositoryUrl}/issues/${issueNumber}`;
        }
      });

      // Save updated project file
      await this.projectFileService.saveProjectFile(projectFile);

      vscode.window.showInformationMessage(
        `Successfully created ${taskToIssueMap.size} GitHub issues!`
      );
    } catch (error) {
      console.error('Error creating GitHub issues:', error);
      vscode.window.showErrorMessage(
        `Failed to create GitHub issues: ${error instanceof Error ? error.message : String(error)}`
      );
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
          <label>Platform / Environment</label>
          <select id="platform" required>
            <option value="">Select platform...</option>
            <optgroup label="Applications">
              <option value="web">Web Application</option>
              <option value="mobile">Mobile App (iOS/Android)</option>
              <option value="desktop">Desktop Application</option>
              <option value="pwa">Progressive Web App (PWA)</option>
            </optgroup>
            <optgroup label="Cloud Platforms">
              <option value="salesforce">Salesforce (Lightning/Classic)</option>
              <option value="azure">Microsoft Azure</option>
              <option value="aws">Amazon Web Services (AWS)</option>
              <option value="gcp">Google Cloud Platform (GCP)</option>
              <option value="cloud-service">Other Cloud Service</option>
            </optgroup>
            <optgroup label="Other">
              <option value="vscode-extension">VS Code Extension</option>
              <option value="api">REST/GraphQL API</option>
              <option value="microservices">Microservices</option>
              <option value="embedded">Embedded System</option>
              <option value="hybrid">Hybrid (Multiple Platforms)</option>
            </optgroup>
          </select>
        </div>
        
        <div class="form-group">
          <label>Existing Systems to Integrate</label>
          <div id="existingSystems">
            <div id="systemsList"></div>
            <button id="addSystem" type="button" style="margin-top: 10px; padding: 6px 12px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 2px; cursor: pointer;">+ Add System</button>
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
        
        <button id="suggestTechStack" class="ai-button" style="margin: 10px 0; padding: 10px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 2px; cursor: pointer; font-weight: bold;">🤖 Suggest Tech Stack with AI</button>
        
        <div id="aiSuggestions" class="ai-suggestions" style="margin-top: 15px; padding: 15px; background: var(--vscode-editor-inactiveSelectionBackground); border-radius: 4px; display: none;">
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
