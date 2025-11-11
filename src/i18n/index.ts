import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import sw from './locales/sw.json';

const resources = {
  en: { translation: en },
  sw: { translation: sw },
};

const saved = typeof window !== 'undefined' ? (localStorage.getItem('app_lang') || '') : '';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: saved || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
