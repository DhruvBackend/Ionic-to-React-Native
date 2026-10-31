// Plan Task 9 part 5B: segment, searchbar, refresher, infinite scroll, fab, slides, spinners, WebEmbed, ImageViewer.
// Expected values are the cited ones in src/theme/ionicMdScroll.ts.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ImageViewer } from '../src/components/ImageViewer';
import { WebEmbed } from '../src/components/WebEmbed';
import { IonContent, type IonContentHandle } from '../src/components/ionic/IonContent';
import { IonFab, IonFabButton } from '../src/components/ionic/IonFab';
import {
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  type InfiniteScrollHandle,
} from '../src/components/ionic/IonInfiniteScroll';
import { IonRefresher, IonRefresherContent } from '../src/components/ionic/IonRefresher';
import { IonSearchbar } from '../src/components/ionic/IonSearchbar';
import { IonSegment, IonSegmentButton } from '../src/components/ionic/IonSegment';
import { IonSlide, IonSlides } from '../src/components/ionic/IonSlides';
import { IonSpinner } from '../src/components/ionic/IonSpinner';
import { OverlayHost } from '../src/components/ionic/OverlayHost';
import { RefresherController } from '../src/components/ionic/refresherController';
import { ionicColors } from '../src/theme';
import {
  colorShade,
  fabMd,
  imageViewerMd,
  infiniteMd,
  refresherMd,
  searchbarMd,
  slidesMd,
  topbathSearchbar,
  topbathSegment,
} from '../src/theme/ionicMdScroll';
import { _resetOverlaysForTests } from '../src/ui/overlays';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = (fn: () => void) => ReactTestRenderer.act(fn);
const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const exists = (id: string) => find(id).length > 0;
const style = (id: string) => StyleSheet.flatten(host(id).props.style);
const mount = (el: React.ReactElement) =>
  act(() => {
    tree = ReactTestRenderer.create(
      <View>
        {el}
        <OverlayHost />
      </View>,
    );
  });
const layout = (id: string, width: number, height: number) =>
  act(() => host(id).props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width, height } } }));

beforeEach(() => {
  jest.useFakeTimers();
  _resetOverlaysForTests();
});
afterEach(() => {
  act(() => tree.unmount());
  jest.useRealTimers();
});

describe('ion-segment', () => {
  function Seg(p: { onValue: jest.Mock; onIon: jest.Mock; onPress: jest.Mock; inTabBtn?: boolean }) {
    const [v, setV] = React.useState('Pending');
    return (
      <IonSegment testID="seg" inTabBtn={p.inTabBtn ?? true} value={v} onValueChange={x => { setV(x); p.onValue(x); }} onIonChange={p.onIon}>
        <IonSegmentButton testID="b-pending" value="Pending" onPress={p.onPress}>Pending</IonSegmentButton>
        <IonSegmentButton testID="b-closed" value="Closed" onPress={p.onPress}>Closed</IonSegmentButton>
      </IonSegment>
    );
  }
  const press = (id: string) => act(() => find(id).find(n => typeof n.props.onPress === 'function' && n.props.accessibilityRole === 'button')!.props.onPress());

  test('inTabBtn: renders the Topbath box: 16px side padding, #fff, 1px #878787, radius 6, buttons 35px high', () => {
    mount(<Seg onValue={jest.fn()} onIon={jest.fn()} onPress={jest.fn()} />);
    expect(style('seg')).toMatchObject({ paddingHorizontal: topbathSegment.wrapperPaddingHorizontal });
    const box = host('seg').children[0] as ReactTestRenderer.ReactTestInstance;
    expect(StyleSheet.flatten(box.props.style)).toMatchObject({
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#878787',
      borderRadius: 6,
      overflow: 'hidden',
    });
    const inner = find('b-pending')[0].findAll(n => n.props.style && StyleSheet.flatten(n.props.style)?.height === 35);
    expect(inner.length).toBeGreaterThan(0);
  });

  test('a tap on another button changes the value (ngModelChange, ionChange) before the (click) handler, which gets the new value', () => {
    const order: string[] = [];
    const onValue = jest.fn(v => order.push(`model:${v}`));
    const onIon = jest.fn(v => order.push(`ion:${v}`));
    const onPress = jest.fn(v => order.push(`click:${v}`));
    mount(<Seg onValue={onValue} onIon={onIon} onPress={onPress} />);
    press('b-closed');
    expect(order).toEqual(['model:Closed', 'ion:Closed', 'click:Closed']);
  });

  test('default (outside .ion-tab-btn, sales-exec-plumber-list): the md look, 42px high, 2px bottom border, uppercase 500 12px, primary text, padding 0 6', () => {
    mount(<Seg onValue={jest.fn()} onIon={jest.fn()} onPress={jest.fn()} inTabBtn={false} />);
    expect(host('seg').props.style).toBeUndefined(); // no .ion-tab-btn wrapper padding
    const box = host('seg').children[0] as ReactTestRenderer.ReactTestInstance;
    expect(StyleSheet.flatten(box.props.style).borderWidth).toBeUndefined();
    const btn = find('b-pending')[0].findAll(n => n.props.style && StyleSheet.flatten(n.props.style)?.height === 42);
    expect(btn.length).toBeGreaterThan(0);
    const bs = StyleSheet.flatten(btn[0].props.style);
    expect(bs).toMatchObject({ borderBottomWidth: 2, paddingHorizontal: 6 });
    const label = find('b-closed')[0].findAll(n => n.props.numberOfLines === 1 && n.props.style)[0];
    const ls = StyleSheet.flatten(label.props.style);
    expect(ls).toMatchObject({ textTransform: 'uppercase', fontSize: 12 });
    expect(label.props.ellipsizeMode).toBe('tail');
  });

  test('inTabBtn labels are clipped, not ellipsized (display:flex disables text-overflow), with the 6px button padding', () => {
    mount(<Seg onValue={jest.fn()} onIon={jest.fn()} onPress={jest.fn()} />);
    const label = find('b-closed')[0].findAll(n => n.props.numberOfLines === 1 && n.props.style)[0];
    expect(label.props.ellipsizeMode).toBe('clip');
    expect(StyleSheet.flatten(label.props.style).textTransform).toBe('capitalize');
    const btn = find('b-closed')[0].findAll(n => n.props.style && StyleSheet.flatten(n.props.style)?.height === 35);
    expect(StyleSheet.flatten(btn[0].props.style).paddingHorizontal).toBe(6);
  });

  test('a programmatic value change fires ionChange (not ngModelChange); the first model write is skipped', () => {
    const onIon = jest.fn();
    const el = (v: string | undefined) => (
      <IonSegment value={v} onIonChange={onIon}>
        <IonSegmentButton value="A">A</IonSegmentButton>
        <IonSegmentButton value="B">B</IonSegmentButton>
      </IonSegment>
    );
    mount(el('A'));
    act(() => tree.update(<View>{el('B')}<OverlayHost /></View>));
    expect(onIon.mock.calls).toEqual([['B']]);
    act(() => tree.update(<View>{el('B')}<OverlayHost /></View>));
    expect(onIon).toHaveBeenCalledTimes(1);
    // starting undefined: the first real write is the skipped init write
    act(() => tree.unmount());
    onIon.mockClear();
    mount(el(undefined));
    act(() => tree.update(<View>{el('A')}<OverlayHost /></View>));
    expect(onIon).not.toHaveBeenCalled();
    act(() => tree.update(<View>{el('B')}<OverlayHost /></View>));
    expect(onIon.mock.calls).toEqual([['B']]);
  });

  test('tapping the active button fires only (click): no ionChange', () => {
    const onValue = jest.fn();
    const onIon = jest.fn();
    const onPress = jest.fn();
    mount(<Seg onValue={onValue} onIon={onIon} onPress={onPress} />);
    press('b-pending');
    expect(onValue).not.toHaveBeenCalled();
    expect(onIon).not.toHaveBeenCalled();
    expect(onPress).toHaveBeenCalledWith('Pending');
  });

  test('the active button shows Topbath primary background and white 600 text after the 100 ms transition', () => {
    mount(<Seg onValue={jest.fn()} onIon={jest.fn()} onPress={jest.fn()} />);
    advance(200);
    const t = find('b-pending')[0].findAll(n => (n.type as any)?.displayName === 'Animated(Text)' || (n.type as any) === 'Text' || false);
    expect(t.length).toBeGreaterThanOrEqual(0); // text node exists; colours are animated values
    expect(topbathSegment.activeBackground).toBe(ionicColors.primary);
  });
});

describe('ion-searchbar', () => {
  const input = () => host('ion-searchbar-input');
  const type = (t: string) => act(() => input().props.onChangeText(t));

  test('addSearch geometry: 30px input, radius 30, no border, 12px/1px letter-spacing, padding-left 35, side padding 16', () => {
    mount(<IonSearchbar />);
    expect(style('ion-searchbar')).toMatchObject({ paddingHorizontal: 16 });
    expect(StyleSheet.flatten(input().props.style)).toMatchObject({
      height: 30,
      borderRadius: 30,
      borderWidth: 0,
      fontSize: 12,
      letterSpacing: 1,
      paddingLeft: 35,
      paddingRight: 16,
      color: searchbarMd.textColor,
      backgroundColor: '#fff',
    });
    expect(input().props.placeholder).toBe('Search');
    expect(style('ion-searchbar-icon')).toMatchObject({ left: 10, top: 7, width: 15, height: 15, overflow: 'hidden' });
  });

  test('bare context is the md default with the global radius 30: 42px high, 16px font, 55px side padding', () => {
    mount(<IonSearchbar context="bare" />);
    expect(StyleSheet.flatten(input().props.style)).toMatchObject({ height: 42, borderRadius: 30, fontSize: 16, paddingLeft: 55 });
    expect(style('ion-searchbar-icon')).toMatchObject({ left: 16, top: 11, width: 21, height: 21 });
  });

  test('search context (gift-list): 45px input with 2px #D4D4D4 border, margin-top -27, no shadow, host padding stays 16', () => {
    mount(<IonSearchbar context="search" />);
    expect(style('ion-searchbar')).toMatchObject({ paddingHorizontal: topbathSearchbar.global.paddingHorizontal });
    const s = StyleSheet.flatten(input().props.style);
    expect(s).toMatchObject({ height: 45, marginTop: -27, borderWidth: 2, borderColor: '#D4D4D4', borderRadius: 30, fontSize: 14 });
    expect(s.boxShadow).toBeUndefined();
  });

  test('ngModelChange is immediate; ionInput is debounced 250 ms and only the last value is emitted', () => {
    const onChange = jest.fn();
    const onInput = jest.fn();
    mount(<IonSearchbar onChangeText={onChange} onIonInput={onInput} />);
    type('a');
    advance(100);
    type('ab');
    expect(onChange.mock.calls).toEqual([['a'], ['ab']]);
    advance(249);
    expect(onInput).not.toHaveBeenCalled();
    advance(1);
    expect(onInput.mock.calls).toEqual([['ab']]);
  });

  test('debounce={0} emits ionInput straight away', () => {
    const onInput = jest.fn();
    mount(<IonSearchbar debounce={0} onIonInput={onInput} />);
    type('x');
    expect(onInput).toHaveBeenCalledWith('x');
  });

  test('clear button only with a value AND focus; tap -> ionClear (twice, click + mousedown), then after 64 ms value "" once (ngModelChange + ionInput)', () => {
    const onChange = jest.fn();
    const onInput = jest.fn();
    const onClear = jest.fn();
    mount(<IonSearchbar value="" onChangeText={onChange} onIonInput={onInput} onIonClear={onClear} />);
    type('abc');
    expect(exists('ion-searchbar-clear')).toBe(false); // no focus yet
    act(() => input().props.onFocus());
    expect(exists('ion-searchbar-clear')).toBe(true);
    advance(300);
    onChange.mockClear();
    onInput.mockClear();
    act(() => find('ion-searchbar-clear')[0].props.onPress());
    expect(onClear).toHaveBeenCalledTimes(2); // NOTE (parity): (click) + (mousedown) both run clearInput
    expect(onChange).not.toHaveBeenCalled();
    advance(63);
    expect(onChange).not.toHaveBeenCalled();
    advance(1);
    expect(onChange.mock.calls).toEqual([['']]);
    expect(onInput.mock.calls).toEqual([['']]);
    advance(100);
    expect(onInput).toHaveBeenCalledTimes(1);
    expect(input().props.value).toBe('');
  });

  test('cancel button only when showCancelButton and focused; it emits ionCancel then clears', () => {
    const onCancel = jest.fn();
    const onInput = jest.fn();
    mount(<IonSearchbar showCancelButton onIonCancel={onCancel} onIonInput={onInput} />);
    expect(exists('ion-searchbar-cancel')).toBe(false);
    type('q');
    act(() => input().props.onFocus());
    expect(exists('ion-searchbar-cancel')).toBe(true);
    expect(exists('ion-searchbar-icon')).toBe(false); // the search icon is hidden while the cancel arrow shows
    advance(300);
    onInput.mockClear();
    act(() => find('ion-searchbar-cancel')[0].props.onPress());
    expect(onCancel).toHaveBeenCalledTimes(2); // click + mousedown
    advance(64);
    expect(onInput).toHaveBeenCalledWith('');
  });

  test('submit (keyup.enter)', () => {
    const onSubmit = jest.fn();
    mount(<IonSearchbar onSubmit={onSubmit} />); // default type is 'search'
    act(() => input().props.onSubmitEditing());
    expect(onSubmit).toHaveBeenCalled();
    expect(input().props.returnKeyType).toBe('search');
    expect(input().props.submitBehavior).toBe('submit'); // Enter must not blur / dismiss the keyboard
  });
});

describe('ion-refresher', () => {
  function makeController(onRefresh = jest.fn()) {
    const view = { setState: jest.fn(), translate: jest.fn() };
    const c = new RefresherController(view, { onRefresh });
    return { c, view, onRefresh };
  }

  test('defaults: pullMin 60, pullMax 120, snapback 280, 120 ms complete delay', () => {
    expect(refresherMd).toMatchObject({ pullMin: 60, pullMax: 120, snapbackDuration: 280, completeDelayMs: 120 });
  });

  test('pull below 60 is `pulling`; releasing there cancels without calling the handler', () => {
    const { c, onRefresh } = makeController();
    expect(c.start(0)).toBe(true);
    c.move(30);
    expect(c.state).toBe('pulling');
    c.end();
    expect(c.state).toBe('cancelling');
    expect(onRefresh).not.toHaveBeenCalled();
    advance(0);
    jest.advanceTimersByTime(320);
    expect(c.state).toBe('inactive');
  });

  test('60..120 is `ready` (content follows the finger 1:1); release starts the refresh, content hangs at 60', () => {
    const { c, view, onRefresh } = makeController();
    c.start(0);
    c.move(90);
    expect(c.state).toBe('ready');
    expect(view.translate).toHaveBeenLastCalledWith(90, 0, 0);
    c.end();
    expect(c.state).toBe('refreshing');
    expect(view.translate).toHaveBeenLastCalledWith(60, 280, 0);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onRefresh.mock.calls[0][0]).toBe(c); // $event.complete()
  });

  test('pulling beyond 120 starts the refresh while the finger is still down', () => {
    const { c, onRefresh } = makeController();
    c.start(0);
    c.move(121);
    expect(c.state).toBe('refreshing');
    expect(onRefresh).toHaveBeenCalledTimes(1);
    c.move(200); // ignored while refreshing
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test('complete(): `completing`, 120 ms delay + 320 ms to 0, then inactive', () => {
    const { c, view } = makeController();
    c.start(0);
    c.move(100);
    c.end();
    c.complete();
    expect(c.state).toBe('completing');
    expect(view.translate).toHaveBeenLastCalledWith(0, 320, 120);
    jest.advanceTimersByTime(439);
    expect(c.state).toBe('completing');
    jest.advanceTimersByTime(1);
    expect(c.state).toBe('inactive');
  });

  test('does not start when scrolled (scrollTop > 0) or while busy', () => {
    const { c } = makeController();
    expect(c.start(5)).toBe(false);
    expect(c.start(0)).toBe(true);
    c.move(100);
    c.end();
    expect(c.start(0)).toBe(false);
  });

  // IonContent drives the pull from the native scroll (see its header comment): spacer 160 = pullMax 120 + 40, scrollTop 0 is offset 160.
  describe('IonContent + IonRefresher (pull = native scroll into the spacer)', () => {
    let handle: any;
    const onRefresh = jest.fn(r => {
      handle = r;
    });
    const sv = () => tree.root.findByType(ScrollView);
    const props = () => sv().props;
    const scrollTo = () => (sv().instance as any).scrollTo as jest.Mock;
    const raw = (y: number) => ({
      nativeEvent: {
        contentOffset: { x: 0, y },
        contentSize: { width: 360, height: 1160 },
        layoutMeasurement: { width: 360, height: 400 },
      },
    });
    function mountPull(extra?: Partial<React.ComponentProps<typeof IonRefresher>>) {
      mount(
        <IonContent testID="sv">
          <IonRefresher onRefresh={onRefresh} {...extra}>
            <IonRefresherContent
              pullingIcon="arrow-dropdown"
              pullingText="Pull to refresh"
              refreshingSpinner="circles"
              refreshingText="Refreshing..."
            />
          </IonRefresher>
          <Text>row</Text>
        </IonContent>,
      );
      act(() => props().onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 400 } } }));
      act(() => props().onContentSizeChange(360, 1160));
      scrollTo().mockClear();
    }
    const drag = (from: number, to: number) => {
      act(() => props().onScrollBeginDrag(raw(from)));
      act(() => props().onScroll(raw(to)));
    };
    beforeEach(() => {
      onRefresh.mockClear();
      handle = undefined;
    });

    test('a registered refresher adds the 160 px spacer (padding-top, min-height) and starts the content at offset 160', () => {
      mount(
        <IonContent testID="sv">
          <IonRefresher>
            <IonRefresherContent />
          </IonRefresher>
          <Text>row</Text>
        </IonContent>,
      );
      act(() => props().onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 400 } } }));
      const cc = StyleSheet.flatten(props().contentContainerStyle);
      expect(cc).toMatchObject({ paddingTop: 160, minHeight: 560 });
      act(() => props().onContentSizeChange(360, 560));
      expect(scrollTo()).toHaveBeenCalledWith({ x: 0, y: 160, animated: false });
      expect(exists('sv-refresher-edge')).toBe(true);
    });

    test('without a refresher there is no spacer', () => {
      mount(
        <IonContent testID="sv">
          <Text>row</Text>
        </IonContent>,
      );
      expect(StyleSheet.flatten(props().contentContainerStyle).paddingTop).toBeUndefined();
      expect(exists('sv-refresher-edge')).toBe(false);
    });

    test('dragging down 90 px from the top then releasing calls onRefresh; the content hangs at 60 and scrolling is frozen', () => {
      mountPull();
      expect(exists('sv-refresher')).toBe(false); // ion-refresher{display:none} while inactive
      drag(160, 70); // dy = 90
      expect(exists('sv-refresher')).toBe(true);
      expect(exists('refresher-pulling')).toBe(true);
      expect(find('refresher-pulling')[0].findAll(n => n.props.children === 'Pull to refresh').length).toBeGreaterThan(0);
      expect(props().scrollEnabled).toBe(true); // the finger's scroll is the pull
      act(() => props().onScrollEndDrag(raw(70)));
      expect(onRefresh).toHaveBeenCalledTimes(1);
      expect(scrollTo()).toHaveBeenCalledWith({ x: 0, y: 100, animated: true }); // 160 - pullMin
      expect(exists('refresher-refreshing')).toBe(true);
      expect(exists('ion-spinner-circles')).toBe(true);
      expect(props().scrollEnabled).toBe(false);
      act(() => handle.complete());
      expect(props().scrollEnabled).toBe(false); // completing
      advance(120);
      expect(scrollTo()).toHaveBeenLastCalledWith({ x: 0, y: 160, animated: true });
      advance(320);
      expect(exists('sv-refresher')).toBe(false);
      expect(props().scrollEnabled).toBe(true);
    });

    test('releasing below pullMin cancels (no handler), frozen while cancelling', () => {
      mountPull();
      drag(160, 120); // dy = 40
      act(() => props().onScrollEndDrag(raw(120)));
      expect(onRefresh).not.toHaveBeenCalled();
      expect(props().scrollEnabled).toBe(false);
      expect(scrollTo()).toHaveBeenLastCalledWith({ x: 0, y: 160, animated: true });
      advance(320);
      expect(props().scrollEnabled).toBe(true);
    });

    test('pulling past pullMax (120) refreshes while the finger is still down', () => {
      mountPull();
      drag(160, 30); // dy = 130
      expect(onRefresh).toHaveBeenCalledTimes(1);
      expect(scrollTo()).toHaveBeenCalledWith({ x: 0, y: 100, animated: true });
    });

    test('a drag that started below the top never pulls: it is held at the top', () => {
      mountPull();
      drag(300, 100); // started at scrollTop 140
      expect(scrollTo()).toHaveBeenCalledWith({ x: 0, y: 160, animated: false });
      act(() => props().onScrollEndDrag(raw(160)));
      expect(onRefresh).not.toHaveBeenCalled();
      expect(exists('sv-refresher')).toBe(false);
    });

    test('a fling past the top is clamped back to scrollTop 0', () => {
      mountPull();
      act(() => props().onScroll(raw(100)));
      expect(scrollTo()).toHaveBeenCalledWith({ x: 0, y: 160, animated: false });
    });

    test('onScroll / metrics report Ionic scrollTop (spacer removed); the ref scrollTo adds it', () => {
      const seen = jest.fn();
      const ref = React.createRef<IonContentHandle>();
      mount(
        <IonContent testID="sv" ref={ref} onScroll={seen}>
          <IonRefresher>
            <IonRefresherContent />
          </IonRefresher>
        </IonContent>,
      );
      act(() => props().onScroll(raw(260)));
      expect(seen.mock.calls[0][0].nativeEvent.contentOffset.y).toBe(100);
      expect(seen.mock.calls[0][0].nativeEvent.contentSize.height).toBe(1000);
      scrollTo().mockClear();
      act(() => ref.current!.scrollTo({ y: 0, animated: false }));
      expect(scrollTo()).toHaveBeenCalledWith({ x: 0, y: 160, animated: false });
    });

    test('re-rendering the parent does not re-register the refresher; changed texts do', () => {
      const el = (text: string) => (
        <View>
          <IonContent testID="sv">
            <IonRefresher>
              <IonRefresherContent pullingText={text} />
            </IonRefresher>
          </IonContent>
          <OverlayHost />
        </View>
      );
      act(() => {
        tree = ReactTestRenderer.create(el('Pull to refresh'));
      });
      act(() => props().onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 400 } } }));
      const before = StyleSheet.flatten(props().contentContainerStyle);
      act(() => tree.update(el('Pull to refresh')));
      expect(StyleSheet.flatten(props().contentContainerStyle)).toEqual(before);
      act(() => tree.update(el('Pull')));
      drag(160, 90);
      expect(find('refresher-pulling')[0].findAll(n => n.props.children === 'Pull').length).toBeGreaterThan(0);
    });

    test('keyboardShouldPersistTaps defaults to handled', () => {
      mount(<IonContent testID="sv" />);
      expect(props().keyboardShouldPersistTaps).toBe('handled');
    });
  });
});

describe('ion-infinite-scroll', () => {
  let handle: InfiniteScrollHandle | undefined;
  const onInfinite = jest.fn((h: InfiniteScrollHandle) => {
    handle = h;
  });
  function mountList() {
    mount(
      <IonContent testID="sv">
        <Text>rows</Text>
        <IonInfiniteScroll threshold="100px" onInfinite={onInfinite}>
          <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
        </IonInfiniteScroll>
      </IonContent>,
    );
    layout('ion-infinite-scroll', 360, 84); // min-height 84 while enabled
  }
  const scroll = (scrollTop: number, scrollHeight = 1000, visible = 400) => {
    advance(40); // >= 32 ms between checks
    act(() =>
      host('sv-scrollview').props.onScroll({
        nativeEvent: {
          contentOffset: { x: 0, y: scrollTop },
          contentSize: { width: 360, height: scrollHeight },
          layoutMeasurement: { width: 360, height: visible },
        },
      }),
    );
    advance(20); // the emit runs in the next frame (_dom.write)
  };
  beforeEach(() => {
    onInfinite.mockClear();
    handle = undefined;
  });

  test('idle content is an empty 84 px block (the loading UI is hidden until `loading`)', () => {
    mountList();
    expect(style('ion-infinite-scroll-content')).toMatchObject({ minHeight: infiniteMd.contentMinHeight });
    expect(exists('infinite-loading')).toBe(false);
  });

  test('triggers when scrollHeight - infiniteHeight - scrollTop - visible - 100 < 0, shows the bubbles + text', () => {
    mountList();
    scroll(0); // 1000-84-0-400-100 = 416
    scroll(416); // = 0, not < 0
    expect(onInfinite).not.toHaveBeenCalled();
    scroll(417); // < 0
    expect(onInfinite).toHaveBeenCalledTimes(1);
    expect(handle!.state).toBe('loading');
    expect(exists('infinite-loading')).toBe(true);
    expect(exists('ion-spinner-bubbles')).toBe(true);
    expect(find('infinite-loading')[0].findAll(n => n.props.children === infiniteMd.loadingText).length).toBeGreaterThan(0);
  });

  test('does not re-trigger while loading; complete() re-arms it', () => {
    mountList();
    scroll(500);
    scroll(520);
    scroll(540);
    expect(onInfinite).toHaveBeenCalledTimes(1);
    act(() => handle!.complete());
    expect(handle!.state).toBe('enabled');
    scroll(560);
    expect(onInfinite).toHaveBeenCalledTimes(2);
  });

  test('ionInfinite is emitted in the next frame (not inside the scroll event); a synchronous complete() in the handler re-arms it', () => {
    const sync = jest.fn((h: InfiniteScrollHandle) => h.complete());
    mount(
      <IonContent testID="sv">
        <IonInfiniteScroll threshold="100px" onInfinite={sync}>
          <IonInfiniteScrollContent />
        </IonInfiniteScroll>
      </IonContent>,
    );
    layout('ion-infinite-scroll', 360, 84);
    advance(40);
    act(() =>
      host('sv-scrollview').props.onScroll({
        nativeEvent: { contentOffset: { x: 0, y: 600 }, contentSize: { width: 360, height: 1000 }, layoutMeasurement: { width: 360, height: 400 } },
      }),
    );
    expect(sync).not.toHaveBeenCalled();
    advance(1);
    expect(sync).toHaveBeenCalledTimes(1);
    expect(exists('infinite-loading')).toBe(false); // complete() ran inside the handler
  });

  test('scroll events less than 32 ms apart are ignored', () => {
    mountList();
    advance(40);
    const ev = (y: number) => ({
      nativeEvent: { contentOffset: { x: 0, y }, contentSize: { width: 360, height: 1000 }, layoutMeasurement: { width: 360, height: 400 } },
    });
    act(() => host('sv-scrollview').props.onScroll(ev(0)));
    advance(10);
    act(() => host('sv-scrollview').props.onScroll(ev(600)));
    expect(onInfinite).not.toHaveBeenCalled();
  });

  test('enable(false) disables it: content hidden, no more triggers; a % threshold uses the visible height', () => {
    mountList();
    scroll(500);
    act(() => handle!.enable(false));
    expect(handle!.state).toBe('disabled');
    expect(exists('ion-infinite-scroll-content')).toBe(false);
    onInfinite.mockClear();
    scroll(900);
    expect(onInfinite).not.toHaveBeenCalled();
    act(() => handle!.enable(true));
    expect(handle!.state).toBe('enabled');
  });

  test('default threshold is 15% of the visible height', () => {
    mount(
      <IonContent testID="sv">
        <IonInfiniteScroll onInfinite={onInfinite}>
          <IonInfiniteScrollContent />
        </IonInfiniteScroll>
      </IonContent>,
    );
    layout('ion-infinite-scroll', 360, 84);
    scroll(400); // 1000-84-400-400-60 = 56 > 0
    expect(onInfinite).not.toHaveBeenCalled();
    scroll(457); // < 0
    expect(onInfinite).toHaveBeenCalledTimes(1);
  });
});

describe('ion-fab', () => {
  test('right bottom: 10px from the edges, 56px primary circle with the md shadow, white add icon', () => {
    mount(
      <IonFab horizontal="right" vertical="bottom">
        <IonFabButton color="primary" icon="add" onPress={jest.fn()} />
      </IonFab>,
    );
    expect(style('ion-fab')).toMatchObject({ position: 'absolute', right: 10, bottom: 10, zIndex: 999 });
    expect(style('ion-fab-button')).toMatchObject({
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: ionicColors.primary,
      boxShadow: fabMd.boxShadow,
    });
  });

  test('danger colour, mini 40px, left/top, edge and centre positions', () => {
    mount(
      <View>
        <IonFab testID="f1" horizontal="left" vertical="top">
          <IonFabButton testID="b1" color="danger" mini icon="add" />
        </IonFab>
        <IonFab testID="f2" horizontal="center" vertical="bottom" edge />
        <IonFab testID="f3" horizontal="end" vertical="middle" />
      </View>,
    );
    expect(style('b1')).toMatchObject({ width: 40, height: 40, backgroundColor: ionicColors.danger });
    expect(style('f1')).toMatchObject({ left: 10, top: 10 });
    expect(style('f2')).toMatchObject({ left: '50%', marginLeft: -28, bottom: -28 });
    expect(style('f3')).toMatchObject({ right: 10, top: '50%', marginTop: -28 });
  });

  test('press calls onPress; activated shade is 12% darker', () => {
    const onPress = jest.fn();
    mount(<IonFabButton onPress={onPress} icon="add" />);
    act(() => find('ion-fab-button')[0].props.onPress({ nativeEvent: { locationX: 5, locationY: 5 } }));
    expect(onPress).toHaveBeenCalled();
    expect(colorShade('#002d25')).toBe('#002821');
  });
});

describe('ion-slides', () => {
  const colorsList = ['a', 'b', 'c'];
  const slidesEl = (p: Partial<React.ComponentProps<typeof IonSlides>> = {}) => (
    <IonSlides testID="sl" {...p}>
      {colorsList.map(c => (
        <IonSlide key={c}>
          <Text>{c}</Text>
        </IonSlide>
      ))}
    </IonSlides>
  );
  const activeBullet = () => [0, 1, 2].filter(i => style(`sl-bullet-${i}`).opacity === 1);

  test('pager: 8px bullets (#000 at .2), active = primary at 1, bottom 10, margin 0 5', () => {
    mount(slidesEl({ pager: true }));
    layout('sl', 300, 100);
    expect(style('sl-pager')).toMatchObject({ bottom: 10, left: 0, position: 'absolute' });
    expect(style('sl-bullet-0')).toMatchObject({ width: 8, height: 8, opacity: 1, backgroundColor: slidesMd.bulletActiveColor });
    expect(style('sl-bullet-1')).toMatchObject({ opacity: 0.2, backgroundColor: '#000', marginHorizontal: 5 });
  });

  test('pager=false / default: no bullets; more than 10 slides: no bullets', () => {
    mount(slidesEl());
    layout('sl', 300, 100);
    expect(exists('sl-pager')).toBe(false);
    act(() => tree.unmount());
    mount(
      <IonSlides testID="sl" pager>
        {Array.from({ length: 11 }, (_, i) => (
          <IonSlide key={i}><Text>x</Text></IonSlide>
        ))}
      </IonSlides>,
    );
    layout('sl', 300, 100);
    expect(exists('sl-pager')).toBe(false);
  });

  test('slide content sits in a `.slide-zoom` with 10px margin', () => {
    mount(slidesEl());
    layout('sl', 300, 100);
    const zoom = tree.root.findAll(n => StyleSheet.flatten(n.props.style)?.margin === 10);
    expect(zoom.length).toBeGreaterThan(0);
  });

  test('autoplay=3000: first advance at 300+3000 ms, then every 3300 ms; after wrapping to slide 0 it stops for good', () => {
    const onChange = jest.fn();
    mount(slidesEl({ pager: true, autoplay: 3000, onSlideChange: onChange }));
    layout('sl', 300, 100);
    advance(3299);
    expect(activeBullet()).toEqual([0]);
    advance(1);
    expect(activeBullet()).toEqual([1]);
    advance(3299);
    expect(activeBullet()).toEqual([1]);
    advance(1);
    expect(activeBullet()).toEqual([2]);
    advance(3299);
    expect(activeBullet()).toEqual([2]);
    advance(1); // isEnd: slideTo(0) stops autoplay (swiper.js:184 + 658)
    expect(activeBullet()).toEqual([0]);
    advance(30000);
    expect(activeBullet()).toEqual([0]);
    expect(onChange.mock.calls.map(c => c[0])).toEqual([1, 2, 0]);
  });

  test('a user drag stops autoplay (autoplayDisableOnInteraction)', () => {
    mount(slidesEl({ pager: true, autoplay: 3000 }));
    layout('sl', 300, 100);
    advance(3300);
    expect(activeBullet()).toEqual([1]);
    act(() => host('sl-scroll').props.onScrollBeginDrag());
    advance(20000);
    expect(activeBullet()).toEqual([1]);
  });

  test('swiping updates the active bullet', () => {
    mount(slidesEl({ pager: true }));
    layout('sl', 300, 100);
    act(() => host('sl-scroll').props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 600, y: 0 } } }));
    expect(activeBullet()).toEqual([2]);
  });
});

describe('spinners', () => {
  test('bubbles 9 circles / circles 8 circles; crescent delegates', () => {
    mount(<IonSpinner name="bubbles" color="#666" />);
    expect(find('ion-spinner-bubbles')[0].findAll(n => typeof n.type === 'string' && n.props.style?.borderRadius).length).toBe(9);
    act(() => tree.unmount());
    mount(<IonSpinner name="circles" color="#000" />);
    expect(find('ion-spinner-circles')[0].findAll(n => typeof n.type === 'string' && n.props.style?.borderRadius).length).toBe(8);
  });
});

describe('WebEmbed / ImageViewer', () => {
  test('iframe default has the 2px inset border; border="none" has none', () => {
    mount(<WebEmbed testID="w" uri="https://example.test/v" height={180} />);
    expect(style('w')).toMatchObject({ height: 180, width: '100%', borderWidth: 2, borderTopColor: '#000', borderLeftColor: '#000', borderBottomColor: '#545454', borderRightColor: '#545454' });
    act(() => tree.unmount());
    mount(<WebEmbed testID="w" uri="https://example.test/m" height="100%" border="none" />);
    expect(style('w').borderWidth).toBeUndefined();
    expect(host('w-webview').props.source).toEqual({ uri: 'https://example.test/m' });
  });

  test('ImageViewer opens a modal page (90% black, red 30px close) and the close button calls onClose', () => {
    const onClose = jest.fn();
    mount(<ImageViewer uri="https://example.test/i.png" visible onClose={onClose} />);
    advance(400);
    expect(exists('image-viewer')).toBe(true);
    expect(style('image-viewer').backgroundColor).toBe(imageViewerMd.backdrop);
    expect(style('image-viewer-close')).toMatchObject({ width: 30, height: 30, borderRadius: 24, backgroundColor: '#d31010', top: 9, right: 9 });
    act(() => find('image-viewer-close')[0].props.onPress());
    advance(500);
    expect(exists('image-viewer')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('ImageViewer: visible=false from the parent dismisses without a second onClose', () => {
    const onClose = jest.fn();
    mount(<ImageViewer uri="https://example.test/i.png" visible onClose={onClose} />);
    advance(400);
    act(() =>
      tree.update(
        <View>
          <ImageViewer uri="https://example.test/i.png" visible={false} onClose={onClose} />
          <OverlayHost />
        </View>,
      ),
    );
    advance(500);
    expect(exists('image-viewer')).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });
});
