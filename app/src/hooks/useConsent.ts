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
