# 🚀 CoupleTimer – Hostinger Deployment Guide
**Domain:** coupletimer.site  
**AdSense:** ca-pub-1712273263687132  
**Status:** ✅ Build ready in `app/dist/`

---

## Problem: Domain parkt noch auf DNS-Parking-Server

Die Domain zeigt aktuell auf `NS1.DNS-PARKING.COM` → App nicht erreichbar.  
**Lösung:** Hostinger Hosting aktivieren → Nameserver wechseln automatisch.

---

## Schritt 1: Hosting in Hostinger aktivieren

1. Login: https://hpanel.hostinger.com
2. **Hosting** → **Manage** → Domain `coupletimer.site` auswählen
3. Falls noch kein Hosting-Plan: **"Start Now"** → Plan wählen (Premium/Business)
4. Hostinger setzt Nameserver automatisch auf eigene NS (z.B. `ns1.hostinger.com`)
5. DNS-Propagierung: **24–48 Stunden** ⏳

---

## Schritt 2: SSH aktivieren

In Hostinger hPanel:
1. **Hosting** → **Advanced** → **SSH Access**
2. SSH aktivieren + Passwort setzen
3. Zugangsdaten notieren:
   - Host: z.B. `srv1234.hostinger.com` (steht in hPanel)  
   - User: z.B. `u123456789`
   - Port: `65002`

---

## Schritt 3: Deployen

### Option A – SSH/rsync (empfohlen, schnellste Methode)

```bash
cd /Users/benjaminpoersch/Projects/WEB/coupleTime

./deploy-hostinger.sh u123456789 srv1234.hostinger.com
```

Das Script baut automatisch und deployed alles via rsync.

---

### Option B – FTP (kein SSH nötig)

In hPanel → **FTP Accounts** → Credentials kopieren:

```bash
cd /Users/benjaminpoersch/Projects/WEB/coupleTime

./deploy-ftp.sh u123456789 DEIN-FTP-PASSWORT ftp.coupletimer.site
```

---

### Option C – File Manager (manuell, kein Terminal)

1. hPanel → **File Manager**
2. Zum Ordner `/public_html/` navigieren
3. **Upload** → alle Dateien aus `app/dist/` hochladen
4. Sicherstellen: `.htaccess` ist dabei (versteckte Datei!)

Dateien die hochgeladen werden müssen:
```
app/dist/
├── .htaccess          ← WICHTIG für SPA-Routing
├── index.html
├── ads.txt            ← WICHTIG für AdSense
├── robots.txt
├── sitemap.xml
├── manifest.json
├── favicon.svg
└── assets/
    ├── index-*.js
    └── index-*.css
```

---

### Option D – GitHub Actions (automatisch bei jedem Push)

1. GitHub Repo erstellen: https://github.com/new
2. Code pushen:
```bash
cd /Users/benjaminpoersch/Projects/WEB/coupleTime
git init
git add .
git commit -m "feat: initial release coupletimer.site"
git remote add origin https://github.com/DEIN-USER/coupletimer.git
git push -u origin main
```

3. GitHub → Repository → **Settings** → **Secrets and variables** → **Actions**:
   - `HOSTINGER_SSH_HOST` = `srv1234.hostinger.com`
   - `HOSTINGER_SSH_USER` = `u123456789`  
   - `HOSTINGER_SSH_KEY` = Inhalt von `~/.ssh/id_ed25519` (privater Key)

4. Bei jedem `git push main` → automatisches Deploy ✅

---

## Schritt 4: Nach dem Deployment prüfen

```bash
# Domain erreichbar?
curl -I https://coupletimer.site

# ads.txt korrekt?
curl https://coupletimer.site/ads.txt
# Erwartete Ausgabe: google.com, pub-1712273263687132, DIRECT, f08c47fec0942fa0

# AdSense Meta-Tag?
curl -s https://coupletimer.site | grep "ca-pub"

# SPA-Routing funktioniert?
curl -I https://coupletimer.site/irgendwas  # muss 200 zurückgeben, nicht 404
```

---

## Schritt 5: Google AdSense Setup

### 5a – Site bei AdSense anmelden
1. https://adsense.google.com
2. **Sites** → **+ Site** → `coupletimer.site` eingeben
3. AdSense verifiziert die Site über:
   - ✅ Meta-Tag `ca-pub-1712273263687132` (bereits in index.html)
   - ✅ ads.txt (bereits deployed)

### 5b – Ad Units erstellen (nach Site-Genehmigung)
1. AdSense → **Ads** → **Ad units** → **+ New ad unit**
2. Typ: **Display ads** (Responsive)
3. Speichern → **Slot-ID** kopieren (z.B. `9876543210`)
4. In `app/src/components/AdBanner.tsx` eintragen:
   ```typescript
   const SLOT_ID = "9876543210"; // ← deine Slot-ID hier
   ```
5. Neu builden + deployen:
   ```bash
   cd app && node_modules/.bin/vite build
   cd .. && ./deploy-hostinger.sh u123456789 srv1234.hostinger.com
   ```

### AdSense Genehmigung
- Typische Wartezeit: **2–4 Wochen**
- Anforderungen:
  - ✅ Datenschutzseite: `coupletimer.site/#/privacy`
  - ✅ About-Seite mit echtem Content: `coupletimer.site/#/about`
  - ✅ ads.txt korrekt
  - ✅ Meta-Tag gesetzt
  - ⏳ Etwas organischer Traffic (mindestens einige 100 Besucher)

---

## DNS-Status prüfen

```
https://www.whatsmydns.net/#A/coupletimer.site
```

Grün = propagiert, App erreichbar.

---

## SSL/HTTPS

Hostinger aktiviert **Let's Encrypt SSL automatisch** sobald Domain propagiert ist.  
hPanel → **SSL** → Auto-SSL aktivieren (falls nicht automatisch).
