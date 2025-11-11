import { ProjectReview, ProjectFile } from '../../types/projectModels';
import { AIService } from '../../services/AIService';

export class ReviewStep {
  constructor(private aiService: AIService) {}

  async reviewProject(projectFile: Partial<ProjectFile>): Promise<ProjectReview> {
    const prompt = `Review this project definition for completeness:

Purpose: ${JSON.stringify(projectFile.purpose)}
Technical Context: ${JSON.stringify(projectFile.technicalContext)}
Features: ${projectFile.features?.length} features defined
Architecture: ${projectFile.architecture?.style}
Tasks: ${projectFile.tasks?.length} tasks created

Check for:
1. Missing requirements or gaps
2. Potential risks
3. Security considerations
4. Performance considerations
5. Testing coverage
6. Documentation needs
7. Accessibility requirements
8. Error handling strategy

Provide:
- Completeness score (0-100)
- List of gaps with severity
- Risk assessment
- Improvement suggestions
- Critical questions that need answers

Return as JSON matching ProjectReview interface.`;

    try {
      const review = await this.aiService.generateStructuredResponse<ProjectReview>(
        prompt,
        this.getDefaultReview()
      );
      return this.validateReview(review);
    } catch (error) {
      console.error('Error reviewing project:', error);
      return this.getDefaultReview();
    }
  }

  private validateReview(review: ProjectReview): ProjectReview {
    return {
      completenessScore: review.completenessScore || 0,
      gaps: Array.isArray(review.gaps) ? review.gaps : [],
      risks: Array.isArray(review.risks) ? review.risks : [],
      suggestions: Array.isArray(review.suggestions) ? review.suggestions : [],
      criticalQuestions: Array.isArray(review.criticalQuestions) ? review.criticalQuestions : []
    };
  }

  private getDefaultReview(): ProjectReview {
    return {
      completenessScore: 75,
      gaps: [],
      risks: [],
      suggestions: ['Consider adding more detailed documentation', 'Review security requirements'],
      criticalQuestions: ['Have all stakeholders approved the requirements?']
    };
  }
}
