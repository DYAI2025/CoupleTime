import { ChevronLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          <LanguageToggle />
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
              Benjamin Poersch<br />
              Grazer Damm 207<br />
              12157 Berlin<br />
              Deutschland
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-700 mb-2">Kontakt</h3>
            <p className="text-slate-600 text-sm">
              E-Mail:{" "}
              <a href="mailto:Connect@dyai.cloud" className="text-sky-600 underline">
                Connect@dyai.cloud
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
