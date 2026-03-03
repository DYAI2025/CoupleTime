import { ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
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
            <Shield className="w-5 h-5 text-sky-500" />
            <h1 className="text-lg font-semibold text-slate-800">Datenschutz</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 prose prose-slate prose-sm">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Datenschutzerklärung</h2>
            <p className="text-slate-500 text-sm">Stand: März 2026</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">1. Verantwortlicher</h3>
            <p className="text-slate-600 text-sm">
              Betreiber dieser Website ist eine Privatperson. Für Datenschutzanfragen wenden Sie sich bitte an:<br />
              <a href="mailto:privacy@coupletimer.site" className="text-sky-600 underline">
                privacy@coupletimer.site
              </a>
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">2. Welche Daten werden gespeichert?</h3>
            <p className="text-slate-600 text-sm mb-2">
              Die Zwiegespräch App speichert ausschließlich Daten <strong>lokal auf Ihrem Gerät</strong> (localStorage des Browsers). Es werden keine personenbezogenen Daten an Server übertragen.
            </p>
            <ul className="text-slate-600 text-sm list-disc list-inside space-y-1">
              <li>Eigene, selbst erstellte Gesprächsmodi (lokal)</li>
              <li>Abgeschlossene Sessions (Datum, Modus-Name, Dauer) für die Streak-Funktion (lokal)</li>
              <li>Spracheinstellung (lokal)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">3. Server-Logs</h3>
            <p className="text-slate-600 text-sm">
              Beim Abruf dieser Website werden durch den Hosting-Anbieter (Vercel) automatisch technische Daten in Server-Logs gespeichert (IP-Adresse, Uhrzeit, aufgerufene Seite, Browser-Typ). Diese Daten werden nicht mit anderen Daten zusammengeführt. Weitere Informationen: <a href="https://vercel.com/legal/privacy-policy" className="text-sky-600 underline" target="_blank" rel="noopener">Vercel Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">4. Google AdSense</h3>
            <p className="text-slate-600 text-sm">
              Diese Website verwendet Google AdSense, einen Dienst zur Einbindung von Werbeanzeigen der Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Google AdSense verwendet Cookies und Web Beacons, um das Nutzungsverhalten zu analysieren und personalisierte Werbung anzuzeigen.
            </p>
            <p className="text-slate-600 text-sm mt-2">
              Sie können die Verwendung von Cookies durch Google unter folgenden Links deaktivieren:{" "}
              <a href="https://www.google.com/settings/ads" className="text-sky-600 underline" target="_blank" rel="noopener">Google Anzeigeneinstellungen</a> |{" "}
              <a href="https://www.youronlinechoices.com" className="text-sky-600 underline" target="_blank" rel="noopener">youronlinechoices.com</a>
            </p>
            <p className="text-slate-600 text-sm mt-2">
              Werbeanzeigen werden <strong>ausschließlich auf der Startseite</strong> angezeigt, niemals während einer laufenden Zwiegespräch-Session.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">5. Cookies</h3>
            <p className="text-slate-600 text-sm">
              Die App selbst setzt keine Cookies. Google AdSense kann Cookies von Drittanbietern setzen. Mit der Nutzung der Website stimmen Sie dem Einsatz dieser Cookies zu. Sie können Cookies in den Einstellungen Ihres Browsers jederzeit deaktivieren.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">6. Ihre Rechte (DSGVO)</h3>
            <p className="text-slate-600 text-sm">
              Da keine personenbezogenen Daten auf unseren Servern gespeichert werden, können Sie Ihre lokal gespeicherten Daten jederzeit selbst löschen (Browser-Einstellungen → Websitedaten löschen). Darüber hinaus haben Sie folgende Rechte: Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Widerspruch (Art. 21), Datenübertragbarkeit (Art. 20).
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">7. Änderungen</h3>
            <p className="text-slate-600 text-sm">
              Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die jeweils aktuelle Version ist auf dieser Seite verfügbar.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
