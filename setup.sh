#!/bin/bash
echo "🚀 ConstructorIA Setup"
echo "====================="
echo ""
echo "1. Instalando dependencias..."
npm install
echo ""
echo "2. Iniciando servicios Docker..."
docker-compose up -d
echo ""
echo "3. Setup completado ✅"
echo ""
echo "API: http://localhost:3000"
echo "DB: localhost:5432"
echo ""
echo "Ver logs: docker-compose logs -f"
