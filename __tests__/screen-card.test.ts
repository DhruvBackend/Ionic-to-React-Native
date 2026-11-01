/// <reference types="node" />
// Task 12: docs/inventory.json (117 Ionic pages with reachability), scripts/screen-card.mjs (mechanical card
// per screen) and the fake role sessions in src/api/fixtures/_sessions.json.
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { jwtDecode } from 'jwt-decode';

const ROOT = path.resolve(__dirname, '..');
const CARD_SCRIPT = path.join(ROOT, 'scripts', 'screen-card.mjs');
const IONIC_SRC = process.env.IONIC_SRC || 'C:/Migrations/Topbath_App_loyalty/src';
const hasIonic = fs.existsSync(path.join(IONIC_SRC, 'pages'));
const ifIonic = hasIonic ? describe : describe.skip;

interface Row {
  ionicClass: string;
  name: string;
  ionicPath: string;
  status: 'LIVE' | 'PUSH-ONLY' | 'DEAD';
  roles: string[];
  backend: 'root' | 'sfa' | 'both';
  feature: string | null;
  phase: number;
  unreachableBecause: string | null;
}
const rows: Row[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/inventory.json'), 'utf8'));

function card(name: string): string {
  return execFileSync('node', [CARD_SCRIPT, name, '--stdout'], { encoding: 'utf8', env: { ...process.env, IONIC_SRC } });
}

ifIonic('screen-card.mjs', () => {
  test('Otp card lists auth/login, app_karigar/karigarLoginOtp and the mobile_no nav param', () => {
    const c = card('Otp');
    expect(c).toContain('`auth/login`');
    expect(c).toContain('`app_karigar/karigarLoginOtp`');
    expect(c).toMatch(/Nav params read[\s\S]*`mobile_no`/);
  });

  test('Home card lists app_karigar/karigarHome', () => {
    expect(card('Home')).toContain('`app_karigar/karigarHome`');
  });

  test('card has every section from the plan, with empty Quirks and States at the end', () => {
    const c = card('Language');
    for (const h of [
      '## Ionic files',
      '## Nav params read',
      '## Endpoints',
      '## Response fields read',
      '## Nav targets',
      '## Overlays',
      '## Natives (@ionic-native)',
      '## i18n keys',
      '## Hardcoded text',
      '## SCSS',
      '## Quirks',
      '## States',
    ]) {
      expect(c).toContain(h);
    }
    expect(c).toMatch(/## Quirks\s+## States\s*$/);
    // helper, server and body source are mechanical
    expect(c).toContain('| post_rqst | `app_karigar/update_language` | root |');
  });

  test('an unknown screen name fails', () => {
    expect(() => execFileSync('node', [CARD_SCRIPT, 'NoSuchScreen', '--stdout'], { stdio: 'pipe', env: { ...process.env, IONIC_SRC } })).toThrow();
  });

  test('sample cards are checked in for Language, Otp and Home', () => {
    for (const n of ['Language', 'Otp', 'Home']) {
      expect(fs.existsSync(path.join(ROOT, 'src/screens', n, 'card.md'))).toBe(true);
    }
  });
});

describe('docs/inventory.json', () => {
  const featureKeys = [...fs.readFileSync(path.join(ROOT, 'src/config/types.ts'), 'utf8').match(/export type FeatureKey =([\s\S]*?);/)![1].matchAll(/'(\w+)'/g)].map(m => m[1]);

  test('has exactly 117 rows with unique class and screen names', () => {
    expect(rows).toHaveLength(117);
    expect(new Set(rows.map(r => r.name)).size).toBe(117);
    expect(new Set(rows.map(r => r.ionicClass)).size).toBe(117);
    for (const r of rows) expect(r.ionicClass).toBe(`${r.name}Page`);
  });

  test('61 LIVE or PUSH-ONLY and 56 DEAD, with Feedback, Transaction and ShippingDetail push-only', () => {
    expect(rows.filter(r => r.status !== 'DEAD')).toHaveLength(61);
    expect(rows.filter(r => r.status === 'DEAD')).toHaveLength(56);
    expect(rows.filter(r => r.status === 'PUSH-ONLY').map(r => r.name).sort()).toEqual(['Feedback', 'ShippingDetail', 'Transaction']);
  });

  test('phases follow the spec: 61 live in phases 1-5, 16 loyalty pages in 6, 40 SFA pages in 7', () => {
    const count = (p: number) => rows.filter(r => r.phase === p).length;
    expect([1, 2, 3, 4, 5, 6, 7].map(count)).toEqual([7, 22, 11, 15, 6, 16, 40]);
    for (const r of rows) expect(r.status === 'DEAD').toBe(r.phase >= 6);
  });

  test('every DEAD row has a FeatureKey and file:line evidence; live rows have no reason', () => {
    for (const r of rows) {
      if (r.status === 'DEAD') {
        expect(featureKeys).toContain(r.feature);
        expect(r.unreachableBecause).toBeTruthy();
        expect(r.unreachableBecause).toMatch(/\.(ts|html):\d+|no navigation to/);
      } else {
        expect(r.unreachableBecause).toBeNull();
        if (r.feature) expect(featureKeys).toContain(r.feature);
      }
    }
    expect(rows.filter(r => r.phase === 7).every(r => r.feature === 'sfa')).toBe(true);
  });

  test('rows are well-formed', () => {
    for (const r of rows) {
      expect(r.ionicPath).toMatch(/^src\/pages\//);
      expect(['root', 'sfa', 'both']).toContain(r.backend);
      expect(r.roles.length).toBeGreaterThan(0);
    }
  });

  test('every generated route is an inventory screen (the rest are not ported yet)', () => {
    const generated = fs.readFileSync(path.join(ROOT, 'src/navigation/routes.generated.ts'), 'utf8');
    const routeNames = [...generated.matchAll(/screens\/(\w+)\/route'/g)].map(m => m[1]);
    const names = new Set(rows.map(r => r.name));
    for (const n of routeNames) expect(names.has(n)).toBe(true);
  });
});

describe('src/api/fixtures/_sessions.json', () => {
  const sessions: Record<string, Record<string, any>> = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/api/fixtures/_sessions.json'), 'utf8'));
  const cmsRoles = ['Plumber', 'Sales_Boy', 'Dealer', 'Sales_Executive', 'Customer', 'Retailer'];

  test('has one session per CMS role plus SFA, Employee and DrLogin', () => {
    expect(Object.keys(sessions).sort()).toEqual([...cmsRoles, 'DrLogin', 'Employee', 'SFA'].sort());
  });

  test('CMS sessions look like the otp.ts login result: type, id, token, loginType CMS, Verified', () => {
    for (const role of cmsRoles) {
      const s = sessions[role];
      expect(s.type).toBe(role);
      expect(s.loginType).toBe('CMS');
      expect(s.status).toBe('Verified');
      expect(s.id).toMatch(/^9000\d\d$/);
      expect(s.mobile_no).toMatch(/^90000000\d\d$/);
    }
  });

  test('every token is a fake unsigned JWT whose sub is the session id', () => {
    for (const s of Object.values(sessions)) {
      expect(s.token.split('.')).toHaveLength(3);
      expect(s.token.endsWith('.')).toBe(true);
      expect(jwtDecode<{ sub: string }>(s.token).sub).toBe(String(s.id));
    }
  });

  test('SFA-family sessions carry the fields app.component and the SFA pages read', () => {
    expect(sessions.SFA).toMatchObject({ loginType: 'SFA', loggedInUserType: 'Employee', user_type: 'MARKET', role_id: 'Market' });
    expect(sessions.Employee).toMatchObject({ loginType: 'Employee', user_type: 'OFFICE' });
    expect(sessions.DrLogin).toMatchObject({ loginType: 'DrLogin', loggedInUserType: 'DrLogin', type: 1 });
    expect(sessions.DrLogin.all_data.type).toBe(1);
  });

  test('is shared data: it is not treated as an endpoint fixture', () => {
    const generated = fs.readFileSync(path.join(ROOT, 'src/api/fixtures.generated.ts'), 'utf8');
    expect(generated).not.toContain('_sessions');
  });
});
