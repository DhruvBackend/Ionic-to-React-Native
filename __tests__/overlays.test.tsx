// Ionic 3.9.5 md popups (Alert, Loading, Toast, ActionSheet) and the imperative overlay API (plan Task 9 part 2).
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';
import { OverlayHost } from '../src/components/ionic/OverlayHost';
import {
  _resetOverlaysForTests,
  dismissTopOverlay,
  isOverlayOpen,
  notifyPageChange,
  showActionSheet,
  showAlert,
  showLoading,
  showToast,
} from '../src/ui/overlays';
import { useLoader } from '../src/ui/useLoader';
import { actionSheetMd, alertMd, loadingMd, toastMd, topbathActionSheet, topbathAlert } from '../src/theme/ionicMdOverlays';

let tree: ReactTestRenderer.ReactTestRenderer;

function mountHost() {
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<OverlayHost />);
  });
}
function advance(ms: number) {
  ReactTestRenderer.act(() => {
    jest.advanceTimersByTime(ms);
  });
}
function act(fn: () => void) {
  ReactTestRenderer.act(fn);
}
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const style = (id: string) => StyleSheet.flatten(host(id).props.style);
function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function');
  if (!n) {
    throw new Error(`nothing pressable with testID ${id}`);
  }
  act(() => n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } }));
}
function textOf(id: string): string {
  const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : '');
  const n = find(id).find(x => x.type === Text || typeof x.type === 'string');
  return flat(n!.props.children);
}

beforeEach(() => {
  jest.useFakeTimers();
  _resetOverlaysForTests();
  mountHost();
});
afterEach(() => {
  act(() => tree.unmount());
  jest.useRealTimers();
});

describe('Alert (alert.md.scss + Topbath overrides)', () => {
  test('renders title, sub title, message and the md wrapper geometry', () => {
    act(() => {
      showAlert({ title: 'Title', subTitle: 'Sub', message: 'Msg', buttons: ['OK'] });
    });
    expect(textOf('alert-title')).toBe('Title');
    expect(textOf('alert-subtitle')).toBe('Sub');
    expect(textOf('alert-message')).toBe('Msg');
    const w = style('alert-wrapper');
    expect(w).toMatchObject({
      minWidth: alertMd.minWidth,
      maxWidth: 280,
      borderRadius: 2,
      backgroundColor: '#fafafa',
    });
    expect(w.maxHeight).toBe('90%');
    const head = style('alert-head');
    expect(head).toMatchObject({ paddingTop: 24, paddingRight: 24, paddingBottom: 20, paddingLeft: 24 });
  });

  test('Topbath: title is 16px (variables.scss:12316 !important), weight 500, no margins', () => {
    act(() => {
      showAlert({ title: 'T', subTitle: 'S', buttons: ['OK'] });
    });
    expect(style('alert-title')).toMatchObject({ fontSize: topbathAlert.titleFontSize, fontFamily: 'Roboto-Medium' });
    expect(style('alert-title').lineHeight).toBeCloseTo(19.2);
    // sub-title: 16px weight 400; Ionic's margin-top 5px is removed by `h3 { margin: 0 !important }`
    expect(style('alert-subtitle')).toMatchObject({ fontSize: 16, fontFamily: 'Roboto-Regular' });
    expect(style('alert-subtitle').marginTop ?? 0).toBe(0);
  });

  test('message is 15px rgba(0,0,0,.5) with 0/24/24/24 padding, and has no padding when empty', () => {
    act(() => {
      showAlert({ title: 'T', message: 'M', buttons: ['OK'] });
    });
    expect(style('alert-message')).toMatchObject({
      fontSize: 15,
      color: 'rgba(0, 0, 0, 0.5)',
    });
    expect(style('alert-message-content')).toMatchObject({ paddingTop: 0, paddingRight: 24, paddingBottom: 24, paddingLeft: 24 });
    expect(style('alert-message-box')).toMatchObject({ maxHeight: 240 });
    act(() => dismissTopOverlay());
    advance(300);
    act(() => {
      showAlert({ title: 'T', buttons: ['OK'] });
    });
    expect(style('alert-message-content')).toMatchObject({ padding: 0 });
  });

  test('buttons: uppercase, 14px/20px, weight 400 (span.button-inner: Topbath * font-weight 400), primary colour, 10px padding, no margin (Topbath button margin 0)', () => {
    act(() => {
      showAlert({ title: 'T', buttons: ['Cancel', 'OK'] });
    });
    expect(style('alert-button-0')).toMatchObject({ padding: 10, borderRadius: 2 });
    const t = StyleSheet.flatten(find('alert-button-0-text').find(n => n.type === Text)!.props.style);
    expect(t).toMatchObject({ fontSize: 14, lineHeight: 20, textTransform: 'uppercase', fontFamily: 'Roboto-Regular' });
    expect(t.color).toBe(alertMd.button.color);
    const g = style('alert-button-group');
    expect(g).toMatchObject({ flexWrap: 'wrap-reverse', justifyContent: 'flex-end', flexDirection: 'row' });
    expect(g).toMatchObject({ paddingTop: 8, paddingRight: 8, paddingBottom: 8, paddingLeft: 24 });
  });

  test('more than two buttons stack vertically (alert-button-group-vertical)', () => {
    act(() => {
      showAlert({ title: 'T', buttons: ['A', 'B', 'C'] });
    });
    expect(style('alert-button-group')).toMatchObject({ flexDirection: 'column', flexWrap: 'nowrap' });
  });

  test('button handler runs after the pop-in, then the alert leaves in 200 ms and onDidDismiss fires', () => {
    const handler = jest.fn();
    const didDismiss = jest.fn();
    act(() => {
      showAlert({ title: 'T', buttons: [{ text: 'Yes', handler }], onDidDismiss: didDismiss });
    });
    // not yet enabled during the 200 ms pop-in (AlertCmp.enabled is set in ionViewDidEnter)
    press('alert-button-0');
    expect(handler).not.toHaveBeenCalled();
    advance(200);
    press('alert-button-0');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(isOverlayOpen()).toBe(true); // still leaving
    expect(didDismiss).not.toHaveBeenCalled();
    advance(200);
    expect(didDismiss).toHaveBeenCalledTimes(1);
    expect(isOverlayOpen()).toBe(false);
    expect(exists('alert-wrapper')).toBe(false);
  });

  test('a handler returning false keeps the alert open', () => {
    const didDismiss = jest.fn();
    act(() => {
      showAlert({ title: 'T', buttons: [{ text: 'No', handler: () => false }], onDidDismiss: didDismiss });
    });
    advance(200);
    press('alert-button-0');
    advance(500);
    expect(exists('alert-wrapper')).toBe(true);
    expect(didDismiss).not.toHaveBeenCalled();
  });

  test('onDidDismiss receives the data and the role of the pressed button', () => {
    const didDismiss = jest.fn();
    act(() => {
      showAlert({
        title: 'T',
        inputs: [{ type: 'radio', label: 'A', value: 'a', checked: true }],
        buttons: [{ text: 'Cancel', role: 'cancel' }],
        onDidDismiss: didDismiss,
      });
    });
    advance(200);
    press('alert-button-0');
    advance(200);
    expect(didDismiss).toHaveBeenCalledWith('a', 'cancel');
  });

  test('backdrop tap runs the role:cancel button handler and dismisses', () => {
    const cancel = jest.fn();
    const ok = jest.fn();
    act(() => {
      showAlert({ title: 'T', buttons: [{ text: 'Cancel', role: 'cancel', handler: cancel }, { text: 'OK', handler: ok }] });
    });
    advance(200);
    press('overlay-backdrop');
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(ok).not.toHaveBeenCalled();
    advance(200);
    expect(exists('alert-wrapper')).toBe(false);
  });

  test('backdrop tap without a cancel button dismisses with role "backdrop"', () => {
    const didDismiss = jest.fn();
    act(() => {
      showAlert({ title: 'T', buttons: ['OK'], onDidDismiss: didDismiss });
    });
    advance(200);
    press('overlay-backdrop');
    advance(200);
    expect(didDismiss).toHaveBeenCalledWith(undefined, 'backdrop');
  });

  test('enableBackdropDismiss: false ignores the backdrop', () => {
    act(() => {
      showAlert({ title: 'T', buttons: ['OK'], enableBackdropDismiss: false });
    });
    advance(200);
    press('overlay-backdrop');
    advance(500);
    expect(exists('alert-wrapper')).toBe(true);
  });

  test('radio: the checked value goes to the button handler; picking another row changes it', () => {
    const handler = jest.fn();
    act(() => {
      showAlert({
        title: 'T',
        inputs: [
          { type: 'radio', label: 'Scan', value: 'scan', checked: true },
          { type: 'radio', label: 'Code', value: 'code' },
        ],
        buttons: ['Cancel', { text: 'OK', handler }],
      });
    });
    advance(200);
    press('alert-radio-1');
    press('alert-button-1');
    expect(handler).toHaveBeenCalledWith('code');
  });

  test('radio geometry: 16px circle, 2px border #787878 off / primary on, 8px dot, label 13/26 padding', () => {
    act(() => {
      showAlert({
        title: 'T',
        inputs: [
          { type: 'radio', label: 'Scan', value: 'scan', checked: true },
          { type: 'radio', label: 'Code', value: 'code' },
        ],
        buttons: ['OK'],
      });
    });
    expect(style('alert-radio-icon-0')).toMatchObject({ width: 16, height: 16, borderWidth: 2, borderRadius: 8, borderColor: alertMd.radio.borderColorOn, left: 13 });
    expect(style('alert-radio-icon-1')).toMatchObject({ borderColor: '#787878' });
    expect(style('alert-radio-0')).toMatchObject({ minHeight: 44 });
    expect(style('alert-radio-label-0')).toMatchObject({ paddingVertical: 13, paddingHorizontal: 26 });
    expect(StyleSheet.flatten(find('alert-radio-label-0-text').find(n => n.type === Text)!.props.style).color).toBe(alertMd.radio.labelColorChecked);
    expect(style('alert-radio-group')).toMatchObject({ maxHeight: 240, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#dedede' });
  });

  test('checkbox: handler receives an array of the checked values', () => {
    const handler = jest.fn();
    act(() => {
      showAlert({
        title: 'T',
        inputs: [
          { type: 'checkbox', label: 'A', value: 'a', checked: true },
          { type: 'checkbox', label: 'B', value: 'b' },
          { type: 'checkbox', label: 'C', value: 'c' },
        ],
        buttons: [{ text: 'OK', handler }],
      });
    });
    advance(200);
    press('alert-checkbox-1');
    press('alert-checkbox-0'); // untick a
    press('alert-checkbox-2');
    press('alert-button-0');
    expect(handler).toHaveBeenCalledWith(['b', 'c']);
  });

  test('text inputs: handler receives {name: value}; unnamed inputs are keyed by index; alert sits at the top (50px)', () => {
    const handler = jest.fn();
    act(() => {
      showAlert({
        title: 'T',
        inputs: [
          { type: 'text', name: 'first', placeholder: 'First', value: 'x' },
          { type: 'number', placeholder: 'Second' },
        ],
        buttons: [{ text: 'OK', handler }],
      });
    });
    expect(style('alert-root')).toMatchObject({ paddingTop: 50, justifyContent: 'flex-start', alignItems: 'center' });
    advance(200);
    const input = find('alert-input-1').find(n => typeof n.props.onChangeText === 'function')!;
    act(() => input.props.onChangeText('42'));
    press('alert-button-0');
    expect(handler).toHaveBeenCalledWith({ first: 'x', '1': '42' });
  });

  test('a plain alert is centred and not at the top', () => {
    act(() => {
      showAlert({ title: 'T', buttons: ['OK'] });
    });
    expect(style('alert-root')).toMatchObject({ alignItems: 'center', justifyContent: 'center' });
  });

  test('cssClass "alert-modal" (dashboard.ts:196): bold 1px-spaced title, 50% green/red white-text buttons', () => {
    act(() => {
      showAlert({ title: 'Stop Time', message: 'Do you want to stop work time?', cssClass: 'alert-modal', buttons: [{ text: 'Yes' }, { text: 'No', role: 'cancel' }] });
    });
    expect(style('alert-title')).toMatchObject({ fontSize: 16, fontFamily: 'Roboto-Bold', letterSpacing: 1 });
    expect(style('alert-button-group')).toMatchObject({ paddingTop: 10, paddingBottom: 10, paddingLeft: 16, paddingRight: 16 });
    expect(style('alert-button-0')).toMatchObject({ backgroundColor: '#469c11', paddingVertical: 8, paddingHorizontal: 10 });
    expect(style('alert-button-1')).toMatchObject({ backgroundColor: '#ef0606' });
    expect(StyleSheet.flatten(find('alert-button-0-text').find(n => n.type === Text)!.props.style).color).toBe('#ffffff');
    // the head keeps Ionic's padding (".alert-modal .alert-head {padding:16px}" loses to .alert-md in main.css)
    expect(style('alert-head')).toMatchObject({ paddingTop: 24, paddingBottom: 20 });
  });

  test('a cssClass without rules (action-close) changes nothing', () => {
    act(() => {
      showAlert({ title: 'Message!', cssClass: 'action-close', subTitle: 'x', buttons: ['OK'] });
    });
    expect(style('alert-button-group')).toMatchObject({ paddingLeft: 24, paddingTop: 8 });
  });

  test('showAlert().dismiss() closes it (no handler is called)', () => {
    const handler = jest.fn();
    let h: { dismiss(): void };
    act(() => {
      h = showAlert({ title: 'T', buttons: [{ text: 'OK', handler }] });
    });
    act(() => h.dismiss());
    advance(200);
    expect(exists('alert-wrapper')).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  test('pop-in animation: wrapper opacity .01 -> 1 and scale 1.1 -> 1, backdrop .01 -> .5, 200 ms', () => {
    act(() => {
      showAlert({ title: 'T', buttons: ['OK'] });
    });
    const w = style('alert-wrapper');
    expect(w.opacity).toBeDefined();
    expect(w.transform).toBeDefined();
    expect(alertMd.enter).toMatchObject({ duration: 200, wrapperOpacity: [0.01, 1], wrapperScale: [1.1, 1], backdropOpacity: [0.01, 0.5] });
    expect(alertMd.leave).toMatchObject({ duration: 200, wrapperOpacity: [0.99, 0], wrapperScale: [1, 0.9], backdropOpacity: [0.5, 0] });
  });
});

describe('overlay stack, hardware back and page change', () => {
  test('isOverlayOpen counts alerts and action sheets, not loading or toast (Ionic _overlayPortal only)', () => {
    expect(isOverlayOpen()).toBe(false);
    act(() => {
      showLoading({ content: 'Please wait...' });
      showToast('hi');
    });
    expect(isOverlayOpen()).toBe(false);
    act(() => {
      showActionSheet({ buttons: [{ text: 'Camera' }] });
    });
    expect(isOverlayOpen()).toBe(true);
  });

  test('dismissTopOverlay dismisses the first alert (app.component.ts:167 uses _overlayPortal._views[0]) without running handlers', () => {
    const handler = jest.fn();
    const dd1 = jest.fn();
    const dd2 = jest.fn();
    act(() => {
      showAlert({ title: 'First', buttons: [{ text: 'OK', handler }], onDidDismiss: dd1 });
      showAlert({ title: 'Second', buttons: ['OK'], onDidDismiss: dd2 });
    });
    act(() => dismissTopOverlay());
    advance(200);
    expect(dd1).toHaveBeenCalledWith(undefined, undefined);
    expect(dd2).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    expect(isOverlayOpen()).toBe(true);
    act(() => dismissTopOverlay());
    advance(200);
    expect(isOverlayOpen()).toBe(false);
  });

  test('dismissOnPageChange: true loading and toast close on a page change; alerts and plain loaders stay', () => {
    act(() => {
      showLoading({ content: 'a', dismissOnPageChange: true });
      showLoading({ content: 'b' });
      showAlert({ title: 'x', buttons: ['OK'] });
    });
    expect(find('loading-wrapper').filter(n => typeof n.type === 'string')).toHaveLength(2);
    act(() => notifyPageChange());
    advance(300);
    expect(find('loading-wrapper').filter(n => typeof n.type === 'string')).toHaveLength(1);
    expect(exists('alert-wrapper')).toBe(true);
  });

  test('an entering alert or loader blocks clicks for enter + 64 ms (nav-controller-base.js:587, app.js:107)', () => {
    act(() => {
      showAlert({ title: 'T', buttons: ['OK'] });
    });
    expect(exists('click-block')).toBe(true);
    advance(263);
    expect(exists('click-block')).toBe(true);
    advance(1);
    expect(exists('click-block')).toBe(false);
  });

  test('an entering action sheet blocks for 400 + 64 ms; a toast never blocks (toast.js:96)', () => {
    act(() => {
      showToast('hi');
    });
    expect(exists('click-block')).toBe(false);
    act(() => {
      showActionSheet({ buttons: [{ text: 'A' }] });
    });
    advance(463);
    expect(exists('click-block')).toBe(true);
    advance(1);
    expect(exists('click-block')).toBe(false);
  });

  test('after an alert is dismissed the app is click-blocked for 400 ms from the start of the leave', () => {
    act(() => {
      showAlert({ title: 'T', buttons: ['OK'] });
    });
    advance(264);
    expect(exists('click-block')).toBe(false);
    press('alert-button-0');
    advance(200); // leave done
    expect(exists('alert-wrapper')).toBe(false);
    expect(exists('click-block')).toBe(true);
    advance(199);
    expect(exists('click-block')).toBe(true);
    advance(1);
    expect(exists('click-block')).toBe(false);
  });

  test('an action sheet keeps the block for its 450 ms leave + 64 ms = 514 ms', () => {
    act(() => {
      showActionSheet({ buttons: [{ text: 'A' }] });
    });
    advance(464);
    press('action-sheet-button-0');
    advance(513);
    expect(exists('click-block')).toBe(true);
    advance(1);
    expect(exists('click-block')).toBe(false);
  });
});

describe('Loading (loading.md.scss + Topbath overrides)', () => {
  test('default md loader: crescent spinner and white text, transparent wrapper without shadow (variables.scss:9940-9947)', () => {
    act(() => {
      showLoading({ content: 'Please wait...' });
    });
    const w = style('loading-wrapper');
    expect(w).toMatchObject({ padding: 24, maxWidth: 280, flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' });
    expect(w.boxShadow).toBeUndefined();
    expect(exists('loading-spinner')).toBe(true);
    expect(style('loading-content')).toMatchObject({ marginLeft: loadingMd.contentMarginStart });
    const t = StyleSheet.flatten(find('loading-content-text').find(n => n.type === Text)!.props.style);
    expect(t).toMatchObject({ color: '#ffffff', fontSize: 14 });
    expect(textOf('loading-content-text')).toBe('Please wait...');
  });

  test('spinner: "hide" and the gif <img> content draws the 8-dot gif.svg loader at 58px (55px with class h55)', () => {
    act(() => {
      showLoading({ spinner: 'hide', content: '<img src="./assets/imgs/gif.svg"/>' });
    });
    expect(exists('loading-spinner')).toBe(false);
    expect(exists('loading-gif')).toBe(true);
    expect(style('loading-gif')).toMatchObject({ width: 58, height: 58 });
    act(() => {
      showLoading({ spinner: 'hide', content: '<img src="./assets/imgs/gif.svg" class="h55" />' });
    });
    const gifs = find('loading-gif').filter(n => typeof n.type === 'string');
    expect(StyleSheet.flatten(gifs[1].props.style)).toMatchObject({ width: 55, height: 55 });
    expect(find('loading-gif-dot').filter(n => typeof n.type === 'string')).toHaveLength(16);
  });

  test('backdrop does not dismiss by default (enableBackdropDismiss false); duration auto-dismisses', () => {
    act(() => {
      showLoading({ content: 'x', duration: 1000 });
    });
    advance(200);
    press('overlay-backdrop');
    advance(300);
    expect(exists('loading-wrapper')).toBe(true);
    advance(1000);
    advance(200);
    expect(exists('loading-wrapper')).toBe(false);
  });

  test('showLoading().dismiss() hides it', () => {
    let h: { dismiss(): void };
    act(() => {
      h = showLoading({ content: 'x' });
    });
    act(() => h.dismiss());
    advance(200);
    expect(exists('loading-wrapper')).toBe(false);
  });
});

describe('useLoader (plan Review Focus 4)', () => {
  function mountHook() {
    const ref: { current: ReturnType<typeof useLoader> | null } = { current: null };
    function Probe() {
      ref.current = useLoader();
      return null;
    }
    let t!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      t = ReactTestRenderer.create(<Probe />);
    });
    return { ref, unmount: () => act(() => t.unmount()) };
  }
  const loaderShown = () => find('loading-wrapper').some(n => typeof n.type === 'string');

  test('show() uses "Please wait..." by default and hide() removes it', () => {
    const { ref } = mountHook();
    act(() => ref.current!.show());
    expect(textOf('loading-content-text')).toBe('Please wait...');
    act(() => ref.current!.hide());
    advance(200);
    expect(loaderShown()).toBe(false);
  });

  test('wrap(resolve) hides the loader and returns the value', async () => {
    const { ref } = mountHook();
    let result: unknown;
    let p!: Promise<number>;
    act(() => {
      p = ref.current!.wrap(Promise.resolve(7));
    });
    expect(loaderShown()).toBe(true);
    await ReactTestRenderer.act(async () => {
      result = await p;
    });
    advance(200);
    expect(result).toBe(7);
    expect(loaderShown()).toBe(false);
  });

  test('wrap(reject) hides the loader and rethrows', async () => {
    const { ref } = mountHook();
    let caught: unknown;
    await ReactTestRenderer.act(async () => {
      await ref.current!.wrap(Promise.reject(new Error('boom'))).catch(e => {
        caught = e;
      });
    });
    advance(200);
    expect((caught as Error).message).toBe('boom');
    expect(loaderShown()).toBe(false);
  });

  test('unmounting while the loader is shown hides it', () => {
    const { ref, unmount } = mountHook();
    act(() => ref.current!.show());
    expect(loaderShown()).toBe(true);
    unmount();
    advance(200);
    expect(loaderShown()).toBe(false);
  });

  test('a second show() does not leave an orphan loader behind', () => {
    const { ref } = mountHook();
    act(() => {
      ref.current!.show();
      ref.current!.show('Again');
    });
    advance(200);
    expect(find('loading-wrapper').filter(n => typeof n.type === 'string')).toHaveLength(1);
    act(() => ref.current!.hide());
    advance(200);
    expect(loaderShown()).toBe(false);
  });
});

describe('Toast (toast.md.scss)', () => {
  test('bottom by default, 3000 ms, message 15px white on #333 with 19/16/17 padding', () => {
    act(() => {
      showToast('Saved');
    });
    expect(textOf('toast-message')).toBe('Saved');
    expect(style('toast-wrapper')).toMatchObject({ backgroundColor: '#333', maxWidth: 700 });
    expect(style('toast-position')).toMatchObject({ bottom: 0, left: 0, right: 0 });
    expect(style('toast-message-box')).toMatchObject({ paddingTop: 19, paddingRight: 16, paddingBottom: 17, paddingLeft: 16 });
    expect(StyleSheet.flatten(find('toast-message').find(n => n.type === Text)!.props.style)).toMatchObject({ fontSize: 15, color: '#fff' });
    advance(2900);
    expect(exists('toast-wrapper')).toBe(true);
    advance(100); // 3000 -> dismiss starts
    advance(450); // slide-out
    expect(exists('toast-wrapper')).toBe(false);
  });

  test('top position anchors to the top; middle is centred with a fade', () => {
    act(() => {
      showToast('Top', { position: 'top' });
    });
    expect(style('toast-position')).toMatchObject({ top: 0 });
    act(() => {
      showToast('Mid', { position: 'middle' });
    });
    const wrappers = find('toast-position').filter(n => typeof n.type === 'string');
    expect(StyleSheet.flatten(wrappers[1].props.style).top).toBeDefined();
  });

  test('an invalid position falls back to bottom', () => {
    act(() => {
      showToast('x', { position: 'sideways' as any });
    });
    expect(style('toast-position')).toMatchObject({ bottom: 0 });
  });

  test('showCloseButton adds a "Close" button (closeButtonText overrides) that dismisses with role "close"', () => {
    const dd = jest.fn();
    act(() => {
      showToast('Hi', { duration: 0, showCloseButton: true, onDidDismiss: dd });
    });
    expect(textOf('toast-close-text')).toBe('Close');
    expect(StyleSheet.flatten(find('toast-close-text').find(n => n.type === Text)!.props.style)).toMatchObject({ textTransform: 'uppercase', fontSize: 15, color: '#fff', fontFamily: 'Roboto-Regular' });
    expect(style('toast-close')).toMatchObject({ height: 36, paddingTop: 19, paddingBottom: 17, paddingLeft: 16, paddingRight: 16 });
    advance(5000);
    expect(exists('toast-wrapper')).toBe(true); // duration 0 means it stays
    advance(400); // enabled
    press('toast-close');
    advance(450);
    expect(dd).toHaveBeenCalledWith(undefined, 'close');
    expect(exists('toast-wrapper')).toBe(false);
  });

  test('closeButtonText', () => {
    act(() => {
      showToast('Hi', { showCloseButton: true, closeButtonText: 'Done' });
    });
    expect(textOf('toast-close-text')).toBe('Done');
  });

  test('toasts never count as an open overlay for the back button', () => {
    act(() => {
      showToast('x');
    });
    expect(isOverlayOpen()).toBe(false);
  });
});

describe('ActionSheet (action-sheet.md.scss + Topbath variables.scss:4338-4390)', () => {
  test('title and buttons render with the Topbath look (white group, 10px radius, 99px buttons)', () => {
    act(() => {
      showActionSheet({
        title: 'Profile photo',
        buttons: [
          { text: 'Camera', icon: 'camera' },
          { text: 'Gallery', icon: 'image' },
          { text: 'Cancel', role: 'cancel' },
        ],
      });
    });
    expect(textOf('action-sheet-title-text')).toBe('Profile photo');
    expect(style('action-sheet-title')).toMatchObject({ padding: 12, borderBottomWidth: 1, borderBottomColor: '#ececec' });
    expect(StyleSheet.flatten(find('action-sheet-title-text').find(n => n.type === Text)!.props.style)).toMatchObject({ fontSize: 18, color: '#000', fontFamily: 'Roboto-Bold', textAlign: 'center' });
    expect(style('action-sheet-group-0')).toMatchObject({ backgroundColor: '#ffffff', borderTopLeftRadius: 10, borderTopRightRadius: 10, paddingTop: 8 });
    expect(style('action-sheet-container')).toMatchObject({ paddingLeft: 10, paddingRight: 10 });
    expect(style('action-sheet-button-0')).toMatchObject({ width: 99, minHeight: 53, marginLeft: 49, paddingLeft: 15, paddingRight: 15 });
    expect(StyleSheet.flatten(find('action-sheet-button-0-text').find(n => n.type === Text)!.props.style)).toMatchObject({ fontSize: 16, color: '#222', fontFamily: 'Roboto-Regular' });
    expect(textOf('action-sheet-button-0-text')).toBe('Camera');
  });

  test('icons: Camera icon #731b3b; the third child of the group (Gallery when there is a title) is green', () => {
    act(() => {
      showActionSheet({
        title: 'Profile photo',
        buttons: [
          { text: 'Camera', icon: 'camera' },
          { text: 'Gallery', icon: 'image' },
        ],
      });
    });
    const color = (i: number) => StyleSheet.flatten(find(`action-sheet-button-${i}-icon`).find(n => typeof n.props.name === 'string' && !!n.props.style)!.props.style).color;
    expect(color(0)).toBe(topbathActionSheet.icon.color);
    expect(color(1)).toBe(topbathActionSheet.icon.thirdChildColor);
  });

  test('without a title the second child is Gallery, so no icon is green', () => {
    act(() => {
      showActionSheet({ buttons: [{ text: 'Camera', icon: 'camera' }, { text: 'Gallery', icon: 'image' }] });
    });
    const color = (i: number) => StyleSheet.flatten(find(`action-sheet-button-${i}-icon`).find(n => typeof n.props.name === 'string' && !!n.props.style)!.props.style).color;
    expect(color(1)).toBe(topbathActionSheet.icon.color);
  });

  test('the cancel button sits in its own group below: centred, bold 16px, no padding, radius 0', () => {
    act(() => {
      showActionSheet({ buttons: [{ text: 'Camera' }, { text: 'Cancel', role: 'cancel' }] });
    });
    expect(exists('action-sheet-cancel')).toBe(true);
    expect(exists('action-sheet-button-1')).toBe(false); // cancel is not in the first group
    expect(style('action-sheet-group-cancel')).toMatchObject({ borderTopLeftRadius: 0, alignItems: 'center', paddingBottom: 8 });
    expect(style('action-sheet-cancel')).toMatchObject({ paddingLeft: 0, paddingRight: 0, marginLeft: 0, minHeight: 53 });
    expect(StyleSheet.flatten(find('action-sheet-cancel-text').find(n => n.type === Text)!.props.style)).toMatchObject({ fontFamily: 'Roboto-Bold', fontSize: 16 });
  });

  test('button handler then dismiss with the role; handler returning false keeps it open', () => {
    const cam = jest.fn();
    const stay = jest.fn(() => false);
    const dd = jest.fn();
    act(() => {
      showActionSheet({ buttons: [{ text: 'Stay', handler: stay }, { text: 'Camera', handler: cam, role: 'destructive' }], onDidDismiss: dd });
    });
    advance(400);
    press('action-sheet-button-0');
    advance(500);
    expect(stay).toHaveBeenCalled();
    expect(exists('action-sheet-wrapper')).toBe(true);
    press('action-sheet-button-1');
    advance(450);
    expect(cam).toHaveBeenCalled();
    expect(dd).toHaveBeenCalledWith(undefined, 'destructive');
    expect(exists('action-sheet-wrapper')).toBe(false);
  });

  test('taps are ignored during the 400 ms slide-up', () => {
    const cam = jest.fn();
    act(() => {
      showActionSheet({ buttons: [{ text: 'Camera', handler: cam }] });
    });
    advance(300);
    press('action-sheet-button-0');
    expect(cam).not.toHaveBeenCalled();
  });

  test('backdrop tap runs the cancel handler (role cancel) and dismisses', () => {
    const cancel = jest.fn();
    act(() => {
      showActionSheet({ buttons: [{ text: 'Camera' }, { text: 'Cancel', role: 'cancel', handler: cancel }] });
    });
    advance(400);
    press('overlay-backdrop');
    expect(cancel).toHaveBeenCalledTimes(1);
    advance(450);
    expect(exists('action-sheet-wrapper')).toBe(false);
  });

  test('an icon name with no Ionicons 3 glyph (e.g. "cancel") keeps an empty zero-width icon with the 8px right margin', () => {
    act(() => {
      showActionSheet({ buttons: [{ text: 'Camera', icon: 'cancel' }, { text: 'Cancel', role: 'cancel', icon: 'cancel' }] });
    });
    expect(style('action-sheet-button-0-icon')).toMatchObject({ width: 0, marginRight: 8 });
    expect(style('action-sheet-cancel-icon')).toMatchObject({ width: 0, marginRight: 8 });
  });

  test('sub title has no md rule: plain 14px black weight 400 text without padding', () => {
    act(() => {
      showActionSheet({ title: 'T', subTitle: 'Sub', buttons: [{ text: 'A' }] });
    });
    expect(textOf('action-sheet-sub-title-text')).toBe('Sub');
    expect(StyleSheet.flatten(find('action-sheet-sub-title-text').find(n => n.type === Text)!.props.style)).toMatchObject({ fontSize: 14, color: '#000', fontFamily: 'Roboto-Regular' });
    expect(host('action-sheet-sub-title').props.style).toBeUndefined(); // plain div: no padding or margin
  });

  test('transitions: slide from 100% in 400 ms and out in 450 ms, backdrop to .26', () => {
    expect(actionSheetMd.enter).toMatchObject({ duration: 400, backdropOpacity: [0.01, 0.26] });
    expect(actionSheetMd.leave).toMatchObject({ duration: 450, backdropOpacity: [0.26, 0] });
    expect(toastMd.slideIn.duration).toBe(400);
    expect(toastMd.slideOut.duration).toBe(450);
  });
});
