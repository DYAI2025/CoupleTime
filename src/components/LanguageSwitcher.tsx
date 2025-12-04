import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Store the selected language in localStorage
    localStorage.setItem('selectedLanguage', lng);
  };

  // Check for stored language preference on initial load
  React.useEffect(() => {
    const storedLanguage = localStorage.getItem('selectedLanguage');
    if (storedLanguage && i18n.language !== storedLanguage) {
      i18n.changeLanguage(storedLanguage);
    }
  }, [i18n]);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Language:</span>
      <div className="flex rounded-md overflow-hidden border border-gray-300">
        <button
          type="button"
          onClick={() => changeLanguage('en')}
          className={`px-3 py-1 text-sm ${
            i18n.language === 'en'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          EN
        </button>
        <div className="border-r border-gray-300"></div>
        <button
          type="button"
          onClick={() => changeLanguage('de')}
          className={`px-3 py-1 text-sm ${
            i18n.language === 'de'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          DE
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;