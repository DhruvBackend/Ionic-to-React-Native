// Phone pass 2026-11-03, confirmed by Dhruv on the Play Store app: after a restart while logged in, Ionic shows the raw
// translate keys (Home reads "Last 7 Days", not en.json's "LAST 7 DAYS"). app.component.ts never sets a language; only
// language.ts:56-57, mobile-login.ts:42-43 and otp.ts:64-65 call setDefaultLang/use. A Hindi user therefore sees English keys
// after reopening the app. RN starts in i18next's 'cimode' (t() returns the key) until one of those screens sets a language.
test('a fresh app (cold start) has no language: t() returns the key, like ngx-translate with no use()', () => {
  jest.isolateModules(() => {
    const i18n = require('../src/i18n').default;
    expect(i18n.language).toBe('cimode');
    expect(i18n.t('Last 7 Days')).toBe('Last 7 Days');
    i18n.changeLanguage('en'); // what language.ts / mobile-login.ts / otp.ts do
    expect(i18n.t('Last 7 Days')).toBe('LAST 7 DAYS');
  });
});

test('debug links copy the reference harness: logged-in English = cold start (keys), other languages = chosen at login', () => {
  const { applyDebugLink } = require('../src/navigation/RootNavigator');
  const i18n = require('../src/i18n').default;
  const base = { screen: 'Tabs', variants: {}, params: undefined, mock: true };
  applyDebugLink({ ...base, role: 'Plumber', lang: 'en' }, { Plumber: { id: '900001', type: 'Plumber' } });
  expect(i18n.language).toBe('cimode');
  applyDebugLink({ ...base, role: 'Plumber', lang: 'hin' }, { Plumber: { id: '900001', type: 'Plumber' } });
  expect(i18n.language).toBe('hin');
  applyDebugLink({ ...base, role: undefined, lang: 'en' }, {});
  expect(i18n.language).toBe('en');
  i18n.changeLanguage('en');
});
