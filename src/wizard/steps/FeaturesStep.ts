import { Feature, ProjectPurpose, TechnicalContext } from '../../types/projectModels';
import { AIService } from '../../services/AIService';

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

  private validateUserStories(stories: any): any[] {
    if (!Array.isArray(stories)) {return [];}
    return stories.map(s => ({
      asA: s.asA || 'user',
      iWant: s.iWant || 'to perform an action',
      soThat: s.soThat || 'I can achieve a goal'
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

  private validateEdgeCases(cases: any): any[] {
    if (!Array.isArray(cases)) {return [];}
    return cases.map(c => ({
      scenario: c.scenario || '',
      expectedBehavior: c.expectedBehavior || '',
      priority: c.priority || 'medium'
    }));
  }
}
