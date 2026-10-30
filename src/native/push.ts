// Push notifications (Ionic: initPushNotification, app.component.ts:896-1015).
// Implemented in plan Phase 8 behind client.features.push; off for Topbath (its production build has
// no push plugin), so start-up calls this and nothing happens.
import { client } from '../config/client';

export function initPushNotification(): void {
  if (!client.features.push) {
    return;
  }
  // Phase 8: register with FCM, send the token to app_karigar/update_token, route taps by type.
}
