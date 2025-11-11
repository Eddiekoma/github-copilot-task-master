import { AIService } from '../../services/AIService';
import { ProjectReview, ProjectFile, Gap, Risk } from '../../types/projectModels';

/**
 * Step 6: Review & Refine
 * Reviews project completeness and identifies gaps and risks
 */
export class ReviewStep {
    constructor(private aiService: AIService) {}

    /**
     * Review complete project definition for completeness and quality
     */
    async reviewProject(projectFile: Partial<ProjectFile>): Promise<ProjectReview> {
        const prompt = `Review this project definition for completeness and quality:

PROJECT: ${projectFile.purpose?.name}
PROBLEM: ${projectFile.purpose?.problemStatement}

FEATURES: ${projectFile.features?.length || 0} features defined
${projectFile.features?.map(f => `- ${f.name}`).join('\n')}

ARCHITECTURE: ${projectFile.architecture?.style}
COMPONENTS: ${projectFile.architecture?.components.length || 0} components

TASKS: ${projectFile.tasks?.length || 0} tasks defined

Check for:
1. Missing requirements or specification gaps
2. Potential technical risks
3. Security considerations not addressed
4. Performance considerations
5. Testing coverage plans
6. Documentation needs
7. Accessibility requirements
8. Error handling strategy
9. Deployment considerations
10. Monitoring and observability

Provide:
- Completeness score (0-100)
- List of gaps with severity and suggestions
- Risk assessment with impact, likelihood, and mitigation
- Improvement suggestions
- Critical questions that need answers

Return as JSON:
{
  "completenessScore": 85,
  "gaps": [
    {
      "category": "Security",
      "description": "No password reset flow defined",
      "severity": "high",
      "suggestion": "Add password reset feature with email verification"
    }
  ],
  "risks": [
    {
      "description": "Database scalability concerns",
      "impact": "high",
      "likelihood": "medium",
      "mitigation": "Implement database sharding and read replicas"
    }
  ],
  "improvementSuggestions": [
    "Add error monitoring service",
    "Define API versioning strategy"
  ],
  "criticalQuestions": [
    "What is the expected user load?",
    "Are there any compliance requirements?"
  ]
}

Return ONLY valid JSON.`;

        try {
            const response = await this.aiService.generateProjectRequirements(prompt);
            
            let jsonString = typeof response === 'string' ? response : JSON.stringify(response);
            const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || jsonString.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
                return this.normalizeReview(parsed);
            }
            
            return this.getDefaultReview();
        } catch (error) {
            console.error('[ReviewStep] Error reviewing project:', error);
            return this.getDefaultReview();
        }
    }

    /**
     * Normalize review data
     */
    private normalizeReview(data: any): ProjectReview {
        return {
            completenessScore: typeof data.completenessScore === 'number' 
                ? Math.min(100, Math.max(0, data.completenessScore))
                : 70,
            gaps: this.normalizeGaps(data.gaps || []),
            risks: this.normalizeRisks(data.risks || []),
            improvementSuggestions: Array.isArray(data.improvementSuggestions) 
                ? data.improvementSuggestions 
                : [],
            criticalQuestions: Array.isArray(data.criticalQuestions)
                ? data.criticalQuestions
                : []
        };
    }

    /**
     * Normalize gaps
     */
    private normalizeGaps(gaps: any[]): Gap[] {
        return gaps.filter(g => g.description).map(g => ({
            category: g.category || 'General',
            description: g.description,
            severity: this.validateSeverity(g.severity),
            suggestion: g.suggestion || ''
        }));
    }

    /**
     * Normalize risks
     */
    private normalizeRisks(risks: any[]): Risk[] {
        return risks.filter(r => r.description).map(r => ({
            description: r.description,
            impact: this.validateSeverity(r.impact),
            likelihood: this.validateLikelihood(r.likelihood),
            mitigation: r.mitigation || 'To be determined'
        }));
    }

    /**
     * Validate severity level
     */
    private validateSeverity(severity: any): 'critical' | 'high' | 'medium' | 'low' {
        const validSeverities: ('critical' | 'high' | 'medium' | 'low')[] = ['critical', 'high', 'medium', 'low'];
        return validSeverities.includes(severity) ? severity : 'medium';
    }

    /**
     * Validate likelihood level
     */
    private validateLikelihood(likelihood: any): 'high' | 'medium' | 'low' {
        const validLikelihoods: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
        return validLikelihoods.includes(likelihood) ? likelihood : 'medium';
    }

    /**
     * Get default review when AI fails
     */
    private getDefaultReview(): ProjectReview {
        return {
            completenessScore: 70,
            gaps: [
                {
                    category: 'Review',
                    description: 'Automated review could not be completed',
                    severity: 'medium',
                    suggestion: 'Manually review project definition'
                }
            ],
            risks: [],
            improvementSuggestions: [
                'Review all features for completeness',
                'Validate technical requirements',
                'Ensure security measures are defined'
            ],
            criticalQuestions: [
                'Have all user requirements been captured?',
                'Are there any missing technical considerations?'
            ]
        };
    }

    /**
     * Calculate overall project health score
     */
    calculateProjectHealth(review: ProjectReview): {
        score: number;
        status: 'excellent' | 'good' | 'fair' | 'needs-work';
        recommendation: string;
    } {
        const score = review.completenessScore;
        const criticalGaps = review.gaps.filter(g => g.severity === 'critical').length;
        const highRisks = review.risks.filter(r => r.impact === 'critical' || r.impact === 'high').length;

        let adjustedScore = score;
        adjustedScore -= criticalGaps * 10;
        adjustedScore -= highRisks * 5;
        adjustedScore = Math.max(0, adjustedScore);

        let status: 'excellent' | 'good' | 'fair' | 'needs-work';
        let recommendation: string;

        if (adjustedScore >= 90) {
            status = 'excellent';
            recommendation = 'Project is well-defined and ready to proceed.';
        } else if (adjustedScore >= 75) {
            status = 'good';
            recommendation = 'Project is mostly ready. Address identified gaps before proceeding.';
        } else if (adjustedScore >= 60) {
            status = 'fair';
            recommendation = 'Project needs refinement. Review and address critical gaps.';
        } else {
            status = 'needs-work';
            recommendation = 'Project definition is incomplete. Significant work needed before proceeding.';
        }

        return { score: adjustedScore, status, recommendation };
    }
}
