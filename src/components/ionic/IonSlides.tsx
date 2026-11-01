// <ion-slides pager autoplay=3000> / <ion-slide> (components/slides/slides.js, swiper/swiper.js = Swiper 3.4 in Ionic).
// Topbath options in use (12 active tags): `pager autoplay=3000` x8, bare x3 (home offers x2, sales-exec-home.html:35),
// `pager="false"` x1 (product-subdetail); no loop,
// speed, slidesPerView or effect, so only: 1 slide per view, 300 ms slide speed, bullets.
//
// Built on a horizontal pagingEnabled ScrollView rather than react-native-pager-view: loop is unused, autoplay needs
// our own timer either way, the slide width is the container width, and a ScrollView adds no native dependency.
//
// Autoplay semantics copied from swiper.js (autoplayDisableOnInteraction = true, autoplayStopOnLast = false):
//  - slides initialise 300 ms after mount (slides.js:785) and the first advance is `autoplay` ms later;
//  - each automatic advance pauses the timer until the 300 ms transition ends, then re-arms it (period = 3300 ms);
//  - NOTE (parity): at the last slide Swiper calls slideTo(0) WITHOUT the internal flag (swiper.js:184), and slideTo
//    treats that as user interaction (swiper.js:658-665), so after wrapping back to slide 0 autoplay stops for good;
//  - any user drag stops autoplay for good.
// `ion-slides{z-index:-1}` (variables.scss:3033) has no effect: ion-slides is not positioned, so z-index does not apply.
// `ion-slides{height:100%}` (main.css) resolves to auto in CSS, because every Topbath <ion-slides> sits in an auto-height
// parent (div.banner etc.). RN does not treat a % height that way (inside a ScrollView it grew to the full content
// height and blanked the rest of the page), so no height is set: the slides size to their content, like auto.
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { slidesMd } from '../../theme/ionicMdScroll';

export interface IonSlidesProps {
  pager?: boolean; // default false (slides.js:183)
  autoplay?: number; // ms; absent = no autoplay
  onSlideChange?: (index: number) => void; // ionSlideDidChange-like (fires on every active index change)
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

export function IonSlides({ pager = false, autoplay, onSlideChange, style, testID = 'ion-slides', children }: IonSlidesProps) {
  const slides = React.Children.toArray(children);
  const count = slides.length;
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const scroller = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const activeRef = useRef(0);
  const widthRef = useRef(0);
  const countRef = useRef(count);
  countRef.current = count;
  const cb = useRef(onSlideChange);
  cb.current = onSlideChange;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rearm = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const playing = useRef(false);
  const stopRef = useRef<() => void>(() => {});

  const goTo = (i: number) => {
    activeRef.current = i;
    setActive(i);
    scroller.current?.scrollTo({ x: i * widthRef.current, y: 0, animated: true });
    cb.current?.(i);
  };

  useEffect(() => {
    if (!autoplay) {
      return;
    }
    const stop = () => {
      playing.current = false;
      clearTimeout(timer.current);
      clearTimeout(rearm.current);
    };
    const schedule = () => {
      timer.current = setTimeout(() => {
        if (activeRef.current < countRef.current - 1) {
          // slideNext(internal): pauseAutoplay until the transition ends, then autoplay() again
          goTo(activeRef.current + 1);
          rearm.current = setTimeout(() => {
            if (playing.current) {
              schedule();
            }
          }, slidesMd.speedMs);
        } else {
          // isEnd: slideTo(0) without `internal` -> stopAutoplay
          stop();
          goTo(0);
        }
      }, autoplay);
    };
    const init = setTimeout(() => {
      playing.current = true;
      schedule();
    }, slidesMd.initDelayMs);
    stopRef.current = stop;
    return () => {
      clearTimeout(init);
      stop();
    };
  }, [autoplay]);

  return (
    <View
      testID={testID}
      style={[styles.host, style]}
      onLayout={e => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
    >
      {width > 0 ? (
        <ScrollView
          ref={scroller}
          testID={`${testID}-scroll`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => stopRef.current()} // autoplayDisableOnInteraction
          onMomentumScrollEnd={e => {
            const i = Math.round(e.nativeEvent.contentOffset.x / widthRef.current);
            if (i !== activeRef.current) {
              activeRef.current = i;
              setActive(i);
              cb.current?.(i);
            }
          }}
        >
          {slides.map((s, i) => (
            <View key={i} style={{ width }}>
              {s}
            </View>
          ))}
        </ScrollView>
      ) : null}
      {pager && count <= slidesMd.maxPagerSlides ? (
        <View testID={`${testID}-pager`} pointerEvents="none" style={styles.pager}>
          {slides.map((_, i) => (
            <View
              key={i}
              testID={`${testID}-bullet-${i}`}
              style={[styles.bullet, i === active && styles.bulletActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

// <ion-slide>: `.swiper-slide` (flex centre, width 100%) holding `.slide-zoom` whose Topbath margin is 10 px
// (variables.scss:3038-3041, main.css `.slide-zoom{text-align:center;display:block;width:100%}` shrunk by the margins).
export function IonSlide({ children, testID }: { children?: React.ReactNode; testID?: string }) {
  return (
    <View testID={testID} style={styles.slide}>
      <View style={styles.zoom}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { width: '100%' }, // ion-slides{display:block;width:100%;height:100%} (the 100% height computes to auto, see top)
  slide: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  zoom: { flexShrink: 1, alignSelf: 'stretch', margin: slidesMd.slideZoomMargin },
  // .swiper-pagination-bullets{left:0;bottom:10px;width:100%;text-align:center;position:absolute;z-index:10}
  pager: {
    position: 'absolute',
    left: 0,
    bottom: slidesMd.paginationBottom,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: slidesMd.bulletBaselineGap,
    zIndex: 10,
  },
  bullet: {
    width: slidesMd.bulletSize,
    height: slidesMd.bulletSize,
    borderRadius: slidesMd.bulletSize / 2,
    marginHorizontal: slidesMd.bulletMarginHorizontal,
    backgroundColor: slidesMd.bulletColor,
    opacity: slidesMd.bulletOpacity,
  },
  bulletActive: { backgroundColor: slidesMd.bulletActiveColor, opacity: 1 },
});
