import { ProjectPurpose } from '../../types/projectModels';
import { AIService } from '../../services/AIService';

export class PurposeStep {
  constructor(private aiService: AIService) {}

  async getInitialPrompt(): Promise<string> {
    return `I want to create a new software project. Help me define it clearly by asking questions about:
- What problem does it solve?
- Who is the target audience?
- What are the primary goals?
- How will we measure success?`;
  }

  async processUserInput(input: string): Promise<string[]> {
    const clarifyingQuestions = await this.generateQuestions(input);
    return clarifyingQuestions;
  }

  async generateQuestions(input: string): Promise<string[]> {
    const prompt = `Given this project description: "${input}"
    
Generate 3-5 clarifying questions to better understand:
1. The target audience
2. Success metrics
3. Business requirements
4. Key stakeholders

Format as JSON array of strings.`;

    try {
      const response = await this.aiService.generateProjectRequirements(prompt);
      if (typeof response === 'string') {
        return JSON.parse(response);
      }
      return [];
    } catch (error) {
      console.error('Error generating questions:', error);
      return [];
    }
  }

  async enhancePurpose(basicPurpose: Partial<ProjectPurpose>): Promise<ProjectPurpose> {
    const prompt = `Enhance this project purpose:
Name: ${basicPurpose.name}
Problem: ${basicPurpose.problemStatement}
Audience: ${basicPurpose.targetAudience?.join(', ')}

Provide:
1. Refined problem statement
2. Detailed target audience segments
3. 3-5 specific, measurable goals
4. 3-5 concrete success metrics
5. Key business requirements
6. Potential stakeholders

Format as JSON matching this structure:
{
  "name": "string",
  "problemStatement": "string",
  "targetAudience": ["string"],
  "primaryGoals": ["string"],
  "successMetrics": ["string"],
  "businessRequirements": ["string"],
  "stakeholders": ["string"]
}`;

    const fallback: ProjectPurpose = {
      name: basicPurpose.name || 'New Project',
      problemStatement: basicPurpose.problemStatement || '',
      targetAudience: basicPurpose.targetAudience || [],
      primaryGoals: basicPurpose.primaryGoals || [],
      successMetrics: basicPurpose.successMetrics || [],
      businessRequirements: basicPurpose.businessRequirements || []
    };

    try {
      const enhanced = await this.aiService.generateStructuredResponse<ProjectPurpose>(prompt, fallback);
      return enhanced;
    } catch (error) {
      console.error('Error enhancing purpose:', error);
      return fallback;
    }
  }
}
