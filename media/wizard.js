(function() {
    const vscode = acquireVsCodeApi();

    document.getElementById('generateBtn')?.addEventListener('click', () => {
        const projectIdea = document.getElementById('projectIdea').value;
        if (projectIdea) {
            vscode.postMessage({
                command: 'generateRequirements',
                projectIdea: projectIdea
            });
        }
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'requirementsGenerated':
                console.log('Requirements generated:', message.requirements);
                // TODO: Display requirements in UI
                break;
            case 'projectCreated':
                console.log('Project created:', message.project);
                break;
        }
    });
})();
