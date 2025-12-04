import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PhaseType } from '../domain/PhaseType';
import { GuidanceLevel } from '../domain/GuidanceLevel';
import { GuidanceSettings, createDefaultGuidanceSettings } from '../domain/GuidanceSettings';

interface GuidancePanelProps {
  currentPhase: PhaseType;
  guidanceLevel: GuidanceLevel;
  guidanceTexts: string[];
  isVisible: boolean;
  settings: GuidanceSettings;
  onSettingsChange: (settings: GuidanceSettings) => void;
  onNextTip: () => void;
  onPreviousTip: () => void;
}

const GuidancePanel: React.FC<GuidancePanelProps> = ({
  currentPhase,
  guidanceLevel,
  guidanceTexts,
  isVisible,
  settings,
  onSettingsChange,
  onNextTip,
  onPreviousTip,
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate functionality
  useEffect(() => {
    if (!settings.autoRotation || !isVisible || guidanceTexts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % guidanceTexts.length);
    }, settings.interval * 1000);

    return () => clearInterval(interval);
  }, [settings.autoRotation, settings.interval, guidanceTexts.length, isVisible]);

  // Update current index when guidance texts change
  useEffect(() => {
    if (guidanceTexts.length > 0) {
      setCurrentIndex(0);
    }
  }, [guidanceTexts]);

  if (!isVisible || guidanceTexts.length === 0) {
    return null;
  }

  const currentTip = guidanceTexts[currentIndex];

  const handleAutoRotateToggle = () => {
    onSettingsChange({
      ...settings,
      autoRotation: !settings.autoRotation,
    });
  };

  const handleShowAllToggle = () => {
    onSettingsChange({
      ...settings,
      showAll: !settings.showAll,
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('guidancePanel.title', 'Guidance')}</h3>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[60px]">
              <p className="text-gray-700">{currentTip}</p>
            </div>
          </div>
          
          <div className="ml-4 flex flex-col space-y-2">
            <div className="flex space-x-2">
              <button
                onClick={onPreviousTip}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={t('guidancePanel.previousTip', 'Previous tip')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={onNextTip}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={t('guidancePanel.nextTip', 'Next tip')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.autoRotation}
                  onChange={handleAutoRotateToggle}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">{t('guidancePanel.autoRotate', 'Auto-rotate tips')}</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showAll}
                  onChange={handleShowAllToggle}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Show all tips</span>
              </label>
            </div>
          </div>
        </div>
        
        {guidanceTexts.length > 1 && (
          <div className="mt-3 flex justify-center items-center">
            <div className="flex space-x-1">
              {guidanceTexts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full ${
                    index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                  aria-label={t('tips.goToTip', 'Go to tip {{number}}', { number: index + 1 })}
                />
              ))}
            </div>
            <span className="ml-3 text-sm text-gray-500">
              {currentIndex + 1} / {guidanceTexts.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidancePanel;