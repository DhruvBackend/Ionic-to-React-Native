// Wires the hardware back button to the Ionic rules in ./backButton.ts. Like Ionic's
// registerBackButtonAction, the app always handles the press itself.
import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { db } from '../api/client';
import { navigationRef } from '../navigation/navigationRef';
import { tabsFor } from '../navigation/tabs';
import { dismissTopOverlay, isOverlayOpen } from '../ui/overlays';
import { confirmExit, handleBack } from './backButton';

export function useBackButton() {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const action = handleBack({
        overlayOpen: isOverlayOpen(),
        routeName: navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name ?? '' : '',
        canGoBack: navigationRef.isReady() && navigationRef.canGoBack(),
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
