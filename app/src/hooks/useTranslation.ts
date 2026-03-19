import { useState, useCallback } from "react";
import deTranslations from "@/i18n/locales/de/translation.json";
import enTranslations from "@/i18n/locales/en/translation.json";

type Translations = typeof deTranslations;

const STORAGE_KEY = "app-language";

const translations: Record<string, Translations> = {
  de: deTranslations,
  en: enTranslations,
};

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let value: unknown = obj;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof value === "string" ? value : path;
}

function detectLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "de" || stored === "en") return stored;
  const browserLang = navigator.language.split("-")[0];
  return browserLang === "de" ? "de" : "en";
}

export function useTranslation() {
  const [language, setLanguage] = useState(detectLanguage);

  const t = useCallback(
    (key: string, defaultValue?: string, options?: Record<string, string | number>) => {
      const currentTranslations = translations[language] || translations.en;
      let value = getNestedValue(currentTranslations as Record<string, unknown>, key);
      if (value === key && defaultValue) {
        value = defaultValue;
      }
      if (options) {
        Object.entries(options).forEach(([k, v]) => {
          value = value.replace(new RegExp(`{{${k}}}`, "g"), String(v));
        });
      }
      return value;
    },
    [language]
  );

  const changeLanguage = useCallback((lang: string) => {
    const resolved = lang === "de" || lang === "en" ? lang : "en";
    localStorage.setItem(STORAGE_KEY, resolved);
    setLanguage(resolved);
  }, []);

  return {
    t,
    i18n: { language, changeLanguage },
  };
}
