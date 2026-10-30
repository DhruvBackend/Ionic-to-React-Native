// Replacement for @ngx-translate. The JSON files in ./locales are copied unchanged from
// Ionic src/assets/i18n, and language codes stay the same ('en', 'hin', 'nep', 'es').
// ./client/*.json are the selected client's overrides (written by scripts/use-client.mjs from
// clients/<id>/i18n; empty for Topbath, whose own text is already the base files).
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
import enClient from './client/en.json';
import hinClient from './client/hin.json';
import nepClient from './client/nep.json';
import esClient from './client/es.json';

export const LANGUAGES = ['en', 'hin', 'nep', 'es'] as const;

type Bundle = Record<string, string>;

// Client keys win over the template's; every other key is untouched.
export function buildResources(base: Record<string, Bundle>, overrides: Record<string, Bundle>) {
  const out: Record<string, { translation: Bundle }> = {};
  for (const lang of Object.keys(base)) {
    out[lang] = { translation: { ...base[lang], ...(overrides[lang] ?? {}) } };
  }
  return out;
}

i18n.use(initReactI18next).init({
  resources: buildResources({ en, hin, nep, es }, { en: enClient, hin: hinClient, nep: nepClient, es: esClient }),
  lng: 'en', // Ionic: translate.setDefaultLang('en') in language.ts
  fallbackLng: 'en',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false }, // React already escapes text
  returnEmptyString: false,
});

export default i18n;
