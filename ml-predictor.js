class MLPredictor {
  constructor() {
    this.model = null;
    this.trained = false;
    this.history = [];
  }

  /**
   * Train model on historical project data
   * @param {Array} projects - Array of past projects with cost and timeline data
   */
  train(projects) {
    if (!projects || projects.length < 5) {
      console.warn('Need at least 5 projects to train model');
      return false;
    }

    this.history = projects;
    this.trained = true;

    // Simple linear regression: cost = base + (area * coeff)
    const areas = projects.map(p => p.area || 100);
    const costs = projects.map(p => p.actual_cost || 0);

    const meanArea = areas.reduce((a, b) => a + b) / areas.length;
    const meanCost = costs.reduce((a, b) => a + b) / costs.length;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < areas.length; i++) {
      numerator += (areas[i] - meanArea) * (costs[i] - meanCost);
      denominator += Math.pow(areas[i] - meanArea, 2);
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = meanCost - slope * meanArea;

    this.model = { slope, intercept };
    console.log('✅ ML Model trained');
    return true;
  }

  /**
   * Predict cost and timeline for new project
   * @param {Object} project - Project features {area, rooms, materials}
   * @returns {Object} Prediction with cost, timeline, confidence
   */
  predict(project) {
    if (!this.trained || !this.model) {
      return {
        cost_predicted: project.budget || 50000,
        cost_confidence: 0.6,
        cost_range_low: (project.budget || 50000) * 0.85,
        cost_range_high: (project.budget || 50000) * 1.15,
        timeline_predicted: 30,
        timeline_confidence: 0.65,
        risk_level: 'medium'
      };
    }

    const area = project.area || 100;
    const rooms = project.rooms || 3;
    
    // Base prediction from linear model
    const baseCost = this.model.intercept + this.model.slope * area;
    
    // Adjustments based on complexity
    const roomMultiplier = 1 + (rooms - 3) * 0.05;
    const predictedCost = baseCost * roomMultiplier;

    // Confidence increases with more training data
    const confidence = Math.min(0.95, 0.6 + this.history.length * 0.03);

    // Timeline: 20-50 days based on area
    const baseTimeline = 20 + (area / 200) * 30;
    const predictedTimeline = Math.round(baseTimeline);

    // Risk assessment
    let riskLevel = 'low';
    if (predictedCost > 100000) riskLevel = 'high';
    else if (predictedCost > 75000) riskLevel = 'medium';

    return {
      cost_predicted: Math.round(predictedCost),
      cost_confidence: confidence,
      cost_range_low: Math.round(predictedCost * 0.95),
      cost_range_high: Math.round(predictedCost * 1.05),
      timeline_predicted: predictedTimeline,
      timeline_confidence: 0.85,
      timeline_variance: 3,
      risk_level: riskLevel,
      accuracy_note: `Trained on ${this.history.length} projects (±${Math.round((1 - confidence) * 100)}%)`
    };
  }

  /**
   * Get accuracy metrics
   */
  getAccuracy() {
    if (!this.trained || this.history.length === 0) {
      return { accuracy: 0, n_samples: 0 };
    }

    let totalError = 0;
    
    for (const project of this.history) {
      const prediction = this.predict(project);
      const actualCost = project.actual_cost || 0;
      const error = Math.abs(prediction.cost_predicted - actualCost) / actualCost;
      totalError += error;
    }

    const meanError = totalError / this.history.length;
    const accuracy = Math.max(0, 1 - meanError);

    return {
      accuracy: Math.round(accuracy * 100),
      n_samples: this.history.length,
      mean_error_percent: Math.round(meanError * 100)
    };
  }
}

module.exports = MLPredictor;
