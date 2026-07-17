const express = require('express');
const pg = require('pg');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

// PostgreSQL Pool
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'constructoria',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ============ AUTH ENDPOINTS ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const hashedPassword = await bcryptjs.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email',
      [email, hashedPassword, firstName || '', lastName || '']
    );

    const token = jwt.sign({ id: result.rows[0].id, email }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ user: result.rows[0], token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcryptjs.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============ PROJECT ENDPOINTS ============

// Create project
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { name, description, budget } = req.body;
    const result = await pool.query(
      'INSERT INTO projects (user_id, name, description, budget, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, name || 'Untitled', description || '', budget || 0, 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// List projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project
app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, budget, status } = req.body;
    const result = await pool.query(
      'UPDATE projects SET name = $1, description = $2, budget = $3, status = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [name, description, budget, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ============ BUDGET ITEMS ENDPOINTS ============

// Add budget item
app.post('/api/projects/:id/items', authenticateToken, async (req, res) => {
  try {
    const { description, quantity, unit_price } = req.body;
    const total = (quantity || 0) * (unit_price || 0);

    const result = await pool.query(
      'INSERT INTO budget_items (project_id, description, quantity, unit_price, total) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.id, description || '', quantity || 0, unit_price || 0, total]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// List items
app.get('/api/projects/:id/items', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM budget_items WHERE project_id = $1 ORDER BY created_at',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Update item
app.put('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const { description, quantity, unit_price } = req.body;
    const total = (quantity || 0) * (unit_price || 0);

    const result = await pool.query(
      'UPDATE budget_items SET description = $1, quantity = $2, unit_price = $3, total = $4 WHERE id = $5 RETURNING *',
      [description, quantity, unit_price, total, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM budget_items WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ============ PREDICTIONS ENDPOINT ============

// Get predictions
app.get('/api/projects/:id/predictions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM predictions WHERE project_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// ============ SUPPLIERS ENDPOINT ============

// Compare suppliers
app.get('/api/suppliers/compare', async (req, res) => {
  try {
    const { material, quantity } = req.query;
    // Placeholder: In production, this would call real supplier APIs
    const suppliers = [
      { name: 'Ferretería Central', price: 2.50 * (quantity || 1), delivery: '2-3 días' },
      { name: 'Acero y Estructuras', price: 2.35 * (quantity || 1), delivery: '5-7 días' },
      { name: 'Azulejos Premium', price: 45 * (quantity || 1), delivery: '3-4 días' }
    ];
    res.json(suppliers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compare suppliers' });
  }
});

// ============ FLOOR PLAN ANALYSIS ============

// Analyze floor plan (mock endpoint)
app.post('/api/projects/:id/analyze-plan', authenticateToken, async (req, res) => {
  try {
    // Mock response - in production, integrates with Claude Vision
    const analysis = {
      area_m2: 150,
      rooms: ['Sala', 'Cocina', 'Baño', 'Dormitorio', 'Lavadero'],
      estimated_cost: '$45,000 - $52,000',
      timeline_days: 31,
      materials: ['Ladrillo', 'Cemento', 'Hierro', 'Azulejos']
    };
    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// ============ 3D RENDERS ============

// Generate render (mock endpoint)
app.post('/api/projects/:id/render', authenticateToken, async (req, res) => {
  try {
    // Mock response - in production, integrates with Midjourney
    const render = {
      style: req.body.style || 'photorealistic',
      status: 'generating',
      url: 'https://example.com/render.png'
    };
    res.json(render);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Render failed' });
  }
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============ START SERVER ============

pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
  console.log('Connected to PostgreSQL');

  app.listen(PORT, () => {
    console.log(`✅ ConstructorIA API running on port ${PORT}`);
  });
});

module.exports = app;
