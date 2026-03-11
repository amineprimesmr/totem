#!/bin/bash
# À lancer à la racine du projet : npm run setup:all
# Prérequis : Docker Desktop (version Apple Silicon) installé et ouvert

set -e
cd "$(dirname "$0")/.."

echo "→ Vérification de Docker..."
if ! command -v docker &> /dev/null; then
  echo "❌ Docker n'est pas trouvé. Installe la version Apple Silicon :"
  echo "   https://desktop.docker.com/mac/main/arm64/Docker.dmg"
  echo "   Puis ouvre Docker Desktop et relance ce script."
  exit 1
fi

echo "→ Démarrage de PostgreSQL (Docker)..."
docker compose up -d

echo "→ Attente du démarrage de la base (10 s)..."
sleep 10

echo "→ Application du schéma (db:push)..."
npm run db:push

echo "→ Création des données initiales (admin + templates)..."
npm run db:seed

echo ""
echo "✅ Base prête. Lance l'app dans 2 terminaux :"
echo "   Terminal 1 : npm run dev:api"
echo "   Terminal 2 : npm run dev:web"
echo ""
echo "   Frontend : http://localhost:3000"
echo "   API      : http://localhost:4000/api"
echo "   Connexion test : admin@totem.fr / admin123"
