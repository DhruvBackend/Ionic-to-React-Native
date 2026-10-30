// In-memory state for MOCK handlers, so a write is visible to later reads
// (scan a coupon → the wallet balance goes up). Reset between tests with resetMock().
const data = new Map<string, unknown>();

export const store = {
  get<T>(key: string): T | undefined {
    return data.get(key) as T | undefined;
  },
  set(key: string, value: unknown): void {
    data.set(key, value);
  },
  reset(): void {
    data.clear();
  },
};
