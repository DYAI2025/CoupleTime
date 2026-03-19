# AdSense Pre-Flight Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 7 FAIL items from the AdSense pre-flight audit so the site passes Google AdSense review.

**Architecture:** Four independent features — cookie consent with Google Consent Mode v2 (controls AdSense loading), Impressum legal page, `<noscript>` crawler content, and footer link updates. Consent is the most complex: a banner component stores consent in localStorage, and AdSense script loading is deferred until consent is granted.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, localStorage for consent persistence. No external cookie consent libraries — custom component matches existing design system.

---

## Task 1: Cookie Consent Banner — Consent Storage Hook

**Files:**
- Create: `app/src/hooks/useConsent.ts`
- Test: `app/src/hooks/__tests__/useConsent.test.ts`

**Step 1: Write the failing test**

```typescript
// app/src/hooks/__tests__/useConsent.test.ts
import { renderHook, act } from "@testing-library/react";
import { useConsent } from "../useConsent";

beforeEach(() => localStorage.clear());

describe("useConsent", () => {
  it("defaults to null (no decision yet)", () => {
    const { result } = renderHook(() => useConsent());
    expect(result.current.consent).toBeNull();
  });

  it("returns stored consent from localStorage", () => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ essential: true, advertising: true })
    );
    const { result } = renderHook(() => useConsent());
    expect(result.current.consent).toEqual({
      essential: true,
      advertising: true,
    });
  });

  it("acceptAll sets all categories to true and persists", () => {
    const { result } = renderHook(() => useConsent());
    act(() => result.current.acceptAll());
    expect(result.current.consent).toEqual({
      essential: true,
      advertising: true,
    });
    expect(JSON.parse(localStorage.getItem("cookie-consent")!)).toEqual({
      essential: true,
      advertising: true,
    });
  });

  it("rejectNonEssential sets advertising false and persists", () => {
    const { result } = renderHook(() => useConsent());
    act(() => result.current.rejectNonEssential());
    expect(result.current.consent).toEqual({
      essential: true,
      advertising: false,
    });
  });

  it("hasAdvertisingConsent returns true only when advertising is true", () => {
    const { result } = renderHook(() => useConsent());
    expect(result.current.hasAdvertisingConsent).toBe(false);
    act(() => result.current.acceptAll());
    expect(result.current.hasAdvertisingConsent).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd app && npx vitest run src/hooks/__tests__/useConsent.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// app/src/hooks/useConsent.ts
import { useState, useCallback } from "react";

const STORAGE_KEY = "cookie-consent";

export interface ConsentState {
  essential: boolean;
  advertising: boolean;
}

function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

function writeConsent(state: ConsentState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(readConsent);

  const acceptAll = useCallback(() => {
    const state: ConsentState = { essential: true, advertising: true };
    writeConsent(state);
    setConsent(state);
  }, []);

  const rejectNonEssential = useCallback(() => {
    const state: ConsentState = { essential: true, advertising: false };
    writeConsent(state);
    setConsent(state);
  }, []);

  return {
    consent,
    acceptAll,
    rejectNonEssential,
    hasAdvertisingConsent: consent?.advertising === true,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd app && npx vitest run src/hooks/__tests__/useConsent.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add app/src/hooks/useConsent.ts app/src/hooks/__tests__/useConsent.test.ts
git commit -m "feat: add useConsent hook for cookie consent persistence"
```

---

## Task 2: Cookie Consent Banner — UI Component

**Files:**
- Create: `app/src/components/CookieConsent.tsx`

**Step 1: Write the component**

```typescript
// app/src/components/CookieConsent.tsx
import { useConsent } from "@/hooks/useConsent";

export function CookieConsent() {
  const { consent, acceptAll, rejectNonEssential } = useConsent();

  // Already made a choice — don't show banner
  if (consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-slate-600">
          <p className="font-medium text-slate-800 mb-1">Cookie-Einstellungen</p>
          <p>
            Diese Website verwendet Cookies von Google AdSense für Werbeanzeigen.
            Essentielle Funktionen der App benötigen keine Cookies.{" "}
            <a
              href="/#/privacy"
              className="text-sky-600 underline hover:text-sky-700"
            >
              Datenschutzerklärung
            </a>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={rejectNonEssential}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Nur Essentielle
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build compiles**

Run: `cd app && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/src/components/CookieConsent.tsx
git commit -m "feat: add CookieConsent banner component"
```

---

## Task 3: Google Consent Mode v2 + Conditional AdSense Loading

**Files:**
- Modify: `app/index.html:46-48` (remove unconditional AdSense script)
- Create: `app/src/hooks/useAdSense.ts`
- Modify: `app/src/components/AdBanner.tsx` (use consent-gated loading)

**Step 1: Update index.html — replace unconditional AdSense with Consent Mode defaults**

Replace lines 46-48 in `app/index.html`:

```html
    <!-- Google Consent Mode v2 — default denied until user consents -->
    <meta name="google-adsense-account" content="ca-pub-1712273263687132">
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied'
      });
    </script>
```

Remove the `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js...">` line — AdSense will be loaded dynamically after consent.

**Step 2: Create useAdSense hook**

```typescript
// app/src/hooks/useAdSense.ts
import { useEffect, useRef } from "react";
import { useConsent } from "./useConsent";

declare global {
  interface Window {
    dataLayer: unknown[];
    adsbygoogle: unknown[];
  }
  function gtag(...args: unknown[]): void;
}

const PUBLISHER_ID = "ca-pub-1712273263687132";

export function useAdSense() {
  const { hasAdvertisingConsent } = useConsent();
  const loaded = useRef(false);

  useEffect(() => {
    if (!hasAdvertisingConsent) return;
    if (loaded.current) return;
    loaded.current = true;

    // Update consent mode to granted
    if (typeof gtag === "function") {
      gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    }

    // Dynamically load AdSense script
    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }, [hasAdvertisingConsent]);

  return { adsReady: hasAdvertisingConsent && loaded.current };
}
```

**Step 3: Update AdBanner to use consent**

Replace `app/src/components/AdBanner.tsx` contents:

```typescript
// app/src/components/AdBanner.tsx
import { useEffect, useRef } from "react";
import { useConsent } from "@/hooks/useConsent";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdBannerProps {
  slotId?: string;
  className?: string;
}

const PUBLISHER_ID = "ca-pub-1712273263687132";
const SLOT_ID = ""; // Set after first ad unit is created in AdSense dashboard

export function AdBanner({ slotId = SLOT_ID, className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const { hasAdvertisingConsent } = useConsent();

  useEffect(() => {
    if (pushed.current) return;
    if (!slotId) return;
    if (!hasAdvertisingConsent) return;

    try {
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch (e) {
      console.error("AdSense push error:", e);
    }
  }, [slotId, hasAdvertisingConsent]);

  if (!slotId) {
    return (
      <div className={`rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-3 text-center ${className}`}>
        <p className="text-xs text-slate-400 font-medium">Werbefläche</p>
        <p className="text-[10px] text-slate-300 mt-0.5">
          AdSense Slot-ID in AdBanner.tsx eintragen
        </p>
      </div>
    );
  }

  if (!hasAdvertisingConsent) return null;

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
```

**Step 4: Verify build**

Run: `cd app && npm run build`
Expected: Clean build, no errors

**Step 5: Commit**

```bash
git add app/index.html app/src/hooks/useAdSense.ts app/src/components/AdBanner.tsx
git commit -m "feat: add Google Consent Mode v2, load AdSense only after consent"
```

---

## Task 4: Mount Consent Banner + AdSense Hook in App

**Files:**
- Modify: `app/src/App.tsx`

**Step 1: Add imports and mount CookieConsent + useAdSense**

Update `app/src/App.tsx`:

```typescript
import { useState, useEffect } from "react";
import { SessionProvider } from "@/viewModel/SessionContext";
import { CookieConsent } from "@/components/CookieConsent";
import { useAdSense } from "@/hooks/useAdSense";
import ModeSelectionPage from "@/pages/ModeSelectionPage";
import SessionPage from "@/pages/SessionPage";
import SetupPage from "@/pages/SetupPage";
import SequenceBuilderPage from "@/pages/SequenceBuilderPage";
import PrivacyPage from "@/pages/PrivacyPage";
import AboutPage from "@/pages/AboutPage";

type Route = "/" | "/session" | "/setup" | "/builder" | "/privacy" | "/about";

function Router() {
  const [route, setRoute] = useState<Route>("/");
  const [streakRefresh, setStreakRefresh] = useState(0);

  useEffect(() => {
    const parse = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#/session"))  { setRoute("/session");  return; }
      if (hash.startsWith("#/setup"))    { setRoute("/setup");    return; }
      if (hash.startsWith("#/builder"))  { setRoute("/builder");  return; }
      if (hash.startsWith("#/privacy"))  { setRoute("/privacy");  return; }
      if (hash.startsWith("#/about"))    { setRoute("/about");    return; }
      setRoute("/");
      setStreakRefresh(n => n + 1);
    };
    parse();
    window.addEventListener("hashchange", parse);
    return () => window.removeEventListener("hashchange", parse);
  }, []);

  switch (route) {
    case "/session": return <SessionPage />;
    case "/setup":   return <SetupPage />;
    case "/builder": return <SequenceBuilderPage />;
    case "/privacy": return <PrivacyPage />;
    case "/about":   return <AboutPage />;
    default:         return <ModeSelectionPage streakRefresh={streakRefresh} />;
  }
}

function App() {
  useAdSense(); // loads AdSense script after consent
  return (
    <SessionProvider>
      <Router />
      <CookieConsent />
    </SessionProvider>
  );
}

export default App;
```

**Step 2: Verify build**

Run: `cd app && npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add app/src/App.tsx
git commit -m "feat: mount CookieConsent banner and consent-gated AdSense in App"
```

---

## Task 5: Impressum Page

**Files:**
- Create: `app/src/pages/ImpressumPage.tsx`
- Modify: `app/src/App.tsx` (add route)

**Step 1: Create Impressum page**

```typescript
// app/src/pages/ImpressumPage.tsx
import { ChevronLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/#/")}
            className="text-slate-500"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Zurück
          </Button>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-sky-500" />
            <h1 className="text-lg font-semibold text-slate-800">Impressum</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 prose prose-slate prose-sm">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              Angaben gemäß § 5 TMG
            </h2>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">Verantwortlich</h3>
            <p className="text-slate-600 text-sm">
              {/* TODO: Echte Daten eintragen */}
              Vorname Nachname<br />
              Straße Hausnummer<br />
              PLZ Ort<br />
              Deutschland
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">Kontakt</h3>
            <p className="text-slate-600 text-sm">
              E-Mail:{" "}
              <a href="mailto:kontakt@coupletimer.site" className="text-sky-600 underline">
                kontakt@coupletimer.site
              </a>
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">
              Haftungsausschluss
            </h3>
            <p className="text-slate-600 text-sm">
              Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt.
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können
              wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß
              § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen
              Gesetzen verantwortlich.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">
              Haftung für Links
            </h3>
            <p className="text-slate-600 text-sm">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren
              Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten
              Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
              verantwortlich.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">Urheberrecht</h3>
            <p className="text-slate-600 text-sm">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
              Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
              Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
              Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
              jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
```

**Step 2: Add route in App.tsx**

In `app/src/App.tsx`:
- Add to imports: `import ImpressumPage from "@/pages/ImpressumPage";`
- Add to Route type: `| "/impressum"`
- Add to parse: `if (hash.startsWith("#/impressum")) { setRoute("/impressum"); return; }`
- Add to switch: `case "/impressum": return <ImpressumPage />;`

**Step 3: Verify build**

Run: `cd app && npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add app/src/pages/ImpressumPage.tsx app/src/App.tsx
git commit -m "feat: add Impressum page (§5 TMG) with route"
```

---

## Task 6: Update All Footers with Impressum Link

**Files:**
- Modify: `app/src/pages/ModeSelectionPage.tsx:342-357`
- Modify: `app/src/pages/AboutPage.tsx:196-203`
- Modify: `app/src/pages/PrivacyPage.tsx` (add footer)

**Step 1: Update ModeSelectionPage footer**

In `app/src/pages/ModeSelectionPage.tsx`, replace the footer div (lines ~342-357):

```tsx
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 space-y-2">
          <div className="flex justify-center gap-4">
            <button type="button" onClick={() => (window.location.href = "/#/about")} className="hover:text-slate-600 transition-colors">
              Über die Methode
            </button>
            <span>·</span>
            <button type="button" onClick={() => (window.location.href = "/#/privacy")} className="hover:text-slate-600 transition-colors">
              Datenschutz
            </button>
            <span>·</span>
            <button type="button" onClick={() => (window.location.href = "/#/impressum")} className="hover:text-slate-600 transition-colors">
              Impressum
            </button>
          </div>
          <p className="text-slate-300 text-[10px]">
            Basierend auf der Zwiegespräch-Methode nach Michael Lukas Moeller
          </p>
        </footer>
```

**Step 2: Update AboutPage footer**

In `app/src/pages/AboutPage.tsx`, replace footer div (lines ~196-203):

```tsx
        <div className="border-t border-slate-200 pt-6 flex justify-center gap-6 text-sm text-slate-400">
          <button type="button" onClick={() => (window.location.href = "/#/privacy")}
            className="hover:text-slate-600 transition-colors">
            Datenschutz
          </button>
          <span>·</span>
          <button type="button" onClick={() => (window.location.href = "/#/impressum")}
            className="hover:text-slate-600 transition-colors">
            Impressum
          </button>
          <span>·</span>
          <span>© 2026 coupletimer.site</span>
        </div>
```

**Step 3: Add footer to PrivacyPage**

In `app/src/pages/PrivacyPage.tsx`, before the closing `</main>` (line 102), add:

```tsx
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="border-t border-slate-200 pt-6 flex justify-center gap-6 text-sm text-slate-400">
          <button type="button" onClick={() => (window.location.href = "/#/")}
            className="hover:text-slate-600 transition-colors">
            Zur App
          </button>
          <span>·</span>
          <button type="button" onClick={() => (window.location.href = "/#/impressum")}
            className="hover:text-slate-600 transition-colors">
            Impressum
          </button>
        </div>
      </div>
```

**Step 4: Verify build**

Run: `cd app && npm run build`
Expected: Clean build

**Step 5: Commit**

```bash
git add app/src/pages/ModeSelectionPage.tsx app/src/pages/AboutPage.tsx app/src/pages/PrivacyPage.tsx
git commit -m "feat: add Impressum link to all page footers"
```

---

## Task 7: Add `<noscript>` Content to index.html

**Files:**
- Modify: `app/index.html:70-72`

**Step 1: Add noscript block**

In `app/index.html`, replace `<body>` section (lines 70-72):

```html
  <body>
    <noscript>
      <div style="max-width:640px;margin:40px auto;padding:24px;font-family:'Inter',system-ui,sans-serif;color:#334155;line-height:1.6">
        <h1 style="font-size:1.5rem;margin-bottom:12px">Zwiegespräch Timer – Bewusst miteinander reden</h1>
        <p>
          Der kostenlose Zwiegespräch Timer für Paare. Führt strukturierte Paargespräche
          nach der Methode von Michael Lukas Moeller – dem einflussreichsten deutschen
          Paartherapeuten des 20. Jahrhunderts. Die App stellt gleiche Redezeiten sicher,
          verhindert Unterbrechungen und begleitet euch mit sanften Klangschalen durch
          jede Gesprächsphase.
        </p>
        <p>
          Drei vordefinierte Modi (Maintain, Commitment, Listening) sowie ein eigener
          Sequenz-Builder für individuelle Gesprächsformate. Kostenlos, ohne Anmeldung,
          alle Daten bleiben lokal auf eurem Gerät.
        </p>
        <p style="margin-top:16px;font-size:0.875rem;color:#94a3b8">
          Bitte aktivieren Sie JavaScript, um die App zu nutzen.
        </p>
        <nav style="margin-top:16px;font-size:0.875rem">
          <a href="https://coupletimer.site/#/about" style="color:#0284c7">Über die Methode</a> ·
          <a href="https://coupletimer.site/#/privacy" style="color:#0284c7">Datenschutz</a> ·
          <a href="https://coupletimer.site/#/impressum" style="color:#0284c7">Impressum</a>
        </nav>
      </div>
    </noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
```

**Step 2: Verify build**

Run: `cd app && npm run build`
Expected: Clean build

**Step 3: Verify noscript content in build output**

Run: `grep -c "noscript" app/dist/index.html`
Expected: 2 (opening + closing tag)

**Step 4: Commit**

```bash
git add app/index.html
git commit -m "feat: add noscript fallback content for AdSense crawler accessibility"
```

---

## Task 8: Update Sitemap with Impressum

**Files:**
- Modify: `app/public/sitemap.xml`

**Step 1: Add impressum URL**

Add before `</urlset>`:

```xml
  <url>
    <loc>https://coupletimer.site/#/impressum</loc>
    <lastmod>2026-03-18</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
```

**Step 2: Commit**

```bash
git add app/public/sitemap.xml
git commit -m "feat: add impressum to sitemap.xml"
```

---

## Task 9: Update Privacy Page — Add Consent Reference

**Files:**
- Modify: `app/src/pages/PrivacyPage.tsx:80-84`

**Step 1: Update cookies section**

Replace section 5 (Cookies) content in `app/src/pages/PrivacyPage.tsx`:

```tsx
          <section>
            <h3 className="font-semibold text-slate-700 mb-2">5. Cookies</h3>
            <p className="text-slate-600 text-sm">
              Die App selbst setzt keine Cookies. Google AdSense kann Cookies von
              Drittanbietern setzen. Beim ersten Besuch werden Sie über einen
              Cookie-Banner um Ihre Einwilligung gebeten. Werbecookies werden erst
              nach Ihrer ausdrücklichen Zustimmung geladen. Sie können Ihre
              Einwilligung jederzeit widerrufen, indem Sie Ihre Browser-Daten für
              diese Website löschen.
            </p>
          </section>
```

**Step 2: Verify build**

Run: `cd app && npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add app/src/pages/PrivacyPage.tsx
git commit -m "feat: update privacy page to reference consent banner"
```

---

## Task 10: Final Verification

**Step 1: Run full build**

Run: `cd app && npm run build`
Expected: Clean build, no errors

**Step 2: Run existing tests**

Run: `cd app && npx vitest run`
Expected: All existing tests pass + new useConsent tests pass

**Step 3: Manual checklist verification**

- [ ] `<noscript>` block present in dist/index.html (>200 chars)
- [ ] No unconditional AdSense script in index.html
- [ ] Consent Mode defaults to `denied` in index.html
- [ ] CookieConsent banner renders in App
- [ ] AdSense only loads after consent (useAdSense hook)
- [ ] Impressum page exists at `/#/impressum`
- [ ] Impressum linked in all footers (ModeSelection, About, Privacy)
- [ ] Privacy page mentions consent banner
- [ ] sitemap.xml includes impressum URL
- [ ] ads.txt pub-ID matches meta tag

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: final verification adjustments for AdSense preflight"
```

---

## Post-Implementation Notes

**IMPORTANT:** Before submitting to AdSense:
1. Replace the `TODO` placeholder in `ImpressumPage.tsx` with real name + address
2. Ensure the site has been live for ~3 months with organic traffic
3. After AdSense approval, create an ad unit and set `SLOT_ID` in `AdBanner.tsx`
