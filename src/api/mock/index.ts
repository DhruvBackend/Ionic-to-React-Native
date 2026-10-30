// MOCK backend: answers every API call locally so all screens work without server access.
//
// Two sources, checked in this order:
//   1. handlers registered with registerMock(): code, for endpoints whose answer depends on
//      state or on the request (write endpoints update `store` so later reads reflect them).
//   2. fixtures: one JSON file per endpoint in src/api/fixtures/, with named variants
//      (default, empty, malformed, NOT FOUND, …). The parity harness serves the same files to
//      the Ionic reference build, so both apps render from identical data.
//
// Response shapes come from the fields each Ionic page reads from the response
// (e.g. home.ts reads resp.karigar.balance_point).
import { fixtureFiles } from '../fixtures.generated';
import { store } from './store';

export { store };

export type MockHandler = (body: any) => any;

export interface FixtureFile {
  endpoint: string; // e.g. 'app_karigar/karigarHome'
  server: 'root' | 'sfa' | 'server_url';
  variants: { default: unknown; [variant: string]: unknown };
}

const handlers: Record<string, MockHandler> = {};
const fixtures: Record<string, FixtureFile> = {};
const activeVariant: Record<string, string> = {};

export function registerMock(fn: string, handler: MockHandler) {
  handlers[fn] = handler;
}

export function registerFixture(f: FixtureFile) {
  fixtures[f.endpoint] = f;
}

export function setFixtureVariant(endpoint: string, variant: string) {
  const f = fixtures[endpoint];
  if (!f) {
    throw new Error(`[MOCK] no fixture for ${endpoint}`);
  }
  if (!(variant in f.variants)) {
    throw new Error(`[MOCK] fixture ${endpoint} has no variant "${variant}" (has: ${Object.keys(f.variants).join(', ')})`);
  }
  activeVariant[endpoint] = variant;
}

// The response a fixture gives right now (active variant unless one is named). Handlers use this
// to start from fixture data instead of repeating it.
export function fixture(endpoint: string, variant?: string): any {
  const f = fixtures[endpoint];
  if (!f) {
    throw new Error(`[MOCK] no fixture for ${endpoint}`);
  }
  return f.variants[variant ?? activeVariant[endpoint] ?? 'default'];
}

// Back to a clean backend: default variants, empty store. Registered handlers and fixtures stay.
export function resetMock() {
  for (const key of Object.keys(activeVariant)) {
    delete activeVariant[key];
  }
  store.reset();
}

export const MOCK_DELAY_MS = 300; // feels like a network call, so loaders get exercised

export async function mockRequest(method: 'GET' | 'POST', fn: string, body?: any, _serverURL?: string): Promise<any> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), MOCK_DELAY_MS));
  let response: unknown;
  if (handlers[fn]) {
    response = handlers[fn](body ?? {});
  } else if (fixtures[fn]) {
    response = fixture(fn);
  } else {
    console.warn(`[MOCK] no handler for ${method} ${fn}`);
    return { status: 'error', statusMsg: 'error', msg: `MOCK: no handler for ${fn}` };
  }
  // Deep-copy so screens can't mutate the store or fixtures by accident.
  return JSON.parse(JSON.stringify(response));
}

export function hasMock(fn: string) {
  return fn in handlers || fn in fixtures;
}

fixtureFiles.forEach(registerFixture);
