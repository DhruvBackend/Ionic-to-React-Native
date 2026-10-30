// Ported from: src/pages/login-section/mobile-login/mobile-login.ts:104-112 and otp/otp.ts:168-207
//
// NOTE (security, not changed): the login OTP is generated on the phone, sent to the server only so
// it can be texted, and checked on the phone. Five hardcoded numbers always get 123456. A colleague
// owns the server-side fix; when it lands, this module is the one place to replace (spec §6.2).

export const BYPASS_NUMBERS = ['9896356568', '7840871141', '9560533107', '9958680038', '1212121212'];

// Math.floor(100000 + Math.random() * 900000) — a number, not a string, as in Ionic.
export function randomOtp(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

// NOTE (parity): test numbers get the string '123456', everyone else a number; the request body
// therefore carries "123456" vs 123456 exactly as the Ionic app sends it.
export function generateLoginOtp(mobileNo: string): string | number {
  return BYPASS_NUMBERS.includes(mobileNo) ? '123456' : randomOtp();
}

// Ionic: if (this.data.otp == this.smsOTP) — loose equality, so '123456' matches 123456.
export function otpMatches(input: unknown, expected: unknown): boolean {
  // eslint-disable-next-line eqeqeq
  return input != null && input !== '' && input == expected;
}
