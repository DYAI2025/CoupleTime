import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface MainLayoutProps {
  children: ReactNode
  showLanguageToggle?: boolean
}

export function MainLayout({ children, showLanguageToggle = true }: MainLayoutProps) {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de'
    i18n.changeLanguage(newLang)
  }

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {showLanguageToggle && (
        <header className="fixed top-0 right-0 p-4 z-50">
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 text-sm font-medium text-surface-500
                       bg-white/80 backdrop-blur-sm rounded-full
                       border border-surface-200 hover:bg-white
                       transition-colors duration-200"
            aria-label="Toggle language"
          >
            {i18n.language === 'de' ? 'EN' : 'DE'}
          </button>
        </header>
      )}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  )
}
