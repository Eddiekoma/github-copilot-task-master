import { AIService } from '../../services/AIService';
import { Architecture, Feature, TechnicalContext, Component, ComponentInterface, DataFlow, APIDesign, APIEndpoint } from '../../types/projectModels';

/**
 * Step 4: Architecture & Design
 * Generates system architecture, components, and API design
 */
export class ArchitectureStep {
    constructor(private aiService: AIService) {}

    /**
     * Generate architecture design based on features and technical context
     */
    async generateArchitecture(
        features: Feature[],
        technical: TechnicalContext
    ): Promise<Architecture> {
        const featuresList = features.map(f => `- ${f.name}: ${f.description}`).join('\n');
        
        const prompt = `Design system architecture for this project:

PLATFORM: ${technical.platform}
FEATURES:
${featuresList}

CONSTRAINTS:
${technical.constraints.map(c => `- ${c.type}: ${c.description}`).join('\n')}

Provide comprehensive architecture design:

1. Architecture style (monolithic/microservices/serverless/hybrid) with reasoning
2. Component breakdown:
   - Name and type (frontend/backend/database/service/api)
   - Technologies for each component
   - Responsibilities
   - Interfaces (REST/GraphQL/etc)
   - Dependencies
3. Data flow between components
4. API design (if applicable):
   - Style (REST/GraphQL/gRPC)
   - Key endpoints with methods
   - Authentication approach
5. Security architecture
6. Deployment strategy
7. Scalability plan

Return as JSON:
{
  "style": "microservices",
  "styleReasoning": "explanation",
  "components": [
    {
      "name": "API Gateway",
      "type": "api",
      "technologies": ["Node.js", "Express"],
      "responsibilities": ["Routing", "Authentication"],
      "interfaces": [{"name": "REST API", "type": "rest", "description": "Main API"}],
      "dependencies": ["Auth Service", "Database"]
    }
  ],
  "dataFlow": [
    {"from": "Frontend", "to": "API Gateway", "dataType": "HTTP Request", "protocol": "HTTPS"}
  ],
  "apiDesign": {
    "style": "rest",
    "endpoints": [
      {"path": "/api/users", "method": "GET", "description": "Get users", "responseBody": "User[]"}
    ],
    "authentication": "JWT",
    "rateLimit": "1000 requests/hour"
  },
  "securityArchitecture": "Description of security measures",
  "deploymentStrategy": "Deployment approach",
  "scalabilityPlan": "How system will scale"
}

Return ONLY valid JSON.`;

        try {
            const response = await this.aiService.generateProjectRequirements(prompt);
            
            let jsonString = typeof response === 'string' ? response : JSON.stringify(response);
            const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/) || jsonString.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim()) as { style: string; [key: string]: unknown };
                return this.normalizeArchitecture(parsed);
            }
            
            // Return minimal architecture if parsing fails
            return this.getDefaultArchitecture(technical.platform);
        } catch (error) {
            console.error('[ArchitectureStep] Error generating architecture:', error);
            return this.getDefaultArchitecture(technical.platform);
        }
    }

    /**
     * Normalize and validate architecture data
     */
    private normalizeArchitecture(data: { style?: string; components?: unknown[]; dataFlow?: unknown[]; apiDesign?: unknown; databaseSchema?: string; securityArchitecture?: string; deploymentStrategy?: string; scalabilityPlan?: string }): Architecture {
        return {
            style: this.validateArchitectureStyle(data.style),
            components: this.validateComponents(data.components || []),
            dataFlow: this.validateDataFlow(data.dataFlow || []),
            apiDesign: this.validateAPIDesign(data.apiDesign || {}),
            databaseSchema: data.databaseSchema,
            securityArchitecture: data.securityArchitecture || 'To be defined',
            deploymentStrategy: data.deploymentStrategy || 'To be defined',
            scalabilityPlan: data.scalabilityPlan || 'To be defined'
        };
    }

    /**
     * Validate architecture style
     */
    private validateArchitectureStyle(style: any): 'monolithic' | 'microservices' | 'serverless' | 'hybrid' {
        const validStyles: ('monolithic' | 'microservices' | 'serverless' | 'hybrid')[] = 
            ['monolithic', 'microservices', 'serverless', 'hybrid'];
        return validStyles.includes(style) ? style : 'monolithic';
    }

    /**
     * Validate components array
     */
    private validateComponents(components: unknown[]): Component[] {
        return components.filter((c): c is Record<string, unknown> => 
            typeof c === 'object' && c !== null && 'name' in c && 'type' in c
        ).map(c => ({
            name: String(c.name),
            type: this.validateComponentType(c.type),
            technologies: Array.isArray(c.technologies) ? c.technologies as string[] : [],
            responsibilities: Array.isArray(c.responsibilities) ? c.responsibilities as string[] : [],
            interfaces: Array.isArray(c.interfaces) ? c.interfaces as ComponentInterface[] : [],
            dependencies: Array.isArray(c.dependencies) ? c.dependencies as string[] : []
        }));
    }

    /**
     * Validate component type
     */
    private validateComponentType(type: any): 'frontend' | 'backend' | 'database' | 'service' | 'api' {
        const validTypes: ('frontend' | 'backend' | 'database' | 'service' | 'api')[] = 
            ['frontend', 'backend', 'database', 'service', 'api'];
        return validTypes.includes(type) ? type : 'service';
    }

    /**
     * Validate data flow array
     */
    private validateDataFlow(dataFlow: any[]): DataFlow[] {
        return dataFlow.filter(df => df.from && df.to).map(df => ({
            from: df.from,
            to: df.to,
            dataType: df.dataType || 'Data',
            protocol: df.protocol || 'HTTP'
        }));
    }

    /**
     * Validate API design
     */
    private validateAPIDesign(apiDesign: any): APIDesign {
        return {
            style: ['rest', 'graphql', 'grpc', 'hybrid'].includes(apiDesign.style) ? apiDesign.style : 'rest',
            endpoints: Array.isArray(apiDesign.endpoints) ? this.validateEndpoints(apiDesign.endpoints) : [],
            authentication: apiDesign.authentication || 'To be defined',
            rateLimit: apiDesign.rateLimit
        };
    }

    /**
     * Validate API endpoints
     */
    private validateEndpoints(endpoints: any[]): APIEndpoint[] {
        return endpoints.filter(e => e.path && e.method).map(e => ({
            path: e.path,
            method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(e.method) ? e.method : 'GET',
            description: e.description || '',
            requestBody: e.requestBody,
            responseBody: e.responseBody
        }));
    }

    /**
     * Get default architecture based on platform
     */
    private getDefaultArchitecture(platform: string): Architecture {
        return {
            style: 'monolithic',
            components: [
                {
                    name: 'Application',
                    type: 'frontend',
                    technologies: [platform === 'web' ? 'React' : platform],
                    responsibilities: ['User Interface', 'User Experience'],
                    interfaces: [],
                    dependencies: []
                }
            ],
            dataFlow: [],
            apiDesign: {
                style: 'rest',
                endpoints: [],
                authentication: 'To be defined'
            },
            securityArchitecture: 'To be defined',
            deploymentStrategy: 'To be defined',
            scalabilityPlan: 'To be defined'
        };
    }
}
