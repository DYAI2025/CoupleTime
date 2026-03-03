#!/bin/bash
# ============================================================
# CoupleTimer – Hostinger Deployment Script
# Domain: coupletimer.site
# ============================================================
# Verwendung:
#   chmod +x deploy-hostinger.sh
#   ./deploy-hostinger.sh <SSH-USER> <SSH-HOST>
#
# Beispiel:
#   ./deploy-hostinger.sh u123456789 srv123.niagahoster.com
#
# SSH-User + Host findest du in Hostinger hPanel:
#   hPanel → Hosting → SSH Access → Details
# ============================================================

set -e

SSH_USER="${1:-}"
SSH_HOST="${2:-coupletimer.site}"
REMOTE_PATH="/home/${SSH_USER}/public_html"
LOCAL_DIST="./app/dist"

if [ -z "$SSH_USER" ]; then
  echo "❌ Fehler: SSH-User fehlt"
  echo "   Verwendung: ./deploy-hostinger.sh u123456789 srv123.niagahoster.com"
  echo ""
  echo "   SSH-Zugangsdaten findest du in Hostinger hPanel:"
  echo "   hPanel → Hosting → SSH Access"
  exit 1
fi

echo "🔨 Baue Projekt..."
cd app
node_modules/.bin/tsc -b
node_modules/.bin/vite build
cd ..

echo ""
echo "📦 Deploye auf Hostinger..."
echo "   User: $SSH_USER"
echo "   Host: $SSH_HOST"
echo "   Pfad: $REMOTE_PATH"
echo ""

# Upload via rsync über SSH
rsync -avz --delete \
  --exclude='.DS_Store' \
  -e "ssh -p 65002 -o StrictHostKeyChecking=accept-new" \
  "${LOCAL_DIST}/" \
  "${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/"

echo ""
echo "✅ Deployment abgeschlossen!"
echo ""
echo "🌐 Prüfe: https://coupletimer.site"
echo "📢 ads.txt: https://coupletimer.site/ads.txt"
echo "🔒 Privacy: https://coupletimer.site/#/privacy"
echo ""
echo "⚠️  Hinweis: DNS-Propagierung kann 24-48h dauern"
echo "   Status prüfen: https://www.whatsmydns.net/#A/coupletimer.site"
