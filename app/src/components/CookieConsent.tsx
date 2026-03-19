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
