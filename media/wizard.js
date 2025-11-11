(function() {
    const vscode = acquireVsCodeApi();

    document.getElementById('generateBtn')?.addEventListener('click', () => {
        const projectIdea = document.getElementById('projectIdea').value;
        if (projectIdea) {
            console.log('[Wizard] Sending generateRequirements command with:', projectIdea);
            vscode.postMessage({
                command: 'generateRequirements',
                projectIdea: projectIdea
            });
        } else {
            alert('Please enter a project description first!');
        }
    });

    window.addEventListener('message', event => {
        const message = event.data;
        console.log('[Wizard] Received message:', message);
        switch (message.command) {
            case 'requirementsGenerated':
                console.log('[Wizard] Requirements generated:', message.requirements);
                alert('Requirements generated! Check console for details.\n\nTitle: ' + message.requirements.title);
                // TODO: Display requirements in UI
                break;
            case 'requirementsError':
                console.error('[Wizard] Error:', message.error);
                alert('Error generating requirements: ' + message.error);
                break;
            case 'projectCreated':
                console.log('[Wizard] Project created:', message.project);
                break;
        }
    });
})();
