#!/bin/bash
# LIMPIEZA TOTAL del repo GitHub — Reset a cero

set -e

echo "🧹 LIMPIEZA TOTAL ConstructorIA"
echo "════════════════════════════════════════"

REPO="https://github.com/LabStudioPna/ConstructorIA.git"
TEMP_DIR="/tmp/ConstructorIA_clean_$$"

echo "📥 Clonando repo..."
git clone $REPO $TEMP_DIR
cd $TEMP_DIR

echo "🔄 Cambiando a rama main..."
git checkout main

echo "🗑️  PASO 1: Eliminar TODOS los archivos"
git rm -r . || true

echo "✅ Commit: 'Clean slate'"
git commit --allow-empty -m "Clean slate — preparar para archivos v0.1-v3.0"

echo "🚀 Push a GitHub..."
git push origin main

echo "════════════════════════════════════════"
echo "✅ COMPLETADO: Repo limpio"
echo ""
echo "📂 Carpeta temporal: $TEMP_DIR"
echo "   (Puedes eliminarla luego)"
echo ""
echo "🔗 Repo: https://github.com/LabStudioPna/ConstructorIA"
echo ""
echo "PRÓXIMO: Copia TODOS los archivos de la carpeta local → GitHub"
