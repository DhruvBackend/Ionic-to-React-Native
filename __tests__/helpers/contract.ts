// expectContract(): checks that an RN call sends exactly what the Ionic call sent (plan Task 6).
//
// A contract (src/api/contracts/<endpoint with "/" → "__">.json) records one Ionic call site:
//   helper  – which dbservice method Ionic used (decides the header set)
//   server  – root (dd_api) | sfa (crm/api/app) | server_url (dd_api/index.php/app/)
//   body    – example body with the exact key structure. Leaf values are not compared, except
//             strings starting with "=" which must match exactly ("=App" → "App", "=" → "").
//             Arrays are checked by the shape of their first element. null = no body (GET).
//
// The request is recorded at the transport, so the call still gets its normal (mock) response.
import fs from 'fs';
import path from 'path';
import { db, getTransport, setTransport, type ApiRequest } from '../../src/api/client';

export type Helper = 'onPostRequestDataFromApi' | 'onGetRequestDataFromApi' | 'post_rqst' | 'get_rqst';

export interface Contract {
  endpoint: string;
  helper: Helper;
  server: 'root' | 'sfa' | 'server_url';
  method: 'POST' | 'GET';
  headers: 'user' | 'tokenOnly';
  body: unknown;
  ionicSource: string; // file:line of the Ionic call, for reviewers
}

const HEADERS_BY_HELPER: Record<Helper, Contract['headers']> = {
  onPostRequestDataFromApi: 'user',
  onGetRequestDataFromApi: 'user',
  post_rqst: 'tokenOnly',
  get_rqst: 'tokenOnly',
};

const ANY = '<any>';

export function loadContract(endpoint: string): Contract {
  const file = path.resolve(__dirname, '../../src/api/contracts', endpoint.replace(/\//g, '__') + '.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function baseUrl(server: Contract['server']): string {
  return { root: db.rootUrl, sfa: db.rootUrlSfa, server_url: db.server_url }[server];
}

// What the contract expects, with free leaves replaced by ANY.
function expectedShape(c: unknown): unknown {
  if (typeof c === 'string' && c.startsWith('=')) return c.slice(1);
  if (Array.isArray(c)) return c.length ? [expectedShape(c[0])] : [];
  if (c && typeof c === 'object') {
    return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, expectedShape(v)]));
  }
  return ANY;
}

// The actual value, reduced the same way, guided by the contract (extra keys stay visible in the diff).
function actualShape(a: unknown, c: unknown): unknown {
  if (typeof c === 'string' && c.startsWith('=')) return a;
  if (Array.isArray(c)) {
    if (!Array.isArray(a)) return a;
    return c.length ? (a.length ? [actualShape(a[0], c[0])] : []) : a.length ? a : [];
  }
  if (c && typeof c === 'object') {
    if (!a || typeof a !== 'object' || Array.isArray(a)) return a;
    return Object.fromEntries(
      Object.entries(a as Record<string, unknown>).map(([k, v]) => [k, k in (c as object) ? actualShape(v, (c as any)[k]) : v]),
    );
  }
  // Free leaf: any primitive is fine, a nested object/array where the contract has a leaf is not.
  return a !== null && typeof a === 'object' ? a : ANY;
}

export async function expectContract(
  contract: string | Contract,
  invoke: () => Promise<unknown>,
  opts: { loggedIn?: boolean } = {},
): Promise<void> {
  const c = typeof contract === 'string' ? loadContract(contract) : contract;
  expect(HEADERS_BY_HELPER[c.helper]).toBe(c.headers); // the contract file itself must be consistent

  if (opts.loggedIn) {
    db.userStorageData = { ...(db.userStorageData ?? {}), token: 'contract-test-token' };
  }

  // The headers depend on the token present WHEN the request is built (a login call stores one afterwards; the start-up
  // profile call loads one first), so record it per request.
  const calls: ApiRequest[] = [];
  const tokens: unknown[] = [];
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    tokens.push((db.userStorageData as any)?.token);
    return previous(req);
  });
  try {
    await invoke();
  } finally {
    setTransport(previous);
  }

  const callIndex = calls.findIndex(r => r.fn === c.endpoint);
  const call = calls[callIndex];
  if (!call) {
    throw new Error(
      `expectContract: ${c.endpoint} was never called (calls: ${calls.map(r => r.fn).join(', ') || 'none'}). Ionic: ${c.ionicSource}`,
    );
  }

  expect({ endpoint: c.endpoint, url: call.url, method: call.method }).toEqual({
    endpoint: c.endpoint,
    url: baseUrl(c.server) + c.endpoint,
    method: c.method,
  });

  const token = tokens[callIndex];
  const expectedHeaders =
    c.headers === 'tokenOnly'
      ? ['Content-Type', 'Token']
      : token
        ? ['Authorization', 'Content-Type', 'Token']
        : ['Content-Type'];
  expect({ endpoint: c.endpoint, headers: Object.keys(call.headers).sort() }).toEqual({
    endpoint: c.endpoint,
    headers: expectedHeaders,
  });

  if (c.body === null) {
    expect({ endpoint: c.endpoint, body: call.body }).toEqual({ endpoint: c.endpoint, body: undefined });
  } else {
    const sent = call.body === undefined ? undefined : JSON.parse(call.body);
    expect({ endpoint: c.endpoint, body: actualShape(sent, c.body) }).toEqual({
      endpoint: c.endpoint,
      body: expectedShape(c.body),
    });
  }
}
