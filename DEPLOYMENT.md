# 🚀 CoupleTime – Deployment & Monetarisierung Guide

## 1. Live-Schaltung via Vercel (empfohlen)

### Voraussetzungen
- GitHub-Account
- Vercel-Account (kostenlos): https://vercel.com

### Schritte

```bash
# 1. Build testen
cd app
npm install
npm run build

# 2. Git-Repo initialisieren (falls noch nicht)
cd ..
git init
git add .
git commit -m "feat: initial release"

# 3. GitHub Remote setzen
git remote add origin https://github.com/DEIN-USER/zwiegespraech-app.git
git push -u origin main
```

### Vercel Setup
1. vercel.com → "New Project" → GitHub Repo importieren
2. Framework: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Root Directory: `app`
6. → Deploy

### Custom Domain (zwiegespraech.app)
1. Vercel → Project → Settings → Domains
2. Domain hinzufügen: `zwiegespraech.app`
3. DNS-Einträge bei Domain-Registrar setzen:
   - A Record: `76.76.21.21`
   - CNAME www: `cname.vercel-dns.com`

---

## 2. Google AdSense – Schritt-für-Schritt

### Voraussetzungen für Genehmigung
- ✅ Datenschutzseite vorhanden (`/#/privacy`)
- ✅ About-Seite vorhanden (`/#/about`)
- ✅ robots.txt vorhanden
- ✅ Sitemap vorhanden
- ✅ Echter Content (Methodenbeschreibung auf About-Seite)
- ⏳ **Mindestens 500-1000 organische Besucher/Monat** (AdSense-Anforderung)
- ⏳ Website muss mind. 3 Monate online sein

### Setup
1. https://adsense.google.com → Anmelden
2. Site hinzufügen: `zwiegespraech.app`
3. AdSense-Code in `index.html` einfügen (Zeile 47, auskommentierter Script-Tag)
4. Publisher-ID (ca-pub-XXXXXXXX) kopieren
5. In `src/components/AdBanner.tsx` eintragen:
   - `PUBLISHER_ID` → deine ca-pub-ID
   - `SLOT_ID` → deine Ad-Unit-ID (nach Erstellung im Dashboard)
6. In `index.html` den AdSense-Script auskommentieren

### AdSense Ad Unit erstellen
1. AdSense Dashboard → Anzeigen → Anzeigenblöcke → Neu
2. Typ: **Displayanzeige** (responsiv)
3. Stil: Automatisch
4. Speichern → Slot-ID kopieren → in AdBanner.tsx eintragen

### Strategische Platzierung (bereits implementiert)
- ✅ Auf der Startseite, zwischen Streak-Dashboard und Preset-Modi
- ❌ NIEMALS während aktiver Session (würde UX und Produktwert zerstören)
- ❌ Niemals auf der Session-Seite

### Erwartete Einnahmen (realistisch)
| Besucher/Monat | RPM (DE) | Einnahmen/Monat |
|---|---|---|
| 1.000 | €3–5 | €3–5 |
| 10.000 | €3–5 | €30–50 |
| 100.000 | €3–5 | €300–500 |

**Fazit:** AdSense allein wird kaum profitabel. Als Ergänzung sinnvoll, nicht als Hauptstrategie.

---

## 3. Alternative / Ergänzende Monetarisierung

### A) Ko-fi / Buy Me a Coffee (sofort umsetzbar)
```
https://ko-fi.com/zwiegespraech
```
Button auf About-Seite einfügen. Freiwillige Unterstützung, typisch €3-5/Unterstützer.

### B) Affiliate Links (passiv)
Auf der About-Seite und nach Sessions strategisch platzieren:
- Amazon: "Das Zwiegespräch" von M. L. Moeller (Affiliate-Link)
- Online-Therapie-Plattformen (Meindingsgesundheit, Instahelp): €20-50 CPA
- Paartherapie-Apps (Lasting, Paired): bis zu €30 CPA

### C) Freemium (mittelfristig, 3-6 Monate)
Stripe oder Paddle einbauen:
- **Kostenlos:** 3 Preset-Modi, 1 Custom-Modus
- **Unterstützer €2,99/Monat:** Unbegrenzte Custom-Modi, Statistiken, Export

---

## 4. Marketing-Strategie

### SEO (Organic – wichtigste Säule)

**Target Keywords:**
- "Zwiegespräch Timer" (low competition, high intent)
- "Zwiegespräch App" 
- "Paargespräch Timer"
- "Paar Kommunikation App kostenlos"
- "Zwiegespräch Methode"

**Content-Strategie (auf About-Seite / Blog):**
- "Was ist das Zwiegespräch?" ✅ (bereits implementiert)
- "Zwiegespräch Regeln – Schritt-für-Schritt"
- "Wie oft sollte man ein Zwiegespräch führen?"
- "Zwiegespräch Alternativen"

**Technisches SEO:**
- ✅ Meta-Tags optimiert
- ✅ Structured Data (Schema.org WebApplication)
- ✅ robots.txt
- ✅ sitemap.xml
- ✅ PWA Manifest (installierbar)
- ✅ OG-Tags für Social Sharing

### Social Media

**Instagram / TikTok (primär):**
- Zielgruppe: Paare 25-45, DE/AT/CH
- Content-Ideen:
  - "Wir haben unser erstes Zwiegespräch geführt – so war es 💬"
  - "Die 1 Gewohnheit, die unsere Beziehung verändert hat"
  - Timer-Timelapse während einer Session
  - "5 Minuten Zwiegespräch vs. 5 Minuten Handy scrollen"
- Hashtags: #Zwiegespräch #Paarkommunikation #Beziehung #Achtsamkeit #Paartherapie

**Reddit:**
- r/Beziehungen (DE)
- r/relationship_advice (EN – "We built a free couples timer based on Zwiegespräch method")
- r/selfimprovement
- Organisch teilen, KEIN Spam

**Pinterest:**
- Infografiken zu Zwiegespräch-Regeln
- "Zwiegespräch in 5 Schritten" Pin
- Link direkt zur App

### Partnerschaften
- Paartherapeuten-Newsletter / Blogs (Gastbeiträge)
- Podcast "Beziehungsweise" – Erwähnung
- Familienbildungsstätten (offline → QR-Code zur App)
- Kirche / Ehe-Vorbereitungskurse (große Zielgruppe!)

### Launch-Strategie (Woche 1)
1. Product Hunt Launch (EN): "Free Couples Communication Timer"
2. Hacker News "Show HN": "Show HN: We built a free Zwiegespräch timer for couples"
3. Reddit organic post
4. Twitter/X thread: "We built a free couples timer. Here's why..."
5. BetaList eintragen

---

## 5. PWA – App-Store Alternative

Die App ist bereits als PWA konfiguriert. Nutzer können sie auf dem Homescreen installieren:

**iOS:** Safari → Teilen → "Zum Home-Bildschirm"
**Android:** Chrome → Menü → "App installieren"

Für echten App Store:
- **Capacitor.js** (Ionic): Web → Native iOS/Android
- App Store Gebühr: €99/Jahr (Apple), €25 einmalig (Google)

---

## 6. Analytics (ohne Cookie-Banner)

Statt Google Analytics (DSGVO-problematisch):

```bash
# Plausible Analytics (datenschutzkonform, kein Cookie-Banner nötig)
# https://plausible.io – €9/Monat oder self-hosted
```

In `index.html` nach AdSense:
```html
<script defer data-domain="zwiegespraech.app" src="https://plausible.io/js/script.js"></script>
```

---

## Checkliste vor Launch

- [ ] `npm run build` erfolgreich
- [ ] `dist/` auf Vercel deployed
- [ ] Custom Domain eingerichtet + SSL aktiv
- [ ] Google Search Console → Site anmelden + Sitemap einreichen
- [ ] Datenschutzseite erreichbar (`/#/privacy`)
- [ ] About-Seite erreichbar (`/#/about`)
- [ ] OG-Image erstellt und unter `/public/og-image.png` gespeichert (1200×630px)
- [ ] Favicon erstellt (`/public/favicon.svg`)
- [ ] Icons für PWA erstellt (`icon-192.png`, `icon-512.png`)
- [ ] AdSense-Antrag gestellt (nach erster Traffic-Phase)
- [ ] Ko-fi Seite erstellt + Link auf About-Seite
