import { useTranslation } from "@/hooks/useTranslation";
import { useModeSelection } from "@/viewModel/useModeSelection";
import { useSession } from "@/viewModel/SessionContext";
import { ModeCard } from "@/components/ModeCard";
import { StreakDashboard } from "@/components/StreakDashboard";
import { AdBanner } from "@/components/AdBanner";
import { Button } from "@/components/ui/button";
import { Plus, Play, Heart, Info, MessageCircle, Clock, Users, CheckCircle } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";

interface Props {
  streakRefresh?: number;
}

export default function ModeSelectionPage({ streakRefresh = 0 }: Props) {
  const { t } = useTranslation();
  const {
    customModes,
    selectedMode,
    selectMode,
    createCustomMode,
  } = useModeSelection();
  const { start } = useSession();

  const handleStartSession = async () => {
    if (!selectedMode) return;
    if (selectedMode.isPreset) {
      window.location.href = `/#/setup?preset=${selectedMode.id}`;
    } else {
      await start(selectedMode);
      window.location.hash = "#/session";
    }
  };

  const handleCreateCustom = () => {
    const newMode = createCustomMode();
    const state = encodeURIComponent(JSON.stringify({ mode: newMode, isNew: true }));
    window.location.href = `/#/builder?state=${state}`;
  };

  const handleEditMode = (mode: typeof customModes[0]) => {
    const state = encodeURIComponent(JSON.stringify({ mode, isNew: false }));
    window.location.href = `/#/builder?state=${state}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-sky-400 flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 leading-none">
                Couple Timer
              </h1>
              <p className="text-[11px] text-slate-400 leading-none mt-0.5">
                Zwiegespräch für Paare
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => (window.location.href = "/#/about")}
            >
              Über die Methode
            </button>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => (window.location.href = "/#/about")}
            >
              <Info className="w-4 h-4 text-slate-400" />
            </button>
            <LanguageToggle />
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4">

        {/* ── EDITORIAL HERO – Publisher Content für AdSense ────────────── */}
        <section className="py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
            <MessageCircle className="w-3.5 h-3.5" />
            Kostenloser Paar-Kommunikations-Timer
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-slate-800 mb-4 leading-tight">
            Das Zwiegespräch –<br />
            <span className="font-semibold bg-gradient-to-r from-rose-500 to-sky-500 bg-clip-text text-transparent">
              einander wirklich zuhören
            </span>
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto text-base leading-relaxed">
            Der Couple Timer begleitet euch durch strukturierte Zwiegespräche nach der bewährten
            Methode von <strong>Michael Lukas Moeller</strong>. Jeder Partner kommt zu Wort –
            ohne Unterbrechung, ohne Diskussion, ohne Druck.
          </p>
        </section>

        {/* ── METHODEN-ERKLÄRUNG – substantieller redaktioneller Content ── */}
        <section className="mb-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-rose-50 to-sky-50 px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-lg">
              Was ist das Zwiegespräch?
            </h3>
          </div>
          <div className="px-6 py-5 space-y-4 text-slate-600 text-sm leading-relaxed">
            <p>
              Das Zwiegespräch ist eine strukturierte Gesprächsmethode für Paare, die der
              deutsche Psychoanalytiker und Paartherapeut <strong>Michael Lukas Moeller</strong>
              {" "}(1937–2002) entwickelt hat. Es funktioniert nach einem simplen Prinzip:
              Beide Partner bekommen gleich viel ungestörte Redezeit – und der andere hört
              zu, ohne zu kommentieren oder zu unterbrechen.
            </p>
            <p>
              Was banal klingt, ist in der Praxis revolutionär: In den meisten Paargesprächen
              reden beide gleichzeitig, unterbrechen sich gegenseitig oder verteidigen sofort
              die eigene Position. Das Zwiegespräch schafft bewusst Raum dafür, dass jede
              Person <em>vollständig gehört</em> wird – und das verändert Beziehungen nachhaltig.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <PhaseCard
                icon="🫁"
                phase="1. Vorbereitung"
                description="Beide kommen zur Ruhe. Atmen durch. Setzen eine positive Absicht."
                color="slate"
              />
              <PhaseCard
                icon="🗣️"
                phase="2. Partner A spricht"
                description="A redet über alles, was ihn/sie bewegt – ohne Zensur, ohne Struktur."
                color="rose"
              />
              <PhaseCard
                icon="👂"
                phase="3. Partner B hört zu"
                description="B hört aktiv zu – keine Kommentare, keine Fragen, keine Reaktionen."
                color="sky"
              />
              <PhaseCard
                icon="🔄"
                phase="4. Rollentausch"
                description="B erzählt, was in ihm/ihr vorging. A hört jetzt still zu."
                color="sky"
              />
              <PhaseCard
                icon="🤝"
                phase="5. Abschluss"
                description="Kurze Anerkennung: Danke fürs Zuhören. Keine Analyse, keine Bewertung."
                color="green"
              />
              <PhaseCard
                icon="🌿"
                phase="6. Cooldown"
                description="Stille. Kein Nachgespräch. Die Eindrücke dürfen sich setzen."
                color="emerald"
              />
            </div>
          </div>
        </section>

        {/* ── AD BANNER – erscheint NACH substantiellem Content ─────────── */}
        <AdBanner className="mb-8 rounded-xl overflow-hidden" />

        {/* ── WARUM ES WIRKT ──────────────────────────────────────────────── */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Warum funktioniert die Methode?
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <BenefitCard
              icon={<Users className="w-5 h-5 text-rose-500" />}
              title="Gleichgewicht"
              text="Beide Partner haben exakt gleich viel Redezeit. Niemand dominiert das Gespräch."
            />
            <BenefitCard
              icon={<CheckCircle className="w-5 h-5 text-sky-500" />}
              title="Sicherheit"
              text="Der Rahmen (Timer, Phasen) gibt Sicherheit. Ihr müsst euch nicht um den Ablauf kümmern."
            />
            <BenefitCard
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              title="Regelmäßigkeit"
              text="Moeller empfahl wöchentliche Zwiegespräche – wie ein Wartungsritual für die Beziehung."
            />
          </div>
        </section>

        {/* ── QUICK RITUALE ──────────────────────────────────────────────── */}
        <section className="mb-8">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Schnell starten
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {([
              { id: 'tiny-check-in',     emoji: '☕', color: 'from-sky-50 to-blue-100',   border: 'border-blue-200',  title: 'Tiny Check-in',    desc: '3 min pro Person', time: '~7 min' },
              { id: 'conflict-cooldown', emoji: '🌬️', color: 'from-amber-50 to-orange-100', border: 'border-amber-200', title: 'Conflict Cooldown', desc: 'Pause bei Streit',  time: '~10 min' },
              { id: 'screen-free-tea',   emoji: '🍵', color: 'from-emerald-50 to-green-100', border: 'border-emerald-200', title: 'Screen-free Tea',  desc: 'Einfach zusammen', time: '15 min' },
            ] as const).map(r => (
              <button
                key={r.id}
                onClick={() => { window.location.href = `/#/setup?preset=${r.id}` }}
                className={`text-left rounded-2xl border ${r.border} bg-gradient-to-br ${r.color} p-4 hover:shadow-md transition-all active:scale-95 cursor-pointer`}
              >
                <div className="text-2xl mb-2">{r.emoji}</div>
                <div className="font-semibold text-slate-800 text-sm">{r.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
                <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-white/60 text-xs text-slate-500 font-medium">
                  <Play className="w-2.5 h-2.5" /> {r.time}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── STREAK DASHBOARD ────────────────────────────────────────────── */}
        <section className="mb-8">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            Euer Fortschritt
          </h3>
          <StreakDashboard refreshTrigger={streakRefresh} />
        </section>

        {/* ── VOLLSTÄNDIGE FORMATE ─────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Vollständige Zwiegespräch-Formate
            </h3>
          </div>
          <div className="grid gap-3">
            {([
              { id: 'einsteiger-60', emoji: '🌱', title: 'Einsteiger 60 min', desc: '2 Runden × 10 min – ideal zum Starten', time: '~60 min', color: 'from-green-50 to-emerald-100', border: 'border-emerald-200' },
              { id: 'commitment-65', emoji: '💪', title: 'Commitment 65 min', desc: '3 Runden × 10 min – für regelmäßige Paare', time: '~65 min', color: 'from-blue-50 to-sky-100', border: 'border-blue-200' },
              { id: 'klassisch-90',  emoji: '🎯', title: 'Klassisch 90 min',  desc: '3 Runden × 15 min nach Moeller', time: '~90 min', color: 'from-violet-50 to-purple-100', border: 'border-violet-200' },
            ] as const).map(p => (
              <button
                key={p.id}
                onClick={() => { window.location.href = `/#/setup?preset=${p.id}` }}
                className={`w-full text-left rounded-2xl border ${p.border} bg-gradient-to-r ${p.color} px-5 py-4 hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-between`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{p.emoji}</div>
                  <div>
                    <div className="font-semibold text-slate-800">{p.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">{p.time}</span>
                  <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm">
                    <Play className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── EIGENE MODI ─────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              {t("modeSelection.custom", "Eigene Modi")}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCreateCustom}
              className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("modeSelection.create", "Erstellen")}
            </Button>
          </div>

          {customModes.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 text-sm">
                {t("modeSelection.noCustom", "Noch keine eigenen Modi")}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCreateCustom}
                className="mt-2 text-sky-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("modeSelection.createFirst", "Ersten erstellen")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {customModes.map((mode, index) => (
                <div
                  key={mode.id}
                  className="animate-slide-in-left"
                  style={{ animationDelay: `${(index + 3) * 0.05}s` }}
                >
                  <ModeCard
                    mode={mode}
                    isSelected={selectedMode?.id === mode.id}
                    onClick={() => selectMode(mode)}
                    onEdit={() => handleEditMode(mode)}
                    showEdit
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── FAQ – weiterer substantieller Content ───────────────────────── */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Häufige Fragen zum Zwiegespräch
          </h3>
          <div className="space-y-3">
            <FaqItem
              q="Wie oft sollte man das Zwiegespräch führen?"
              a="Michael Lukas Moeller empfahl einmal pro Woche, ca. 30 Minuten. Regelmäßigkeit ist entscheidender als Häufigkeit – ein wöchentliches Ritual wirkt stärker als ein gelegentliches langes Gespräch."
            />
            <FaqItem
              q="Was, wenn ich nicht weiß, worüber ich reden soll?"
              a="Genau das ist der Einstieg: Sag einfach, was in diesem Moment in dir vorgeht. Es muss kein Thema sein – Gedanken, Gefühle, Bilder, Erinnerungen – alles ist erlaubt. Das Zwiegespräch ist kein Problemlösungsgespräch."
            />
            <FaqItem
              q="Was passiert im Cooldown? Darf man gar nicht sprechen?"
              a="Moeller war ausdrücklich dafür, nach dem Zwiegespräch keine sofortige Diskussion zu führen. Der Cooldown gibt beiden Zeit, das Gehörte zu verarbeiten. Stille ist erlaubt – und oft heilsam. Kurze Bestätigungen wie 'Danke' sind in Ordnung."
            />
            <FaqItem
              q="Können wir die Zeitlängen anpassen?"
              a="Ja – mit dem 'Eigene Modi'-Builder kannst du Phasenlängen frei konfigurieren. Einsteiger empfehlen wir den Maintain-Modus (17 Min.), für tiefere Gespräche den Commitment-Modus (32 Min.)."
            />
            <FaqItem
              q="Ist die App kostenlos?"
              a="Ja, vollständig kostenlos und ohne Anmeldung. Alle Daten (Streak, eigene Modi) werden ausschließlich lokal auf deinem Gerät gespeichert."
            />
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
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

        <div className="h-28" />
      </div>

      {/* ── STICKY START BUTTON ──────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto">
          <Button
            type="button"
            size="lg"
            onClick={handleStartSession}
            disabled={!selectedMode}
            className={`w-full rounded-xl py-6 text-base font-medium transition-all ${
              selectedMode
                ? "bg-gradient-to-r from-rose-400 via-pink-400 to-sky-500 hover:from-rose-500 hover:to-sky-600 text-white shadow-lg shadow-rose-200/50"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Play className="w-5 h-5 mr-2" />
            {selectedMode
              ? `${t("modeSelection.start", "Session starten")}`
              : t("modeSelection.selectFirst", "Oben einen Modus auswählen")}
          </Button>
        </div>
      </div>
    </main>
  );
}

// ── Sub-Components ────────────────────────────────────────────────────────────

function PhaseCard({
  icon, phase, description, color,
}: {
  icon: string;
  phase: string;
  description: string;
  color: "slate" | "rose" | "sky" | "green" | "emerald";
}) {
  const bg: Record<string, string> = {
    slate: "bg-slate-50 border-slate-200",
    rose: "bg-rose-50 border-rose-200",
    sky: "bg-sky-50 border-sky-200",
    green: "bg-green-50 border-green-200",
    emerald: "bg-emerald-50 border-emerald-200",
  };
  return (
    <div className={`rounded-xl border p-3 ${bg[color]}`}>
      <div className="flex items-start gap-2">
        <span className="text-xl leading-none mt-0.5">{icon}</span>
        <div>
          <p className="font-medium text-slate-700 text-xs">{phase}</p>
          <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function BenefitCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="mb-2">{icon}</div>
      <p className="font-semibold text-slate-700 text-sm mb-1">{title}</p>
      <p className="text-slate-500 text-xs leading-relaxed">{text}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="bg-white rounded-xl border border-slate-200 group">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
        <span className="font-medium text-slate-700 text-sm pr-4">{q}</span>
        <span className="text-slate-400 text-lg shrink-0 transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="px-5 pb-4 text-slate-500 text-sm leading-relaxed border-t border-slate-100 pt-3">
        {a}
      </div>
    </details>
  );
}
