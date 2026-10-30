// Replacement for @ngx-translate. The JSON files in ./locales are copied unchanged from
// Ionic src/assets/i18n, and language codes stay the same ('en', 'hin', 'nep', 'es').
//
// ngx-translate keys are whole English sentences ("Are you sure you want Exit?"), so i18next's
// key/namespace separators ('.' and ':') are switched off — otherwise those keys would be split.
// Missing keys fall back to the key itself, which is what ngx-translate did.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hin from './locales/hin.json';
import nep from './locales/nep.json';
import es from './locales/es.json';

export const LANGUAGES = ['en', 'hin', 'nep', 'es'] as const;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hin: { translation: hin },
    nep: { translation: nep },
    es: { translation: es },
  },
  lng: 'en', // Ionic: translate.setDefaultLang('en') in language.ts
  fallbackLng: 'en',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false }, // React already escapes text
  returnEmptyString: false,
});

export default i18n;
