/**
 * ConstructorIA — Photo Vision Analysis
 * Analyzes construction site photos for progress tracking & quality assessment
 * v2.0+ Feature
 */

class PhotoAnalyzer {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1';
    this.model = 'claude-3-5-sonnet-20241022';
  }

  /**
   * Analyzes construction site photo
   * @param {string} imageData - Base64 encoded image
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzePhoto(imageData, options = {}) {
    const {
      phase = 'general',
      focus = ['progress', 'safety', 'quality'],
      projectId = null
    } = options;

    const prompt = `You are an expert construction site inspector. Analyze this construction site photo.

ANALYSIS FOCUS: ${focus.join(', ')}
PROJECT PHASE: ${phase}

Provide detailed assessment:

1. **Progress Assessment**:
   - Current phase identification
   - % completion estimation
   - Visible work completed
   - Remaining work

2. **Safety Inspection**:
   - Hazards identified
   - PPE compliance
   - Site cleanliness
   - Safety risk score (1-10)

3. **Quality Assessment**:
   - Material quality visible
   - Workmanship assessment
   - Defects or issues noticed
   - Quality score (1-10)

4. **Resource Status**:
   - Visible equipment/materials
   - Worker count estimation
   - Resource adequacy assessment

5. **Timeline Impact**:
   - On-schedule assessment
   - Potential delays
   - Recommended actions

6. **Cost Impact**:
   - Visible cost variations
   - Material waste observed
   - Budget impact assessment

Format as JSON for easy parsing.`;

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
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: imageData
                  }
                },
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
      const analysisText = data.content[0].text;

      // Parse JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      let analysis = {};
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }

      return {
        project_id: projectId,
        analysis: analysis,
        timestamp: new Date().toISOString(),
        status: 'analysis_complete'
      };
    } catch (error) {
      return {
        error: error.message,
        status: 'analysis_failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Batch analyze multiple photos (from site visit)
   * @param {Array} imageDataArray - Array of base64 images
   * @param {Object} options
   * @returns {Promise<Array>} Analysis results
   */
  async batchAnalyzePhotos(imageDataArray, options = {}) {
    const results = [];

    for (const [index, imageData] of imageDataArray.entries()) {
      const result = await this.analyzePhoto(imageData, {
        ...options,
        sequenceNumber: index + 1,
        totalPhotos: imageDataArray.length
      });
      results.push(result);

      // Rate limiting: 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return this._synthesizeResults(results);
  }

  /**
   * Synthesizes results from multiple photo analyses
   * @private
   */
  _synthesizeResults(results) {
    const failedAnalyses = results.filter(r => r.status === 'analysis_failed');
    const successfulAnalyses = results.filter(r => r.status === 'analysis_complete');

    if (successfulAnalyses.length === 0) {
      return {
        error: 'All analyses failed',
        details: failedAnalyses
      };
    }

    // Aggregate findings
    const avgProgressScore = successfulAnalyses.reduce((sum, a) => {
      return sum + (a.analysis.progress_assessment?.completion_percentage || 0);
    }, 0) / successfulAnalyses.length;

    const avgSafetyScore = successfulAnalyses.reduce((sum, a) => {
      return sum + (a.analysis.safety_inspection?.safety_risk_score || 5);
    }, 0) / successfulAnalyses.length;

    const avgQualityScore = successfulAnalyses.reduce((sum, a) => {
      return sum + (a.analysis.quality_assessment?.quality_score || 5);
    }, 0) / successfulAnalyses.length;

    const allDefects = [];
    const allHazards = [];
    successfulAnalyses.forEach(a => {
      if (a.analysis.quality_assessment?.defects) {
        allDefects.push(...a.analysis.quality_assessment.defects);
      }
      if (a.analysis.safety_inspection?.hazards) {
        allHazards.push(...a.analysis.safety_inspection.hazards);
      }
    });

    return {
      site_visit_summary: {
        photos_analyzed: successfulAnalyses.length,
        analysis_date: new Date().toISOString(),
        average_progress: Math.round(avgProgressScore),
        average_safety_score: Math.round(avgSafetyScore * 10) / 10,
        average_quality_score: Math.round(avgQualityScore * 10) / 10,
        critical_issues: this._filterCriticalIssues(allHazards, allDefects),
        all_defects: allDefects,
        all_hazards: allHazards,
        recommendations: this._generateRecommendations(allHazards, allDefects, avgSafetyScore)
      },
      detailed_analyses: successfulAnalyses,
      failed_analyses: failedAnalyses.length
    };
  }

  /**
   * Filter for critical/blocking issues
   * @private
   */
  _filterCriticalIssues(hazards = [], defects = []) {
    const critical = [];

    hazards.forEach(h => {
      if (h.severity === 'critical' || h.risk_level > 8) {
        critical.push({
          type: 'safety_hazard',
          description: h.description,
          severity: h.severity,
          action_required: true
        });
      }
    });

    defects.forEach(d => {
      if (d.severity === 'major' || d.impact_score > 7) {
        critical.push({
          type: 'quality_defect',
          description: d.description,
          severity: d.severity,
          action_required: true
        });
      }
    });

    return critical;
  }

  /**
   * Generate actionable recommendations
   * @private
   */
  _generateRecommendations(hazards = [], defects = [], safetyScore = 5) {
    const recommendations = [];

    if (safetyScore > 7) {
      recommendations.push({
        priority: 'high',
        area: 'safety',
        action: 'Implement immediate safety corrective measures'
      });
    }

    if (defects.length > 5) {
      recommendations.push({
        priority: 'high',
        area: 'quality',
        action: 'Schedule quality audit and rework plan'
      });
    }

    recommendations.push({
      priority: 'medium',
      area: 'documentation',
      action: 'Update project documentation with photos and findings'
    });

    return recommendations;
  }

  /**
   * Compares two photos (before/after)
   * @param {string} beforeImage - Base64 before photo
   * @param {string} afterImage - Base64 after photo
   * @returns {Promise<Object>} Comparison analysis
   */
  async comparePhotos(beforeImage, afterImage) {
    const prompt = `Compare these two construction photos (before and after).

Analyze:
1. Work completed between photos
2. Materials added/removed
3. Progress made
4. Quality improvements/degradations
5. Safety changes
6. Timeline assessment

Estimate % completion gain and provide specific findings.`;

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
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'BEFORE:' },
                {
                  type: 'image',
                  source: { type: 'base64', media_type: 'image/jpeg', data: beforeImage }
                },
                { type: 'text', text: 'AFTER:' },
                {
                  type: 'image',
                  source: { type: 'base64', media_type: 'image/jpeg', data: afterImage }
                },
                { type: 'text', text: prompt }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      return {
        comparison: data.content[0].text,
        status: 'complete'
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhotoAnalyzer;
}

// Usage Example:
/*
const analyzer = new PhotoAnalyzer(process.env.CLAUDE_API_KEY);

// Analyze single photo
const analysis = await analyzer.analyzePhoto(imageData, {
  phase: 'foundation',
  focus: ['progress', 'safety', 'quality'],
  projectId: 'proj-123'
});

// Batch analyze from site visit
const siteVisit = await analyzer.batchAnalyzePhotos(
  [photo1, photo2, photo3, photo4],
  { phase: 'framing' }
);

// Compare before/after
const comparison = await analyzer.comparePhotos(beforePhoto, afterPhoto);
*/
