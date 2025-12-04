import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ParticipantConfig, createDefaultParticipantConfig } from '../domain/ParticipantConfig';

interface SessionSetupProps {
  config: ParticipantConfig;
  onSave: (config: ParticipantConfig) => void;
  onCancel: () => void;
}

const SessionSetup: React.FC<SessionSetupProps> = ({ config, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [localConfig, setLocalConfig] = useState<ParticipantConfig>(config);
  
  const COLORS = [
    { name: 'blue', value: '#3b82f6' },
    { name: 'violet', value: '#8b5cf6' },
    { name: 'rose', value: '#f43f5e' },
    { name: 'amber', value: '#f59e0b' },
    { name: 'emerald', value: '#10b981' },
    { name: 'indigo', value: '#6366f1' },
  ];

  const handleNameChange = (participant: 'A' | 'B', value: string) => {
    setLocalConfig({
      ...localConfig,
      [`name${participant}`]: value,
    });
  };

  const handleColorChange = (participant: 'A' | 'B', color: string) => {
    setLocalConfig({
      ...localConfig,
      [`color${participant}`]: color,
    });
  };

  const handleSave = () => {
    onSave(localConfig);
  };

  const handleReset = () => {
    setLocalConfig(createDefaultParticipantConfig());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t('session.setup.title', 'Session Setup')}
          </h2>
          
          <div className="space-y-6">
            {/* Participant A Configuration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('session.setup.nameA', 'Partner A Name')}
              </label>
              <input
                type="text"
                value={localConfig.nameA}
                onChange={(e) => handleNameChange('A', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              <label className="block text-sm font-medium text-gray-700 mt-3 mb-1">
                {t('session.setup.colorA', 'Partner A Color')}
              </label>
              <div className="flex space-x-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      localConfig.colorA === color.value ? 'border-gray-800' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleColorChange('A', color.value)}
                    aria-label={`${t('settings.selectColor', 'Select')} ${color.name} ${t('settings.color', 'color')} for Partner A`}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color"
                    value={localConfig.colorA}
                    onChange={(e) => handleColorChange('A', e.target.value)}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            {/* Participant B Configuration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('session.setup.nameB', 'Partner B Name')}
              </label>
              <input
                type="text"
                value={localConfig.nameB}
                onChange={(e) => handleNameChange('B', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              <label className="block text-sm font-medium text-gray-700 mt-3 mb-1">
                {t('session.setup.colorB', 'Partner B Color')}
              </label>
              <div className="flex space-x-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      localConfig.colorB === color.value ? 'border-gray-800' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleColorChange('B', color.value)}
                    aria-label={`${t('settings.selectColor', 'Select')} ${color.name} ${t('settings.color', 'color')} for Partner B`}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color"
                    value={localConfig.colorB}
                    onChange={(e) => handleColorChange('B', e.target.value)}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {t('common.reset', 'Reset')}
            </button>
            
            <div className="space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t('common.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSetup;