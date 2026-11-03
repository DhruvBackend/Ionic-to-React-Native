// Wires the hardware back button to the Ionic rules in ./backButton.ts. Like Ionic's
// registerBackButtonAction, the app always handles the press itself.
import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { db } from '../api/client';
import { activeNavCanGoBack, modalPortalNav, navigationRef } from '../navigation/navigationRef';
import { tabsFor } from '../navigation/tabs';
import { dismissTopOverlay, isModalOpen, isOverlayOpen } from '../ui/overlays';
import { confirmExit, handleBack } from './backButton';

export function useBackButton() {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // NOTE (parity): while an ionic-selectable / select-searchable modal is open, Ionic's
      // App.getActiveNavs() returns the modal portal's nav (app.js:172-175), whose only view is the modal page
      // (enableBack() false). The Topbath handler (app.component.ts:165-243) therefore skips the page rules and
      // ends in the "App termination" alert shown over the modal.
      const modal = isModalOpen();
      // Ionic modal pages (and pages a modal pushes into its portal) are the active nav too: see modalPortalNav.
      const root = navigationRef.isReady() ? (navigationRef.getRootState() as any) : undefined;
      const portal = modal ? null : modalPortalNav(root);
      const action = handleBack({
        overlayOpen: isOverlayOpen(),
        routeName: modal
          ? 'IonicSelectableModalComponent'
          : portal
            ? portal.routeName
            : navigationRef.isReady()
              ? navigationRef.getCurrentRoute()?.name ?? ''
              : '',
        canGoBack: modal ? false : portal ? portal.canGoBack : navigationRef.isReady() && activeNavCanGoBack(root),
      });
      switch (action) {
        case 'dismissOverlay':
          dismissTopOverlay();
          break;
        case 'pop':
          navigationRef.goBack();
          break;
        case 'selectTab0': {
          const first = tabsFor(db.userStorageData?.type)[0];
          if (first) {
            navigationRef.navigate(first.icon);
          }
          break;
        }
        case 'confirmExit':
          confirmExit();
          break;
        case 'ignore':
          break;
      }
      return true;
    });
    return () => sub.remove();
  }, []);
}
