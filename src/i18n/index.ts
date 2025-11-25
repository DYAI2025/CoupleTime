import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en/translation.json'
import de from './locales/de/translation.json'

const resources = {
  en: { translation: en },
  de: { translation: de },
}

// Get language from localStorage or browser
const getLanguage = (): string => {
  // Check localStorage first
  const stored = localStorage.getItem('language')
  if (stored && ['de', 'en'].includes(stored)) {
    return stored
  }
  // Fall back to browser language
  const lang = navigator.language.split('-')[0]
  return ['de', 'en'].includes(lang) ? lang : 'de'
}

i18n.use(initReactI18next).init({
  resources,
  lng: getLanguage(),
  fallbackLng: 'de',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
