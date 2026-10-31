/// <reference types="node" />
// Plan Task 4: theme colours come from the client config, translations keep ngx-translate behaviour,
// and screens/components can't hardcode client strings.
import { execFileSync } from 'child_process';
import path from 'path';
import { client } from '../src/config/client';
import { colors, ionicColors, scssColors } from '../src/theme';
import i18n, { buildResources } from '../src/i18n';
import en from '../src/i18n/locales/en.json';

test('primary colour comes from the client config', () => {
  expect(colors.primary).toBe(client.colors.primary);
});

test('both Ionic colour sets are kept with their own values', () => {
  expect(ionicColors.danger).toBe('#54595F'); // $colors map, used by color="danger"
  expect(scssColors.danger).toBe('#ff0000'); // $danger, used by page styles
  expect(ionicColors.primary).toBe(client.colors.primary);
});

test('a key missing from a locale falls back to the key itself (ngx-translate)', async () => {
  await i18n.changeLanguage('hin');
  expect(i18n.t('Some key that does not exist')).toBe('Some key that does not exist');
});

test('a known key is translated in Hindi', async () => {
  await i18n.changeLanguage('hin');
  expect(i18n.t('About Topsan')).not.toBe('About Topsan');
});

test('with no client override, the English bundle equals the Ionic en.json exactly', () => {
  expect(i18n.getResourceBundle('en', 'translation')).toEqual(en);
});

test('a client override replaces only its own keys', () => {
  const res = buildResources({ en: { A: 'a', B: 'b' } }, { en: { B: 'client b' } });
  expect(res.en.translation).toEqual({ A: 'a', B: 'client b' });
});

test('lint flags hex colours, brand words and URLs in screens and components', () => {
  const root = path.resolve(__dirname, '..');
  let out = '';
  try {
    out = execFileSync('npx', ['eslint', '--no-ignore', '-f', 'json', 'test-fixtures/lint/brand-violation.tsx'], {
      cwd: root,
      encoding: 'utf8',
      shell: true,
    });
  } catch (e: any) {
    out = e.stdout; // eslint exits 1 when it finds errors; that's the expected case
  }
  const messages = JSON.parse(out)[0].messages.filter((m: any) => m.ruleId === 'no-restricted-syntax');
  expect(messages.map((m: any) => m.line).sort()).toEqual([3, 4, 5]);
});

test('lint flags Alert.alert, ToastAndroid, datetimepicker and vector-icons in screens', () => {
  const root = path.resolve(__dirname, '..');
  let out = '';
  try {
    out = execFileSync('npx', ['eslint', '--no-ignore', '-f', 'json', 'test-fixtures/lint/screens-violation.tsx'], {
      cwd: root,
      encoding: 'utf8',
      shell: true,
    });
  } catch (e: any) {
    out = e.stdout;
  }
  const messages = JSON.parse(out)[0].messages.filter((m: any) => m.ruleId === 'no-restricted-syntax');
  // line 4 holds two bans (the Alert and ToastAndroid imports)
  expect(messages.map((m: any) => m.line).sort((a: number, b: number) => a - b)).toEqual([4, 4, 5, 6, 10, 11]);
});
