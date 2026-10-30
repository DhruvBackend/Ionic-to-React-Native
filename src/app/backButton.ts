// Ported from: src/app/app.component.ts:165-243 (platform.registerBackButtonAction).
// The rules are checked in Ionic's order; page names are the Ionic class names without "Page".
import { BackHandler } from 'react-native';
import i18n from '../i18n';
import { showAlert } from '../ui/overlays';

export type BackAction = 'dismissOverlay' | 'ignore' | 'pop' | 'selectTab0' | 'confirmExit';

const IGNORE = ['Home', 'MobileLogin', 'Otp', 'DealerHome', 'Dashboard', 'SelectRegistrationType'];
const TAB_ROOTS_TO_FIRST_TAB = ['GiftList', 'Transaction', 'Profile', 'MainHome'];

export function handleBack(state: { overlayOpen: boolean; routeName: string; canGoBack: boolean }): BackAction {
  if (state.overlayOpen) {
    return 'dismissOverlay';
  }
  if (IGNORE.includes(state.routeName)) {
    return 'ignore';
  }
  if (state.routeName === 'DealerAddorder') {
    return 'ignore';
  }
  if (state.canGoBack) {
    return 'pop';
  }
  // NOTE (parity): OfferList and PointList are tab roots too, but Ionic only lists these four;
  // the others fall through to the exit question.
  if (TAB_ROOTS_TO_FIRST_TAB.includes(state.routeName)) {
    return 'selectTab0';
  }
  return 'confirmExit';
}

// The translated "App termination" alert (:205-233).
export function confirmExit() {
  showAlert({
    title: i18n.t('App termination'),
    message: i18n.t('Are you sure you want Exit?'),
    buttons: [{ text: i18n.t('Stay') }, { text: i18n.t('Exit'), handler: () => BackHandler.exitApp() }],
  });
}
