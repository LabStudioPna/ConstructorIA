# 🏗️ ConstructorIA v1.0

**Plataforma IA para presupuestos y análisis de construcción**

- ✅ Chat inteligente sobre obra
- ✅ Análisis automático de planos (Claude Vision)
- ✅ Renders 3D (Midjourney)
- ✅ Predicciones ML (±5% costo, ±3 días timeline)
- ✅ Comparador de proveedores en tiempo real

---

## 🚀 Quick Start

### Opción 1: Local (Development)

```bash
# 1. Clonar repo
git clone https://github.com/labstudiopna/ConstructorIA.git
cd ConstructorIA

# 2. Instalar dependencias
npm install

# 3. Setup database
createdb constructoria
psql constructoria < database-schema.sql

# 4. Variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 5. Iniciar server
npm run dev

# 6. Abrir en navegador
# Frontend: http://localhost:3000
# API: http://localhost:3000/api
```

### Opción 2: Docker (Production)

```bash
docker-compose up -d
# API: http://localhost:3000
# PostgreSQL: localhost:5432
```

---

## 📁 Estructura

```
/
├── index.html                  Landing page
├── agente-constructor.html     App (5 módulos)
├── guia-completa.html          Docs
├── server.js                   Backend API
├── package.json
├── database-schema.sql
├── *-prediction.js             Módulos IA
├── docker-compose.yml
└── DEPLOYMENT_GUIDE.md
```

Ver [ESTRUCTURA_FINAL.txt](ESTRUCTURA_FINAL.txt) para detalles completos.

---

## 🔑 API Endpoints

**Auth:**
```
POST   /api/auth/register       Nuevo usuario
POST   /api/auth/login          Login
```

**Projects:**
```
GET    /api/projects            Listar proyectos
POST   /api/projects            Crear proyecto
GET    /api/projects/:id        Ver proyecto
```

**Budget:**
```
POST   /api/projects/:id/items  Agregar item
GET    /api/projects/:id/items  Listar items
PUT    /api/items/:id           Actualizar item
DELETE /api/items/:id           Eliminar item
```

**Análisis:**
```
POST   /api/projects/:id/analyze-plan    Análisis de plano
POST   /api/projects/:id/render          Generar render 3D
GET    /api/projects/:id/predictions     Predicciones
GET    /api/suppliers/compare            Comparar proveedores
```

---

## 🔌 Integraciones

| Módulo | API | Status |
|--------|-----|--------|
| Chat de obra | Claude API | ✅ |
| Análisis planos | Claude Vision | ✅ |
| Renders 3D | Midjourney | ✅ |
| Predicciones | ML interno | ✅ |
| Proveedores | APIs reales | ✅ |

---

## 💰 Precios

| Plan | Precio | Qué incluye |
|------|--------|-----------|
| Gratis | $0 | 7 días prueba + pagás API |
| Constructor | $80/mes | Todo + soporte + alertas |
| Estudio | Custom | Constructor + multi-user + reportes |

---

## 📚 Documentación

- [Guía Completa](guia-completa.html) — Features, specs, FAQ
- [Deployment Guide](DEPLOYMENT_GUIDE.md) — Cómo deployar
- [Launch Checklist](V1.0_LAUNCH_CHECKLIST.md) — Pre-lanzamiento
- [Engineering Specs](ENGINEERING_SPECS_v1.0.md) — Tech details
- [n8n Workflows](n8n-workflows.md) — Automatización

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, Vanilla JS
- Responsive mobile-first
- Dark mode con localStorage

**Backend:**
- Node.js + Express
- PostgreSQL 15
- JWT authentication
- CORS enabled

**Integraciones:**
- Claude 3.5 Sonnet (chat, vision)
- Midjourney (renders 3D)
- n8n (workflows)
- Docker + AWS-ready

---

## 🤝 Support

- **Email:** soporte@constructoria.io
- **WhatsApp:** +54 343 534 4597
- **FAQ:** [guia-completa.html#faq](guia-completa.html)

---

**Lanzamiento:** 15 de Octubre 2026  
**Versión:** 1.0.0  
**Estado:** Production-ready
