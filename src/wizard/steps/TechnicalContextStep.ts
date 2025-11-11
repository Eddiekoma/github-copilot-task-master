import { TechnicalContext, ProjectPurpose } from '../../types/projectModels';
import { AIService } from '../../services/AIService';

export class TechnicalContextStep {
  constructor(private aiService: AIService) {}

  async analyzeTechnicalNeeds(purpose: ProjectPurpose): Promise<TechnicalContext> {
    const prompt = `Based on this project:
Purpose: ${purpose.problemStatement}
Goals: ${purpose.primaryGoals.join(', ')}
Target Audience: ${purpose.targetAudience.join(', ')}

Suggest:
1. Best platform (web/mobile/desktop/cloud)
2. Recommended tech stack
3. Common constraints to consider
4. Integration points
5. Performance requirements
6. Security requirements

Return as structured JSON matching TechnicalContext interface with:
- platform: "web" | "mobile" | "desktop" | "cloud" | "hybrid"
- existingSystems: []
- constraints: []
- performanceRequirements: []
- securityRequirements: []
- complianceNeeds: []
- integrations: []`;

    try {
      const suggestions = await this.aiService.generateStructuredResponse<TechnicalContext>(
        prompt, 
        this.getDefaultTechnicalContext()
      );
      return this.validateTechnicalContext(suggestions);
    } catch (error) {
      console.error('Error analyzing technical needs:', error);
      return this.getDefaultTechnicalContext();
    }
  }

  private validateTechnicalContext(context: TechnicalContext): TechnicalContext {
    return {
      platform: context.platform || 'web',
      existingSystems: context.existingSystems || [],
      constraints: context.constraints || [],
      performanceRequirements: context.performanceRequirements || [],
      securityRequirements: context.securityRequirements || [],
      complianceNeeds: context.complianceNeeds || [],
      integrations: context.integrations || []
    };
  }

  private getDefaultTechnicalContext(): TechnicalContext {
    return {
      platform: 'web',
      existingSystems: [],
      constraints: [],
      performanceRequirements: [],
      securityRequirements: [],
      complianceNeeds: [],
      integrations: []
    };
  }
}
