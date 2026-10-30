// MOCK backend: answers every API call locally so all screens work without server access.
//
// Response shapes are inferred from the fields each Ionic page reads from the response
// (e.g. home.ts reads resp.karigar.balance_point). Handlers are added screen by screen
// as they are ported; see docs/PLAN.md.
//
// Write endpoints change the in-memory store so later reads reflect them
// (scan a coupon → points go up in history).

export type MockHandler = (body: any) => any;

const handlers: Record<string, MockHandler> = {};

export function registerMock(fn: string, handler: MockHandler) {
  handlers[fn] = handler;
}

export const MOCK_DELAY_MS = 300; // feels like a network call, so loaders get exercised

export async function mockRequest(method: 'GET' | 'POST', fn: string, body?: any, _serverURL?: string): Promise<any> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), MOCK_DELAY_MS));
  const handler = handlers[fn];
  if (!handler) {
    console.warn(`[MOCK] no handler for ${method} ${fn}`);
    return { status: 'error', statusMsg: 'error', msg: `MOCK: no handler for ${fn}` };
  }
  // Deep-copy so screens can't mutate the store by accident.
  return JSON.parse(JSON.stringify(handler(body ?? {})));
}

export function hasMock(fn: string) {
  return fn in handlers;
}
