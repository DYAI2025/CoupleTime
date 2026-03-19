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
