import { AITask, Feature, Architecture, TechnicalContext, ProjectPurpose, Constraint, TechnicalRequirement, AcceptanceCriterion, CodeExample, DocumentationLink } from '../../types/projectModels';
import { AIService } from '../../services/AIService';

// Helper interface for parsing AI responses
interface ParsedTaskData {
  title?: string;
  goal?: string;
  description?: string;
  detailedDescription?: string;
  constraints?: unknown;
  technicalRequirements?: unknown;
  designPatterns?: string[];
  documentation?: unknown;
  relevantFiles?: string[];
  acceptanceCriteria?: unknown;
  exampleCode?: unknown;
  successCriteria?: string[];
  potentialPitfalls?: string[];
  testingStrategy?: string;
  priority?: string;
  estimatedHours?: number;
  labels?: string[];
}

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
      const tasksData = await this.aiService.generateStructuredResponse<ParsedTaskData[]>(prompt, []);
      return tasksData.map((t, index) => this.enrichTask(t, feature, purpose, architecture, index));
    } catch (error) {
      console.error('Error breaking down feature:', error);
      return [];
    }
  }

  private enrichTask(
    taskData: ParsedTaskData,
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
      priority: this.validatePriority(taskData.priority) || feature.priority,
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

  private validatePriority(priority: string | undefined): 'critical' | 'high' | 'medium' | 'low' {
    if (priority === 'critical' || priority === 'high' || priority === 'medium' || priority === 'low') {
      return priority;
    }
    return 'medium';
  }

  private validateConstraints(constraints: unknown): Constraint[] {
    if (!Array.isArray(constraints)) {return [];}
    return constraints.map((c: unknown) => {
      const constraint = c as Partial<Constraint>;
      const type = constraint.type;
      return {
        type: (type === 'performance' || type === 'security' || type === 'compliance' || 
               type === 'technical' || type === 'business') ? type : 'technical',
        description: constraint.description || ''
      };
    });
  }

  private validateTechnicalRequirements(requirements: unknown): TechnicalRequirement[] {
    if (!Array.isArray(requirements)) {return [];}
    return requirements.map((r: unknown) => {
      const req = r as Partial<TechnicalRequirement>;
      const reqType = req.type;
      return {
        name: req.name || '',
        version: req.version,
        reason: req.reason || '',
        documentation: req.documentation,
        type: (reqType === 'library' || reqType === 'framework' || reqType === 'tool' || reqType === 'service') 
          ? reqType : 'library'
      };
    });
  }

  private validateAcceptanceCriteria(criteria: unknown): AcceptanceCriterion[] {
    if (!Array.isArray(criteria)) {return [];}
    return criteria.map((c: unknown) => {
      const crit = c as Partial<AcceptanceCriterion>;
      return {
        given: crit.given || '',
        when: crit.when || '',
        then: crit.then || '',
        testable: crit.testable !== false
      };
    });
  }

  private validateCodeExamples(examples: unknown): CodeExample[] {
    if (!Array.isArray(examples)) {return [];}
    return examples.map((e: unknown) => {
      const ex = e as Partial<CodeExample>;
      return {
        language: ex.language || 'typescript',
        code: ex.code || '',
        explanation: ex.explanation || ''
      };
    });
  }

  private validateDocumentation(docs: unknown): DocumentationLink[] {
    if (!Array.isArray(docs)) {return [];}
    return docs.map((d: unknown) => {
      const doc = d as Partial<DocumentationLink>;
      return {
        title: doc.title || '',
        url: doc.url || '',
        section: doc.section,
        relevance: doc.relevance || ''
      };
    });
  }

  private async analyzeDependencies(tasks: AITask[]): Promise<AITask[]> {
    const prompt = `Analyze these tasks and identify dependencies:

${tasks.map(t => `- ${t.id}: ${t.title}`).join('\n')}

Return which tasks depend on which (task A must be done before task B).
Format as JSON: [{ taskId: "...", dependsOn: ["..."] }]`;

    try {
      interface DependencyMap { taskId?: string; dependsOn?: string[] }
      const dependencies = await this.aiService.generateStructuredResponse<DependencyMap[]>(prompt, []);
      // Apply dependencies to tasks
      if (Array.isArray(dependencies)) {
        dependencies.forEach((dep: DependencyMap) => {
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
