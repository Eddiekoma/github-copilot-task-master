(function() {
    const vscode = acquireVsCodeApi();
    let currentRequirements = null;

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
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step1').style.display = 'block';
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
