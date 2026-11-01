// MOCK-mode controls for the native wrappers (plan Task 10). In MODE 'MOCK' (the Jest default) no wrapper touches
// native code; each returns the plan's fixed value unless a test forces a failure here.
import { MODE } from '../config/env';
import { fail, type NativeFailureReason, type NativeResult } from './result';

// Wrappers that return a NativeResult and can therefore be forced to fail.
export type NativeName =
  | 'scanner'
  | 'camera'
  | 'location'
  | 'share'
  | 'browser'
  | 'geocode'
  | 'navigate'
  | 'upload'
  | 'network';

export const isMock = (): boolean => MODE === 'MOCK';

let mockScan = 'TB-MOCK-0001';
const failures = new Map<NativeName, { reason: NativeFailureReason; message?: string }>();

export function setMockScan(code: string): void {
  mockScan = code;
}

export const getMockScan = (): string => mockScan;

export function setMockNativeFailure(name: NativeName, reason: NativeFailureReason, message?: string): void {
  failures.set(name, { reason, message });
}

export function resetMockNative(): void {
  mockScan = 'TB-MOCK-0001';
  failures.clear();
}

// The forced failure for `name`, if a test set one.
export function mockFailure(name: NativeName): Extract<NativeResult<never>, { ok: false }> | null {
  const f = failures.get(name);
  return f ? (fail(f.reason, f.message) as Extract<NativeResult<never>, { ok: false }>) : null;
}
