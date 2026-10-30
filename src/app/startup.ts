// Ported from: src/app/app.component.ts:137-160 (storage.get('userStorageData')) and
// :398-462 (onGetLoggedInUserDataHandler). Decides the first page, like Ionic setting rootPage.
import { db } from '../api/client';
import { session } from '../auth/session';
import { showAlert } from '../ui/overlays';

export interface StartDecision {
  route: 'Language' | 'Tabs' | 'Blank';
  startPushAfterMs?: 2000;
}

const TABS: StartDecision = { route: 'Tabs', startPushAfterMs: 2000 };

export async function decideStartRoute(): Promise<StartDecision> {
  const stored = await session.load();
  db.userStorageData = stored;

  const token = stored && stored.token ? stored.token : '';
  if (!token) {
    return { route: 'Language' };
  }
  if (stored!.loginType !== 'CMS') {
    // NOTE (parity): the SFA/Employee/DrLogin branches are commented out in Ionic
    // (app.component.ts:258-299), so no root page is set: the app stays blank.
    return { route: 'Blank' };
  }

  let result: any;
  try {
    result = await db.onPostRequestDataFromApi({ karigar_id: stored!.id }, 'app_karigar/profile', db.rootUrl);
  } catch {
    // Ionic error callback: Tabs anyway.
    return TABS;
  }

  if (result?.status === 'SUCCESS') {
    const karigar = result.karigar;
    if (!karigar || typeof karigar !== 'object') {
      // NOTE (parity): Ionic reads karigarData.del here and throws inside subscribe, so no root
      // page is ever set (blank screen). Copied without the crash.
      return { route: 'Blank' };
    }
    if (karigar.del === '1') {
      showAlert({ title: 'Message!', subTitle: 'Your Account has been suspended', buttons: ['OK'] });
      await session.clear();
      return { route: 'Language' };
    }
    // Verified and not-verified both go to Tabs (:416-438).
    return TABS;
  }

  // NOTE (parity): any other status clears the session and sets no root page (:441-446): blank screen.
  await session.clear();
  return { route: 'Blank' };
}
