/**
 * Extended type definitions for GitHub Copilot Task Master
 * These types support the sophisticated multi-step wizard and AI-ready task generation
 */

/**
 * Defines the core purpose and goals of the project
 */
export interface ProjectPurpose {
    name: string;
    problemStatement: string;
    targetAudience: string[];
    primaryGoals: string[];
    successMetrics: string[];
    businessRequirements: string[];
    stakeholders?: string[];
}

/**
 * Describes an existing system that needs to be integrated
 */
export interface ExistingSystem {
    name: string;
    type: 'database' | 'api' | 'service' | 'library';
    version?: string;
    documentation?: string;
    mustIntegrate: boolean;
}

/**
 * Represents a technical constraint or limitation
 */
export interface TechnicalConstraint {
    type: 'budget' | 'technology' | 'performance' | 'compliance' | 'other';
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Performance metric requirement
 */
export interface PerformanceMetric {
    metric: string;
    target: string;
    measurement: string;
}

/**
 * Integration requirement with external systems
 */
export interface Integration {
    name: string;
    type: 'rest-api' | 'graphql' | 'webhook' | 'database' | 'other';
    required: boolean;
    documentation?: string;
}

/**
 * Technical context for the project
 */
export interface TechnicalContext {
    platform: 'web' | 'mobile' | 'desktop' | 'cloud' | 'hybrid';
    existingSystems: ExistingSystem[];
    constraints: TechnicalConstraint[];
    performanceRequirements: PerformanceMetric[];
    securityRequirements: string[];
    complianceNeeds: string[];
    integrations: Integration[];
}

/**
 * User story in standard format
 */
export interface UserStory {
    asA: string;
    iWant: string;
    soThat: string;
}

/**
 * Acceptance criterion in Given-When-Then format
 */
export interface AcceptanceCriterion {
    given: string;
    when: string;
    then: string;
    testable: boolean;
}

/**
 * Edge case to consider for a feature
 */
export interface EdgeCase {
    scenario: string;
    expectedBehavior: string;
    priority: 'high' | 'medium' | 'low';
}

/**
 * Feature with detailed specifications
 */
export interface Feature {
    id: string;
    name: string;
    description: string;
    userStories: UserStory[];
    acceptanceCriteria: AcceptanceCriterion[];
    edgeCases: EdgeCase[];
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedComplexity: number;
    dependencies: string[];
    technicalNotes: string;
}

/**
 * Component interface definition
 */
export interface ComponentInterface {
    name: string;
    type: 'rest' | 'graphql' | 'grpc' | 'event' | 'other';
    description: string;
}

/**
 * System component
 */
export interface Component {
    name: string;
    type: 'frontend' | 'backend' | 'database' | 'service' | 'api';
    technologies: string[];
    responsibilities: string[];
    interfaces: ComponentInterface[];
    dependencies: string[];
}

/**
 * Data flow between components
 */
export interface DataFlow {
    from: string;
    to: string;
    dataType: string;
    protocol: string;
}

/**
 * API endpoint design
 */
export interface APIEndpoint {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    description: string;
    requestBody?: string;
    responseBody?: string;
}

/**
 * API design specification
 */
export interface APIDesign {
    style: 'rest' | 'graphql' | 'grpc' | 'hybrid';
    endpoints: APIEndpoint[];
    authentication: string;
    rateLimit?: string;
}

/**
 * System architecture design
 */
export interface Architecture {
    style: 'monolithic' | 'microservices' | 'serverless' | 'hybrid';
    components: Component[];
    dataFlow: DataFlow[];
    apiDesign: APIDesign;
    databaseSchema?: string;
    securityArchitecture: string;
    deploymentStrategy: string;
    scalabilityPlan: string;
}

/**
 * Constraint for an AI task
 */
export interface Constraint {
    type: 'technical' | 'business' | 'security' | 'performance' | 'compliance';
    description: string;
}

/**
 * Technical requirement for implementing a task
 */
export interface TechnicalRequirement {
    name: string;
    version?: string;
    reason: string;
    documentation?: string;
}

/**
 * Code example for a task
 */
export interface CodeExample {
    language: string;
    code: string;
    explanation: string;
}

/**
 * Documentation link
 */
export interface DocumentationLink {
    title: string;
    url: string;
    section?: string;
}

/**
 * Task dependency
 */
export interface TaskDependency {
    taskId: string;
    taskTitle: string;
    type: 'blocks' | 'requires' | 'related';
    reason: string;
}

/**
 * AI-ready task with complete prompt structure
 */
export interface AITask {
    id: string;
    title: string;
    aiPrompt: {
        projectContext: {
            projectName: string;
            projectGoal: string;
            technicalStack: string[];
            architecture: string;
        };
        taskGoal: string;
        detailedDescription: string;
        constraints: Constraint[];
        technicalRequirements: TechnicalRequirement[];
        acceptanceCriteria: AcceptanceCriterion[];
        exampleCode?: CodeExample[];
        designPatterns?: string[];
        documentation: DocumentationLink[];
        relevantFiles?: string[];
        dependencies: TaskDependency[];
        successCriteria: string[];
        potentialPitfalls: string[];
        testingStrategy: string;
    };
    status: 'todo' | 'in-progress' | 'review' | 'completed';
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedHours: number;
    labels: string[];
    githubIssueNumber?: number;
    githubIssueUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Gap identified during review
 */
export interface Gap {
    category: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    suggestion: string;
}

/**
 * Risk identified during review
 */
export interface Risk {
    description: string;
    impact: 'critical' | 'high' | 'medium' | 'low';
    likelihood: 'high' | 'medium' | 'low';
    mitigation: string;
}

/**
 * Project review results
 */
export interface ProjectReview {
    completenessScore: number;
    gaps: Gap[];
    risks: Risk[];
    improvementSuggestions: string[];
    criticalQuestions: string[];
}

/**
 * Key decision made during project definition
 */
export interface Decision {
    decision: string;
    rationale: string;
    alternatives?: string[];
    timestamp: Date;
}

/**
 * Coding conventions and standards
 */
export interface Conventions {
    codeStyle: string;
    namingConventions: string;
    fileStructure: string;
    testingApproach: string;
    documentationStandards: string;
}

/**
 * AI context for Copilot integration
 */
export interface AIContext {
    projectSummary: string;
    keyDecisions: Decision[];
    conventions: Conventions;
}

/**
 * Complete project file structure
 */
export interface ProjectFile {
    version: string;
    projectId: string;
    purpose: ProjectPurpose;
    technicalContext: TechnicalContext;
    features: Feature[];
    architecture: Architecture;
    tasks: AITask[];
    review: ProjectReview;
    createdAt: Date;
    updatedAt: Date;
    github?: {
        repositoryUrl: string;
        issuePrefix: string;
        projectBoard?: string;
    };
    aiContext: AIContext;
}
