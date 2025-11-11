import { Feature, ProjectPurpose, TechnicalContext, UserStory, AcceptanceCriterion, EdgeCase } from '../../types/projectModels';
import { AIService } from '../../services/AIService';

// Helper interfaces for parsing
interface ParsedUserStory {
  asA?: string;
  iWant?: string;
  soThat?: string;
}

interface ParsedAcceptanceCriterion {
  given?: string;
  when?: string;
  then?: string;
  testable?: boolean;
}

interface ParsedEdgeCase {
  scenario?: string;
  expectedBehavior?: string;
  priority?: string;
}

export class FeaturesStep {
  constructor(private aiService: AIService) {}

  async generateFeatures(
    purpose: ProjectPurpose,
    technical: TechnicalContext
  ): Promise<Feature[]> {
    const prompt = `Generate detailed features for this project:

Purpose: ${purpose.problemStatement}
Platform: ${technical.platform}
Goals: ${purpose.primaryGoals.join(', ')}
Target Audience: ${purpose.targetAudience.join(', ')}

For EACH feature provide:
1. Name and description
2. 3-5 user stories in "As a X, I want Y, so that Z" format
3. Acceptance criteria in Given/When/Then format
4. Potential edge cases
5. Priority level (critical/high/medium/low)
6. Estimated complexity (1-10)
7. Dependencies on other features
8. Technical notes

Return as JSON array of features.`;

    try {
      const features = await this.aiService.generateStructuredResponse<Feature[]>(prompt, []);
      return this.validateAndEnrichFeatures(features);
    } catch (error) {
      console.error('Error generating features:', error);
      return [];
    }
  }

  private validateAndEnrichFeatures(features: Feature[]): Feature[] {
    return features.map((f, index) => ({
      id: `feature-${Date.now()}-${index}`,
      name: f.name || `Feature ${index + 1}`,
      description: f.description || '',
      userStories: this.validateUserStories(f.userStories),
      acceptanceCriteria: this.validateAcceptanceCriteria(f.acceptanceCriteria),
      edgeCases: this.validateEdgeCases(f.edgeCases),
      priority: f.priority || 'medium',
      estimatedComplexity: f.estimatedComplexity || 5,
      dependencies: f.dependencies || [],
      technicalNotes: f.technicalNotes || ''
    }));
  }

  private validateUserStories(stories: unknown): UserStory[] {
    if (!Array.isArray(stories)) {return [];}
    return stories.map((s: unknown) => {
      const story = s as ParsedUserStory;
      return {
        asA: story.asA || 'user',
        iWant: story.iWant || 'to perform an action',
        soThat: story.soThat || 'I can achieve a goal'
      };
    });
  }

  private validateAcceptanceCriteria(criteria: unknown): AcceptanceCriterion[] {
    if (!Array.isArray(criteria)) {return [];}
    return criteria.map((c: unknown) => {
      const crit = c as ParsedAcceptanceCriterion;
      return {
        given: crit.given || '',
        when: crit.when || '',
        then: crit.then || '',
        testable: crit.testable !== false
      };
    });
  }

  private validateEdgeCases(cases: unknown): EdgeCase[] {
    if (!Array.isArray(cases)) {return [];}
    return cases.map((c: unknown) => {
      const edgeCase = c as ParsedEdgeCase;
      const priority = edgeCase.priority;
      return {
        scenario: edgeCase.scenario || '',
        expectedBehavior: edgeCase.expectedBehavior || '',
        priority: (priority === 'high' || priority === 'medium' || priority === 'low') 
          ? priority 
          : 'medium'
      };
    });
  }
}
