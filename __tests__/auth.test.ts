// src/auth: session storage and the Ionic OTP logic, copied unchanged (plan Task 8).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../src/api/client';
import { BYPASS_NUMBERS, generateLoginOtp, otpMatches, randomOtp } from '../src/auth/otp';
import { session } from '../src/auth/session';
import { storage } from '../src/storage';

beforeEach(async () => {
  await AsyncStorage.clear();
  db.userStorageData = undefined;
});

describe('otp (mobile-login.ts:104-112, otp.ts:201-207)', () => {
  test('the five Ionic test numbers always get the string "123456"', () => {
    expect(BYPASS_NUMBERS).toEqual(['9896356568', '7840871141', '9560533107', '9958680038', '1212121212']);
    for (const n of BYPASS_NUMBERS) {
      expect(generateLoginOtp(n)).toBe('123456');
    }
  });

  test('any other number gets a random 6-digit number (a number, as in Ionic)', () => {
    const otp = generateLoginOtp('9876543210');
    expect(typeof otp).toBe('number');
    expect(otp).toBeGreaterThanOrEqual(100000);
    expect(otp).toBeLessThanOrEqual(999999);
    expect(randomOtp()).toBeLessThanOrEqual(999999);
  });

  test('the check is a loose == like Ionic', () => {
    expect(otpMatches('123456', 123456)).toBe(true);
    expect(otpMatches('123457', 123456)).toBe(false);
    expect(otpMatches('', undefined)).toBe(false);
  });
});

describe('session', () => {
  test('saveLoginResult stores user + token + loginType CMS (otp.ts:103-107)', async () => {
    await session.saveLoginResult({ status: 'SUCCESS', token: 'jwt', user: { id: 7, type: 'Plumber', status: 'Verified' } });
    const stored = await storage.get('userStorageData');
    expect(stored).toEqual({ id: 7, type: 'Plumber', status: 'Verified', token: 'jwt', loginType: 'CMS' });
    expect(db.userStorageData).toEqual(stored);
  });

  test('clear writes {} (Ionic never removes the key)', async () => {
    await storage.set('userStorageData', { token: 'jwt' });
    await session.clear();
    expect(await storage.get('userStorageData')).toEqual({});
    expect(db.userStorageData).toEqual({});
  });

  test.each([
    ['missing', undefined],
    ['empty object', {}],
    ['empty token', { token: '' }],
  ])('load returns no token for %s data', async (_label, value) => {
    if (value !== undefined) {
      await storage.set('userStorageData', value);
    }
    expect((await session.load())?.token ?? '').toBe('');
  });

  test('load survives corrupt stored text', async () => {
    await AsyncStorage.setItem('userStorageData', 'garbage{');
    const loaded = await session.load();
    expect(loaded?.token ?? '').toBe('');
  });
});
