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
