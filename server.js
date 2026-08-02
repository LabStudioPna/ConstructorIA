/**
 * ============================================
 * CONSTRUCTORIA - SERVIDOR DEMO (sin Mongo/Redis)
 * ============================================
 * Misma API que la versión production (docker-compose),
 * pero con almacenamiento en memoria para poder probar
 * el flujo completo sin infraestructura externa.
 *
 * Para pasar a producción: reemplazar los Maps por
 * Mongoose models y el setTimeout del worker por un
 * Bull Queue real (ver CONSTRUCTORIA_GUIDE.md).
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = 'demo-secret-cambiar-en-produccion';
const PORT = 3000;

// ============================================
// "BASE DE DATOS" EN MEMORIA
// ============================================
const users = new Map();      // email -> user
const usersById = new Map();  // id -> user
const renders = new Map();    // id -> render

// ============================================
// APP
// ============================================
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());

// ============================================
// WEBSOCKET
// ============================================
const wss = new WebSocketServer({ server, path: '/ws' });
const clientsByUser = new Map(); // userId -> [ws, ws...]

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    if (!clientsByUser.has(userId)) clientsByUser.set(userId, []);
    clientsByUser.get(userId).push(ws);
    console.log(`✅ WS conectado: usuario ${userId}`);

    ws.on('close', () => {
      const list = clientsByUser.get(userId) || [];
      clientsByUser.set(userId, list.filter((c) => c !== ws));
    });
  } catch (err) {
    ws.close(1008, 'Token inválido');
  }
});

function pushToUser(userId, payload) {
  const list = clientsByUser.get(userId) || [];
  list.forEach((ws) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
  });
}

// ============================================
// AUTH MIDDLEWARE
// ============================================
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  try {
    const decoded = jwt.verify(header.substring(7), JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ============================================
// GENERADOR DE IMÁGENES "IA" (mock)
// ============================================
// Genera un SVG placeholder representando el render,
// para simular lo que devolvería FAL.ai / MNML.ai
function generateMockImage(prompt, style) {
  const palettes = {
    modern: ['#8A5A2B', '#C87D2F', '#FAF8F5'],
    minimalist: ['#241B12', '#6E5F4B', '#FFFFFF'],
    contemporary: ['#2B2118', '#E09A4F', '#F1ECE4'],
    luxury: ['#171208', '#C87D2F', '#F1ECE4'],
  };
  const [c1, c2, bg] = palettes[style] || palettes.modern;
  const label = prompt.length > 60 ? prompt.slice(0, 60) + '…' : prompt;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${c2}" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#sky)"/>
  <rect x="150" y="260" width="500" height="280" fill="${c1}" opacity="0.85" rx="6"/>
  <rect x="150" y="260" width="500" height="40" fill="${c2}"/>
  <rect x="230" y="340" width="90" height="120" fill="${bg}" opacity="0.9"/>
  <rect x="360" y="340" width="90" height="120" fill="${bg}" opacity="0.9"/>
  <rect x="490" y="340" width="90" height="120" fill="${bg}" opacity="0.9"/>
  <polygon points="150,260 400,150 650,260" fill="${c2}"/>
  <circle cx="700" cy="100" r="35" fill="#F2C572" opacity="0.9"/>
  <text x="400" y="580" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="${c1}">
    ${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}
  </text>
  <text x="400" y="30" text-anchor="middle" font-family="sans-serif" font-size="12" fill="${c1}" opacity="0.6">
    Render generado · estilo ${style}
  </text>
</svg>`.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// ============================================
// RUTAS: HEALTH
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'demo-in-memory', timestamp: new Date().toISOString() });
});

// ============================================
// RUTAS: USUARIOS
// ============================================
app.post('/api/users/signup', async (req, res) => {
  const { email, password, name, whatsappNumber } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password y name son requeridos' });
  }
  if (users.has(email.toLowerCase())) {
    return res.status(409).json({ error: 'Email ya registrado' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const user = {
    id,
    email: email.toLowerCase(),
    password: hashedPassword,
    name,
    whatsappNumber: whatsappNumber || null,
    credits: 5,
    subscription: 'free',
    createdAt: new Date().toISOString(),
  };

  users.set(user.email, user);
  usersById.set(id, user);

  const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
  console.log(`✅ Usuario creado: ${email}`);

  res.status(201).json({ id, token, name, email: user.email, credits: user.credits });
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.get((email || '').toLowerCase());

  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  console.log(`✅ Login: ${email}`);

  res.json({ id: user.id, token, name: user.name, email: user.email, credits: user.credits });
});

app.get('/api/users/profile', auth, (req, res) => {
  const user = usersById.get(req.userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { password, ...publicUser } = user;
  res.json(publicUser);
});

app.put('/api/users/profile', auth, (req, res) => {
  const user = usersById.get(req.userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  Object.assign(user, req.body, { id: user.id, email: user.email, password: user.password });
  const { password, ...publicUser } = user;
  res.json(publicUser);
});

// ============================================
// RUTAS: RENDERS
// ============================================
app.post('/api/renders', auth, (req, res) => {
  const { prompt, title, style, aiModel } = req.body;
  const user = usersById.get(req.userId);

  if (!prompt) return res.status(400).json({ error: 'Prompt es requerido' });
  if (user.credits <= 0) {
    return res.status(402).json({ error: 'Créditos insuficientes', code: 'INSUFFICIENT_CREDITS' });
  }

  const id = uuidv4();
  const render = {
    id,
    userId: user.id,
    prompt,
    title: title || 'Render sin título',
    style: style || 'modern',
    aiModel: aiModel || 'flux',
    status: 'pending',
    imageUrl: null,
    error: null,
    createdAt: new Date().toISOString(),
  };
  renders.set(id, render);
  user.credits -= 1;

  console.log(`📥 Render creado: ${id} - "${prompt.slice(0, 40)}..."`);

  res.status(201).json({
    id,
    status: 'pending',
    creditsRemaining: user.credits,
    message: 'Render en cola de procesamiento',
  });

  // ============================================
  // SIMULACIÓN DEL WORKER (Bull en producción)
  // ============================================
  setTimeout(() => {
    render.status = 'processing';
    pushToUser(user.id, {
      type: 'render:update',
      data: { renderId: id, status: 'processing' },
    });
    console.log(`⚙️  Procesando: ${id}`);

    setTimeout(() => {
      try {
        const imageUrl = generateMockImage(render.prompt, render.style);
        render.status = 'completed';
        render.imageUrl = imageUrl;
        render.completedAt = new Date().toISOString();

        pushToUser(user.id, {
          type: 'render:update',
          data: { renderId: id, status: 'completed', imageUrl },
        });
        console.log(`✅ Completado: ${id}`);
      } catch (err) {
        render.status = 'failed';
        render.error = err.message;
        pushToUser(user.id, {
          type: 'render:update',
          data: { renderId: id, status: 'failed', error: err.message },
        });
      }
    }, 3000);
  }, 1500);
});

app.get('/api/renders', auth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const userRenders = Array.from(renders.values())
    .filter((r) => r.userId === req.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const start = (page - 1) * limit;
  const paginated = userRenders.slice(start, start + limit);

  res.json({
    success: true,
    data: paginated,
    pagination: {
      page,
      limit,
      total: userRenders.length,
      pages: Math.ceil(userRenders.length / limit),
    },
  });
});

app.get('/api/renders/stats/summary', auth, (req, res) => {
  const userRenders = Array.from(renders.values()).filter((r) => r.userId === req.userId);
  res.json({
    success: true,
    data: {
      total: userRenders.length,
      completed: userRenders.filter((r) => r.status === 'completed').length,
      processing: userRenders.filter((r) => r.status === 'processing' || r.status === 'pending').length,
      failed: userRenders.filter((r) => r.status === 'failed').length,
    },
  });
});

app.get('/api/renders/:id', auth, (req, res) => {
  const render = renders.get(req.params.id);
  if (!render || render.userId !== req.userId) {
    return res.status(404).json({ error: 'Render no encontrado' });
  }
  res.json({ success: true, data: render });
});

app.delete('/api/renders/:id', auth, (req, res) => {
  const render = renders.get(req.params.id);
  if (!render || render.userId !== req.userId) {
    return res.status(404).json({ error: 'Render no encontrado' });
  }
  renders.delete(req.params.id);
  res.json({ success: true, message: 'Render eliminado' });
});

// ============================================
// START
// ============================================
server.listen(PORT, () => {
  console.log(`🚀 Constructoria DEMO server en http://localhost:${PORT}`);
  console.log(`📡 WebSocket en ws://localhost:${PORT}/ws`);
  console.log(`ℹ️  Modo: en memoria (sin Mongo/Redis) - reinicia y se borra todo`);
});
