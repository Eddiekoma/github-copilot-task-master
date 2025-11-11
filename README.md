# GitHub Copilot Task Master

> Transform project ideas into AI-ready tasks with GitHub integration

## Overview

GitHub Copilot Task Master is a VS Code extension that uses **GitHub Copilot AI** to transform project ideas into comprehensive, actionable tasks with GitHub integration. It features a sophisticated 6-step wizard that generates detailed project definitions, creates AI-ready task prompts, and automatically creates GitHub issues.

## ✨ Key Features

- **🎯 Multi-Step Wizard**: 6-step guided process for complete project definition
- **🤖 AI-Powered Analysis**: Uses GitHub Copilot Chat for intelligent suggestions
- **📋 AI-Ready Tasks**: Each task is a complete prompt with context and examples
- **🔗 GitHub Integration**: Automatic issue creation with rich formatting
- **📝 Copilot Context**: Generates context files for better AI assistance
- **✅ Acceptance Criteria**: Given/When/Then format for all features
- **🏗️ Architecture Design**: AI-generated system architecture
- **📊 Project Review**: Automated completeness assessment

## Prerequisites

- VS Code version ^1.84.0 or higher
- GitHub Copilot Chat extension installed and active
- GitHub Personal Access Token (for repository integration)

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or build from source:
   ```bash
   git clone https://github.com/Eddiekoma/github-copilot-task-master.git
   cd github-copilot-task-master
   npm install
   npm run compile
   ```
3. Press F5 to run in development mode

## Quick Start

1. Open a workspace folder in VS Code
2. Run command: `Task Master: New Project Wizard`
3. Follow the 6-step wizard:
   - **Step 1**: Define project purpose and goals
   - **Step 2**: Specify technical context and constraints
   - **Step 3**: Generate features with acceptance criteria
   - **Step 4**: Design system architecture
   - **Step 5**: Break down into AI-ready tasks
   - **Step 6**: Review completeness and quality
4. Complete wizard to generate:
   - `.github-copilot-task-master.json` (project file)
   - `.vscode/copilot-context.md` (Copilot context)
   - GitHub issues (if configured)

## Features in Detail

### Multi-Step Wizard

The wizard guides you through comprehensive project planning:

1. **Project Purpose**: Define goals, target audience, and success metrics
2. **Technical Context**: Platform, existing systems, constraints, and integrations
3. **Features**: User stories, acceptance criteria, and edge cases
4. **Architecture**: System design, components, and data flow
5. **Task Breakdown**: AI-ready tasks with complete implementation prompts
6. **Review**: Quality assessment and gap analysis

### AI-Ready Task Format

Each generated task includes:
- 🎯 Project context (name, goal, tech stack, architecture)
- 📝 Clear task goal and detailed description
- ✅ Acceptance criteria (Given/When/Then format)
- 🔧 Technical requirements with documentation links
- 💡 Code examples
- 🎨 Design patterns to use
- ⚠️ Constraints and considerations
- 🎲 Potential pitfalls
- 🧪 Testing strategy
- ✨ Success criteria
- 🔗 Dependencies
- 📚 Documentation resources

### GitHub Integration

Automatically creates issues with:
- Rich markdown formatting
- All task details as sections
- Appropriate labels (ai-prompt, priority-*)
- Cross-references for dependencies

### Copilot Context

Generates `.vscode/copilot-context.md` containing:
- Project overview and goals
- Architecture and tech stack
- Key decisions and conventions
- Active tasks and priorities
- Security requirements

This helps GitHub Copilot provide context-aware suggestions while coding.

## Commands

- `Task Master: New Project Wizard` - Start the multi-step wizard
- `Task Master: Show Dashboard` - View project dashboard
- `Task Master: Sync with GitHub` - Sync tasks with GitHub issues

## Configuration

### GitHub Token

Set your GitHub Personal Access Token in VS Code settings:

```json
{
  "taskMaster.github.token": "ghp_your_token_here"
}
```

Required permissions: `repo`, `write:packages`

## Project Structure

```
github-copilot-task-master/
├── src/
│   ├── wizard/              # Multi-step wizard
│   │   ├── WizardController.ts
│   │   ├── WizardOrchestrator.ts
│   │   └── steps/          # Individual step handlers
│   ├── types/
│   │   └── projectModels.ts # Comprehensive type definitions
│   ├── services/
│   │   ├── AIService.ts    # Copilot Chat integration
│   │   ├── GitHubService.ts # GitHub API
│   │   └── ProjectFileService.ts # Project file management
│   ├── context/
│   │   └── CopilotContextProvider.ts
│   └── panels/             # Webview panels
└── docs/
    └── MULTI_STEP_WIZARD.md # Detailed implementation guide
```

## Architecture

- **Frontend**: VS Code Webview panels with HTML/CSS/JavaScript
- **Backend**: Extension running in VS Code process
- **AI**: VS Code Language Model API (vscode.lm) with GitHub Copilot Chat
- **Storage**: JSON files in workspace + VS Code global storage
- **GitHub**: REST API via @octokit/rest

## Development

### Build

```bash
npm run compile
```

### Watch Mode

```bash
npm run watch
```

### Lint

```bash
npm run lint
```

### Package

```bash
vsce package
```

## Documentation

- [Multi-Step Wizard Guide](docs/MULTI_STEP_WIZARD.md) - Detailed implementation documentation
- [Design Plan](To_get_started.md) - Original design and architecture

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT - See LICENSE file for details

## Acknowledgments

- Built with VS Code Extension API
- Uses GitHub Copilot Chat for AI capabilities
- Inspired by claude-task-master

## Support

- Issues: [GitHub Issues](https://github.com/Eddiekoma/github-copilot-task-master/issues)
- Discussions: [GitHub Discussions](https://github.com/Eddiekoma/github-copilot-task-master/discussions)

---

Made with ❤️ using GitHub Copilot

2. **System Architecture**:
   - Define the architecture diagram showing the interaction between the webview UI, extension backend, and GitHub API.
   - Specify the data flow and VS Code Language Model API integration.

#### Phase 3: Development

1. **Setup Development Environment**:

   - Initialize a new VS Code extension project using Yeoman or the VS Code Extension Generator.
   - Install required dependencies: @octokit/rest for GitHub integration.

2. **Implement Wizard**:

   - Create the wizard webview panel using HTML/CSS/JavaScript.
   - Integrate GitHub Copilot using VS Code's Language Model API (vscode.lm.selectChatModels).
   - Requires GitHub Copilot Chat extension to be installed and active.
   - No API keys needed - uses native VS Code AI integration.

3. **GitHub Integration**:

   - Uses @octokit/rest with GitHub Personal Access Token (configured in extension settings).
   - Implement functions to manage tasks, issues, and pull requests.
   - Use the GitHub REST API to fetch and update task data.

4. **Progress Tracking Dashboard**:

   - Develop a dashboard webview to display project progress, including task completion rates and outstanding issues.
   - **Planned:** Implement charts and graphs using libraries like Chart.js or D3.js.

5. **User Preferences and Settings**:
   - Allow users to configure GitHub Personal Access Token in extension settings.
   - Store project data and preferences using VS Code's global storage API.

#### Phase 4: Testing

1. **Unit Testing**: Write unit tests for individual components and functions using Jest or Mocha.
2. **Integration Testing**: Test the integration between the extension backend and GitHub API, ensuring data flows correctly between components.
3. **User Acceptance Testing**: Conduct testing sessions with users to gather feedback and make necessary adjustments.

#### Phase 5: Deployment

1. **Publish VS Code Extension**: Package the extension and publish it to the Visual Studio Code Marketplace.
2. **Documentation**: Create comprehensive documentation for users, including installation instructions, usage guides, and troubleshooting tips.

#### Phase 6: Maintenance and Updates

1. **Monitor User Feedback**: Continuously gather user feedback and make improvements based on their suggestions.
2. **Regular Updates**: Release updates to fix bugs, add new features, and improve performance.

### Timeline

| Phase                   | Duration |
| ----------------------- | -------- |
| Requirements Gathering  | 2 weeks  |
| Design                  | 3 weeks  |
| Development             | 8 weeks  |
| Testing                 | 3 weeks  |
| Deployment              | 1 week   |
| Maintenance and Updates | Ongoing  |

### Conclusion

The GitHub Copilot Task Master project aims to enhance project management through GitHub Copilot's AI assistance via VS Code's Language Model API and seamless integration with GitHub. By following this detailed design and implementation plan, we can create a powerful tool that simplifies task management and improves project tracking for developers.
