# 🚀 INSTRUCCIONES — Setup ConstructorIA (v0.1 a v3.0)

**Estado:** Carpeta LOCAL limpia ✓ | GitHub limpio ✓ | Archivos listos ✓

---

## 📋 PASOS

### Paso 1: Limpiar GitHub (OPCIONAL - si quieres reset total)
```bash
bash CLEAN-GITHUB.sh
# O manualmente:
# 1. Abre el repo en GitHub
# 2. Settings → Danger Zone → Delete Repository
# 3. Recrea repo vacío o usa CLEAN-GITHUB.sh
```

---

### Paso 2: Copiar TODOS los archivos desde LOCAL → GitHub

**Asegúrate que estos archivos estén en la carpeta LOCAL (C:\Users\Luciano-PC\Downloads\LABStudio-Apps\ConstructorIA\):**

✅ **HTML (Frontend)**
- `index.html` — Landing page
- `agente.html` — v0.1 MVP
- `agente-v1.0.html` — v1.0 Production
- `agente-v2.0.html` — v2.0 Advanced Analytics
- `agente-v3.0.html` — v3.0 Ecosystem
- `roadmap.html` — Timeline visual

✅ **CSS & Assets**
- `style-global.css` — Estilos compartidos
- `svg-icons-template.svg` — Iconografía LABStudio

✅ **Backend & Database**
- `server.js` — Node.js API (Express)
- `package.json` — Dependencies
- `database-schema.sql` — PostgreSQL schema
- `migrations-init.sql` — Sample data

✅ **DevOps & Config**
- `Dockerfile` — Container config
- `docker-compose.yml` — Orchestration
- `.env.example` — Environment template
- `setup.sh` — Installation script

✅ **Workflows & Integrations**
- `n8n-workflows.md` — n8n automation specs
- `workflow-welcome-email.js` — Welcome workflow
- `analyze-plan.js` — Claude Vision integration
- `renderers.js` — Midjourney 3D renders
- `vision-photo.js` — Photo analysis
- `ml-predictor.js` — ML cost predictions
- `suppliers-integration.js` — 5-supplier sync

✅ **Documentation (TODOS los .md)**
- `README.md`
- `CHANGELOG.md`
- `ICON-SYSTEM.md`
- `ASSETS-GUIDE.md`
- `DEPLOYMENT_GUIDE.md`
- `ENGINEERING_SPECS_v1.0.md`
- `IMPLEMENTATION_ROADMAP.md`
- `SPECS_v0.2_PLANOS_Y_RENDERS.md`
- `SPECS_v0.3_VISION_ML_SUPPLIERS.md`
- `SPECS_v1.0_LAUNCH.md`
- `SPECS_v2.0_ADVANCED_FEATURES.md`
- `SPECS_v2.1_RESOURCE_PLANNING.md`
- `SPECS_v2.2_QUALITY_COMPLIANCE.md`
- `SPECS_v3.0_ECOSYSTEM.md`
- `V0.2_RELEASE_NOTES.md`
- `V0.3_RELEASE_NOTES.md`
- `V1.0_RELEASE_NOTES.md`
- `V1.0_LAUNCH_CHECKLIST.md`
- `V2.0_RELEASE_NOTES.md`
- `V2.1_RELEASE_NOTES.md`
- `V2.2_RELEASE_NOTES.md`
- `V3.0_RELEASE_NOTES.md`
- `MARKETING_LAUNCH_PLAN.md`
- `PRICING_PAGE_CONTENT.md`
- `ROADMAP_2027_AND_BEYOND.md`

---

### Paso 3: Subir a GitHub

```bash
cd /path/to/ConstructorIA/

# Verificar que NO hay carpetas (solo archivos en raíz)
ls -la | grep "^d" # No debe mostrar src/, docs/, templates/

# Git commands
git clone https://github.com/LabStudioPna/ConstructorIA.git temp-repo
cd temp-repo

# Copiar TODOS los archivos
cp -v /path/to/local/archivos/* .

# Verificar
git status # Debe mostrar ~50+ archivos sin carpetas

# Commit & Push
git add .
git commit -m "Initial: v0.1-v3.0 complete + backend + docs + workflows"
git push origin main
```

---

### Paso 4: Verificar en GitHub Pages (2-3 min después)

```
https://labstudiopna.github.io/ConstructorIA/
```

Debe ver:
- ✅ Página con estilos (CSS funciona)
- ✅ Links funcionando (a agente.html, agente-v1.0.html, etc)
- ✅ Chat IA cargando
- ✅ Calculadora lista
- ✅ Acceso a todas las versiones

---

## 🎯 Orden Correcto de Archivos

**IMPORTANTE:** Los archivos deben estar en RAÍZ, sin carpetas.

```
ConstructorIA/
├── index.html ✓
├── agente.html ✓
├── agente-v1.0.html ✓
├── agente-v2.0.html ✓
├── agente-v3.0.html (falta)
├── roadmap.html ✓
├── style-global.css
├── svg-icons-template.svg
├── server.js
├── package.json
├── database-schema.sql
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── [40+ archivos .md en raíz]
├── [y archivos .js, .sql]
│
└── ❌ SIN carpetas: src/, docs/, templates/
```

---

## ⚠️ QUÉ NO HACER

❌ Crear carpetas como `src/`, `docs/`, `templates/`
❌ Organizar archivos en subcarpetas
❌ Mezclar archivos local + GitHub (subir una vez)
❌ Copiar solo algunos archivos

---

## ✅ RESULTADO ESPERADO

Después de subir:
- 🌐 https://labstudiopna.github.io/ConstructorIA/ funciona 100%
- 📁 Repo limpio, sin carpetas anidadas
- 📚 Toda la documentación disponible
- 🚀 v0.1-v3.0 accesibles
- 💻 Backend listo para desplegar

---

**Última actualización:** 2026-07-17
**Status:** Listo para deployment ✅
