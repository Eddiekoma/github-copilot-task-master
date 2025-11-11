import { AIService } from '../../services/AIService';
import { Feature, ProjectPurpose, TechnicalContext, UserStory, AcceptanceCriterion, EdgeCase } from '../../types/projectModels';

/**
 * Step 3: Features Deep Dive
 * Generates detailed features with user stories, acceptance criteria, and edge cases
 */
export class FeaturesStep {
    constructor(private aiService: AIService) {}

    /**
     * Generate comprehensive features based on project purpose and technical context
     */
    async generateFeatures(
        purpose: ProjectPurpose,
        technical: TechnicalContext
    ): Promise<Feature[]> {
        const prompt = `Generate detailed features for this project:

PROJECT INFO:
- Name: ${purpose.name}
- Problem: ${purpose.problemStatement}
- Goals: ${purpose.primaryGoals.join(', ')}
- Platform: ${technical.platform}
- Target Audience: ${purpose.targetAudience.join(', ')}

For EACH feature, provide:
1. Clear name and description
2. 3-5 user stories in "As a [role], I want [goal], so that [benefit]" format
3. Acceptance criteria in Given/When/Then format (minimum 3 per feature)
4. Potential edge cases to consider (at least 2)
5. Priority level (critical/high/medium/low)
6. Estimated complexity (1-10 scale)
7. Dependencies on other features (if any)
8. Technical notes

Return as JSON array:
[
  {
    "name": "Feature Name",
    "description": "Detailed description",
    "userStories": [
      {"asA": "user", "iWant": "capability", "soThat": "benefit"}
    ],
    "acceptanceCriteria": [
      {"given": "precondition", "when": "action", "then": "result", "testable": true}
    ],
    "edgeCases": [
      {"scenario": "edge case", "expectedBehavior": "how to handle", "priority": "high"}
    ],
    "priority": "high",
    "estimatedComplexity": 7,
    "dependencies": [],
    "technicalNotes": "Implementation notes"
  }
]

Generate 5-10 core features. Return ONLY valid JSON array.`;

        try {
            const response = await this.aiService.generateProjectRequirements(prompt);
            
            let jsonString = typeof response === 'string' ? response : JSON.stringify(response);
            const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || jsonString.match(/\[[\s\S]*\]/);
            
            if (jsonMatch) {
                const featuresData = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
                return this.enrichFeatures(Array.isArray(featuresData) ? featuresData : []);
            }
            
            return [];
        } catch (error) {
            console.error('[FeaturesStep] Error generating features:', error);
            return [];
        }
    }

    /**
     * Enrich features with IDs and validation
     */
    private enrichFeatures(featuresData: any[]): Feature[] {
        return featuresData.map((f, index) => ({
            id: `feature_${Date.now()}_${index}`,
            name: f.name || `Feature ${index + 1}`,
            description: f.description || '',
            userStories: this.validateUserStories(f.userStories || []),
            acceptanceCriteria: this.validateAcceptanceCriteria(f.acceptanceCriteria || []),
            edgeCases: this.validateEdgeCases(f.edgeCases || []),
            priority: this.validatePriority(f.priority),
            estimatedComplexity: typeof f.estimatedComplexity === 'number' ? f.estimatedComplexity : 5,
            dependencies: Array.isArray(f.dependencies) ? f.dependencies : [],
            technicalNotes: f.technicalNotes || ''
        }));
    }

    /**
     * Validate and normalize user stories
     */
    private validateUserStories(stories: any[]): UserStory[] {
        return stories.filter(s => s.asA && s.iWant && s.soThat).map(s => ({
            asA: s.asA,
            iWant: s.iWant,
            soThat: s.soThat
        }));
    }

    /**
     * Validate and normalize acceptance criteria
     */
    private validateAcceptanceCriteria(criteria: any[]): AcceptanceCriterion[] {
        return criteria.filter(c => c.given && c.when && c.then).map(c => ({
            given: c.given,
            when: c.when,
            then: c.then,
            testable: c.testable !== false
        }));
    }

    /**
     * Validate and normalize edge cases
     */
    private validateEdgeCases(cases: any[]): EdgeCase[] {
        return cases.filter(c => c.scenario && c.expectedBehavior).map(c => ({
            scenario: c.scenario,
            expectedBehavior: c.expectedBehavior,
            priority: ['high', 'medium', 'low'].includes(c.priority) ? c.priority : 'medium'
        }));
    }

    /**
     * Validate priority value
     */
    private validatePriority(priority: any): 'critical' | 'high' | 'medium' | 'low' {
        const validPriorities: ('critical' | 'high' | 'medium' | 'low')[] = ['critical', 'high', 'medium', 'low'];
        return validPriorities.includes(priority) ? priority : 'medium';
    }

    /**
     * Add a custom feature manually
     */
    createCustomFeature(
        name: string,
        description: string,
        priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
    ): Feature {
        return {
            id: `feature_${Date.now()}_custom`,
            name,
            description,
            userStories: [],
            acceptanceCriteria: [],
            edgeCases: [],
            priority,
            estimatedComplexity: 5,
            dependencies: [],
            technicalNotes: ''
        };
    }
}
