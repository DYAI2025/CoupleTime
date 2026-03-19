import { ChevronLeft, Heart, Clock, Shield, Zap, BookOpen, MessageCircle, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdBanner } from "@/components/AdBanner";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button type="button" variant="ghost" size="sm"
            onClick={() => (window.location.href = "/#/")} className="text-slate-500">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Zur App
          </Button>
          <h1 className="text-lg font-semibold text-slate-800">Die Zwiegespräch-Methode</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">

        {/* Hero */}
        <section className="text-center pt-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-sky-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-200/50">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-light text-slate-800 mb-3">
            Das Zwiegespräch
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
            Die einfachste und wirksamste Methode, um als Paar in echter Verbindung zu bleiben –
            entwickelt von einem der einflussreichsten deutschen Psychoanalytiker.
          </p>
        </section>

        {/* Ad Banner – nach Hero-Content */}
        <AdBanner className="rounded-xl overflow-hidden" />

        {/* Wer war Michael Lukas Moeller */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">Michael Lukas Moeller</h3>
          </div>
          <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <p>
              Michael Lukas Moeller (1937–2002) war ein deutsch-amerikanischer Psychiater, Psychoanalytiker
              und einer der bekanntesten Paartherapeuten des 20. Jahrhunderts. Er war Professor an der
              Universität Frankfurt und gründete die Gesellschaft für wissenschaftliche Gesprächspsychotherapie.
            </p>
            <p>
              Aus seiner jahrzehntelangen klinischen Arbeit mit Paaren entwickelte er die Methode des
              Zwiegesprächs, die er in seinem Buch <em>„Die Wahrheit beginnt zu zweit"</em> (1984) beschrieb.
              Das Buch wurde ein Bestseller, weil es eine praktische Antwort auf eine universelle Herausforderung
              gab: Wie können zwei Menschen wirklich miteinander sprechen – nicht aneinander vorbei?
            </p>
            <p>
              Moellers Kernthese: In Beziehungen sprechen die meisten Paare <em>über</em> Probleme,
              aber selten <em>miteinander</em>. Das Zwiegespräch schafft den strukturellen Rahmen,
              der echtes Zuhören überhaupt erst ermöglicht.
            </p>
          </div>
        </section>

        {/* Die Regeln */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-sky-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">Die Regeln des Zwiegesprächs</h3>
          </div>
          <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <p>
              Das Zwiegespräch hat wenige, aber unveränderliche Regeln. Ihre Einfachheit ist
              gleichzeitig ihre größte Stärke – und ihre größte Herausforderung.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <RuleCard n="1" rule="Gleiche Redezeit" color="rose"
              detail="Beide Partner sprechen gleich lange. Der Timer stellt das sicher. Niemand darf die Redezeit des anderen kürzen oder verlängern." />
            <RuleCard n="2" rule="Keine Unterbrechungen" color="sky"
              detail="Während ein Partner spricht, ist der andere still. Keine Fragen, keine Korrekturen, kein Nicken, keine Reaktionen – nur zuhören." />
            <RuleCard n="3" rule="Ich-Perspektive" color="rose"
              detail="Man spricht über sich selbst, nicht über den Partner. Sätze beginnen mit: Ich fühle, Ich denke, Bei mir ist – nicht mit: Du machst immer..." />
            <RuleCard n="4" rule="Kein Nachgespräch" color="sky"
              detail="Nach dem Zwiegespräch folgt Stille (Cooldown). Keine Diskussion, kein Kommentieren des Gehörten. Die Worte dürfen wirken." />
            <RuleCard n="5" rule="Regelmäßigkeit" color="emerald"
              detail="Das Zwiegespräch wirkt als Ritual. Einmal pro Woche, fester Termin – nicht nur wenn es Probleme gibt." />
          </div>
        </section>

        {/* Wissenschaftlicher Hintergrund */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Warum aktives Zuhören Beziehungen heilt</h3>
          <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <p>
              Die Forschung bestätigt, was Moeller klinisch beobachtete: <strong>Aktives, ungeteiltes Zuhören</strong> ist
              einer der stärksten Prädiktoren für Beziehungszufriedenheit. In einer viel zitierten Längsschnittstudie
              des Gottman Institute konnten Paare, bei denen beide Partner das Gefühl hatten, wirklich gehört zu werden,
              mit 94 % Wahrscheinlichkeit als glücklich zusammengebliebene Paare identifiziert werden.
            </p>
            <p>
              Das Problem: Echtes Zuhören ist kognitiv anspruchsvoll. Das menschliche Gehirn neigt dazu, während
              des Zuhörens bereits die eigene Antwort zu formulieren – statt wirklich aufzunehmen, was gesagt wird.
              Der Strukturzwang des Zwiegesprächs (Timer, Phasen, Schweigegebot) macht echtes Zuhören zur einzigen
              Option.
            </p>
            <p>
              Hinzu kommt der Effekt des <em>„Gehalten-Werdens"</em>: Wenn ein Mensch weiß, dass er ungestört
              bis zu Ende sprechen darf, ändert sich die Qualität dessen, was er sagt. Die Verarbeitung eigener
              Gedanken und Gefühle gelingt tiefer, wenn man nicht gleichzeitig mit Gegenreaktionen rechnen muss.
            </p>
          </div>
        </section>

        {/* App Features */}
        <section>
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Was der Couple Timer bietet</h3>
          <div className="grid gap-4">
            {[
              {
                icon: <Clock className="w-5 h-5 text-sky-500" />,
                title: "Drei vordefinierte Gesprächs-Modi",
                desc: "Maintain (17 min) für den wöchentlichen Check-in, Commitment (32 min) für tiefere Anliegen und Listening (37 min) mit Fokus auf aktives Zuhören. Jeder Modus ist sorgfältig auf die jeweilige Gesprächssituation abgestimmt.",
              },
              {
                icon: <Zap className="w-5 h-5 text-amber-500" />,
                title: "Eigene Modi konfigurieren",
                desc: "Mit dem Sequenz-Builder kannst du eigene Phasenlängen festlegen und unbegrenzt Gesprächsformate speichern – z.B. ein kürzeres 12-Minuten-Format für unter der Woche oder ein ausführliches Sonntagsgespräch.",
              },
              {
                icon: <Star className="w-5 h-5 text-rose-500" />,
                title: "Streak-System für Regelmäßigkeit",
                desc: "Wie beim Sport entscheidet die Regelmäßigkeit über den Effekt. Das Streak-Dashboard zeigt euren aktuellen Streak, den Wochenkalender und Gesamtstatistiken – ohne Cloud, ohne Account, vollständig lokal.",
              },
              {
                icon: <Shield className="w-5 h-5 text-green-500" />,
                title: "100 % privat und kostenlos",
                desc: "Keine Anmeldung, kein Abo, kein Tracking. Alle Daten bleiben ausschließlich auf eurem Gerät. Gesprächsinhalte werden zu keiner Zeit gespeichert – der Timer begleitet euch, hört aber nicht zu.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 shadow-sm">
                <div className="shrink-0 mt-0.5">{icon}</div>
                <div>
                  <p className="font-semibold text-slate-700 text-sm mb-1">{title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Praktische Tipps */}
        <section className="bg-gradient-to-br from-rose-50 to-sky-50 rounded-2xl border border-slate-200 p-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Praktische Einstiegstipps</h3>
          <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <p><strong>Fester Termin:</strong> Legt einen festen Wochentag und eine Uhrzeit fest.
            Der Termin sollte nicht „wenn wir Zeit haben" sein – sondern so fest wie ein Arzttermin.
            Viele Paare wählen Sonntagnachmittag oder Mittwochabend.</p>

            <p><strong>Physische Ruhe:</strong> Handys weglegen, Benachrichtigungen aus.
            Sitzt euch gegenüber oder nebeneinander – nicht im Bett, nicht beim Essen.
            Ein klarer physischer Rahmen verstärkt den psychologischen Rahmen.</p>

            <p><strong>Kleiner Anfang:</strong> Startet mit dem Maintain-Modus (17 Minuten).
            Es ist verlockend, gleich tief einzutauchen – aber die Regelmäßigkeit kleiner Sessions
            bringt mehr als ein einmaliges intensives Gespräch.</p>

            <p><strong>Was wenn nichts kommt?</strong> Das ist normal und sogar wertvoll.
            „Ich merke gerade, dass ich nicht weiß, was ich sagen soll" – ist eine vollkommen
            gültige Aussage im Zwiegespräch. Das Schweigen gehört dazu.</p>

            <p><strong>Nach schwierigen Themen:</strong> Der Cooldown ist kein Schweigen aus Bestrafung,
            sondern Respekt vor dem Gehörten. Gebt euch 10–20 Minuten, bevor ihr wieder sprecht.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pb-4">
          <Button type="button" size="lg"
            onClick={() => (window.location.href = "/#/")}
            className="bg-gradient-to-r from-rose-400 to-sky-500 hover:from-rose-500 hover:to-sky-600 text-white rounded-xl px-8 py-6 text-base shadow-lg shadow-rose-200/50"
          >
            <Heart className="w-5 h-5 mr-2" />
            Jetzt starten
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-slate-400 text-sm mt-3">
            Kostenlos · Keine Anmeldung · Direkt im Browser
          </p>
        </section>

        {/* Footer */}
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
      </div>
    </main>
  );
}

function RuleCard({
  n, rule, detail, color,
}: {
  n: string;
  rule: string;
  detail: string;
  color: "rose" | "sky" | "emerald";
}) {
  const bg = { rose: "bg-rose-50 border-rose-200", sky: "bg-sky-50 border-sky-200", emerald: "bg-emerald-50 border-emerald-200" };
  const text = { rose: "text-rose-700", sky: "text-sky-700", emerald: "text-emerald-700" };
  return (
    <div className={`rounded-xl border p-4 ${bg[color]}`}>
      <div className="flex gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-white border ${text[color]}`}>
          {n}
        </div>
        <div>
          <p className="font-semibold text-slate-700 text-sm">{rule}</p>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">{detail}</p>
        </div>
      </div>
    </div>
  );
}
