// MOCK mode (the default) must never touch the network and must answer from local handlers.
import { db } from '../src/api/client';
import { registerMock } from '../src/api/mock';

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
