/**
 * ConstructorIA API Server v1.0+
 * Node.js + Express + PostgreSQL + JWT Auth
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/constructoria',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

app.use(cors());
app.use(express.json());

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ===== HEALTH =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ===== AUTH =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(409).json({ error: 'User exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email',
      [email, hashedPassword, firstName || '', lastName || '']
    );

    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET || 'secret-key', { expiresIn: '24h' });
    res.status(201).json({ message: 'Registered', user: result.rows[0], token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret-key', { expiresIn: '24h' });
    res.json({ message: 'Login success', token, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== PROJECTS =====
app.get('/api/projects', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', verifyToken, async (req, res) => {
  try {
    const { name, description, budget, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const result = await pool.query(
      'INSERT INTO projects (user_id, name, description, budget, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, name, description || '', budget || 0, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:projectId', verifyToken, async (req, res) => {
  try {
    const project = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.projectId, req.userId]
    );
    if (project.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const items = await pool.query(
      'SELECT * FROM budget_items WHERE project_id = $1 ORDER BY created_at',
      [req.params.projectId]
    );
    res.json({ ...project.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== BUDGET ITEMS =====
app.post('/api/projects/:projectId/items', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { description, quantity, unit_price } = req.body;

    const project = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    );
    if (project.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const total = (quantity || 0) * (unit_price || 0);
    const result = await pool.query(
      'INSERT INTO budget_items (project_id, description, quantity, unit_price, total) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [projectId, description, quantity, unit_price, total]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:itemId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM budget_items WHERE id = $1 RETURNING *', [req.params.itemId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== PREDICTIONS =====
app.get('/api/projects/:projectId/predictions', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM predictions WHERE project_id = $1 ORDER BY created_at DESC',
      [req.params.projectId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:projectId/predictions', verifyToken, async (req, res) => {
  try {
    const { metric, predicted_value, confidence } = req.body;
    const result = await pool.query(
      'INSERT INTO predictions (project_id, metric, predicted_value, confidence) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.projectId, metric, predicted_value, confidence || 85]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handlers
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 ConstructorIA API on :${PORT}`));

module.exports = app;
