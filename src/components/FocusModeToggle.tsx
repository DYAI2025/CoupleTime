import React from 'react';
import { useTranslation } from 'react-i18next';

interface FocusModeToggleProps {
  isFullscreen: boolean;
  onToggle: () => void;
  isSupported: boolean;
}

const FocusModeToggle: React.FC<FocusModeToggleProps> = ({ isFullscreen, onToggle, isSupported }) => {
  const { t } = useTranslation();
  
  return (
    <button
      onClick={onToggle}
      className="flex items-center text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
      disabled={!isSupported}
      aria-label={isFullscreen 
        ? t('focusMode.exit', 'Exit focus mode') 
        : t('focusMode.enter', 'Enter focus mode')}
    >
      {isSupported ? (
        <>
          {isFullscreen ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L4.414 8H10a1 1 0 110 2H4.414l3.293 3.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0zm7 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L17.586 12H11a1 1 0 110-2h6.586l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {t('focusMode.exit', 'Exit focus')}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {t('focusMode.enter', 'Focus mode')}
            </>
          )}
        </>
      ) : (
        <span className="text-gray-400 italic">
          {t('focusMode.unsupported', 'Focus mode unsupported')}
        </span>
      )}
    </button>
  );
};

export default FocusModeToggle;