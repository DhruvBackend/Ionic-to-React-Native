// <ion-content> (components/content/content.js, content.md.scss) and the flex grid <ion-grid>/<ion-row>/<ion-col>
// (components/grid/grid.scss). Values and citations: src/theme/ionicMdContent.ts (contentMd, gridMd),
// src/theme/ionicMdScroll.ts (refresherMd, infiniteMd).
//
// IonContent is THE single ion-content. Besides the scroll surface it hosts everything Ionic puts inside <ion-content>:
//  - the ScrollContext that <ion-infinite-scroll> subscribes to (scroll metrics + `ionScroll`, content.getContentDimensions()),
//  - the <ion-refresher> pull-to-refresh (registered by IonRefresher, drawn behind the scroll layer),
//  - `fixedContent` (Ionic's fixed-content layer: <ion-fab>, which is position:absolute over the scroll).
//
// Pull-to-refresh on Android: the pull is driven by NATIVE scrolling into a spacer, not by a JS gesture.
//  Why not PanResponder + translateY: Android's ReactScrollView.onInterceptTouchEvent takes the gesture over after the
//  touch slop even when scrollTop is 0 and notifies JS of a native gesture start, which terminates the JS responder
//  whatever onPanResponderTerminationRequest says. Disabling the ScrollView from JS only takes effect after a re-render,
//  and at touch-down the finger's direction is unknown, so a JS-owned pull would lose that race or break normal scrolling.
//  How it works instead: while a refresher is registered, the scroll content gets `H = pullMax + 40` px of extra top padding
//  and rests at contentOffset H (that is scrollTop 0). Pulling down is then an ordinary, native, 1:1 scroll from offset H
//  towards 0: the spacer is transparent, so the refresher layer behind shows through exactly like Ionic exposes it while
//  .scroll-content translates down. offset < H <=> pull distance dy = H - offset, which feeds the same RefresherController
//  state machine (pulling < pullMin <= ready <= pullMax < refresh). On finger-up (onScrollEndDrag) `controller.end()`
//  decides; the hang position (pullMin), the close (0) and the 120 ms complete delay are programmatic scrollTo calls to
//  H - y. A fling that carries a normal scroll past the top is clamped back to H (Ionic only starts a pull when the touch
//  STARTED at scrollTop 0; a drag that started lower is held at H as well).
//  RN-only trade-offs: native scroll moves the content from the end of the touch slop (~8 dp), and the snap animations use
//  the platform's scroll animation, not the 320 ms cubic-bezier. While refreshing / cancelling / completing the scroll is
//  frozen (scrollEnabled false; programmatic scrollTo still works); during pulling / ready it must stay enabled because the
//  finger's scroll IS the pull.
//  The refresher CSS `.has-refresher>.scroll-content{margin-top:-1px;border-top:1px solid #ddd}` becomes a 1px #ddd line
//  just above the content, hidden under the header at rest. Content background: the scroll layer is transparent and the
//  ion-content background shows through (`ion-content.has-refresher>.scroll-content{background-color:inherit}`).
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colWidthPercent, contentMd, gridMd } from '../../theme/ionicMdContent';
import { refresherMd } from '../../theme/ionicMdScroll';
import {
  RefresherStateContext,
  ScrollContext,
  type RefresherReg,
  type ScrollCtx,
  type ScrollMetrics,
} from './contentContext';
import { RefresherController, type RefresherState } from './refresherController';

export interface IonContentProps extends Omit<ScrollViewProps, 'style' | 'contentContainerStyle'> {
  padding?: boolean; // the `padding` attribute: 16px all round ([I] app.scss content-padding('md'))
  noPadding?: boolean; // `ion-app [no-padding], [no-padding] .scroll-content { padding: 0 }` (content.scss:88-91)
  style?: StyleProp<ViewStyle>; // `<ion-content style="background: #f8f8f8">` and page classes: the ion-content element
  contentStyle?: StyleProp<ViewStyle>; // the `.scroll-content` element
  fixedContent?: React.ReactNode; // Ionic's fixed-content layer (<ion-fab>): absolutely positioned over the scroll
  // `position: sticky` children (e.g. GiftList `.fix`): indices into the screen's own children; the refresher spacer is skipped
  stickyChildIndices?: number[];
  testID?: string;
}

// The ref: a ScrollView-like handle whose offsets are Ionic scrollTop values (the refresher spacer is hidden).
export interface IonContentHandle {
  scrollTo(opts: { x?: number; y?: number; animated?: boolean }): void;
  scrollToEnd(opts?: { animated?: boolean }): void;
  getScrollView(): React.ComponentRef<typeof ScrollView> | null;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

function flattenStyle(s: StyleProp<ViewStyle>): ViewStyle {
  return StyleSheet.flatten(s) ?? {};
}

function topPadding(s: ViewStyle): number {
  const v = s.paddingTop ?? s.paddingVertical ?? s.padding;
  return typeof v === 'number' ? v : 0;
}

export const IonContent = forwardRef<IonContentHandle, IonContentProps>(function IonContentBase(
  {
    padding,
    noPadding,
    style,
    contentStyle,
    fixedContent,
    stickyChildIndices,
    children,
    testID = 'ion-content',
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    onContentSizeChange,
    onLayout,
    scrollEnabled = true,
    keyboardShouldPersistTaps = 'handled', // taps on controls while the keyboard is up must not be swallowed
    ...rest
  },
  ref,
) {
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [reg, setReg] = useState<RefresherReg | null>(null);
  const [rstate, setRstate] = useState<RefresherState>('inactive');
  const [viewport, setViewport] = useState(0);
  const metrics = useRef<ScrollMetrics>({ scrollTop: 0, scrollHeight: 0, contentHeight: 0 });
  const listeners = useRef(new Set<() => void>());
  const offset = useRef(0);
  const dragging = useRef(false);
  const noPull = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shift = useRef<number | null>(null);
  const prevSpacer = useRef(0);

  // spacer height: room above scrollTop 0 for the pull (0 without an enabled refresher)
  const spacer = reg && reg.enabled ? (reg.opts.pullMax ?? refresherMd.pullMax) + refresherMd.overscrollExtra : 0;
  const spacerRef = useRef(spacer);
  spacerRef.current = spacer;

  const scrollToRaw = useCallback((y: number, animated: boolean) => {
    scroll.current?.scrollTo({ x: 0, y, animated });
  }, []);

  const controller = useMemo(
    () =>
      new RefresherController({
        setState: setRstate,
        // Move the content to translateY(to): offset = spacer - to
        translate(to, durationMs, delayMs) {
          if (durationMs <= 0 && dragging.current) {
            return; // the finger already put the content there
          }
          clearTimeout(timer.current);
          const run = () => scrollToRaw(spacerRef.current - to, durationMs > 0);
          if (delayMs > 0) {
            timer.current = setTimeout(run, delayMs);
          } else {
            run();
          }
        },
      }),
    [scrollToRaw],
  );
  controller.opts = reg?.opts ?? {};
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      controller.destroy();
    },
    [controller],
  );

  // spacer appeared / vanished / changed: keep the visible content where it was
  useLayoutEffect(() => {
    const prev = prevSpacer.current;
    prevSpacer.current = spacer;
    if (prev === spacer) {
      return;
    }
    if (spacer < prev) {
      scrollToRaw(Math.max(0, offset.current - (prev - spacer)), false);
    } else {
      shift.current = spacer - prev; // applied once the taller content has been laid out
    }
  }, [spacer, scrollToRaw]);

  const ctx = useMemo<ScrollCtx>(
    () => ({
      getMetrics: () => metrics.current,
      subscribe(fn) {
        listeners.current.add(fn);
        return () => {
          listeners.current.delete(fn);
        };
      },
      registerRefresher: setReg,
    }),
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollTo: o => scrollToRaw((o.y ?? 0) + spacerRef.current, o.animated ?? true),
      scrollToEnd: o => scroll.current?.scrollToEnd({ animated: o?.animated ?? true }),
      getScrollView: () => scroll.current,
    }),
    [scrollToRaw],
  );

  // Phase 2 phone pass (2026-11-03): the one-shot scroll to the spacer could be clamped natively (content not tall enough yet)
  // and was never re-applied, leaving a 160 dp white gap above the page at random. While the refresher is idle and nobody is
  // dragging, a position inside the spacer is never valid, so every layout / content-size change parks it at scrollTop 0 again.
  const repark = () => {
    const base = spacerRef.current;
    if (base > 0 && !dragging.current && controller.state === 'inactive' && offset.current < base - 0.5) {
      scrollToRaw(base, false);
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const n = e.nativeEvent;
    const base = spacerRef.current;
    offset.current = n.contentOffset.y;
    const top = n.contentOffset.y - base;
    metrics.current = {
      // Ionic's scrollTop is never negative (during a pull the content is translated, scrollTop stays 0). A negative value
      // here made ion-infinite-scroll load pages by itself (PointHistory rows doubled on the phone, 2026-11-03).
      scrollTop: Math.max(0, top),
      scrollHeight: n.contentSize.height - base,
      contentHeight: n.layoutMeasurement.height,
    };
    if (base > 0) {
      if (dragging.current) {
        if (noPull.current) {
          if (top < 0) {
            scrollToRaw(base, false); // the touch did not start at the top: no pull (refresher.js _onMove `scrollTop > 0`)
          }
        } else {
          controller.move(Math.max(0, -top), 0);
        }
      } else if (top < 0 && controller.state === 'inactive') {
        scrollToRaw(base, false); // a fling ran past the top
      }
    }
    if (onScroll) {
      onScroll({
        ...e,
        nativeEvent: {
          ...n,
          contentOffset: { ...n.contentOffset, y: Math.max(0, top) },
          contentSize: { ...n.contentSize, height: metrics.current.scrollHeight },
        },
      } as NativeSyntheticEvent<NativeScrollEvent>);
    }
    listeners.current.forEach(fn => fn());
  };

  const handleBeginDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const base = spacerRef.current;
    if (base > 0) {
      dragging.current = true;
      const top = e.nativeEvent.contentOffset.y - base;
      // refresher.js _onStart: only when the content is at scrollTop 0 and the refresher is idle
      noPull.current = top > 0.5 || controller.state !== 'inactive' || !controller.start(Math.max(0, top));
    }
    onScrollBeginDrag?.(e);
  };

  const handleEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (spacerRef.current > 0) {
      dragging.current = false;
      if (!noPull.current) {
        controller.end();
      }
    }
    onScrollEndDrag?.(e);
  };

  const pad = flattenStyle([padding && !noPadding && styles.padded, contentStyle]);
  const baseTop = topPadding(pad);
  const contentBg = StyleSheet.flatten([styles.content, style])?.backgroundColor;
  // scroll frozen while the refresher is refreshing / cancelling / completing (refresher.js stops the pointer events)
  const frozen = rstate === 'refreshing' || rstate === 'cancelling' || rstate === 'completing';

  return (
    <ScrollContext.Provider value={ctx}>
      <View testID={testID} style={[styles.content, style]}>
        {reg && rstate !== 'inactive' ? (
          <View testID={`${testID}-refresher`} pointerEvents="none" style={styles.refresher}>
            <RefresherStateContext.Provider value={rstate}>{reg.content}</RefresherStateContext.Provider>
          </View>
        ) : null}
        <ScrollView
          ref={scroll}
          testID={`${testID}-scrollview`}
          style={styles.scroll}
          scrollEnabled={scrollEnabled && !frozen}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          scrollEventThrottle={16}
          {...rest}
          // the spacer fragment is one extra ScrollView child before the screen's children
          stickyHeaderIndices={stickyChildIndices ? stickyChildIndices.map(i => i + (spacer > 0 ? 1 : 0)) : rest.stickyHeaderIndices}
          onScroll={handleScroll}
          onScrollBeginDrag={handleBeginDrag}
          onScrollEndDrag={handleEndDrag}
          onContentSizeChange={(w, h) => {
            metrics.current = { ...metrics.current, scrollHeight: h - spacerRef.current };
            if (shift.current !== null) {
              scrollToRaw(Math.max(0, offset.current + shift.current), false);
              shift.current = null;
            }
            repark();
            onContentSizeChange?.(w, h);
          }}
          onLayout={e => {
            metrics.current = { ...metrics.current, contentHeight: e.nativeEvent.layout.height };
            setViewport(e.nativeEvent.layout.height);
            repark();
            onLayout?.(e);
          }}
          contentContainerStyle={[pad, spacer > 0 && { paddingTop: baseTop + spacer, minHeight: viewport + spacer }]}
        >
          {spacer > 0 ? (
            <>
              {/* .scroll-content is opaque (background-color: inherit) and covers the refresher layer: only the transparent
                  spacer above scrollTop 0 shows it. Without this, content with no background of its own let the refresher
                  text show through while the content slides back. */}
              <View pointerEvents="none" testID={`${testID}-scroll-bg`} style={[styles.cover, { top: spacer, backgroundColor: contentBg }]} />
              <View pointerEvents="none" testID={`${testID}-refresher-edge`} style={[styles.edge, { top: spacer - 1 }]} />
            </>
          ) : null}
          {children}
        </ScrollView>
        {fixedContent}
      </View>
    </ScrollContext.Provider>
  );
});

export interface IonGridProps {
  noPadding?: boolean; // [no-padding] .grid[no-padding] { padding: 0 } and its columns' padding ([CSS] 13550-13551)
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

const GridContext = React.createContext(false);

// .grid { padding: 5px; width: 100%; display: flex; flex-direction: column } ([CSS] 13549)
export function IonGrid({ noPadding, style, testID = 'ion-grid', children }: IonGridProps) {
  return (
    <GridContext.Provider value={!!noPadding}>
      <View testID={testID} style={[styles.grid, noPadding && styles.noPad, style]}>
        {children}
      </View>
    </GridContext.Provider>
  );
}

export interface IonRowProps {
  nowrap?: boolean; // [nowrap] ([CSS] 13561)
  wrapReverse?: boolean; // [wrap-reverse]
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'; // [align-items-*] ([CSS] 13563-13567)
  justifyContent?: 'start' | 'center' | 'end' | 'around' | 'between'; // [justify-content-*] ([CSS] 13568-13572)
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

const ALIGN = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline' } as const;
const JUSTIFY = { start: 'flex-start', center: 'center', end: 'flex-end', around: 'space-around', between: 'space-between' } as const;

// .row { display: flex; flex-wrap: wrap } ([CSS] 13560)
export function IonRow({ nowrap, wrapReverse, alignItems, justifyContent, style, testID = 'ion-row', children }: IonRowProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.row,
        nowrap && { flexWrap: 'nowrap' },
        wrapReverse && { flexWrap: 'wrap-reverse' },
        alignItems && { alignItems: ALIGN[alignItems] },
        justifyContent && { justifyContent: JUSTIFY[justifyContent] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface IonColProps {
  col?: number | 'auto'; // [col-N] N of 12, [col-auto]; none = `[col]` equal-width flex ([CSS] 13573)
  offset?: number; // [offset-N]: margin-left N/12 ([CSS] 13736-13746)
  alignSelf?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'; // .col[align-self-*] ([CSS] 13574-13578)
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

export function IonCol({ col, offset, alignSelf, style, testID = 'ion-col', children }: IonColProps) {
  const noPad = React.useContext(GridContext);
  const spec: Mutable<ViewStyle> = {};
  if (col === 'auto') {
    // [col-auto] flex: 0 0 auto; width: auto ([CSS] 13697)
    spec.flexGrow = 0;
    spec.flexShrink = 0;
    spec.flexBasis = 'auto';
  } else if (typeof col === 'number') {
    // [col-N] flex: 0 0 N/12; width/max-width the same ([CSS] 13698-13709)
    const w = `${colWidthPercent(col)}%` as const;
    spec.flexGrow = 0;
    spec.flexShrink = 0;
    spec.flexBasis = w;
    spec.width = w;
    spec.maxWidth = w;
  } else {
    // .col { flex: 1 0 0; width: 100%; max-width: 100% } ([CSS] 13573; [col] 13696 flex-basis 0, flex-grow 1)
    spec.flexGrow = 1;
    spec.flexShrink = 1;
    spec.flexBasis = 0;
    spec.maxWidth = '100%';
  }
  if (offset) {
    spec.marginLeft = `${colWidthPercent(offset)}%`;
  }
  if (alignSelf) {
    spec.alignSelf = ALIGN[alignSelf];
  }
  return (
    <View testID={testID} style={[styles.col, noPad && styles.noPad, spec, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // content.md.scss:4-6 + [CSS] 13300 (`ion-content { width/height 100% }`)
  content: { flex: 1, backgroundColor: contentMd.backgroundColor },
  scroll: { flex: 1 }, // transparent: the ion-content background shows through (background-color: inherit)
  // ion-refresher{position:absolute;top:0;left:0;width:100%;height:60px;z-index:0} behind the scroll layer
  refresher: { position: 'absolute', top: 0, left: 0, width: '100%', height: refresherMd.height },
  edge: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: refresherMd.borderColor },
  cover: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  padded: { padding: contentMd.padding },
  grid: { width: '100%', flexDirection: 'column', padding: gridMd.padding },
  noPad: { padding: 0 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  // .col { padding: 5px; position: relative; min-height: 1px }
  col: { padding: gridMd.colPadding, position: 'relative', minHeight: 1 },
});
