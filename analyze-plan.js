/**
 * ConstructorIA — Claude Vision Integration
 * Analyzes floor plans (PDF/images) using Claude's vision capabilities
 * v2.0+ Feature
 */

class PlanAnalyzer {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1';
    this.model = 'claude-3-5-sonnet-20241022';
  }

  /**
   * Analyzes a floor plan image/PDF
   * @param {string} imageData - Base64 encoded image or URL
   * @param {string} format - 'base64' | 'url'
   * @returns {Promise<Object>} Analysis results
   */
  async analyzePlan(imageData, format = 'base64') {
    const prompt = `You are an expert construction engineer analyzing architectural floor plans.

Analyze this floor plan and provide:
1. **Dimensions**: Total area (m²), room dimensions
2. **Rooms**: Count and types (bedrooms, bathrooms, kitchen, living, etc.)
3. **Materials**: Inferred construction materials visible
4. **Structural Elements**: Load-bearing walls, columns, stairs
5. **Systems**: Electrical runs, plumbing routes (if visible)
6. **Cost Estimation**: Rough cost breakdown by room/system
7. **Construction Phases**: Recommended work order
8. **Potential Issues**: Structural concerns or design oddities
9. **Material Requirements**: Estimated quantities of key materials

Format response as JSON for easy parsing.`;

    const imageContent = format === 'url'
      ? { type: 'image', source: { type: 'url', url: imageData } }
      : { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageData } };

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: [
                imageContent,
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = data.content[0].text;

      // Try to parse JSON from response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        raw: analysis,
        status: 'analysis_complete',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        status: 'analysis_failed'
      };
    }
  }

  /**
   * Generates budget from plan analysis
   * @param {Object} analysis - Results from analyzePlan()
   * @returns {Object} Budget breakdown
   */
  generateBudgetFromAnalysis(analysis) {
    if (analysis.error) {
      return { error: 'Cannot generate budget from failed analysis' };
    }

    // Default cost per m² (can be customized by region/type)
    const costPerSqm = {
      basic: 800,      // Basic construction
      standard: 1200,  // Standard construction
      premium: 1800    // Premium finish
    };

    const totalArea = analysis.dimensions?.total_area_sqm || 100;
    const quality = 'standard'; // Can be parameterized

    return {
      total_area: totalArea,
      quality_level: quality,
      cost_per_sqm: costPerSqm[quality],
      estimated_total: totalArea * costPerSqm[quality],
      breakdown: {
        structure: totalArea * costPerSqm[quality] * 0.25,
        electrical: totalArea * costPerSqm[quality] * 0.15,
        plumbing: totalArea * costPerSqm[quality] * 0.15,
        finishing: totalArea * costPerSqm[quality] * 0.35,
        contingency: totalArea * costPerSqm[quality] * 0.10
      },
      materials: analysis.material_requirements || {},
      timeline_days: Math.ceil(totalArea / 10) // ~10 m² per day
    };
  }

  /**
   * Extracts material list from analysis
   * @param {Object} analysis
   * @returns {Array} Material items with quantities
   */
  extractMaterials(analysis) {
    if (!analysis.material_requirements) {
      return [];
    }

    return Object.entries(analysis.material_requirements).map(([material, qty]) => ({
      name: material,
      quantity: qty.amount,
      unit: qty.unit || 'units',
      estimated_cost: qty.estimated_cost || 0
    }));
  }

  /**
   * Generates recommended supplier list
   * @param {Object} analysis
   * @returns {Array} Recommended suppliers
   */
  recommendSuppliers(analysis) {
    const materials = this.extractMaterials(analysis);
    const suppliers = {
      'cement-aggregate': ['Ferretería Central', 'Materiales La Plata'],
      'steel-structural': ['Acero y Estructuras', 'Siderar'],
      'electrical': ['Cables Eléctricos SA', 'Schneider Electric'],
      'plumbing': ['Azulejos Premium', 'Ferretería Central'],
      'finishing': ['Pinturas Decorativas', 'DuPont']
    };

    return materials.map(material => ({
      ...material,
      recommended_suppliers: suppliers[material.name] || ['Ferretería Central']
    }));
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlanAnalyzer;
}

// Usage Example:
/*
const analyzer = new PlanAnalyzer(process.env.CLAUDE_API_KEY);

// Analyze plan
const analysis = await analyzer.analyzePlan(base64ImageData, 'base64');

// Generate budget
const budget = analyzer.generateBudgetFromAnalysis(analysis);

// Extract materials
const materials = analyzer.extractMaterials(analysis);

// Get suppliers
const suppliers = analyzer.recommendSuppliers(analysis);
*/
