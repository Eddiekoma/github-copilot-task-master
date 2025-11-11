import { AIService } from '../../services/AIService';
import { TechnicalContext, ProjectPurpose, ExistingSystem, TechnicalConstraint, PerformanceMetric, Integration } from '../../types/projectModels';

/**
 * Step 2: Technical Context
 * Determines platform, existing systems, constraints, and integration needs
 */
export class TechnicalContextStep {
    constructor(private aiService: AIService) {}

    /**
     * Analyze project purpose and suggest technical context
     */
    async analyzeTechnicalNeeds(purpose: ProjectPurpose): Promise<Partial<TechnicalContext>> {
        const prompt = `Based on this project information, suggest technical context:

Project: ${purpose.name}
Problem: ${purpose.problemStatement}
Goals: ${purpose.primaryGoals.join(', ')}
Target Audience: ${purpose.targetAudience.join(', ')}

Analyze and suggest:
1. Best platform (web/mobile/desktop/cloud/hybrid) with reasoning
2. Common technical constraints to consider
3. Typical performance requirements for this type of project
4. Security requirements based on the use case
5. Potential integration points

Return as JSON:
{
  "platformSuggestion": "web",
  "platformReasoning": "explanation",
  "suggestedConstraints": [
    {"type": "budget", "description": "description", "severity": "medium"}
  ],
  "suggestedPerformanceMetrics": [
    {"metric": "Page Load Time", "target": "< 2 seconds", "measurement": "Core Web Vitals"}
  ],
  "suggestedSecurityRequirements": ["requirement 1", "requirement 2"],
  "potentialIntegrations": [
    {"name": "Payment Gateway", "type": "rest-api", "required": false}
  ]
}

Return ONLY valid JSON.`;

        try {
            const response = await this.aiService.generateProjectRequirements(prompt);
            
            let jsonString = typeof response === 'string' ? response : JSON.stringify(response);
            const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || jsonString.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
                return {
                    platform: parsed.platformSuggestion || 'web',
                    constraints: parsed.suggestedConstraints || [],
                    performanceRequirements: parsed.suggestedPerformanceMetrics || [],
                    securityRequirements: parsed.suggestedSecurityRequirements || [],
                    integrations: parsed.potentialIntegrations || []
                };
            }
            
            return {};
        } catch (error) {
            console.error('[TechnicalContextStep] Error analyzing technical needs:', error);
            return {};
        }
    }

    /**
     * Build complete technical context from user input and AI suggestions
     */
    buildTechnicalContext(
        platform: 'web' | 'mobile' | 'desktop' | 'cloud' | 'hybrid',
        existingSystems: ExistingSystem[],
        constraints: TechnicalConstraint[],
        performanceRequirements: PerformanceMetric[],
        securityRequirements: string[],
        complianceNeeds: string[],
        integrations: Integration[]
    ): TechnicalContext {
        return {
            platform,
            existingSystems,
            constraints,
            performanceRequirements,
            securityRequirements,
            complianceNeeds,
            integrations
        };
    }

    /**
     * Validate technical context completeness
     */
    validateContext(context: Partial<TechnicalContext>): boolean {
        return !!(
            context.platform &&
            Array.isArray(context.existingSystems) &&
            Array.isArray(context.constraints) &&
            Array.isArray(context.securityRequirements)
        );
    }
}
