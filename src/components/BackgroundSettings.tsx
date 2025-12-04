import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createDefaultBackgroundConfig, BackgroundConfig } from '../domain/BackgroundConfig';

interface BackgroundSettingsProps {
  config: BackgroundConfig;
  onSave: (config: BackgroundConfig) => void;
}

const BACKGROUND_COLORS = [
  { name: 'blue', value: '#f0f9ff' },
  { name: 'violet', value: '#f5f3ff' },
  { name: 'rose', value: '#fff1f2' },
  { name: 'amber', value: '#fffbeb' },
  { name: 'emerald', value: '#f0fdf4' },
];

const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({ config, onSave }) => {
  const { t } = useTranslation();
  const [localConfig, setLocalConfig] = useState<BackgroundConfig>(config);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleColorChange = (color: string) => {
    setLocalConfig({ ...localConfig, primaryColor: color });
  };

  const handleSave = () => {
    onSave(localConfig);
    setIsEditing(false);
  };

  const handleReset = () => {
    setLocalConfig(createDefaultBackgroundConfig());
    onSave(createDefaultBackgroundConfig());
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.background', 'Background Settings')}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.primaryColor', 'Primary Color')}
          </label>
          <div className="flex flex-wrap gap-2">
            {BACKGROUND_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  localConfig.primaryColor === color.value ? 'border-gray-800' : 'border-transparent'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorChange(color.value)}
                aria-label={`${t('settings.selectColor', 'Select')} ${color.name} ${t('settings.color', 'color')}`}
              />
            ))}
            <div className="relative">
              <input
                type="color"
                value={localConfig.primaryColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t('common.save', 'Save')}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {t('common.reset', 'Reset')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSettings;