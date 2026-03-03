#!/bin/bash
# ============================================================
# CoupleTimer – FTP Deployment (Fallback wenn kein SSH)
# Benötigt: lftp installiert  →  brew install lftp
# ============================================================
# Verwendung:
#   ./deploy-ftp.sh <FTP-USER> <FTP-PASSWORD> <FTP-HOST>
#
# FTP-Zugangsdaten in Hostinger hPanel:
#   hPanel → Hosting → FTP Accounts
# ============================================================

FTP_USER="${1:-}"
FTP_PASS="${2:-}"
FTP_HOST="${3:-coupletimer.site}"
REMOTE_DIR="/public_html"
LOCAL_DIST="./app/dist"

if [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
  echo "❌ Verwendung: ./deploy-ftp.sh <USER> <PASSWORD> [HOST]"
  exit 1
fi

# Sicherstellen dass lftp installiert ist
if ! command -v lftp &> /dev/null; then
  echo "📦 Installiere lftp..."
  brew install lftp
fi

echo "🔨 Baue Projekt..."
cd app
node_modules/.bin/tsc -b
node_modules/.bin/vite build
cd ..

echo ""
echo "📤 Upload via FTP nach $FTP_HOST$REMOTE_DIR..."

lftp -u "$FTP_USER","$FTP_PASS" ftp://"$FTP_HOST" <<EOF
set ssl:verify-certificate no
set ftp:ssl-allow yes
mirror --reverse --delete --verbose \
  --exclude='.DS_Store' \
  ${LOCAL_DIST}/ ${REMOTE_DIR}/
bye
EOF

echo ""
echo "✅ Upload abgeschlossen!"
echo "🌐 https://coupletimer.site"
