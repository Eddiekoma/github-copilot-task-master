(function() {
    const vscode = acquireVsCodeApi();

    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'refreshData' });
    });

    document.getElementById('syncBtn')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'syncGitHub' });
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'loadProject':
                displayProject(message.project);
                break;
        }
    });

    function displayProject(project) {
        const content = document.getElementById('content');
        if (content && project) {
            content.innerHTML = `
                <h2>${project.title}</h2>
                <p>${project.description}</p>
                <h3>Tasks (${project.tasks.length})</h3>
                <ul>
                    ${project.tasks.map(task => `<li>${task.title} - ${task.priority}</li>`).join('')}
                </ul>
            `;
        }
    }
})();
