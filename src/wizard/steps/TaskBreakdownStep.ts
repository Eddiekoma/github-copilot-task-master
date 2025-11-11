import { AIService } from '../../services/AIService';
import { 
    AITask, Feature, Architecture, TechnicalContext, ProjectPurpose,
    AcceptanceCriterion, TechnicalRequirement, CodeExample, DocumentationLink,
    TaskDependency, Constraint
} from '../../types/projectModels';

/**
 * Step 5: Task Breakdown
 * Generates AI-ready tasks with complete prompts for each feature
 * THIS IS THE MOST CRITICAL STEP - each task becomes a complete AI prompt
 */
export class TaskBreakdownStep {
    constructor(private aiService: AIService) {}

    /**
     * Generate AI-ready tasks from all features
     */
    async generateAIReadyTasks(
        features: Feature[],
        architecture: Architecture,
        technical: TechnicalContext,
        purpose: ProjectPurpose
    ): Promise<AITask[]> {
        const tasks: AITask[] = [];
        
        for (const feature of features) {
            console.log(`[TaskBreakdownStep] Breaking down feature: ${feature.name}`);
            const featureTasks = await this.breakdownFeatureIntoTasks(
                feature,
                architecture,
                technical,
                purpose
            );
            tasks.push(...featureTasks);
        }
        
        // Analyze and add dependencies between tasks
        return this.analyzeDependencies(tasks, features);
    }

    /**
     * Break down a single feature into detailed implementation tasks
     */
    private async breakdownFeatureIntoTasks(
        feature: Feature,
        architecture: Architecture,
        technical: TechnicalContext,
        purpose: ProjectPurpose
    ): Promise<AITask[]> {
        const techStack = architecture.components
            .flatMap(c => c.technologies)
            .filter((tech, index, self) => self.indexOf(tech) === index);

        const prompt = `Break down this feature into detailed, AI-ready implementation tasks:

FEATURE: ${feature.name}
Description: ${feature.description}
Priority: ${feature.priority}
Complexity: ${feature.estimatedComplexity}/10

USER STORIES:
${feature.userStories.map(us => `- As a ${us.asA}, I want ${us.iWant}, so that ${us.soThat}`).join('\n')}

ACCEPTANCE CRITERIA:
${feature.acceptanceCriteria.map((ac, i) => `${i+1}. Given ${ac.given}, when ${ac.when}, then ${ac.then}`).join('\n')}

PROJECT CONTEXT:
- Goal: ${purpose.problemStatement}
- Architecture: ${architecture.style}
- Platform: ${technical.platform}
- Tech Stack: ${techStack.join(', ')}

For EACH implementation task, provide:
1. Clear, specific task title
2. Detailed goal statement
3. Step-by-step implementation description
4. Technical requirements (libraries, tools, versions)
5. Code examples where helpful
6. Acceptance criteria in Given/When/Then format
7. Testing strategy (unit tests, integration tests)
8. Potential pitfalls and how to avoid them
9. Success criteria
10. Documentation links to official docs
11. Estimated hours
12. Design patterns to use (if applicable)

Break this into 2-5 concrete, actionable tasks.

Return as JSON array:
[
  {
    "title": "Implement user authentication flow",
    "goal": "Create secure JWT-based authentication",
    "description": "Detailed step-by-step implementation...",
    "technicalRequirements": [
      {"name": "jsonwebtoken", "version": "^9.0.0", "reason": "JWT generation", "documentation": "https://github.com/auth0/node-jsonwebtoken"}
    ],
    "constraints": [
      {"type": "security", "description": "Must use HTTPS only"}
    ],
    "acceptanceCriteria": [
      {"given": "valid credentials", "when": "user logs in", "then": "JWT token is returned", "testable": true}
    ],
    "exampleCode": [
      {"language": "typescript", "code": "const token = jwt.sign(...)", "explanation": "JWT generation"}
    ],
    "designPatterns": ["Factory Pattern", "Singleton"],
    "documentation": [
      {"title": "JWT Best Practices", "url": "https://...", "section": "Security"}
    ],
    "successCriteria": ["Users can login", "Tokens expire after 1 hour"],
    "potentialPitfalls": ["Don't store passwords in plain text", "Validate token expiry"],
    "testingStrategy": "Unit tests for token generation, integration tests for auth flow",
    "estimatedHours": 8,
    "priority": "high"
  }
]

Return ONLY valid JSON array.`;

        try {
            const response = await this.aiService.generateProjectRequirements(prompt);
            
            let jsonString = typeof response === 'string' ? response : JSON.stringify(response);
            const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || jsonString.match(/\[[\s\S]*\]/);
            
            if (jsonMatch) {
                const tasksData = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
                return Array.isArray(tasksData) ? tasksData.map((t, idx) => 
                    this.enrichTask(t, feature, purpose, architecture, techStack, idx)
                ) : [];
            }
            
            return [];
        } catch (error) {
            console.error('[TaskBreakdownStep] Error breaking down feature:', error);
            return [];
        }
    }

    /**
     * Enrich task data with complete AI prompt structure
     */
    private enrichTask(
        taskData: any,
        feature: Feature,
        purpose: ProjectPurpose,
        architecture: Architecture,
        techStack: string[],
        index: number
    ): AITask {
        return {
            id: `task_${Date.now()}_${index}`,
            title: taskData.title || `Implement ${feature.name}`,
            aiPrompt: {
                projectContext: {
                    projectName: purpose.name,
                    projectGoal: purpose.problemStatement,
                    technicalStack: techStack,
                    architecture: architecture.style
                },
                taskGoal: taskData.goal || taskData.title,
                detailedDescription: taskData.description || '',
                constraints: this.normalizeConstraints(taskData.constraints || []),
                technicalRequirements: this.normalizeTechnicalRequirements(taskData.technicalRequirements || []),
                acceptanceCriteria: this.normalizeAcceptanceCriteria(taskData.acceptanceCriteria || feature.acceptanceCriteria || []),
                exampleCode: this.normalizeCodeExamples(taskData.exampleCode || []),
                designPatterns: Array.isArray(taskData.designPatterns) ? taskData.designPatterns : [],
                documentation: this.normalizeDocumentation(taskData.documentation || []),
                relevantFiles: taskData.relevantFiles || [],
                dependencies: [],
                successCriteria: Array.isArray(taskData.successCriteria) ? taskData.successCriteria : [],
                potentialPitfalls: Array.isArray(taskData.potentialPitfalls) ? taskData.potentialPitfalls : [],
                testingStrategy: taskData.testingStrategy || 'Add unit and integration tests'
            },
            status: 'todo',
            priority: this.validatePriority(taskData.priority || feature.priority),
            estimatedHours: typeof taskData.estimatedHours === 'number' ? taskData.estimatedHours : 8,
            labels: [feature.name, architecture.style, ...techStack.slice(0, 2)],
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Normalize constraints
     */
    private normalizeConstraints(constraints: any[]): Constraint[] {
        return constraints.filter(c => c.type && c.description).map(c => ({
            type: ['technical', 'business', 'security', 'performance', 'compliance'].includes(c.type) 
                ? c.type : 'technical',
            description: c.description
        }));
    }

    /**
     * Normalize technical requirements
     */
    private normalizeTechnicalRequirements(requirements: any[]): TechnicalRequirement[] {
        return requirements.filter(r => r.name).map(r => ({
            name: r.name,
            version: r.version,
            reason: r.reason || '',
            documentation: r.documentation
        }));
    }

    /**
     * Normalize acceptance criteria
     */
    private normalizeAcceptanceCriteria(criteria: any[]): AcceptanceCriterion[] {
        return criteria.filter(c => c.given && c.when && c.then).map(c => ({
            given: c.given,
            when: c.when,
            then: c.then,
            testable: c.testable !== false
        }));
    }

    /**
     * Normalize code examples
     */
    private normalizeCodeExamples(examples: any[]): CodeExample[] {
        return examples.filter(e => e.code).map(e => ({
            language: e.language || 'typescript',
            code: e.code,
            explanation: e.explanation || ''
        }));
    }

    /**
     * Normalize documentation links
     */
    private normalizeDocumentation(docs: any[]): DocumentationLink[] {
        return docs.filter(d => d.url).map(d => ({
            title: d.title || 'Documentation',
            url: d.url,
            section: d.section
        }));
    }

    /**
     * Validate priority
     */
    private validatePriority(priority: any): 'critical' | 'high' | 'medium' | 'low' {
        const validPriorities: ('critical' | 'high' | 'medium' | 'low')[] = ['critical', 'high', 'medium', 'low'];
        return validPriorities.includes(priority) ? priority : 'medium';
    }

    /**
     * Analyze and add dependencies between tasks
     */
    private analyzeDependencies(tasks: AITask[], features: Feature[]): AITask[] {
        // Simple dependency detection: tasks for features with dependencies
        const featureDependencyMap = new Map<string, string[]>();
        features.forEach(f => {
            if (f.dependencies && f.dependencies.length > 0) {
                featureDependencyMap.set(f.id, f.dependencies);
            }
        });

        // Add dependencies to tasks based on feature dependencies
        tasks.forEach(task => {
            const taskFeature = features.find(f => 
                task.labels.includes(f.name)
            );
            
            if (taskFeature && taskFeature.dependencies) {
                taskFeature.dependencies.forEach(depFeatureName => {
                    const depFeature = features.find(f => f.name === depFeatureName);
                    if (depFeature) {
                        const depTasks = tasks.filter(t => t.labels.includes(depFeature.name));
                        depTasks.forEach(depTask => {
                            task.aiPrompt.dependencies.push({
                                taskId: depTask.id,
                                taskTitle: depTask.title,
                                type: 'requires',
                                reason: `Depends on ${depFeature.name} feature`
                            });
                        });
                    }
                });
            }
        });

        return tasks;
    }
}
