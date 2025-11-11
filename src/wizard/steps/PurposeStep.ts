import { AIService } from '../../services/AIService';
import { ProjectPurpose } from '../../types/projectModels';

/**
 * Step 1: Project Purpose
 * Gathers project goals, target audience, and success metrics
 * Uses AI to ask clarifying questions
 */
export class PurposeStep {
    constructor(private aiService: AIService) {}

    /**
     * Generate initial clarifying questions based on user's project idea
     */
    async generateQuestions(projectIdea: string): Promise<string[]> {
        const prompt = `Given this project description: "${projectIdea}"
    
Generate 3-5 clarifying questions to better understand:
1. The specific target audience and their needs
2. How success will be measured
3. Key business requirements
4. Important stakeholders

Format as a JSON array of strings. Each question should be clear and specific.

Example format:
["Who specifically is the target user for this application?", "What metrics will determine if this project is successful?"]`;

        try {
            const response = await this.aiService.generateProjectRequirements(prompt);
            // Parse questions from AI response
            const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
            // Try to extract JSON array from response
            const jsonMatch = responseStr.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [];
        } catch (error) {
            console.error('[PurposeStep] Error generating questions:', error);
            return [];
        }
    }

    /**
     * Analyze user responses and create structured ProjectPurpose
     */
    async analyzePurpose(
        projectName: string,
        problemStatement: string,
        responses: { question: string; answer: string }[]
    ): Promise<ProjectPurpose> {
        const responsesText = responses
            .map(r => `Q: ${r.question}\nA: ${r.answer}`)
            .join('\n\n');

        const prompt = `Based on this project information, create a structured project purpose:

Project Name: ${projectName}
Problem Statement: ${problemStatement}

Additional Context:
${responsesText}

Extract and organize this information into JSON format:
{
  "name": "Project name",
  "problemStatement": "Clear problem description",
  "targetAudience": ["audience segment 1", "audience segment 2"],
  "primaryGoals": ["goal 1", "goal 2", "goal 3"],
  "successMetrics": ["metric 1", "metric 2"],
  "businessRequirements": ["requirement 1", "requirement 2"],
  "stakeholders": ["stakeholder 1", "stakeholder 2"]
}

Return ONLY valid JSON.`;

        try {
            const response = await this.aiService.generateProjectRequirements(prompt);
            
            // Try to parse JSON from response
            let jsonString = typeof response === 'string' ? response : JSON.stringify(response);
            const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || jsonString.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
                return {
                    name: parsed.name || projectName,
                    problemStatement: parsed.problemStatement || problemStatement,
                    targetAudience: Array.isArray(parsed.targetAudience) ? parsed.targetAudience : [],
                    primaryGoals: Array.isArray(parsed.primaryGoals) ? parsed.primaryGoals : [],
                    successMetrics: Array.isArray(parsed.successMetrics) ? parsed.successMetrics : [],
                    businessRequirements: Array.isArray(parsed.businessRequirements) ? parsed.businessRequirements : [],
                    stakeholders: Array.isArray(parsed.stakeholders) ? parsed.stakeholders : []
                };
            }
            
            // Fallback if parsing fails
            return {
                name: projectName,
                problemStatement: problemStatement,
                targetAudience: [],
                primaryGoals: [],
                successMetrics: [],
                businessRequirements: [],
                stakeholders: []
            };
        } catch (error) {
            console.error('[PurposeStep] Error analyzing purpose:', error);
            return {
                name: projectName,
                problemStatement: problemStatement,
                targetAudience: [],
                primaryGoals: [],
                successMetrics: [],
                businessRequirements: []
            };
        }
    }
}
