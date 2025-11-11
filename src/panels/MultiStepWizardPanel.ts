import * as vscode from 'vscode';
import { WizardOrchestrator } from '../wizard/WizardOrchestrator';
import { AIService } from '../services/AIService';

/**
 * Panel for the new 6-step wizard using WizardOrchestrator
 */
export class MultiStepWizardPanel {
  public static currentPanel: MultiStepWizardPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _orchestrator: WizardOrchestrator;

  public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (MultiStepWizardPanel.currentPanel) {
      MultiStepWizardPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'multiStepWizard',
      'Project Setup Wizard',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'webview')
        ]
      }
    );

    MultiStepWizardPanel.currentPanel = new MultiStepWizardPanel(panel, extensionUri, context);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Create AI service and orchestrator
    const aiService = new AIService(context);
    this._orchestrator = new WizardOrchestrator(context, panel.webview, aiService);

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'nextStep':
            await this._orchestrator.nextStep(message.data);
            break;
          case 'previousStep':
            await this._orchestrator.previousStep();
            break;
          case 'analyzeWithAI':
            await this._orchestrator.handleAIAnalysis(message.step, message.data);
            break;
          case 'suggestTechStack':
            await this._orchestrator.handleTechStackSuggestion(message.step, message.data);
            break;
        }
      },
      null,
      this._disposables
    );

    // Start the wizard
    this._orchestrator.startWizard();
  }

  public dispose() {
    MultiStepWizardPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get URIs for styles and scripts
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'wizard.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>Project Setup Wizard</title>
  <style>
    body {
      padding: 20px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
    }
    .wizard-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .progress-bar {
      height: 4px;
      background: var(--vscode-progressBar-background);
      margin-bottom: 30px;
      border-radius: 2px;
    }
    .progress-fill {
      height: 100%;
      background: var(--vscode-button-background);
      transition: width 0.3s ease;
      border-radius: 2px;
    }
    .step-indicator {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      font-size: 12px;
    }
    .step-dot {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--vscode-input-background);
      border: 2px solid var(--vscode-input-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .step-dot.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .step-dot.completed {
      background: var(--vscode-testing-iconPassed);
      color: white;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    input, textarea, select {
      width: 100%;
      padding: 8px 12px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
      font-family: inherit;
      font-size: 13px;
    }
    textarea {
      resize: vertical;
      min-height: 80px;
    }
    button {
      padding: 8px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    button.ai-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 10px 0;
    }
    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 30px;
      justify-content: space-between;
    }
    .step {
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #stepContent {
      min-height: 400px;
    }
  </style>
</head>
<body>
  <div class="wizard-container">
    <h1>🚀 Project Setup Wizard</h1>
    
    <div class="progress-bar">
      <div class="progress-fill" id="progressBar" style="width: 16.67%"></div>
    </div>
    
    <div class="step-indicator" id="stepIndicator">
      <div class="step-dot active">1</div>
      <div class="step-dot">2</div>
      <div class="step-dot">3</div>
      <div class="step-dot">4</div>
      <div class="step-dot">5</div>
      <div class="step-dot">6</div>
    </div>
    
    <div id="stepContent">
      <!-- Step content will be injected here -->
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentStep = 1;
    const totalSteps = 6;

    // Listen for messages from extension
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'showStep':
          showStep(message.step, message.html, message.data);
          break;
        case 'aiAnalysisResult':
          displayAIResult(message);
          break;
        case 'techStackSuggestions':
          displayTechStackSuggestions(message.suggestions);
          break;
      }
    });

    function showStep(stepNumber, html, data) {
      currentStep = stepNumber;
      
      // Update progress bar
      const progress = (stepNumber / totalSteps) * 100;
      document.getElementById('progressBar').style.width = progress + '%';
      
      // Update step indicators
      const dots = document.querySelectorAll('.step-dot');
      dots.forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index + 1 === stepNumber) {
          dot.classList.add('active');
        } else if (index + 1 < stepNumber) {
          dot.classList.add('completed');
        }
      });
      
      // Update content
      document.getElementById('stepContent').innerHTML = html;
      
      // Attach event listeners to new content
      attachEventListeners(stepNumber);
      
      // Restore data if available
      if (data) {
        restoreFormData(stepNumber, data);
      }
    }

    function attachEventListeners(stepNumber) {
      // Next button
      const nextBtn = document.querySelector('[id^="nextStep"]');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          const data = collectStepData(stepNumber);
          vscode.postMessage({ command: 'nextStep', data });
        });
      }
      
      // Back button
      const backBtn = document.querySelector('[id^="backStep"]');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          vscode.postMessage({ command: 'previousStep' });
        });
      }
      
      // Step 1: AI Analyze button
      const aiBtn = document.getElementById('analyzeWithAI');
      if (aiBtn) {
        aiBtn.addEventListener('click', () => {
          const data = collectStepData(stepNumber);
          vscode.postMessage({ command: 'analyzeWithAI', step: stepNumber, data });
        });
      }

      // Step 2: Add System button
      const addSystemBtn = document.getElementById('addSystem');
      if (addSystemBtn) {
        addSystemBtn.addEventListener('click', () => {
          const systemsList = document.getElementById('systemsList');
          if (systemsList) {
            const systemDiv = document.createElement('div');
            systemDiv.className = 'system-input';
            systemDiv.style.marginBottom = '8px';
            systemDiv.style.display = 'flex';
            systemDiv.style.gap = '8px';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'System name (e.g., Salesforce CRM, Azure AD)';
            input.className = 'existingSystem';
            input.style.flex = '1';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.type = 'button';
            removeBtn.style.padding = '6px 12px';
            removeBtn.style.background = 'var(--vscode-button-secondaryBackground)';
            removeBtn.style.color = 'var(--vscode-button-secondaryForeground)';
            removeBtn.style.border = 'none';
            removeBtn.style.cursor = 'pointer';
            removeBtn.addEventListener('click', () => systemDiv.remove());
            
            systemDiv.appendChild(input);
            systemDiv.appendChild(removeBtn);
            systemsList.appendChild(systemDiv);
            input.focus();
          }
        });
      }

      // Step 2: Suggest Tech Stack AI button
      const suggestTechStackBtn = document.getElementById('suggestTechStack');
      if (suggestTechStackBtn) {
        suggestTechStackBtn.addEventListener('click', () => {
          const data = collectStepData(stepNumber);
          vscode.postMessage({ command: 'suggestTechStack', step: stepNumber, data });
        });
      }
    }

    function collectStepData(stepNumber) {
      const inputs = document.querySelectorAll('input, textarea, select');
      
      if (stepNumber === 1) {
        // Step 1: Purpose - map to ProjectPurpose interface
        const purpose = {
          name: '',
          problemStatement: '',
          targetAudience: [],
          primaryGoals: [],
          successMetrics: [],
          businessRequirements: []
        };
        
        inputs.forEach(input => {
          const value = input.value;
          
          if (input.id === 'projectName') {
            purpose.name = value;
          } else if (input.id === 'problemStatement') {
            purpose.problemStatement = value;
          } else if (input.id === 'targetAudience') {
            purpose.targetAudience = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
          } else if (input.id === 'primaryGoals') {
            purpose.primaryGoals = value.split('\\n').map(s => s.trim()).filter(s => s.length > 0);
          } else if (input.id === 'successMetrics') {
            purpose.successMetrics = value.split('\\n').map(s => s.trim()).filter(s => s.length > 0);
          }
        });
        
        console.log('Collected Purpose data:', purpose);
        return purpose;
      }
      
      if (stepNumber === 2) {
        // Step 2: Technical Context - collect existing systems separately
        const data = {
          existingSystems: []
        };
        
        // Collect existing systems
        const systemInputs = document.querySelectorAll('.existingSystem');
        systemInputs.forEach(input => {
          if (input.value.trim()) {
            data.existingSystems.push(input.value.trim());
          }
        });
        
        // Collect other fields
        inputs.forEach(input => {
          if (input.id && !input.classList.contains('existingSystem')) {
            data[input.id] = input.value;
          }
        });
        
        console.log('Collected Technical Context data:', data);
        return data;
      }
      
      // For other steps, collect as generic object
      const data = {};
      inputs.forEach(input => {
        if (input.id) {
          data[input.id] = input.value;
        }
      });
      
      console.log('Collected step data:', data);
      return data;
    }

    function restoreFormData(stepNumber, data) {
      // Restore form values from saved data
      Object.keys(data).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
          element.value = data[key];
        }
      });
    }

    function displayAIResult(message) {
      // Display AI-generated suggestions and fill form fields
      console.log('AI Result received:', message);
      
      if (!message || !message.data) {
        console.error('No data in AI result');
        return;
      }
      
      const data = message.data;
      console.log('Filling fields with:', data);
      
      // Fill form fields with AI-enhanced data
      if (data.name) {
        const nameInput = document.getElementById('projectName');
        if (nameInput) {
          nameInput.value = data.name;
          console.log('Set projectName:', data.name);
        }
      }
      
      if (data.problemStatement) {
        const problemInput = document.getElementById('problemStatement');
        if (problemInput) {
          problemInput.value = data.problemStatement;
          console.log('Set problemStatement');
        }
      }
      
      if (data.targetAudience && Array.isArray(data.targetAudience)) {
        const audienceInput = document.getElementById('targetAudience');
        if (audienceInput) {
          audienceInput.value = data.targetAudience.join(', ');
          console.log('Set targetAudience');
        }
      }
      
      if (data.primaryGoals && Array.isArray(data.primaryGoals)) {
        const goalsInput = document.getElementById('primaryGoals');
        if (goalsInput) {
          goalsInput.value = data.primaryGoals.join('\\n');
          console.log('Set primaryGoals');
        }
      }
      
      if (data.successMetrics && Array.isArray(data.successMetrics)) {
        const metricsInput = document.getElementById('successMetrics');
        if (metricsInput) {
          metricsInput.value = data.successMetrics.join('\\n');
          console.log('Set successMetrics');
        }
      }
      
      // Show success message
      const message2 = document.createElement('div');
      message2.style.cssText = 'background: #4caf50; color: white; padding: 12px; border-radius: 4px; margin: 10px 0; font-weight: bold;';
      message2.textContent = '✅ AI has enhanced your project definition!';
      const content = document.getElementById('stepContent');
      if (content && content.firstChild) {
        content.insertBefore(message2, content.firstChild);
        setTimeout(() => message2.remove(), 5000);
      }
    }

    function displayTechStackSuggestions(suggestions) {
      console.log('Tech Stack Suggestions received:', suggestions);
      
      const suggestionsDiv = document.getElementById('aiSuggestions');
      if (!suggestionsDiv) {
        console.error('aiSuggestions div not found');
        return;
      }
      
      // Build HTML for suggestions
      let html = '<h3 style="margin-top: 0; color: var(--vscode-foreground);">🤖 AI-Suggested Tech Stack</h3>';
      
      const sections = [
        { key: 'backend', label: '🔧 Backend', icon: '⚙️' },
        { key: 'frontend', label: '🎨 Frontend', icon: '🖥️' },
        { key: 'database', label: '💾 Database', icon: '📊' },
        { key: 'cloud', label: '☁️ Cloud Platform', icon: '🌐' },
        { key: 'security', label: '🔒 Security', icon: '🛡️' },
        { key: 'api', label: '🔌 API Architecture', icon: '🔗' },
        { key: 'devTools', label: '🛠️ Development Tools', icon: '⚒️' },
        { key: 'testing', label: '🧪 Testing', icon: '✅' }
      ];
      
      sections.forEach(section => {
        if (suggestions[section.key]) {
          const item = suggestions[section.key];
          html += \`
            <div style="margin: 15px 0; padding: 12px; background: var(--vscode-editor-background); border-left: 3px solid var(--vscode-button-background); border-radius: 4px;">
              <div style="font-weight: bold; color: var(--vscode-button-background); margin-bottom: 6px;">
                \${section.icon} \${section.label}
              </div>
              <div style="font-size: 14px; color: var(--vscode-foreground); margin-bottom: 4px;">
                <strong>\${item.technology}</strong>
              </div>
              <div style="font-size: 12px; color: var(--vscode-descriptionForeground); font-style: italic;">
                \${item.reasoning}
              </div>
            </div>
          \`;
        }
      });
      
      suggestionsDiv.innerHTML = html;
      suggestionsDiv.style.display = 'block';
      
      // Scroll to suggestions
      suggestionsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  </script>
</body>
</html>`;
  }
}
