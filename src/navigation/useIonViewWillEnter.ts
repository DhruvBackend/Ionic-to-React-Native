// Ionic 3 ionViewWillEnter for RN screens (Phase 2 kit, 2026-11-03).
// Ionic runs it when the page first enters and every time it becomes the active page again (back from a pushed page,
// its tab re-selected), but NOT when a modal shown above it is dismissed: Ionic 3 presents modals in the overlay portal,
// so the page underneath never left (Profile S8 review, profile.ts:277 ViewProfile modal). React Navigation's 'focus'
// fires in both cases, so a blur caused by a modal page (src/navigation/ionicModalPages.json: the pages Ionic opens with a live
// modalCtrl.create) swallows the focus that follows it.
import { useContext, useEffect, useRef } from 'react';
import { NavigationContext } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import modalPages from './ionicModalPages.json';

const MODALS = new Set<string>(modalPages);

type NavState = { index?: number; routes: { name: string; state?: NavState }[] };

// The deepest focused route: the page the user is looking at.
export function focusedRouteName(root: NavState | undefined): string | undefined {
  let s = root;
  let name: string | undefined;
  while (s && s.routes.length) {
    const r = s.routes[s.index ?? s.routes.length - 1];
    name = r?.name;
    s = r?.state;
  }
  return name;
}

type Nav = { addListener: (ev: 'focus' | 'blur', fn: () => void) => () => void };

export function useIonViewWillEnter(
  callback: () => void,
  opts: { navigation?: Nav; topRouteName?: () => string | undefined } = {},
): void {
  const contextNav = useContext(NavigationContext) as Nav | undefined;
  const navigation = opts.navigation ?? contextNav;
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const topRef = useRef(opts.topRouteName);
  topRef.current = opts.topRouteName;

  useEffect(() => {
    if (!navigation) {
      return;
    }
    let modalAbove = false;
    const top = () =>
      topRef.current ? topRef.current() : navigationRef.isReady() ? focusedRouteName(navigationRef.getRootState() as any) : undefined;
    const offBlur = navigation.addListener('blur', () => {
      const name = top();
      modalAbove = !!name && MODALS.has(name);
    });
    const offFocus = navigation.addListener('focus', () => {
      if (modalAbove) {
        modalAbove = false; // NOTE (parity): dismissing an Ionic modal does not re-enter the page below
        return;
      }
      cbRef.current();
    });
    return () => {
      offBlur();
      offFocus();
    };
  }, [navigation]);
}
