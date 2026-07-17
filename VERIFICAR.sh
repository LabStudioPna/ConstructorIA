#!/bin/bash

echo "✅ VERIFICACIÓN DE ARCHIVOS CONSTRUCTORIA"
echo "════════════════════════════════════════════════════"
echo ""

FOLDER="."
echo "📁 Carpeta: $FOLDER"
echo ""

# HTML - Frontend
echo "🌐 HTML (Frontend):"
for file in index.html agente.html agente-v1.0.html agente-v2.0.html agente-v3.0.html roadmap.html; do
  if [ -f "$file" ]; then
    size=$(ls -lh "$file" | awk '{print $5}')
    echo "  ✅ $file ($size)"
  else
    echo "  ❌ $file (FALTA)"
  fi
done
echo ""

# Backend
echo "🔧 Backend:"
for file in server.js package.json database-schema.sql migrations-init.sql Dockerfile docker-compose.yml .env.example setup.sh; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (FALTA)"
  fi
done
echo ""

# CSS & Assets
echo "🎨 CSS & Assets:"
for file in style-global.css svg-icons-template.svg; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ⚠️  $file (FALTA - generar si no existe)"
  fi
done
echo ""

# Workflows
echo "⚙️  Workflows & Integrations:"
for file in n8n-workflows.md workflow-welcome-email.js analyze-plan.js renderers.js vision-photo.js ml-predictor.js suppliers-integration.js; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ⚠️  $file"
  fi
done
echo ""

# Docs (sample)
echo "📚 Documentación (.md):"
md_count=$(ls -1 *.md 2>/dev/null | wc -l)
echo "  ✅ Total archivos .md: $md_count"
for file in README.md CHANGELOG.md ICON-SYSTEM.md DEPLOYMENT_GUIDE.md; do
  if [ -f "$file" ]; then
    echo "     ✅ $file"
  fi
done
echo ""

# Check for BAD folders
echo "🚨 Verificar carpetas anidadas (NO deben existir):"
if [ -d "src" ] || [ -d "docs" ] || [ -d "templates" ]; then
  echo "  ❌ ENCONTRADAS CARPETAS - ELIMINAR:"
  find . -maxdepth 1 -type d ! -name "." -exec echo "     {} " \;
else
  echo "  ✅ Sin carpetas anidadas (correcto)"
fi
echo ""

# Summary
total_files=$(find . -maxdepth 1 -type f | wc -l)
echo "════════════════════════════════════════════════════"
echo "📊 RESUMEN:"
echo "  Total archivos en raíz: $total_files"
echo "  Carpetas anidadas: $(find . -maxdepth 1 -type d ! -name "." | wc -l) (debe ser 0)"
echo ""
echo "✅ LISTO para subir a GitHub: $([ $total_files -gt 20 ] && echo 'SÍ' || echo 'NO - Faltan archivos')"
echo "════════════════════════════════════════════════════"
