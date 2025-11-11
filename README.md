# GitHub Copilot Task Master

A sophisticated VS Code extension that transforms project ideas into **AI-ready task prompts** and GitHub issues using GitHub Copilot's AI. Define projects deeply, break down features into complete AI prompts, and create perfectly structured GitHub issues ready for AI-assisted development.

> **Inspired by** [claude-task-master](https://github.com/eyaltoledano/claude-task-master) - bringing AI-ready task management directly into VS Code with GitHub Copilot integration.

## ✨ Key Features

### 🎯 Multi-Step Project Wizard

Interactive 6-step wizard that uses AI to deeply define your project:

1. **Project Purpose & Goals** - AI asks clarifying questions about your vision
2. **Technical Context** - Platform, constraints, tech stack suggestions
3. **Features Deep Dive** - User stories, acceptance criteria, edge cases
4. **Architecture & Design** - AI-assisted system design with documentation links
5. **Task Breakdown** - Creates complete AI-ready prompts for each task
6. **Review & Refine** - AI reviews project completeness and identifies gaps

### 🤖 AI-Ready Task Prompts

Each task becomes a **complete prompt** for AI consumption containing:

- Full project context (goals, architecture, tech stack)
- Detailed step-by-step implementation guide
- Constraints and technical requirements
- Acceptance criteria in Given/When/Then format
- Code examples with explanations
- Design patterns and best practices
- Documentation links with relevance notes
- Task dependencies and relationships
- Potential pitfalls and how to avoid them
- Testing strategy (unit, integration, e2e)
- Success criteria

### 📦 GitHub Integration

- **AI-Ready Issues**: Creates GitHub issues with complete AI prompts in the body
- **Automatic Labeling**: Priority, status, and feature labels
- **Issue Linking**: Task dependencies linked via issue numbers
- **Project Board Ready**: Issues ready for GitHub Projects organization

### 💾 Project Context File

Saves `.github-copilot-task-master.json` in your workspace with:

- Complete project definition
- All requirements and architecture decisions
- Task breakdown with AI prompts
- GitHub issue mappings
- **Provides ongoing AI context** throughout project development

### 📊 Progress Tracking Dashboard

_(Current implementation)_

- View all project tasks
- Track completion status
- Monitor GitHub sync status
- Visual progress indicators

## 🚀 Getting Started

### Prerequisites

- **VS Code** version ^1.84.0 or higher
- **GitHub Copilot Chat** extension (required for AI features)
- **GitHub Personal Access Token** (for repository integration)

### Installation

1. Install from VS Code Marketplace _(coming soon)_
2. Or build from source:
   ```bash
   git clone https://github.com/Eddiekoma/github-copilot-task-master.git
   cd github-copilot-task-master
   npm install
   npm run compile
   ```
3. Press `F5` to launch Extension Development Host

### Configuration

Add to your VS Code settings (`settings.json`):

```json
{
  "taskMaster.github.token": "your-github-personal-access-token",
  "taskMaster.autoSync": false
}
```

**Create GitHub Token:**

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Copy token to VS Code settings

## 📖 Usage

### Starting the Project Wizard

1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Run: `GitHub Copilot Task Master: Start Project Wizard`
3. Follow the 6-step wizard:

#### Step 1: Project Purpose

- Enter project name and problem statement
- AI asks clarifying questions about:
  - Target audience
  - Success metrics
  - Business requirements
  - Key stakeholders
- AI enhances your inputs with suggestions

#### Step 2: Technical Context

- Select platform (web/mobile/desktop/cloud)
- Define constraints and requirements
- AI suggests appropriate tech stack
- Specify integrations and security needs

#### Step 3: Features

- AI generates features from your purpose
- Each feature includes:
  - User stories ("As a X, I want Y, so that Z")
  - Acceptance criteria (Given/When/Then)
  - Edge cases with expected behavior
  - Priority and complexity estimates
- Add custom features manually
- AI helps refine each feature

#### Step 4: Architecture

- AI designs system architecture based on features
- Provides:
  - Architecture style (monolithic/microservices/serverless)
  - Component breakdown with responsibilities
  - Data flow diagrams
  - API design patterns
  - Security architecture
  - Deployment strategy
  - Scalability plan
- Includes documentation links for technologies

#### Step 5: Task Breakdown

- AI breaks each feature into implementation tasks
- Each task is a **complete AI prompt** with:
  - Clear implementation goal
  - Project context automatically included
  - Step-by-step guide
  - Code examples
  - Acceptance criteria
  - Testing strategy
  - Dependencies on other tasks
  - Estimated hours
- AI analyzes dependencies between tasks

#### Step 6: Review & Refine

- AI reviews entire project for:
  - Completeness score (0-100)
  - Identified gaps with recommendations
  - Risk assessment with mitigation
  - Improvement suggestions
  - Critical unanswered questions
- Configure GitHub repository
- Set issue prefix (e.g., "TASK-")
- Create project and GitHub issues

### GitHub Issue Creation

When you complete the wizard:

1. **Project file saved**: `.github-copilot-task-master.json` created in workspace
2. **GitHub issues created**: One issue per task with complete AI prompt
3. **Issue numbers mapped**: Project file updated with issue URLs
4. **Ready for development**: Copy issue body into AI chat for implementation

### Example AI-Ready Issue

````markdown
# TASK-1: Implement User Authentication System

## 📋 Project Context

- **Project:** E-commerce Platform
- **Goal:** Secure online shopping experience
- **Architecture:** Microservices
- **Tech Stack:** Node.js, Express, PostgreSQL, JWT

## 🎯 Task Goal

Implement secure user authentication with JWT tokens and refresh token rotation

## 📝 Detailed Description

1. Create User model with bcrypt password hashing
2. Implement registration endpoint with validation
3. Create login endpoint generating access/refresh tokens
4. Add refresh token rotation mechanism
5. Implement logout with token revocation
6. Add middleware for protected routes

## ⚠️ Constraints

- **security:** Must use bcrypt with salt rounds >= 10
- **performance:** JWT verification must be < 5ms
- **compliance:** GDPR-compliant data storage

## 🔧 Technical Requirements

- **bcrypt** (^5.1.0)
  - Secure password hashing
  - [Documentation](https://www.npmjs.com/package/bcrypt)
- **jsonwebtoken** (^9.0.0)
  - JWT creation and verification
  - [Documentation](https://jwt.io)

## ✅ Acceptance Criteria

1. **Given** valid user credentials
   **When** user attempts login
   **Then** receive access token (15m) and refresh token (7d)
   ✓ Testable

2. **Given** expired access token
   **When** user provides valid refresh token
   **Then** receive new access token
   ✓ Testable

## 💻 Code Examples

### Example 1: Password hashing

```javascript
const bcrypt = require("bcrypt");
const saltRounds = 12;

async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, saltRounds);
}
```
````

## 🏗️ Design Patterns

- Repository Pattern for data access
- Factory Pattern for token creation
- Strategy Pattern for authentication methods

## 📚 Documentation

- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
  Security guidelines for Express apps
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
  Industry-standard authentication practices

## 🔗 Dependencies

- **blocking:** Database schema setup (#TASK-0)
  Required for user storage

## 🎉 Success Criteria

- All unit tests pass (>90% coverage)
- Integration tests verify token flow
- Security audit finds no vulnerabilities
- Load test: 1000 req/s with <100ms p95

## ⚠️ Potential Pitfalls

- Don't store passwords in plain text (use bcrypt)
- Avoid hardcoding JWT secret (use env vars)
- Implement rate limiting on auth endpoints
- Clear refresh tokens on logout

## 🧪 Testing Strategy

**Unit Tests:**

- Password hashing/verification
- Token generation/validation
- Middleware authorization

**Integration Tests:**

- Full registration flow
- Login with valid/invalid credentials
- Token refresh mechanism
- Protected route access

**Priority:** high | **Estimated Hours:** 8 | **Status:** todo

```

## 🏗️ Architecture

### Extension Structure
```

src/
├── extension.ts # Extension entry point
├── commands/ # Command handlers
├── panels/ # Webview panels
│ ├── WizardPanel.ts # Multi-step wizard UI
│ └── DashboardPanel.ts # Progress dashboard
├── wizard/ # Wizard orchestration
│ ├── WizardOrchestrator.ts # Step management
│ └── steps/ # Individual step handlers
│ ├── PurposeStep.ts
│ ├── TechnicalContextStep.ts
│ ├── FeaturesStep.ts
│ ├── ArchitectureStep.ts
│ ├── TaskBreakdownStep.ts
│ └── ReviewStep.ts
├── services/ # Core services
│ ├── AIService.ts # GitHub Copilot integration
│ ├── GitHubService.ts # GitHub API integration
│ └── ProjectFileService.ts # Project persistence
├── managers/
│ └── ProjectManager.ts # Project CRUD operations
├── types/
│ └── projectModels.ts # TypeScript interfaces
└── utils/ # Utility functions

media/ # Webview assets
├── wizard.js # Wizard UI logic
├── wizard.css # Wizard styling
├── dashboard.js
└── dashboard.css

````

### Data Models

Key TypeScript interfaces in `src/types/projectModels.ts`:

- **ProjectFile**: Complete project definition saved to `.github-copilot-task-master.json`
- **ProjectPurpose**: Name, problem statement, goals, success metrics
- **TechnicalContext**: Platform, constraints, integrations, security
- **Feature**: User stories, acceptance criteria, edge cases
- **Architecture**: Components, data flow, API design, scalability
- **AITask**: Complete AI-ready prompt structure
- **ProjectReview**: AI completeness analysis

### AI Integration

Uses **VS Code Language Model API** (`vscode.lm`):

```typescript
// Example: Generate structured AI response
const models = await vscode.lm.selectChatModels({
  vendor: 'copilot',
  family: 'gpt-4'
});

const response = await models[0].sendRequest(
  [vscode.LanguageModelChatMessage.User(prompt)],
  {},
  cancellationToken
);
````

**No external API keys required** - uses native GitHub Copilot integration.

## 🛠️ Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/Eddiekoma/github-copilot-task-master.git
cd github-copilot-task-master

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run tests
npm test
```

### Running the Extension

1. Open project in VS Code
2. Press `F5` to launch Extension Development Host
3. In new window, open Command Palette
4. Run: `GitHub Copilot Task Master: Start Project Wizard`

### Project Structure

- **TypeScript 5.3.0** - Type-safe development
- **VS Code Extension API** - ^1.84.0
- **@octokit/rest** - GitHub API integration
- **No React/Angular/Vue** - Vanilla JavaScript for webviews
- **ESLint** - Code quality and consistency

## 📝 Configuration Options

```json
{
  // GitHub Integration
  "taskMaster.github.token": "", // GitHub Personal Access Token
  "taskMaster.github.defaultRepo": "", // Default repository for issues

  // Auto-sync
  "taskMaster.autoSync": false, // Sync with GitHub on startup

  // AI Settings
  "taskMaster.ai.enhancePrompts": true, // Use AI to enhance inputs
  "taskMaster.ai.suggestTechStack": true, // AI tech stack suggestions

  // Task Defaults
  "taskMaster.task.defaultPriority": "medium",
  "taskMaster.task.estimationUnit": "hours"
}
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation for API changes
- Use meaningful commit messages
- Keep pull requests focused

## 📋 Roadmap

### Current (v1.0)

- ✅ Multi-step project wizard
- ✅ AI-enhanced requirements gathering
- ✅ AI-ready task prompt generation
- ✅ GitHub issue creation with full prompts
- ✅ Project file persistence
- ✅ Basic progress dashboard

### Planned (v1.1)

- 🔲 Copilot Context Provider (inject project context into Copilot)
- 🔲 Task progress tracking from GitHub
- 🔲 Pull request integration
- 🔲 Visual progress charts (Chart.js/D3.js)
- 🔲 Project templates for common patterns
- 🔲 Export to other formats (Markdown, PDF)

### Future (v2.0)

- 🔲 Real-time collaboration
- 🔲 Integration with Azure Boards, Jira
- 🔲 AI code review suggestions
- 🔲 Automated testing framework integration
- 🔲 Sprint planning assistance

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Inspired by [claude-task-master](https://github.com/eyaltoledano/claude-task-master)
- Built with [GitHub Copilot](https://github.com/features/copilot)
- Powered by [VS Code Extension API](https://code.visualstudio.com/api)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Eddiekoma/github-copilot-task-master/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Eddiekoma/github-copilot-task-master/discussions)
- **Documentation**: [Wiki](https://github.com/Eddiekoma/github-copilot-task-master/wiki)

---

**Made with ❤️ for developers who love AI-assisted development**
