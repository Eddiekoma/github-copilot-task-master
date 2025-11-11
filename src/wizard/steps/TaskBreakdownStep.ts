import { AITask, Feature, Architecture, TechnicalContext, ProjectPurpose } from '../../types/projectModels';
import { AIService } from '../../services/AIService';

export class TaskBreakdownStep {
  constructor(private aiService: AIService) {}

  async generateAIReadyTasks(
    features: Feature[],
    architecture: Architecture,
    technical: TechnicalContext,
    purpose: ProjectPurpose
  ): Promise<AITask[]> {
    const tasks: AITask[] = [];
    
    for (const feature of features) {
      const featureTasks = await this.breakdownFeatureIntoTasks(
        feature,
        architecture,
        technical,
        purpose
      );
      tasks.push(...featureTasks);
    }
    
    return this.analyzeDependencies(tasks);
  }

  private async breakdownFeatureIntoTasks(
    feature: Feature,
    architecture: Architecture,
    technical: TechnicalContext,
    purpose: ProjectPurpose
  ): Promise<AITask[]> {
    const prompt = `Break down this feature into detailed implementation tasks:

FEATURE: ${feature.name}
Description: ${feature.description}
User Stories: ${JSON.stringify(feature.userStories)}
Acceptance Criteria: ${JSON.stringify(feature.acceptanceCriteria)}

PROJECT CONTEXT:
- Goal: ${purpose.problemStatement}
- Architecture: ${architecture.style}
- Platform: ${technical.platform}
- Components: ${architecture.components.map(c => c.name).join(', ')}

For EACH task, provide:
1. Clear goal and title
2. Detailed step-by-step implementation guide
3. Code examples where applicable
4. Links to relevant documentation
5. Acceptance criteria in Given/When/Then format
6. List of potential pitfalls and how to avoid them
7. Testing strategy (unit tests, integration tests)
8. Dependencies on other tasks
9. Estimated hours
10. Technical requirements (libraries, tools needed)

Format each task as a COMPLETE PROMPT that a developer with AI assistance can follow.

Return as JSON array of tasks.`;

    try {
      const tasksData = await this.aiService.generateStructuredResponse<any[]>(prompt, []);
      return tasksData.map((t, index) => this.enrichTask(t, feature, purpose, architecture, index));
    } catch (error) {
      console.error('Error breaking down feature:', error);
      return [];
    }
  }

  private enrichTask(
    taskData: any,
    feature: Feature,
    purpose: ProjectPurpose,
    architecture: Architecture,
    index: number
  ): AITask {
    return {
      id: `task-${Date.now()}-${index}`,
      title: taskData.title || `Task ${index + 1}`,
      aiPrompt: {
        projectContext: {
          projectName: purpose.name,
          projectGoal: purpose.problemStatement,
          technicalStack: this.extractTechStack(architecture),
          architecture: architecture.style
        },
        taskGoal: taskData.goal || taskData.description || '',
        detailedDescription: taskData.detailedDescription || taskData.description || '',
        constraints: this.validateConstraints(taskData.constraints),
        technicalRequirements: this.validateTechnicalRequirements(taskData.technicalRequirements),
        acceptanceCriteria: this.validateAcceptanceCriteria(taskData.acceptanceCriteria),
        exampleCode: this.validateCodeExamples(taskData.exampleCode),
        designPatterns: taskData.designPatterns || [],
        documentation: this.validateDocumentation(taskData.documentation),
        relevantFiles: taskData.relevantFiles || [],
        dependencies: [],
        successCriteria: taskData.successCriteria || [],
        potentialPitfalls: taskData.potentialPitfalls || [],
        testingStrategy: taskData.testingStrategy || ''
      },
      status: 'todo',
      priority: taskData.priority || feature.priority,
      estimatedHours: taskData.estimatedHours || 4,
      labels: [feature.name, ...(taskData.labels || [])],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private extractTechStack(architecture: Architecture): string[] {
    const techStack: string[] = [];
    architecture.components.forEach(c => {
      techStack.push(...c.technologies);
    });
    return [...new Set(techStack)];
  }

  private validateConstraints(constraints: any): any[] {
    if (!Array.isArray(constraints)) {return [];}
    return constraints.map(c => ({
      type: c.type || 'technical',
      description: c.description || ''
    }));
  }

  private validateTechnicalRequirements(requirements: any): any[] {
    if (!Array.isArray(requirements)) {return [];}
    return requirements.map(r => ({
      name: r.name || '',
      version: r.version,
      reason: r.reason || '',
      documentation: r.documentation,
      type: r.type || 'library'
    }));
  }

  private validateAcceptanceCriteria(criteria: any): any[] {
    if (!Array.isArray(criteria)) {return [];}
    return criteria.map(c => ({
      given: c.given || '',
      when: c.when || '',
      then: c.then || '',
      testable: c.testable !== false
    }));
  }

  private validateCodeExamples(examples: any): any[] {
    if (!Array.isArray(examples)) {return [];}
    return examples.map(e => ({
      language: e.language || 'typescript',
      code: e.code || '',
      explanation: e.explanation || ''
    }));
  }

  private validateDocumentation(docs: any): any[] {
    if (!Array.isArray(docs)) {return [];}
    return docs.map(d => ({
      title: d.title || '',
      url: d.url || '',
      section: d.section,
      relevance: d.relevance || ''
    }));
  }

  private async analyzeDependencies(tasks: AITask[]): Promise<AITask[]> {
    const prompt = `Analyze these tasks and identify dependencies:

${tasks.map(t => `- ${t.id}: ${t.title}`).join('\n')}

Return which tasks depend on which (task A must be done before task B).
Format as JSON: [{ taskId: "...", dependsOn: ["..."] }]`;

    try {
      const dependencies = await this.aiService.generateStructuredResponse<any[]>(prompt, []);
      // Apply dependencies to tasks
      if (Array.isArray(dependencies)) {
        dependencies.forEach((dep: any) => {
          const task = tasks.find(t => t.id === dep.taskId);
          if (task && dep.dependsOn) {
            task.aiPrompt.dependencies = dep.dependsOn.map((depId: string) => {
              const depTask = tasks.find(t => t.id === depId);
              return {
                taskId: depId,
                taskTitle: depTask?.title || '',
                type: 'blocking' as const,
                reason: 'Required for this task'
              };
            });
          }
        });
      }
    } catch (error) {
      console.error('Error analyzing dependencies:', error);
    }

    return tasks;
  }
}
