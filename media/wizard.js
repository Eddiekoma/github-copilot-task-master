(function() {
    const vscode = acquireVsCodeApi();

    document.getElementById('generateBtn')?.addEventListener('click', () => {
        const projectIdea = document.getElementById('projectIdea').value;
        if (projectIdea) {
            vscode.postMessage({
                command: 'createProject',
                projectIdea: projectIdea
            });
        }
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'projectCreated':
                console.log('Project created:', message.project);
                break;
        }
    });
})();
