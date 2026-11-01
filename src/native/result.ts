// Result type shared by every native wrapper (plan Task 10). A wrapper never throws or rejects: failures
// come back as { ok: false, reason }, so a screen decides what the Ionic page did in its error callback.
export type NativeFailureReason = 'denied' | 'cancelled' | 'unavailable' | 'error';

export type NativeResult<T> = { ok: true; value: T } | { ok: false; reason: NativeFailureReason; message?: string };

export const ok = <T>(value: T): NativeResult<T> => ({ ok: true, value });

export const fail = (reason: NativeFailureReason, message?: string): NativeResult<never> =>
  message === undefined ? { ok: false, reason } : { ok: false, reason, message };

// Runs a real implementation and turns anything it throws or rejects with into { ok: false, reason: 'error' }.
export async function guard<T>(run: () => Promise<NativeResult<T>>): Promise<NativeResult<T>> {
  try {
    return await run();
  } catch (e) {
    return fail('error', e instanceof Error ? e.message : String(e));
  }
}
