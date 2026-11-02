// Phone tap check 2026-11-02: a debug link only sets the variants it names, so a variant from an EARLIER link stuck
// (auth/login "suspended" from Registration.editSuspended turned a later plain login into "account suspended").
// A mock=1 link starts from a clean MOCK backend: default variants and an empty store.
import { fixture, setFixtureVariant } from '../src/api/mock';
import '../src/api/fixtures.generated';
import { applyDebugLink } from '../src/navigation/RootNavigator';

test('a mock=1 link resets variants left by an earlier link', () => {
  const def = JSON.stringify(fixture('auth/login', 'default'));
  setFixtureVariant('auth/login', 'NOT FOUND');
  expect(JSON.stringify(fixture('auth/login'))).not.toBe(def);
  applyDebugLink({ screen: 'Language', variants: {}, params: {}, mock: true });
  expect(JSON.stringify(fixture('auth/login'))).toBe(def);
});

test('variants named by the link still apply after the reset', () => {
  applyDebugLink({ screen: 'Language', variants: { 'auth/login': 'NOT FOUND' }, params: {}, mock: true });
  expect(JSON.stringify(fixture('auth/login'))).toBe(JSON.stringify(fixture('auth/login', 'NOT FOUND')));
});
