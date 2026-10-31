// <ion-infinite-scroll threshold="100px" (ionInfinite)="loadData($event)" *ngIf="flag!=1"> with
// <ion-infinite-scroll-content loadingSpinner="bubbles" loadingText="Loading more data...">
// (components/infinite-scroll/infinite-scroll.js, infinite-scroll-content.js, infinite-scroll.scss).
// Must be the last child of an IonContent. `*ngIf="flag!=1"` becomes conditional rendering by the page: a new
// instance starts `enabled` again, exactly like a re-created Angular directive.
//
// Trigger (infinite-scroll.js:_onScroll): on a scroll event at least 32 ms after the last check, with state neither
// loading nor disabled and a non-zero element height:
//   scrollHeight - infiniteHeight - scrollTop - contentHeight - threshold < 0  ->  state = loading, emit ionInfinite.
// A '%' threshold is a fraction of the visible height, otherwise pixels. No scroll event, no check: a list shorter than
// the screen never triggers (same as Ionic).
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { infiniteMd, scrollMetrics } from '../../theme/ionicMdScroll';
import { fontFor } from '../../theme/typography';
import { IonSpinner, type SpinnerName } from './IonSpinner';
import { useScrollCtx } from './contentContext';

export type InfiniteState = 'enabled' | 'loading' | 'disabled';

export interface InfiniteScrollHandle {
  readonly state: InfiniteState;
  complete(): void; // loading -> enabled (position bottom)
  enable(shouldEnable: boolean): void; // enable(false) -> disabled: the content is hidden and scroll is ignored
  waitFor(action: Promise<unknown>): void; // action.then(complete, complete)
}

const StateContext = createContext<InfiniteState>('enabled');

export interface IonInfiniteScrollProps {
  threshold?: string; // default '15%'
  enabled?: boolean; // [enabled]
  onInfinite?: (infiniteScroll: InfiniteScrollHandle) => void; // (ionInfinite)
  children?: React.ReactNode;
}

export function IonInfiniteScroll({
  threshold = infiniteMd.defaultThreshold,
  enabled = true,
  onInfinite,
  children,
}: IonInfiniteScrollProps) {
  const ctx = useScrollCtx();
  const [state, setStateRaw] = useState<InfiniteState>(enabled ? 'enabled' : 'disabled');
  const stateRef = useRef<InfiniteState>(state);
  const height = useRef(0);
  const lastCheck = useRef(0);
  const cb = useRef(onInfinite);
  cb.current = onInfinite;
  const thr = useRef(threshold);
  thr.current = threshold;

  const handle = useMemo<InfiniteScrollHandle>(() => {
    const setState = (s: InfiniteState) => {
      stateRef.current = s;
      setStateRaw(s);
    };
    const h: InfiniteScrollHandle = {
      get state() {
        return stateRef.current;
      },
      complete() {
        if (stateRef.current !== 'loading') {
          return;
        }
        setState('enabled');
      },
      enable(shouldEnable) {
        setState(shouldEnable ? 'enabled' : 'disabled');
      },
      waitFor(action) {
        const done = () => h.complete();
        action.then(done, done);
      },
    };
    return h;
  }, []);
  const setState = (s: InfiniteState) => {
    stateRef.current = s;
    setStateRaw(s);
  };

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    handle.enable(enabled); // `set enabled(v) { this.enable(v) }`
  }, [enabled, handle]);

  useEffect(
    () =>
      ctx.subscribe(() => {
        if (stateRef.current === 'loading' || stateRef.current === 'disabled') {
          return;
        }
        const now = Date.now();
        if (lastCheck.current + infiniteMd.throttleMs > now) {
          return;
        }
        lastCheck.current = now;
        if (!height.current) {
          return; // `if (!infiniteHeight) return 3`
        }
        const d = ctx.getMetrics();
        const t = thr.current;
        const thresholdPx = t.includes('%') ? d.contentHeight * (parseFloat(t) / 100) : parseFloat(t);
        const distance = d.scrollHeight - height.current - d.scrollTop - d.contentHeight - thresholdPx;
        if (distance < 0) {
          // infinite-scroll.js:255-262: the state change and the emit run in `_dom.write` (the next frame), where the
          // state is checked again; a synchronous complete() inside the handler therefore sees `loading`
          requestAnimationFrame(() => {
            if (stateRef.current !== 'loading' && stateRef.current !== 'disabled') {
              setState('loading');
              cb.current?.(handle);
            }
          });
        }
      }),
    [ctx, handle],
  );

  return (
    <View
      testID="ion-infinite-scroll"
      onLayout={e => {
        height.current = e.nativeEvent.layout.height;
      }}
      style={styles.host}
    >
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </View>
  );
}

export interface IonInfiniteScrollContentProps {
  loadingSpinner?: SpinnerName; // config default 'ios' (not built; Topbath always passes 'bubbles')
  loadingText?: string;
}

export function IonInfiniteScrollContent({
  loadingSpinner = infiniteMd.loadingSpinner,
  loadingText,
}: IonInfiniteScrollContentProps) {
  const state = useContext(StateContext);
  if (state === 'disabled') {
    return null; // ion-infinite-scroll-content[state=disabled]{display:none}
  }
  return (
    <View testID="ion-infinite-scroll-content" style={styles.content}>
      {state === 'loading' ? (
        <View testID="infinite-loading" style={styles.loading}>
          <View style={styles.spinnerRow}>
            <IonSpinner name={loadingSpinner} color={infiniteMd.color} />
          </View>
          {loadingText ? (
            <Text style={[fontFor(400), styles.text]}>{loadingText}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { width: '100%' }, // ion-infinite-scroll{display:block;width:100%}
  // ion-infinite-scroll-content{display:flex;flex-direction:column;justify-content:center;text-align:center;min-height:84px}
  content: { justifyContent: 'center', minHeight: infiniteMd.contentMinHeight },
  loading: { width: '100%', marginBottom: infiniteMd.spinnerMarginBottom, alignItems: 'center' },
  spinnerRow: { height: scrollMetrics.infiniteSpinnerRow, justifyContent: 'flex-start' },
  text: {
    fontSize: infiniteMd.textSize,
    color: infiniteMd.color,
    textAlign: 'center',
    marginTop: infiniteMd.textMarginTop,
    marginHorizontal: infiniteMd.textMarginHorizontal,
    includeFontPadding: false,
  },
});
