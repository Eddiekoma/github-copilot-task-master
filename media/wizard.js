(function() {
    const vscode = acquireVsCodeApi();
    let currentRequirements = null;
    let currentStep = 1;
    let wizardData = {};
    let useMultiStepWizard = false; // Toggle between old and new wizard

    // Multi-step wizard toggle button (if you want to add it to UI)
    function initializeWizard() {
        // Check if we should use multi-step wizard
        const urlParams = new URLSearchParams(window.location.search);
        useMultiStepWizard = urlParams.get('multiStep') === 'true';
        
        console.log('[Wizard] Using multi-step wizard:', useMultiStepWizard);
        
        if (useMultiStepWizard) {
            // Start the new multi-step wizard
            vscode.postMessage({ command: 'startWizard' });
        }
    }

    // OLD WIZARD HANDLERS (backward compatible)
    document.getElementById('generateBtn')?.addEventListener('click', () => {
        const projectIdea = document.getElementById('projectIdea').value;
        if (projectIdea.trim()) {
            console.log('[Wizard] Sending generateRequirements command with:', projectIdea);
            vscode.postMessage({
                command: 'generateRequirements',
                projectIdea: projectIdea
            });
        } else {
            showError('Please enter a project description first!');
        }
    });

    document.getElementById('backBtn')?.addEventListener('click', () => {
        if (useMultiStepWizard) {
            vscode.postMessage({ command: 'previousStep' });
        } else {
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step1').style.display = 'block';
        }
    });

    document.getElementById('createProjectBtn')?.addEventListener('click', () => {
        if (currentRequirements) {
            console.log('[Wizard] Creating project with requirements');
            vscode.postMessage({
                command: 'createProject',
                projectData: {
                    name: currentRequirements.title,
                    description: currentRequirements.description,
                    requirements: currentRequirements,
                    createGitHub: false
                }
            });
        }
    });

    window.addEventListener('message', event => {
        const message = event.data;
        console.log('[Wizard] Received message:', message);
        switch (message.command) {
            case 'showStep':
                // NEW: Multi-step wizard
                handleShowStep(message);
                break;
            case 'wizardComplete':
                showSuccess('Project created successfully! GitHub issues will be created in the background.');
                break;
            case 'requirementsGenerated':
                console.log('[Wizard] Requirements generated:', message.requirements);
                currentRequirements = message.requirements;
                displayRequirements(message.requirements);
                break;
            case 'requirementsError':
                console.error('[Wizard] Error:', message.error);
                showError('Error generating requirements: ' + message.error);
                break;
            case 'projectCreated':
                console.log('[Wizard] Project created:', message.project);
                showSuccess('Project created successfully!');
                break;
        }
    });

    // NEW: Multi-step wizard handler
    function handleShowStep(message) {
        console.log('[Wizard] Showing step:', message.step, 'of', message.totalSteps);
        currentStep = message.step;
        
        // Update progress indicator
        updateProgressIndicator(message.step, message.totalSteps);
        
        // Display step HTML
        const wizardContainer = document.querySelector('.wizard-container');
        if (wizardContainer) {
            wizardContainer.innerHTML = `
                <h1>🚀 Project Setup Wizard</h1>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(message.step / message.totalSteps) * 100}%"></div>
                </div>
                <div class="step-indicator">Step ${message.step} of ${message.totalSteps}</div>
                ${message.html}
            `;
            
            // Attach event listeners for the new step
            attachStepListeners(message.step);
        }
    }

    function updateProgressIndicator(step, total) {
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${(step / total) * 100}%`;
        }
    }

    function attachStepListeners(step) {
        // Common listeners
        const nextBtn = document.getElementById(`nextStep${step}`);
        const backBtn = document.getElementById(`backStep${step}`);
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const stepData = collectStepData(step);
                vscode.postMessage({
                    command: 'nextStep',
                    data: stepData
                });
            });
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'previousStep' });
            });
        }
        
        // Step-specific listeners
        switch(step) {
            case 1: attachStep1Listeners(); break;
            case 2: attachStep2Listeners(); break;
            case 3: attachStep3Listeners(); break;
            case 4: attachStep4Listeners(); break;
            case 5: attachStep5Listeners(); break;
            case 6: attachStep6Listeners(); break;
        }
    }

    function collectStepData(step) {
        // Collect data based on current step
        switch(step) {
            case 1: return collectStep1Data();
            case 2: return collectStep2Data();
            case 3: return collectStep3Data();
            case 4: return collectStep4Data();
            case 5: return collectStep5Data();
            case 6: return collectStep6Data();
            default: return {};
        }
    }

    // Step 1: Purpose
    function attachStep1Listeners() {
        const analyzeBtn = document.getElementById('analyzeWithAI');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                // Trigger AI analysis
                const purpose = collectStep1Data();
                vscode.postMessage({
                    command: 'analyzePurpose',
                    data: purpose
                });
            });
        }
    }

    function collectStep1Data() {
        return {
            name: document.getElementById('projectName')?.value || '',
            problemStatement: document.getElementById('problemStatement')?.value || '',
            targetAudience: (document.getElementById('targetAudience')?.value || '').split(',').map(s => s.trim()),
            primaryGoals: (document.getElementById('primaryGoals')?.value || '').split('\n').filter(s => s.trim()),
            successMetrics: (document.getElementById('successMetrics')?.value || '').split('\n').filter(s => s.trim()),
            businessRequirements: []
        };
    }

    // Step 2: Technical Context
    function attachStep2Listeners() {
        const suggestBtn = document.getElementById('suggestTechStack');
        if (suggestBtn) {
            suggestBtn.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'suggestTechStack',
                    data: collectStep2Data()
                });
            });
        }
    }

    function collectStep2Data() {
        return {
            platform: document.getElementById('platform')?.value || 'web',
            existingSystems: [],
            constraints: [],
            performanceRequirements: [],
            securityRequirements: (document.getElementById('securityReqs')?.value || '').split('\n').filter(s => s.trim()),
            complianceNeeds: [],
            integrations: []
        };
    }

    // Step 3: Features
    function attachStep3Listeners() {
        const generateBtn = document.getElementById('generateFeatures');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'generateFeatures' });
            });
        }
    }

    function collectStep3Data() {
        // Collect features from UI
        return [];
    }

    // Step 4: Architecture
    function attachStep4Listeners() {
        const generateBtn = document.getElementById('generateArchitecture');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'generateArchitecture' });
            });
        }
    }

    function collectStep4Data() {
        return {};
    }

    // Step 5: Tasks
    function attachStep5Listeners() {
        const generateBtn = document.getElementById('generateTasks');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'generateTasks' });
            });
        }
    }

    function collectStep5Data() {
        return [];
    }

    // Step 6: Review
    function attachStep6Listeners() {
        const reviewBtn = document.getElementById('runReview');
        const createBtn = document.getElementById('createProject');
        
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'runReview' });
            });
        }
        
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const githubRepo = document.getElementById('githubRepo')?.value || '';
                const issuePrefix = document.getElementById('issuePrefix')?.value || 'TASK-';
                
                vscode.postMessage({
                    command: 'createProject',
                    data: {
                        githubRepo,
                        issuePrefix
                    }
                });
            });
        }
    }

    function collectStep6Data() {
        return {
            githubRepo: document.getElementById('githubRepo')?.value || '',
            issuePrefix: document.getElementById('issuePrefix')?.value || 'TASK-'
        };
    }

    // Initialize on load
    initializeWizard();

    function displayRequirements(req) {
        document.getElementById('projectTitle').textContent = req.title || 'Untitled Project';
        document.getElementById('projectDescription').textContent = req.description || 'No description';
        
        const featuresList = document.getElementById('featuresList');
        featuresList.innerHTML = '';
        if (req.features && req.features.length > 0) {
            req.features.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature;
                featuresList.appendChild(li);
            });
        } else {
            featuresList.innerHTML = '<li>No features defined</li>';
        }

        const techStackList = document.getElementById('techStackList');
        techStackList.innerHTML = '';
        if (req.techStack && req.techStack.length > 0) {
            req.techStack.forEach(tech => {
                const badge = document.createElement('span');
                badge.className = 'tech-badge';
                badge.textContent = tech;
                techStackList.appendChild(badge);
            });
        } else {
            techStackList.innerHTML = '<span class="tech-badge">Not specified</span>';
        }

        const architectureText = typeof req.architecture === 'string' 
            ? req.architecture 
            : (req.architecture?.description || JSON.stringify(req.architecture, null, 2) || 'No architecture description');
        document.getElementById('architectureDescription').textContent = architectureText;

        const tasksList = document.getElementById('tasksList');
        tasksList.innerHTML = '';
        if (req.tasks && req.tasks.length > 0) {
            req.tasks.forEach(task => {
                const taskCard = document.createElement('div');
                taskCard.className = 'task-card';
                taskCard.innerHTML = `
                    <h4>${task.title}</h4>
                    <p>${task.description || 'No description'}</p>
                    <div class="task-meta">
                        <span class="priority-${task.priority || 'medium'}">${task.priority || 'medium'} priority</span>
                        ${task.estimatedHours ? `<span>⏱️ ${task.estimatedHours}h</span>` : ''}
                    </div>
                `;
                tasksList.appendChild(taskCard);
            });
        } else {
            tasksList.innerHTML = '<p>No tasks generated</p>';
        }

        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
    }

    function showError(message) {
        console.error('[Wizard]', message);
        // Could add a proper error display in the UI
    }

    function showSuccess(message) {
        console.log('[Wizard]', message);
        // Could add a proper success display in the UI
    }
})();
