#!/bin/bash

# --- CONFIGURATION ---
SERVER_USER="ptdradmin"
SERVER_IP="195.154.30.15" 
SERVER_PATH="~/life-switch"

echo "🚀 Démarrage du déploiement de Life Switch..."

# 1. Build de l'application
echo "📦 Compilation de l'application (npm run build)..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build réussi !"
else
    echo "❌ Erreur lors du build. Déploiement annulé."
    exit 1
fi

# 2. Transfert des fichiers vers le serveur
echo "⬆️ Transfert des fichiers vers WindRiver ($SERVER_PATH)..."
# On envoie le dossier dist entier vers le serveur
scp -r ./dist $SERVER_USER@$SERVER_IP:$SERVER_PATH/

if [ $? -eq 0 ]; then
    echo "🎉 Déploiement terminé avec succès !"
    echo "🔗 Votre app est disponible sur votre serveur."
    echo "💡 N'oubliez pas de redémarrer Nginx si c'est la première fois : 'service nginx restart'"
else
    echo "❌ Erreur lors du transfert SSH."
    exit 1
fi
