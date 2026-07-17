class PhotoAnalyzer {
  constructor(apiKey, baseURL = 'https://api.anthropic.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.model = 'claude-3-5-sonnet-20241022';
  }

  /**
   * Analyze single construction site photo
   * @param {String} imageData - Base64 encoded image
   * @param {Object} options - Analysis options
   * @returns {Object} Detailed analysis
   */
  async analyzePhoto(imageData, options = {}) {
    const prompt = `
      Analiza esta foto de obra de construcción y proporciona:
      
      1. **Porcentaje de progreso** (0-100%)
      2. **Fase actual** (excavación, cimentación, estructura, acabados, etc.)
      3. **Alertas de seguridad** (si hay)
      4. **Calidad del trabajo** (excelente/buena/aceptable/mala)
      5. **Recursos visibles** (maquinaria, materiales, personal)
      6. **Estimación de impacto en timeline** (días adelantados/atrasados)
      
      Responde en JSON.
    `;

    try {
      const response = await this._callClaudeVision(imageData, prompt);
      return this._parsePhotoAnalysis(response);
    } catch (err) {
      console.error('Photo analysis failed:', err);
      throw err;
    }
  }

  /**
   * Analyze multiple photos
   * @param {Array} imageDataArray - Array of base64 images
   * @param {Function} progressCallback - Progress callback
   * @returns {Object} Aggregated analysis
   */
  async batchAnalyzePhotos(imageDataArray, progressCallback) {
    const analyses = [];
    
    for (let i = 0; i < imageDataArray.length; i++) {
      const analysis = await this.analyzePhoto(imageDataArray[i]);
      analyses.push(analysis);
      
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total: imageDataArray.length,
          percent: Math.round(((i + 1) / imageDataArray.length) * 100)
        });
      }
    }

    return this._aggregateAnalyses(analyses);
  }

  /**
   * Compare before/after photos
   * @param {String} beforeImage - Base64 encoded before image
   * @param {String} afterImage - Base64 encoded after image
   * @returns {Object} Comparison analysis
   */
  async comparePhotos(beforeImage, afterImage) {
    const prompt = `
      Compara estas dos fotos de obra (antes y después) y proporciona:
      
      1. **Cambios principales** (qué se completó)
      2. **Progreso en %** (incremento desde la anterior)
      3. **Velocidad de ejecución** (rápida/normal/lenta)
      4. **Anomalías o desviaciones** (si hay)
      5. **Próximos pasos recomendados**
      
      Responde en JSON.
    `;

    try {
      // In real implementation, send both images to Claude
      const response = await this._callClaudeVisionMultiple([beforeImage, afterImage], prompt);
      return this._parseComparisonAnalysis(response);
    } catch (err) {
      console.error('Comparison failed:', err);
      throw err;
    }
  }

  /**
   * Get site visit summary from photo batch
   * @param {Array} photoAnalyses - Array of photo analyses
   * @returns {Object} Site summary
   */
  getSiteVisitSummary(photoAnalyses) {
    if (!photoAnalyses || photoAnalyses.length === 0) {
      return { error: 'No analyses provided' };
    }

    const avgProgress = photoAnalyses.reduce((sum, a) => sum + (a.progress || 0), 0) / photoAnalyses.length;
    const safetyIssues = photoAnalyses.filter(a => a.safety_alerts && a.safety_alerts.length > 0);
    const qualityScores = photoAnalyses.map(a => a.quality_score || 0);
    const avgQuality = qualityScores.reduce((a, b) => a + b) / qualityScores.length;

    const phases = photoAnalyses.map(a => a.phase).filter((v, i, arr) => arr.indexOf(v) === i);

    return {
      site_progress_percent: Math.round(avgProgress),
      current_phases: phases,
      avg_quality_score: Math.round(avgQuality),
      safety_alerts_count: safetyIssues.length,
      overall_status: avgProgress > 75 ? 'on-track' : avgProgress > 50 ? 'acceptable' : 'behind-schedule',
      photos_analyzed: photoAnalyses.length,
      timeline_impact_days: this._estimateTimelineImpact(avgProgress, photoAnalyses),
      cost_impact_percent: this._estimateCostImpact(safetyIssues, qualityScores)
    };
  }

  // ========== PRIVATE METHODS ==========

  async _callClaudeVision(imageData, prompt) {
    // Mock response for demo
    return JSON.stringify({
      progress: 45,
      phase: 'estructura',
      safety_alerts: [],
      quality_score: 8,
      resources: ['grúa', 'andamios', 'personal', 'cemento'],
      timeline_impact: 0
    });
  }

  async _callClaudeVisionMultiple(images, prompt) {
    // Mock response for demo
    return JSON.stringify({
      changes: ['Se completó estructura lateral', 'Colocación de vigas'],
      progress_increase: 15,
      execution_speed: 'normal',
      anomalies: [],
      next_steps: ['Encofrado', 'Vertido de hormigón']
    });
  }

  _parsePhotoAnalysis(response) {
    try {
      const data = JSON.parse(response);
      return {
        progress: data.progress || 0,
        phase: data.phase || 'unknown',
        safety_alerts: data.safety_alerts || [],
        quality_score: data.quality_score || 0,
        resources: data.resources || [],
        timeline_impact: data.timeline_impact || 0
      };
    } catch (e) {
      return {
        progress: 0,
        error: 'Failed to parse response'
      };
    }
  }

  _parseComparisonAnalysis(response) {
    try {
      const data = JSON.parse(response);
      return {
        changes: data.changes || [],
        progress_increase: data.progress_increase || 0,
        execution_speed: data.execution_speed || 'unknown',
        anomalies: data.anomalies || [],
        next_steps: data.next_steps || []
      };
    } catch (e) {
      return { error: 'Failed to parse comparison' };
    }
  }

  _estimateTimelineImpact(progress, analyses) {
    // Simple heuristic: ahead of schedule if progress > 60% at mid-project
    if (progress > 65) return -3; // 3 days ahead
    if (progress < 40) return 5; // 5 days behind
    return 0;
  }

  _estimateCostImpact(safetyIssues, qualityScores) {
    const avgQuality = qualityScores.reduce((a, b) => a + b) / qualityScores.length;
    const safetyPenalty = safetyIssues.length * 2;
    const qualityBonus = avgQuality > 7 ? -2 : avgQuality < 5 ? 5 : 0;
    
    return safetyPenalty + qualityBonus;
  }
}

module.exports = PhotoAnalyzer;
