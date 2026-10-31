// What <ion-content> shares with the components Ionic lets you put inside it: the scroll metrics + `ionScroll`
// stream (content.getContentDimensions()) for <ion-infinite-scroll>, and the refresher registration for
// <ion-refresher>. Provided by IonContent (the single ion-content); see its header comment.
import React, { createContext, useContext } from 'react';
import type { RefresherOptions, RefresherState } from './refresherController';

export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number; // total content height
  contentHeight: number; // visible height
}

export interface RefresherReg {
  opts: RefresherOptions;
  enabled: boolean;
  content: React.ReactNode;
}

export interface ScrollCtx {
  getMetrics(): ScrollMetrics;
  subscribe(fn: () => void): () => void; // ion-content `ionScroll`
  registerRefresher(reg: RefresherReg | null): void;
}

export const ScrollContext = createContext<ScrollCtx | null>(null);
export const RefresherStateContext = createContext<RefresherState>('inactive');

export function useScrollCtx(): ScrollCtx {
  const c = useContext(ScrollContext);
  if (!c) {
    throw new Error('IonRefresher / IonInfiniteScroll must be inside IonContent');
  }
  return c;
}
