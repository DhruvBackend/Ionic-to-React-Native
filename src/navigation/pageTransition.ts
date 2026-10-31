// Pure parts of the Ionic md page transition (plan Task 9 part 4): which transition a change of the stack state
// is, and the animation spec for it. Values and citations: src/theme/ionicMdPage.ts (pageTransition,
// modalTransition). IonStack.tsx draws it.
import { createContext } from 'react';
import { modalTransition, pageTransition } from '../theme/ionicMdPage';

export type Presentation = 'card' | 'modal';

export interface TransitionSpec {
  duration: number;
  easing: readonly [number, number, number, number];
  translateY: readonly [number, number];
  opacity: readonly [number, number];
}

// ion-nav pages: transition-md.js. Modal routes: ModalController's ModalMDSlideIn / ModalMDSlideOut.
export function enterSpec(p: Presentation): TransitionSpec {
  return p === 'modal' ? modalTransition.enter : pageTransition.enter;
}
export function leaveSpec(p: Presentation): TransitionSpec {
  return p === 'modal' ? modalTransition.leave : pageTransition.leave;
}

export type TransitionType = 'none' | 'push' | 'pop';

export interface TransitionPlan {
  type: TransitionType;
  entering?: string; // route key of the page that animates in (transition-md.js: forward)
  leaving?: string; // route key of the page that animates out (backward)
  under?: string; // route key that stays visible below the entering page until it has finished
}

// Ionic NavControllerBase._queueTrns: a transition only animates the new top page going forward (push) or the old
// top page going back (pop, popTo, popToRoot). setRoot / reset is INSTANT: setRoot goes through setPages, which sets
// opts.animate = false unless animate === true (nav-controller-base.js:145-152) and no Topbath code passes
// animate: true. Any other change of the stack also happens instantly.

// Presentation of the page being drawn: a ModalController page lives in its own overlay nav, so it has no page
// below it and no back button (view-controller.js:169-178 enableBack()).
export const PresentationContext = createContext<Presentation>('card');
export function planTransition(prevKeys: string[], nextKeys: string[]): TransitionPlan {
  if (prevKeys.length === 0 || nextKeys.length === 0) {
    return { type: 'none' };
  }
  const oldTop = prevKeys[prevKeys.length - 1];
  const newTop = nextKeys[nextKeys.length - 1];
  if (oldTop === newTop) {
    return { type: 'none' };
  }
  if (!prevKeys.includes(newTop)) {
    // forward: the previous top page stays visible underneath while the new one animates in
    return nextKeys.includes(oldTop) ? { type: 'push', entering: newTop, under: oldTop } : { type: 'none' };
  }
  if (!nextKeys.includes(oldTop)) {
    // back: the page that comes back was already below; only the old top animates out
    return { type: 'pop', leaving: oldTop };
  }
  return { type: 'none' };
}
