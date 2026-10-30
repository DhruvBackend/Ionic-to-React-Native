// MOCK mode (forced for all tests in jest.setup.js) must never touch the network and must answer
// from local handlers or shared endpoint fixtures (plan Task 5).
import { db } from '../src/api/client';
import {
  fixture,
  registerFixture,
  registerMock,
  resetMock,
  setFixtureVariant,
  store,
} from '../src/api/mock';

const FX = {
  endpoint: 'test/fx',
  server: 'root' as const,
  variants: { default: { status: 'SUCCESS', n: 1 }, other: { status: 'NOT FOUND' } },
};

beforeEach(() => resetMock());

test('MOCK mode answers locally and never calls fetch', async () => {
  const f = jest.fn();
  (globalThis as any).fetch = f;
  registerMock('test/echo', body => ({ status: 'success', got: body }));
  const res = await db.onPostRequestDataFromApi({ x: 1 }, 'test/echo', db.rootUrl);
  expect(res).toEqual({ status: 'success', got: { x: 1 } });
  expect(f).not.toHaveBeenCalled();
});

test('unknown endpoint returns an error object instead of crashing', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const res = await db.onGetRequestDataFromApi('nope/nothing', db.rootUrl);
  expect(res.status).toBe('error');
  warn.mockRestore();
});

test('a fixture answers with its default variant, and switching variant changes the answer', async () => {
  registerFixture(FX);
  expect(await db.onPostRequestDataFromApi({}, 'test/fx', db.rootUrl)).toEqual({ status: 'SUCCESS', n: 1 });
  setFixtureVariant('test/fx', 'other');
  expect((await db.onPostRequestDataFromApi({}, 'test/fx', db.rootUrl)).status).toBe('NOT FOUND');
});

test('setting a variant the fixture does not have throws (catches typos in tests)', () => {
  registerFixture(FX);
  expect(() => setFixtureVariant('test/fx', 'otehr')).toThrow(/otehr/);
  expect(() => setFixtureVariant('no/such', 'default')).toThrow(/no\/such/);
});

test('resetMock restores default variants and clears the store', async () => {
  registerFixture(FX);
  setFixtureVariant('test/fx', 'other');
  store.set('k', 1);
  resetMock();
  expect(store.get('k')).toBeUndefined();
  expect((await db.onPostRequestDataFromApi({}, 'test/fx', db.rootUrl)).status).toBe('SUCCESS');
});

test('a registered handler wins over a fixture and can read the fixture', async () => {
  registerFixture(FX);
  registerMock('test/fx', () => ({ ...fixture('test/fx'), from: 'handler' }));
  expect(await db.onPostRequestDataFromApi({}, 'test/fx', db.rootUrl)).toEqual({
    status: 'SUCCESS',
    n: 1,
    from: 'handler',
  });
});

test('responses are copies: a screen mutating one cannot change the next', async () => {
  registerFixture(FX);
  const first = await db.onPostRequestDataFromApi({}, 'test/fx', db.rootUrl);
  first.n = 99;
  expect((await db.onPostRequestDataFromApi({}, 'test/fx', db.rootUrl)).n).toBe(1);
});

test('the store keeps state between calls (stateful mocks)', async () => {
  registerMock('test/add', body => {
    store.set('points', (store.get<number>('points') ?? 0) + body.points);
    return { status: 'SUCCESS' };
  });
  registerMock('test/balance', () => ({ points: store.get<number>('points') ?? 0 }));
  await db.onPostRequestDataFromApi({ points: 5 }, 'test/add', db.rootUrl);
  await db.onPostRequestDataFromApi({ points: 3 }, 'test/add', db.rootUrl);
  expect((await db.onPostRequestDataFromApi({}, 'test/balance', db.rootUrl)).points).toBe(8);
});
