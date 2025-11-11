# Multi-Step Wizard Implementation Guide

## Overview

The GitHub Copilot Task Master extension now includes a sophisticated 6-step wizard that transforms project ideas into comprehensive, AI-ready task definitions with GitHub integration.

## Architecture

### Core Components

1. **WizardController** (`src/wizard/WizardController.ts`)
   - Master orchestrator coordinating all wizard operations
   - Handles message passing between UI and services
   - Manages wizard state and step transitions

2. **WizardOrchestrator** (`src/wizard/WizardOrchestrator.ts`)
   - Manages step-by-step flow
   - Stores wizard data between steps
   - Validates completion before finalizing

3. **Step Handlers** (`src/wizard/steps/`)
   - **PurposeStep**: Gathers project goals with AI clarifying questions
   - **TechnicalContextStep**: Analyzes platform and technical requirements
   - **FeaturesStep**: Generates features with user stories and acceptance criteria
   - **ArchitectureStep**: Designs system architecture
   - **TaskBreakdownStep**: Creates AI-ready tasks (MOST CRITICAL)
   - **ReviewStep**: Reviews completeness and identifies gaps

4. **Services**
   - **ProjectFileService**: Saves/loads `.github-copilot-task-master.json`
   - **GitHubService**: Enhanced to create AI-prompt formatted issues
   - **CopilotContextProvider**: Injects project context for Copilot

## Benefits

1. **Comprehensive Planning**: No detail overlooked
2. **AI-Ready Tasks**: Every task is a complete prompt
3. **GitHub Integration**: Automatic issue creation
4. **Copilot Enhancement**: Context-aware development
5. **Structured Approach**: Consistent project definitions
6. **Quality Assurance**: Built-in review step

## Type System

### AITask - The Core of AI-Ready Prompts

Each task contains a complete prompt structure with:
- Project context
- Task goal and detailed description
- Constraints and technical requirements
- Acceptance criteria (Given/When/Then)
- Code examples and design patterns
- Documentation links
- Dependencies
- Success criteria
- Potential pitfalls
- Testing strategy

## GitHub Issue Format

Issues are created with comprehensive AI-ready content including all sections needed for a developer to implement the feature with AI assistance.

## Usage

1. Run command: `Task Master: New Project Wizard`
2. Follow 6-step process
3. Project file saved as `.github-copilot-task-master.json`
4. Context file created in `.vscode/copilot-context.md`
5. GitHub issues created (if requested)

## File Structure

```
src/
├── wizard/
│   ├── WizardController.ts
│   ├── WizardOrchestrator.ts
│   └── steps/
├── types/projectModels.ts
├── services/
│   ├── ProjectFileService.ts
│   └── GitHubService.ts
└── context/CopilotContextProvider.ts
```
