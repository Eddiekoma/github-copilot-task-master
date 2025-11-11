import { Architecture, Feature, TechnicalContext } from '../../types/projectModels';
import { AIService } from '../../services/AIService';

export class ArchitectureStep {
  constructor(private aiService: AIService) {}

  async generateArchitecture(
    features: Feature[],
    technical: TechnicalContext
  ): Promise<Architecture> {
    const prompt = `Design architecture for this project:

Platform: ${technical.platform}
Features: ${features.map(f => `${f.name}: ${f.description}`).join('\n')}
Constraints: ${technical.constraints.map(c => c.description).join(', ')}

Provide:
1. Recommended architecture style (monolithic/microservices/serverless)
2. Component breakdown with responsibilities
3. Data flow between components
4. API design (if applicable)
5. Database schema suggestions
6. Security architecture
7. Deployment strategy
8. Scalability plan

Also generate a Mermaid diagram for the architecture.
Include links to relevant documentation for suggested technologies.

Return as JSON matching Architecture interface.`;

    try {
      const architecture = await this.aiService.generateStructuredResponse<Architecture>(
        prompt,
        this.getDefaultArchitecture()
      );
      return this.validateArchitecture(architecture);
    } catch (error) {
      console.error('Error generating architecture:', error);
      return this.getDefaultArchitecture();
    }
  }

  private validateArchitecture(arch: Architecture): Architecture {
    return {
      style: arch.style || 'monolithic',
      components: Array.isArray(arch.components) ? arch.components : [],
      dataFlow: Array.isArray(arch.dataFlow) ? arch.dataFlow : [],
      apiDesign: arch.apiDesign || {
        style: 'rest',
        authentication: 'jwt',
        versioning: 'uri',
        endpoints: []
      },
      databaseSchema: arch.databaseSchema || '',
      securityArchitecture: arch.securityArchitecture || '',
      deploymentStrategy: arch.deploymentStrategy || '',
      scalabilityPlan: arch.scalabilityPlan || ''
    };
  }

  private getDefaultArchitecture(): Architecture {
    return {
      style: 'monolithic',
      components: [],
      dataFlow: [],
      apiDesign: {
        style: 'rest',
        authentication: 'jwt',
        versioning: 'uri',
        endpoints: []
      },
      databaseSchema: '',
      securityArchitecture: '',
      deploymentStrategy: '',
      scalabilityPlan: ''
    };
  }
}
