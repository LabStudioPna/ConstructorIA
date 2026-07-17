/**
 * ConstructorIA — Midjourney 3D Render Integration
 * Generates 3D visualizations of construction projects
 * v2.0+ Feature
 */

class MidjourneyRenderer {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.midjourney.com/v1';
    this.styles = ['photorealistic', 'architectural', 'minimalist'];
  }

  /**
   * Generates a 3D render from project description
   * @param {Object} project - Project details
   * @param {string} style - Render style ('photorealistic' | 'architectural' | 'minimalist')
   * @returns {Promise<Object>} Render job details
   */
  async generateRender(project, style = 'photorealistic') {
    const prompt = this._buildPrompt(project, style);

    try {
      const response = await fetch(`${this.baseURL}/imagine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          prompt: prompt,
          aspect_ratio: '16:9',
          quality: 'hd',
          style: style,
          seed: Math.random() * 1000000
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        job_id: data.id,
        status: 'queued',
        prompt: prompt,
        style: style,
        created_at: new Date().toISOString(),
        eta_seconds: 60
      };
    } catch (error) {
      return {
        error: error.message,
        status: 'generation_failed'
      };
    }
  }

  /**
   * Builds a detailed Midjourney prompt from project data
   * @private
   */
  _buildPrompt(project, style) {
    const {
      name = 'Modern House',
      area_sqm = 150,
      rooms = 3,
      style_preference = 'contemporary',
      materials = ['concrete', 'glass'],
      color_scheme = 'neutral',
      terrain = 'flat urban lot'
    } = project;

    const stylePrompts = {
      photorealistic: `photorealistic, 8k, professional architecture photography, golden hour lighting, detailed textures`,
      architectural: `architectural rendering, clean lines, blueprint style, technical accuracy, professional CAD aesthetic`,
      minimalist: `minimalist design, clean aesthetic, modern architecture, simple forms, subtle color palette`
    };

    const prompt = `
${name}
${area_sqm} sqm, ${rooms}-room construction project
Materials: ${materials.join(', ')}
Color scheme: ${color_scheme}
Location: ${terrain}
Style: ${style_preference}
${stylePrompts[style] || stylePrompts.photorealistic}
--v 6 --ar 16:9 --q 2`;

    return prompt.trim();
  }

  /**
   * Gets render status and results
   * @param {string} jobId - Job ID from generateRender()
   * @returns {Promise<Object>} Render status
   */
  async getRenderStatus(jobId) {
    try {
      const response = await fetch(`${this.baseURL}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const data = await response.json();
      return {
        job_id: jobId,
        status: data.status, // 'processing' | 'completed' | 'failed'
        progress: data.progress || 0,
        image_url: data.image_url || null,
        upscaled_urls: data.upscaled_urls || [],
        created_at: data.created_at
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Generates multiple render variations
   * @param {Object} project
   * @returns {Promise<Array>} Array of render jobs
   */
  async generateVariations(project) {
    const jobs = [];

    for (const style of this.styles) {
      const job = await this.generateRender(project, style);
      jobs.push(job);
      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return jobs;
  }

  /**
   * Creates animation/walkthrough of project phases
   * @param {Object} project
   * @param {Array} phases - Construction phases ['foundation', 'structure', 'finishing']
   * @returns {Promise<Array>} Animation frames
   */
  async generatePhaseAnimation(project, phases = ['foundation', 'structure', 'finishing']) {
    const frames = [];

    for (const phase of phases) {
      const phaseProject = {
        ...project,
        construction_phase: phase,
        description: `${project.name} - ${phase} phase`
      };

      const prompt = `${phaseProject.description}
Construction progress: ${phase}
Show ${phase} stage of construction
${this._buildPrompt(phaseProject, 'architectural')}`;

      frames.push({
        phase: phase,
        prompt: prompt,
        status: 'queued'
      });
    }

    return frames;
  }
}

/**
 * Render Manager — handles queue and caching
 */
class RenderManager {
  constructor(apiKey) {
    this.renderer = new MidjourneyRenderer(apiKey);
    this.cache = new Map();
    this.queue = [];
  }

  /**
   * Queue a render job with automatic status checking
   * @param {Object} project
   * @param {Object} options
   */
  async queueRender(project, options = {}) {
    const { style = 'photorealistic', autoPoll = true } = options;

    const job = await this.renderer.generateRender(project, style);

    if (job.error) return job;

    this.queue.push(job);

    // Optional: auto-poll status
    if (autoPoll) {
      this._pollStatus(job.job_id, 60000); // Poll for 1 minute
    }

    return job;
  }

  /**
   * Poll status until complete
   * @private
   */
  async _pollStatus(jobId, timeoutMs = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.renderer.getRenderStatus(jobId);

      if (status.status === 'completed') {
        this.cache.set(jobId, status);
        return status;
      }

      if (status.status === 'failed') {
        console.error(`Render job ${jobId} failed`);
        return status;
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return { job_id: jobId, status: 'timeout' };
  }

  /**
   * Get cached render
   */
  getCachedRender(jobId) {
    return this.cache.get(jobId) || null;
  }

  /**
   * Clear old cache entries (>1 hour)
   */
  cleanCache(maxAgeMs = 3600000) {
    const now = Date.now();
    for (const [key, value] of this.cache) {
      if (now - new Date(value.created_at).getTime() > maxAgeMs) {
        this.cache.delete(key);
      }
    }
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MidjourneyRenderer, RenderManager };
}

// Usage Example:
/*
const manager = new RenderManager(process.env.MIDJOURNEY_API_KEY);

// Queue a render
const job = await manager.queueRender({
  name: 'Modern House',
  area_sqm: 250,
  rooms: 4,
  style_preference: 'contemporary',
  materials: ['concrete', 'glass', 'wood'],
  color_scheme: 'warm earth tones'
}, { style: 'photorealistic', autoPoll: true });

// Get cached result
const result = manager.getCachedRender(job.job_id);
if (result) {
  console.log('Render ready:', result.image_url);
}
*/
