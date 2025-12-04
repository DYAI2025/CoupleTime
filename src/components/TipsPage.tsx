import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const TipsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {t('common.back', 'Back to Home')}
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('tipsPage.title', 'Valuable Tips')}</h1>

      <div className="space-y-8">
        {/* Before the Session */}
        <section className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center mr-3">1</span>
            {t('tipsPage.beforeSession.title', 'Before the Session')}
          </h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>{t('tipsPage.beforeSession.item1', 'Schedule a fixed weekly time (e.g., 90 min) and set a specific start time')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>{t('tipsPage.beforeSession.item2', 'Create a quiet, disturbance-free environment without distractions')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>{t('tipsPage.beforeSession.item3', 'Agree on a fixed speaking time (e.g., 15 min) and strict listening protocol')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>{t('tipsPage.beforeSession.item4', 'Make the session a fixed, non-negotiable ritual')}</span>
            </li>
          </ul>
        </section>

        {/* During the Session */}
        <section className="bg-violet-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-violet-100 text-violet-800 rounded-full h-8 w-8 flex items-center justify-center mr-3">2</span>
            {t('tipsPage.duringSession.title', 'During the Session')}
          </h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-violet-500 mr-2">•</span>
              <span>{t('tipsPage.duringSession.item1', 'Your only task as listener is to listen with full attention, without your own agenda')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-violet-500 mr-2">•</span>
              <span>{t('tipsPage.duringSession.item2', 'Absolute prohibition: No interrupting, judging, advising, or non-verbal rejection')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-violet-500 mr-2">•</span>
              <span>{t('tipsPage.duringSession.item3', 'When your partner pauses to think, remain still even if the silence feels long')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-violet-500 mr-2">•</span>
              <span>{t('tipsPage.duringSession.item4', 'As speaker, use "I feel/think" expressions and avoid accusations')}</span>
            </li>
          </ul>
        </section>

        {/* When Triggered */}
        <section className="bg-amber-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-amber-100 text-amber-800 rounded-full h-8 w-8 flex items-center justify-center mr-3">3</span>
            {t('tipsPage.whenTriggered.title', 'When I Feel Triggered')}
          </h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span>{t('tipsPage.whenTriggered.item1', 'Call time-out as soon as you or your partner feel emotionally overwhelmed')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span>{t('tipsPage.whenTriggered.item2', 'Use the pause for calming activities, not to brood')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span>{t('tipsPage.whenTriggered.item3', 'Resume the dialogue within 24 hours to prevent escalation')}</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span>{t('tipsPage.whenTriggered.item4', 'Focus on understanding rather than defending')}</span>
            </li>
          </ul>
        </section>

        {/* Basic Rules */}
        <section className="bg-emerald-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="bg-emerald-100 text-emerald-800 rounded-full h-8 w-8 flex items-center justify-center mr-3">4</span>
            {t('tipsPage.basicRules.title', 'Basic Conversation Rules')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <h3 className="font-medium text-emerald-800 mb-2">{t('tipsPage.basicRules.speaker', 'Speaker Guidelines')}</h3>
              <ul className="space-y-1">
                <li className="text-sm text-gray-700">• {t('tipsPage.basicRules.speakerRule1', 'Use "I feel/think" expressions')}</li>
                <li className="text-sm text-gray-700">• {t('tipsPage.basicRules.speakerRule2', 'Avoid accusations')}</li>
                <li className="text-sm text-gray-700">• {t('tipsPage.basicRules.speakerRule3', 'No interrupting, judging, or giving advice')}</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <h3 className="font-medium text-emerald-800 mb-2">{t('tipsPage.basicRules.listener', 'Listener Guidelines')}</h3>
              <ul className="space-y-1">
                <li className="text-sm text-gray-700">• {t('tipsPage.basicRules.listenerRule1', 'Listen attentively without judgment')}</li>
                <li className="text-sm text-gray-700">• {t('tipsPage.basicRules.listenerRule2', 'Maintain eye contact')}</li>
                <li className="text-sm text-gray-700">• {t('tipsPage.basicRules.listenerRule3', 'No interrupting, commenting, or dismissing')}</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TipsPage;