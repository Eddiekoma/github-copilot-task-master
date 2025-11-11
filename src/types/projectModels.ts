/**
 * Extended type definitions for GitHub Copilot Task Master
 * These models support AI-ready project definitions and GitHub integration
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

export interface TechnicalContext {
  platform: 'web' | 'mobile' | 'desktop' | 'cloud' | 'hybrid';
  existingSystems: ExistingSystem[];
  constraints: TechnicalConstraint[];
  performanceRequirements: PerformanceMetric[];
  securityRequirements: string[];
  complianceNeeds: string[];
  integrations: Integration[];
}

export interface ExistingSystem {
  name: string;
  type: 'database' | 'api' | 'service' | 'library';
  version?: string;
  documentation?: string;
  mustIntegrate: boolean;
}

export interface TechnicalConstraint {
  type: 'budget' | 'technology' | 'timeline' | 'resource' | 'compliance';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface PerformanceMetric {
  metric: string;
  target: string;
  unit: string;
  critical: boolean;
}

export interface Integration {
  system: string;
  type: 'api' | 'database' | 'webhook' | 'file' | 'event';
  protocol?: string;
  authentication?: string;
}

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

export interface UserStory {
  asA: string;
  iWant: string;
  soThat: string;
}

export interface AcceptanceCriterion {
  given: string;
  when: string;
  then: string;
  testable: boolean;
}

export interface EdgeCase {
  scenario: string;
  expectedBehavior: string;
  priority: 'high' | 'medium' | 'low';
}

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

export interface Component {
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'api';
  technologies: string[];
  responsibilities: string[];
  interfaces: ComponentInterface[];
  dependencies: string[];
}

export interface ComponentInterface {
  name: string;
  type: 'rest' | 'graphql' | 'websocket' | 'grpc' | 'event';
  endpoint?: string;
  methods?: string[];
}

export interface DataFlow {
  from: string;
  to: string;
  dataType: string;
  protocol: string;
  frequency?: string;
}

export interface APIDesign {
  style: 'rest' | 'graphql' | 'grpc' | 'soap';
  authentication: string;
  versioning: string;
  documentation?: string;
  endpoints?: APIEndpoint[];
}

export interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
}

export interface TechnicalRequirement {
  name: string;
  version?: string;
  reason: string;
  documentation?: string;
  type: 'library' | 'framework' | 'tool' | 'service';
}

export interface Constraint {
  type: 'performance' | 'security' | 'compliance' | 'technical' | 'business';
  description: string;
}

export interface CodeExample {
  language: string;
  code: string;
  explanation: string;
  source?: string;
}

export interface TaskDependency {
  taskId: string;
  taskTitle: string;
  type: 'blocking' | 'related' | 'optional';
  reason: string;
}

export interface DocumentationLink {
  title: string;
  url: string;
  section?: string;
  relevance: string;
}

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

export interface Decision {
  decision: string;
  rationale: string;
  alternatives?: string[];
  date?: Date;
}

export interface Conventions {
  codeStyle: string;
  namingConventions: string;
  folderStructure: string;
  gitStrategy: string;
  testingStrategy: string;
}

export interface ProjectReview {
  completenessScore: number;
  gaps: ReviewGap[];
  risks: Risk[];
  suggestions: string[];
  criticalQuestions: string[];
}

export interface ReviewGap {
  area: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface Risk {
  type: string;
  description: string;
  likelihood: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface ProjectFile {
  version: string;
  projectId: string;
  purpose: ProjectPurpose;
  technicalContext: TechnicalContext;
  features: Feature[];
  architecture: Architecture;
  tasks: AITask[];
  review?: ProjectReview;
  createdAt: Date;
  updatedAt: Date;
  github?: {
    repositoryUrl: string;
    issuePrefix: string;
    projectBoard?: string;
  };
  aiContext: {
    projectSummary: string;
    keyDecisions: Decision[];
    conventions: Conventions;
  };
}
