import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdBannerProps {
  /** AdSense slot ID – get from AdSense dashboard → Ads → Ad units */
  slotId?: string;
  className?: string;
}

/**
 * AdBanner – Google AdSense responsive unit
 * Publisher: ca-pub-1712273263687132
 *
 * Placement rules:
 * ✅ ModeSelectionPage (Startseite) – zwischen Streak-Dashboard und Modi-Liste
 * ❌ SessionPage – NIEMALS während einer aktiven Session
 * ❌ SessionCompletedView – emotionaler Moment, kein Ad-Interrupt
 *
 * Slot-ID nach AdSense-Freischaltung unter:
 * adsense.google.com → Anzeigen → Anzeigenblöcke → Neu → Slot-ID kopieren
 */

const PUBLISHER_ID = "ca-pub-1712273263687132";

// TODO: Nach erster Ad-Unit-Erstellung im AdSense Dashboard hier eintragen:
// adsense.google.com → Anzeigen → Anzeigenblöcke → "+ Neu" → Display → Slot-ID
const SLOT_ID = ""; // Leer lassen bis erste Ad-Unit erstellt ist

export function AdBanner({ slotId = SLOT_ID, className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    if (typeof window === "undefined") return;
    if (!slotId) return; // Kein Slot → kein Push

    try {
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch (e) {
      console.error("AdSense push error:", e);
    }
  }, [slotId]);

  // Slot noch nicht konfiguriert → Dev-Placeholder zeigen
  if (!slotId) {
    return (
      <div className={`rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-3 text-center ${className}`}>
        <p className="text-xs text-slate-400 font-medium">📢 Werbefläche</p>
        <p className="text-[10px] text-slate-300 mt-0.5">
          AdSense Slot-ID in AdBanner.tsx eintragen
        </p>
      </div>
    );
  }

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
