// The logged-in user, stored under the Ionic key 'userStorageData' and mirrored in db.userStorageData
// (Ionic: dbService.userStorageData).
//
// NOTE (security, not changed): the JWT is stored unencrypted and logout only clears the phone,
// exactly as in Ionic.
import { db } from '../api/client';
import { storage } from '../storage';

const KEY = 'userStorageData';

export interface StoredUser {
  id?: string | number;
  type?: string;
  token?: string;
  loginType?: string;
  status?: string;
  [field: string]: unknown;
}

export const session = {
  // The stored value as-is, like Ionic's storage.get. Anything that isn't an object (missing,
  // corrupt text) comes back as null so callers can treat it as "no token".
  async load(): Promise<StoredUser | null> {
    let value: unknown;
    try {
      value = await storage.get(KEY);
    } catch {
      return null;
    }
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as StoredUser) : null;
  },

  // otp.ts:103-107 / registration.ts:666-672: the user object plus token and loginType 'CMS'.
  async saveLoginResult(result: { token: string; user: StoredUser; [field: string]: unknown }): Promise<void> {
    const user = { ...result.user, token: result.token, loginType: 'CMS' };
    await storage.set(KEY, user);
    db.userStorageData = user;
  },

  // Ionic writes {} rather than removing the key.
  async clear(): Promise<void> {
    await storage.set(KEY, {});
    db.userStorageData = {};
  },
};
