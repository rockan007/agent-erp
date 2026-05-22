import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

import commonZhCN from './locales/zh_CN/common.json';
import authZhCN from './locales/zh_CN/auth.json';
import dashboardZhCN from './locales/zh_CN/dashboard.json';
import commonEnUS from './locales/en_US/common.json';
import authEnUS from './locales/en_US/auth.json';
import dashboardEnUS from './locales/en_US/dashboard.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh_CN: {
        common: commonZhCN,
        auth: authZhCN,
        dashboard: dashboardZhCN,
      },
      en_US: {
        common: commonEnUS,
        auth: authEnUS,
        dashboard: dashboardEnUS,
      },
    },
    fallbackLng: 'en_US',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'erp_lang',
      caches: ['localStorage'],
      convertDetectedLanguage: (lng: string) => lng.replace('-', '_'),
    },
    interpolation: { escapeValue: false },
  });

const antdLocales: Record<string, typeof zhCN> = {
  zh_CN: zhCN,
  en_US: enUS,
};

export function getAntdLocale() {
  return antdLocales[i18n.language] || enUS;
}

export default i18n;
