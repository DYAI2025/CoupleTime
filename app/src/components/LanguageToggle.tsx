import { useTranslation } from "@/hooks/useTranslation";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => i18n.changeLanguage("de")}
        className={`px-2 py-1 rounded-md transition-colors ${
          i18n.language === "de"
            ? "bg-white text-sky-600 shadow-sm"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        DE
      </button>
      <button
        type="button"
        onClick={() => i18n.changeLanguage("en")}
        className={`px-2 py-1 rounded-md transition-colors ${
          i18n.language === "en"
            ? "bg-white text-sky-600 shadow-sm"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        EN
      </button>
    </div>
  );
}
