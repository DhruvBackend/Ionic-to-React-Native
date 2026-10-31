// Ionic 3.9.5 md content controls (plan Task 9 part 5A): ion-content, grid, ion-button, list / item / label / list-header,
// ion-input / ion-textarea, radio-group + ion-radio, ion-checkbox, ion-card. Expected values are the cited ones in
// src/theme/ionicMdContent.ts (the colour helpers are checked against the compiled main.css of the shipped app).
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet, View } from 'react-native';
import { IonButton } from '../src/components/ionic/IonButton';
import { IonCard, IonCardContent, IonCardHeader } from '../src/components/ionic/IonCard';
import { IonIcon } from '../src/components/ionic/IonIcon';
import { IonCheckbox, IonRadio, IonRadioGroup } from '../src/components/ionic/IonChoice';
import { IonCol, IonContent, IonGrid, IonRow } from '../src/components/ionic/IonContent';
import { IonInputItem } from '../src/components/ionic/IonInput';
import { IonItem, IonList, IonListHeader } from '../src/components/ionic/IonList';
import { ionicColors } from '../src/theme';
import {
  buttonColors,
  buttonMd,
  cardMd,
  checkboxMd,
  colWidthPercent,
  colorContrast,
  colorShade,
  contentMd,
  inputMd,
  ionPadding,
  itemContentMd,
  listHeaderMd,
  listMd,
  radioMd,
} from '../src/theme/ionicMdContent';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = (fn: () => void) => ReactTestRenderer.act(fn);
const advance = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const exists = (id: string) => find(id).length > 0;
const flush = () => act(() => Promise.resolve() as any); // run pending microtasks (ngModel's second, asynchronous write)
const style = (id: string) => StyleSheet.flatten(host(id).props.style);
// Animated colour interpolations come back as rgba(...) strings
const hex = (c: string) =>
  /^rgba?\(/.test(c)
    ? '#' + (c.match(/\d+(\.\d+)?/g) as string[]).slice(0, 3).map(v => Number(v).toString(16).padStart(2, '0')).join('')
    : c;
function press(id: string) {
  const n = find(id).filter(x => typeof x.props.onPress === 'function').pop(); // the innermost: the Pressable, not the wrapper
  if (!n) {
    throw new Error(`nothing pressable with testID ${id}`);
  }
  act(() => n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } }));
}
function mount(el: React.ReactElement) {
  act(() => {
    tree = ReactTestRenderer.create(el);
  });
}
function rerender(el: React.ReactElement) {
  act(() => tree.update(el));
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('colour helpers match the Sass compile of the shipped CSS (main.css 12586-12673, 14650)', () => {
  test('color-shade: white for dark colours, black for light ones, 8% (outline 5%)', () => {
    expect(colorShade(ionicColors.primary)).toBe('#143e36'); // .button-md-primary.activated
    expect(colorShade(ionicColors.primary, 0.05)).toBe('#0d3830'); // .button-outline-md-primary
    expect(colorShade(ionicColors.light)).toBe('#e0e0e0');
    expect(colorShade(ionicColors.danger)).toBe('#62666c');
    expect(colorShade(ionicColors.secondary)).toBe('#141414');
    expect(colorShade('#ffffff')).toBe('#ebebeb');
  });
  test('color-contrast: black on light colours, white otherwise', () => {
    expect(colorContrast(ionicColors.primary)).toBe('#ffffff');
    expect(colorContrast(ionicColors.light)).toBe('#000000');
    expect(colorContrast(ionicColors.warning)).toBe('#000000');
    expect(colorContrast('#ffffff')).toBe('#000000');
    expect(colorContrast(ionicColors.success)).toBe('#ffffff');
  });
  test('a colour that is not in the map keeps the primary look (color="theme")', () => {
    expect(buttonColors('theme').solid.background).toBe(ionicColors.primary);
    expect(buttonColors('danger').solid.background).toBe(ionicColors.danger);
    expect(buttonColors('light').clear.text).toBe(ionicColors.light);
  });
});

describe('ion-content, ion-grid', () => {
  test('white background, 16px padding only with [padding]', () => {
    mount(
      <View>
        <IonContent testID="c1" padding>
          <View />
        </IonContent>
        <IonContent testID="c2">
          <View />
        </IonContent>
        <IonContent testID="c3" padding noPadding>
          <View />
        </IonContent>
      </View>,
    );
    expect(style('c1').backgroundColor).toBe(contentMd.backgroundColor);
    const pad = (id: string) => StyleSheet.flatten(find(`${id}-scrollview`).find(n => n.props.contentContainerStyle)!.props.contentContainerStyle);
    expect(pad('c1').padding).toBe(16);
    expect(pad('c2').padding).toBeUndefined();
    expect(pad('c3').padding).toBeUndefined(); // [no-padding] wins
  });
  test('col-N is N/12 wide, rounded to 5 places; padding 5 on grid and col', () => {
    expect(colWidthPercent(1)).toBe(8.33333);
    expect(colWidthPercent(6)).toBe(50);
    mount(
      <IonGrid testID="g">
        <IonRow testID="r">
          <IonCol col={1} testID="c1" />
          <IonCol testID="c2" />
          <IonCol col={4} offset={2} testID="c3" />
          <IonCol col="auto" testID="c4" />
        </IonRow>
      </IonGrid>,
    );
    expect(style('g')).toMatchObject({ padding: 5, width: '100%', flexDirection: 'column' });
    expect(style('r')).toMatchObject({ flexDirection: 'row', flexWrap: 'wrap' });
    expect(style('c1')).toMatchObject({ padding: 5, flexBasis: '8.33333%', width: '8.33333%', maxWidth: '8.33333%', flexGrow: 0 });
    expect(style('c2')).toMatchObject({ flexGrow: 1, flexBasis: 0, maxWidth: '100%' });
    expect(style('c3')).toMatchObject({ width: '33.33333%', marginLeft: '16.66667%' });
    expect(style('c4')).toMatchObject({ flexGrow: 0, flexBasis: 'auto' });
  });
  test('[no-padding] grid drops its own and its columns padding', () => {
    mount(
      <IonGrid noPadding testID="g">
        <IonRow>
          <IonCol col={6} testID="c" />
        </IonRow>
      </IonGrid>,
    );
    expect(style('g').padding).toBe(0);
    expect(style('c').padding).toBe(0);
  });
});

describe('ion-button', () => {
  test('block round primary: 36 high, 100% wide, radius 64, padding 26, shadow, 400 weight uppercase text', () => {
    const onPress = jest.fn();
    mount(
      <IonButton color="primary" block round onPress={onPress} testID="b">
        Submit
      </IonButton>,
    );
    expect(style('b')).toMatchObject({
      height: 36,
      width: '100%',
      borderRadius: 64,
      paddingHorizontal: 26,
      backgroundColor: ionicColors.primary,
      boxShadow: buttonMd.shadow,
    });
    const label = tree.root.findAll(n => n.props.children === 'Submit' && typeof n.type === 'string')[0];
    const ls = StyleSheet.flatten(label.props.style);
    expect(ls).toMatchObject({ fontSize: 14, color: '#ffffff', textTransform: 'uppercase' });
    expect(ls.fontFamily).toBe('Roboto-Regular'); // `* { font-weight: 400 }` keeps the span at 400
    press('b');
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  test('default: 2px radius, 15.4 padding, shrinks to its text; <a> keeps the .4rem .2rem margin, <button> has none', () => {
    mount(
      <View>
        <IonButton testID="b">Default</IonButton>
        <IonButton as="a" testID="a">
          Link
        </IonButton>
      </View>,
    );
    expect(style('b')).toMatchObject({ borderRadius: 2, paddingHorizontal: 15.4, alignSelf: 'flex-start' });
    expect(style('b').marginVertical).toBeUndefined();
    expect(style('a')).toMatchObject({ marginVertical: 4, marginHorizontal: 2 });
  });
  test('full has no radius; outline full has no side borders; clear is transparent', () => {
    mount(
      <View>
        <IonButton full testID="f">
          Full
        </IonButton>
        <IonButton kind="outline" full testID="of">
          Out
        </IonButton>
        <IonButton kind="clear" small testID="c">
          Clear
        </IonButton>
      </View>,
    );
    expect(style('f')).toMatchObject({ borderRadius: 0, width: '100%' });
    act(() => tree.unmount());
    mount(
      <View>
        <IonButton full round testID="fr">
          FR
        </IonButton>
        <IonButton as="a" block testID="ab">
          B
        </IonButton>
        <IonButton as="a" full testID="af">
          F
        </IonButton>
      </View>,
    );
    expect(style('fr').borderRadius).toBe(64); // NOTE (parity): .button-round-md comes after .button-full-md: round wins
    expect(style('ab')).toMatchObject({ marginVertical: 4, marginHorizontal: 0 }); // .button-block-md / -full-md zero the sides
    expect(style('af')).toMatchObject({ marginVertical: 4, marginHorizontal: 0 });
    act(() => tree.unmount());
    mount(
      <View>
        <IonButton full testID="f">
          Full
        </IonButton>
        <IonButton kind="outline" full testID="of">
          Out
        </IonButton>
        <IonButton kind="clear" small testID="c">
          Clear
        </IonButton>
      </View>,
    );
    expect(style('of')).toMatchObject({ borderLeftWidth: 0, borderRightWidth: 0, borderWidth: 1, borderColor: buttonColors().outline.border });
    expect(style('c')).toMatchObject({ backgroundColor: 'transparent', height: 27.3, paddingHorizontal: 11.7 });
    expect(style('c').boxShadow).toBeUndefined();
  });
  test('icon-only is 25.2px icon with .5em padding; icon-start is 1.4em with .3em gap', () => {
    mount(
      <View>
        <IonButton iconOnly="add" color="light" testID="io" />
        <IonButton iconStart="add" testID="is">
          Scan
        </IonButton>
      </View>,
    );
    expect(style('io').paddingHorizontal).toBe(0);
    expect(style('io').minWidth).toBeCloseTo(12.6, 5);
    const icons = tree.root.findAll(n => n.props.allowFontScaling === false && typeof n.type === 'string');
    expect(StyleSheet.flatten(icons[0].props.style)).toMatchObject({ fontSize: 25.2, paddingHorizontal: 12.6 });
    expect(StyleSheet.flatten(icons[1].props.style).fontSize).toBeCloseTo(19.6, 5);
    expect(StyleSheet.flatten(icons[1].props.style).marginRight).toBeCloseTo(5.88, 5);
  });
  test('cs-btn: 40 high, 12px / 1px letter-spacing label; re-btn 36 high with 43 margin; pdf-btn capitalize 16px', () => {
    mount(
      <View>
        <IonButton csBtn testID="cs">
          Save
        </IonButton>
        <IonButton reBtn testID="re">
          Reg
        </IonButton>
        <IonButton pdfBtn full testID="pdf">
          Pdf
        </IonButton>
      </View>,
    );
    expect(style('cs')).toMatchObject({ height: 40, width: '100%', backgroundColor: ionicColors.primary });
    expect(style('re')).toMatchObject({ height: 36, marginBottom: 43 });
    const t = (s: string) => StyleSheet.flatten(tree.root.findAll(n => n.props.children === s && typeof n.type === 'string')[0].props.style);
    expect(t('Save')).toMatchObject({ fontSize: 12, letterSpacing: 1, lineHeight: 22 });
    expect(t('Pdf')).toMatchObject({ fontSize: 16, textTransform: 'capitalize' });
    expect(t('Pdf').fontFamily).toBe('Roboto-Regular'); // the span keeps 400 (`* { font-weight: 400 }`), not the button's 600
    expect(t('Reg')).toMatchObject({ lineHeight: 22 }); // .cs-btn span { line-height: 22px }; the 41 is on the button
  });
  test('activated: !important backgrounds (cs-btn, green/red/reen colour) never change; pdf-btn and plain buttons shade', () => {
    mount(
      <View>
        <IonButton csBtn testID="cs">
          A
        </IonButton>
        <IonButton background={buttonMd.greenColorBackground} testID="g">
          B
        </IonButton>
        <IonButton pdfBtn full testID="pdf">
          C
        </IonButton>
        <IonButton testID="plain">D</IonButton>
      </View>,
    );
    for (const id of ['cs', 'g', 'pdf', 'plain']) {
      press(id);
    }
    expect(style('cs').backgroundColor).toBe(ionicColors.primary);
    expect(style('g').backgroundColor).toBe(buttonMd.greenColorBackground);
    expect(style('pdf').backgroundColor).toBe(colorShade(ionicColors.primary));
    expect(style('plain').backgroundColor).toBe(colorShade(ionicColors.primary));
    expect(style('cs').boxShadow).toBe(buttonMd.shadowActivated); // the shadow still changes
  });
  test('disabled: opacity .4 and the Pressable is disabled (no taps); an enabled tap shows the ripple', () => {
    const onPress = jest.fn();
    mount(
      <IonButton disabled onPress={onPress} testID="b">
        X
      </IonButton>,
    );
    expect(style('b').opacity).toBe(0.4);
    const pressable = find('b').find(n => n.props.disabled !== undefined)!;
    expect(pressable.props.disabled).toBe(true);
    act(() => tree.unmount());
    const ok = jest.fn();
    mount(
      <IonButton onPress={ok} testID="b">
        X
      </IonButton>,
    );
    press('b');
    expect(ok).toHaveBeenCalledTimes(1);
    advance(100);
    expect(style('b').backgroundColor).toBe(ionicColors.primary);
  });
});

describe('ion-list / ion-item / ion-list-header', () => {
  test('list margin -1 0 16; the last item has no inner line, the others a 1px #dedede one', () => {
    mount(
      <IonList testID="l">
        <IonItem label="One" testID="i1" />
        <IonItem label="Two" testID="i2" />
      </IonList>,
    );
    expect(style('l')).toMatchObject({ marginTop: -1, marginBottom: 16 });
    expect(style('i1-inner')).toMatchObject({ borderBottomWidth: 1, borderBottomColor: listMd.borderColor, paddingRight: 8 });
    expect(style('i2-inner').borderBottomWidth).toBe(0);
    expect(style('i1')).toMatchObject({ minHeight: 44, paddingLeft: 16, backgroundColor: '#fff' });
  });
  test('[no-lines] on the list or the item removes the lines', () => {
    mount(
      <IonList noLines>
        <IonItem label="One" testID="i1" />
        <IonItem label="Two" testID="i2" />
      </IonList>,
    );
    expect(style('i1-inner').borderBottomWidth).toBe(0);
  });
  test('items nested in an IonRadioGroup count as list children: last line, [no-lines], list header after a list', () => {
    mount(
      <IonList afterList testID="l">
        <IonRadioGroup>
          <IonListHeader testID="h">Type</IonListHeader>
          <IonItem label="a" testID="i1">
            <IonRadio value="a" />
          </IonItem>
          <IonItem label="b" testID="i2">
            <IonRadio value="b" />
          </IonItem>
        </IonRadioGroup>
      </IonList>,
    );
    expect(style('i1-inner').borderBottomWidth).toBe(1);
    expect(style('i2-inner').borderBottomWidth).toBe(0);
    expect(style('h').marginTop).toBe(-16);
    act(() => tree.unmount());
    mount(
      <IonList noLines>
        <IonRadioGroup>
          <IonItem label="a" testID="i1" />
        </IonRadioGroup>
        <IonItem label="x" testID="i2" />
      </IonList>,
    );
    expect(style('i1-inner').borderBottomWidth).toBe(0);
    act(() => tree.unmount());
    // a trailing non-item child means the last item is no longer :last-child
    mount(
      <IonList>
        <IonRadioGroup>
          <IonItem label="a" testID="i1" />
        </IonRadioGroup>
        <View />
      </IonList>,
    );
    expect(style('i1-inner').borderBottomWidth).toBe(1);
  });
  test('label: 16px black, margin 13 8 13 0, one line', () => {
    mount(<IonItem label="Plumber" testID="i" />);
    expect(style('i-label')).toMatchObject({ marginTop: 13, marginRight: 8, marginBottom: 13, marginLeft: 0, flex: 1 });
    const t = tree.root.findAll(n => n.props.children === 'Plumber' && typeof n.type === 'string')[0];
    expect(t.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(t.props.style)).toMatchObject({ fontSize: 16, color: '#000' });
  });
  test('the last input item of a list keeps a 1px bottom border on the item (list.md.scss .item-input:last-child)', () => {
    mount(
      <IonList>
        <IonItem input label="a" testID="i1" />
        <IonItem input label="b" testID="i2" />
      </IonList>,
    );
    expect(style('i1').borderBottomWidth).toBeUndefined();
    expect(style('i2')).toMatchObject({ borderBottomWidth: 1, borderBottomColor: listMd.borderColor });
  });
  test('the last cs-input of a list also keeps the 1px item border; a plain last input item gets it too, without the inner line', () => {
    mount(
      <IonList>
        <IonInputItem variant="csInput" label="a" value="" onChangeText={() => undefined} testID="c1" />
        <IonInputItem variant="csInput" label="b" value="" onChangeText={() => undefined} testID="c2" />
      </IonList>,
    );
    expect(style('c1').borderBottomWidth).toBeUndefined();
    expect(style('c2')).toMatchObject({ borderBottomWidth: 1, borderBottomColor: listMd.borderColor });
    act(() => tree.unmount());
    mount(
      <IonList>
        <IonInputItem label="a" value="" onChangeText={() => undefined} testID="p1" />
        <IonInputItem label="b" value="" onChangeText={() => undefined} testID="p2" />
      </IonList>,
    );
    expect(style('p1-inner').borderBottomWidth).toBe(1);
    expect(style('p2-inner').borderBottomWidth).toBe(0);
    expect(style('p2')).toMatchObject({ borderBottomWidth: 1, borderBottomColor: listMd.borderColor });
  });
  test('button item: tap runs onPress, shows #f1f1f1 after 80 ms; a plain item with (click) shows nothing', () => {
    const a = jest.fn();
    const b = jest.fn();
    mount(
      <View>
        <IonItem button label="B" onPress={a} testID="btn" />
        <IonItem label="P" onPress={b} testID="plain" />
      </View>,
    );
    press('btn');
    expect(a).toHaveBeenCalledTimes(1);
    expect(style('btn').backgroundColor).toBe(itemContentMd.activatedBackground);
    advance(100);
    expect(style('btn').backgroundColor).toBe('#fff');
    press('plain');
    expect(b).toHaveBeenCalledTimes(1);
    expect(style('plain').backgroundColor).toBe('#fff');
  });
  test('list-header: plain (#757575, 14px, border-top, margin-bottom 13), border-heading, color="secondary"', () => {
    mount(
      <View>
        <IonListHeader testID="p">Scan History</IonListHeader>
        <IonListHeader borderHeading testID="bh">
          Select Type
        </IonListHeader>
        <IonListHeader color="secondary" testID="sec">
          History
        </IonListHeader>
        <IonListHeader afterList testID="after">
          x
        </IonListHeader>
      </View>,
    );
    expect(style('p')).toMatchObject({ minHeight: 45, paddingLeft: 16, marginBottom: 13, borderTopWidth: 1, borderTopColor: '#dedede' });
    const t = (s: string) => StyleSheet.flatten(tree.root.findAll(n => n.props.children === s && typeof n.type === 'string')[0].props.style);
    expect(t('Scan History')).toMatchObject({ fontSize: 14, color: listHeaderMd.color });
    expect(t('Scan History').fontFamily).toBe('Roboto-Regular');
    expect(exists('p-label')).toBe(false); // ion-list-header has no ion-label: the text sits directly in the flex row
    // only the background / radius / border-top rule of .border-heading matches; the .item-inner .input-wrapper ion-label rules and the bar do not
    expect(style('bh')).toMatchObject({ backgroundColor: '#f8f8f8', marginBottom: 0, borderTopWidth: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8 });
    expect(t('Select Type')).toMatchObject({ fontSize: 14, color: listHeaderMd.color });
    expect(t('Select Type').fontFamily).toBe('Roboto-Regular');
    expect(t('Select Type').marginLeft).toBeUndefined();
    expect(exists('bh-bar')).toBe(false);
    expect(style('sec').backgroundColor).toBe(ionicColors.secondary);
    expect(t('History').color).toBe('#ffffff');
    expect(style('after').marginTop).toBe(-16);
  });
});

describe('radio-group + ion-radio', () => {
  function Radios(props: { onChange?: (v: unknown) => void; value?: unknown; onPress?: (v: unknown) => void }) {
    const { onChange, onPress } = props;
    const model = 'value' in props ? { value: props.value } : null; // [(ngModel)] present or not
    return (
      <IonList>
        <IonRadioGroup {...model} onChange={onChange}>
          <IonItem label="Plumber" testID="i1">
            <IonRadio value="Plumber" color="primary" testID="r1" onPress={onPress} />
          </IonItem>
          <IonItem label="Seller" testID="i2">
            <IonRadio value="Sales_Boy" testID="r2" />
          </IonItem>
        </IonRadioGroup>
      </IonList>
    );
  }
  const iconBorder = (id: string) => StyleSheet.flatten(host(`${id}-icon`).props.style).borderColor;
  test('radio sits at the item end with 9 10 9 0 margins; unchecked ring #787878, 16 x 16, 2px', () => {
    mount(<Radios />);
    expect(style('r1')).toMatchObject({ marginTop: 9, marginRight: 10, marginBottom: 9, marginLeft: 0 });
    expect(style('r1-icon')).toMatchObject({ width: 16, height: 16, borderWidth: 2, borderColor: radioMd.borderColor, borderRadius: 8 });
    expect(style('r1-inner')).toMatchObject({ width: 8, height: 8, left: 2, top: 2 });
    // end slot: after the item-inner content, inside .item-inner
    const inner = host('i1-inner');
    const kids = React.Children.toArray(inner.props.children) as any[];
    expect(kids[kids.length - 1].props.testID).toBe('r1');
  });
  test('tapping the item selects the radio, colours its ring and label, and fires ionChange(value)', () => {
    const onChange = jest.fn();
    const onPress = jest.fn();
    mount(<Radios onChange={onChange} onPress={onPress} />);
    press('i1-cover');
    expect(onChange).toHaveBeenCalledWith('Plumber');
    expect(onPress).toHaveBeenCalledWith('Plumber');
    expect(iconBorder('r1')).toBe(ionicColors.primary);
    expect(iconBorder('r2')).toBe(radioMd.borderColor);
    const label = tree.root.findAll(n => n.props.children === 'Plumber' && typeof n.type === 'string')[0];
    expect(StyleSheet.flatten(label.props.style).color).toBe(ionicColors.primary); // .item-radio-checked ion-label
    press('i2-cover');
    expect(onChange).toHaveBeenLastCalledWith('Sales_Boy');
    expect(iconBorder('r1')).toBe(radioMd.borderColor);
    expect(iconBorder('r2')).toBe(ionicColors.primary);
  });
  test('NOTE (parity): tapping the already selected radio fires ionChange again', () => {
    const onChange = jest.fn();
    mount(<Radios onChange={onChange} />);
    press('i1-cover');
    press('i1-cover');
    expect(onChange).toHaveBeenCalledTimes(2);
  });
  test('[(ngModel)]: writeValue(null) is skipped, the initial model is written in a later microtask and emits once; later writes emit', async () => {
    const onChange = jest.fn();
    mount(<Radios onChange={onChange} value="Plumber" />);
    expect(onChange).not.toHaveBeenCalled(); // synchronous mount: nothing yet
    await flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('Plumber');
    expect(iconBorder('r1')).toBe(ionicColors.primary);
    rerender(<Radios onChange={onChange} value="Sales_Boy" />);
    expect(onChange).toHaveBeenLastCalledWith('Sales_Boy');
    expect(iconBorder('r2')).toBe(ionicColors.primary);
    rerender(<Radios onChange={onChange} value="Sales_Boy" />);
    expect(onChange).toHaveBeenCalledTimes(2); // an unchanged model is not written again
  });
  test('NOTE (parity): an undefined initial model still emits ionChange(undefined) once; a group without a value prop never does', async () => {
    const onChange = jest.fn();
    mount(<Radios onChange={onChange} value={undefined} />);
    await flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    act(() => tree.unmount());
    const plain = jest.fn();
    mount(<Radios onChange={plain} />);
    await flush();
    expect(plain).not.toHaveBeenCalled();
  });
  test('a user selection echoed back by the parent does not emit twice', async () => {
    const onChange = jest.fn();
    function Parent() {
      const [v, setV] = React.useState<unknown>(undefined);
      return (
        <Radios
          value={v}
          onChange={x => {
            onChange(x);
            setV(x);
          }}
        />
      );
    }
    mount(<Parent />);
    await flush();
    expect(onChange).toHaveBeenCalledTimes(1); // the initial (undefined) model write
    press('i2-cover');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith('Sales_Boy');
  });
  test('disabled group: .3 opacity and the cover is disabled', () => {
    mount(
      <IonRadioGroup disabled>
        <IonItem label="x" testID="i">
          <IonRadio value="a" testID="r" />
        </IonItem>
      </IonRadioGroup>,
    );
    expect(style('r').opacity).toBe(0.3);
    expect(find('i-cover').find(n => n.props.disabled !== undefined)!.props.disabled).toBe(true);
  });
  test('loose compare like isCheckedProperty: group value 0 checks radio "0"', () => {
    mount(
      <IonRadioGroup value={0}>
        <IonItem label="x">
          <IonRadio value="0" testID="r" />
        </IonItem>
      </IonRadioGroup>,
    );
    expect(iconBorder('r')).toBe(ionicColors.primary);
  });
  test('the `checked` attribute is honoured until the group is updated', () => {
    mount(
      <IonRadioGroup>
        <IonItem label="a">
          <IonRadio value="en" checked="true" testID="r1" />
        </IonItem>
        <IonItem label="b" testID="i2">
          <IonRadio value="hin" checked="false" testID="r2" />
        </IonItem>
      </IonRadioGroup>,
    );
    expect(iconBorder('r1')).toBe(ionicColors.primary);
    expect(iconBorder('r2')).toBe(radioMd.borderColor);
    press('i2-cover');
    expect(iconBorder('r1')).toBe(radioMd.borderColor);
    expect(iconBorder('r2')).toBe(ionicColors.primary);
  });
});

describe('ion-checkbox', () => {
  test('checkbox sits at the item start with 9 36 9 4 margins; 16 x 16, 2px #787878 ring, radius 2', () => {
    mount(
      <IonItem label="Same as Working Address" testID="i">
        <IonCheckbox testID="c" />
      </IonItem>,
    );
    expect(style('c')).toMatchObject({ marginTop: 9, marginRight: 36, marginBottom: 9, marginLeft: 4 });
    expect(style('c-icon')).toMatchObject({ width: 16, height: 16, borderWidth: 2, borderRadius: 2 });
    expect(hex(style('c-icon').borderColor as string)).toBe(checkboxMd.borderColor);
    expect(exists('c-tick')).toBe(false);
    // start slot: before the .item-inner
    const kids = React.Children.toArray(host('i').props.children) as any;
    const items = (Array.isArray(kids[0].props.children) ? kids[0].props.children : [kids[0].props.children]).flat();
    expect(items[0].props.testID).toBe('c');
  });
  test('a tap checks it (tick drawn), fires ionChange synchronously before (click); again unchecks', () => {
    const order: string[] = [];
    const onChange = jest.fn(() => order.push('ionChange'));
    const onPress = jest.fn(() => order.push('click'));
    mount(
      <IonItem label="x" testID="i">
        <IonCheckbox color="dark" onChange={onChange} onPress={onPress} testID="c" />
      </IonItem>,
    );
    press('i-cover');
    expect(onPress).toHaveBeenCalledWith(true);
    // TimeoutDebouncer(0) runs synchronously (util/debouncer.js:12-13), and the inner button's handler runs before the host (click)
    expect(order).toEqual(['ionChange', 'click']);
    expect(onChange).toHaveBeenCalledWith({ checked: true, value: true, disabled: false }); // Ionic emits the Checkbox: $event.checked
    expect(exists('c-tick')).toBe(true);
    expect(style('c-tick')).toMatchObject({ left: 4, top: 0, width: 5, height: 10, borderRightWidth: 2, borderBottomWidth: 2 });
    expect(style('c-tick').transform).toEqual([{ rotate: '45deg' }]);
    advance(300);
    expect(hex(StyleSheet.flatten(host('c-icon').props.style).backgroundColor as string)).toBe('#222222'); // color="dark" ([CSS] checkbox-md-dark)
    press('i-cover');
    advance(1);
    expect(onChange).toHaveBeenLastCalledWith({ checked: false, value: false, disabled: false });
    expect(exists('c-tick')).toBe(false);
  });
  test('border colour changes at once (only the background transitions); tick is #000 for color="light", #fff otherwise', () => {
    mount(
      <View>
        <IonItem label="x" testID="i">
          <IonCheckbox color="dark" testID="c" />
        </IonItem>
        <IonItem label="y" testID="j">
          <IonCheckbox color="light" checked testID="l" />
        </IonItem>
      </View>,
    );
    expect(StyleSheet.flatten(host('c-icon').props.style).borderColor).toBe(checkboxMd.borderColor);
    press('i-cover');
    expect(StyleSheet.flatten(host('c-icon').props.style).borderColor).toBe(ionicColors.dark); // immediately, no animation frames needed
    expect(style('c-tick').borderColor).toBe('#ffffff');
    expect(style('l-tick').borderColor).toBe('#000000');
  });
  test('[checked] initial true is drawn checked without emitting; the first model write is skipped, a later one emits', () => {
    const onChange = jest.fn();
    const Cb = ({ v }: { v?: boolean }) => (
      <IonItem label="x">
        <IonCheckbox checked={v} onChange={onChange} testID="c" />
      </IonItem>
    );
    mount(<Cb v />);
    advance(10);
    expect(exists('c-tick')).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
    rerender(<Cb v={false} />); // initModel already true (the initial true write was the skipped one)
    advance(10);
    expect(onChange).toHaveBeenCalledWith({ checked: false, value: false, disabled: false });
    expect(exists('c-tick')).toBe(false);
    rerender(<Cb v={false} />);
    advance(10);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  test('with an initial false model the first model change is the skipped one, the next emits', () => {
    const onChange = jest.fn();
    const Cb = ({ v }: { v?: boolean }) => (
      <IonItem label="x">
        <IonCheckbox checked={v} onChange={onChange} testID="c" />
      </IonItem>
    );
    mount(<Cb v={false} />);
    rerender(<Cb v />);
    advance(10);
    expect(onChange).not.toHaveBeenCalled();
    expect(exists('c-tick')).toBe(true);
    rerender(<Cb v={false} />);
    advance(10);
    expect(onChange).toHaveBeenCalledWith({ checked: false, value: false, disabled: false });
    rerender(<Cb v={undefined} />); // _writeValue(undefined) changes nothing
    advance(10);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  test('disabled checkbox: .3 opacity, the cover cannot be pressed', () => {
    mount(
      <IonItem label="x" testID="i">
        <IonCheckbox disabled testID="c" />
      </IonItem>,
    );
    expect(style('c').opacity).toBe(0.3);
    expect(find('i-cover').find(n => n.props.disabled !== undefined)!.props.disabled).toBe(true);
  });
  test('a checkbox outside an item is tapped itself', () => {
    const onChange = jest.fn();
    mount(<IonCheckbox onChange={onChange} testID="c" />);
    press('c');
    advance(1);
    expect(onChange).toHaveBeenCalledWith({ checked: true, value: true, disabled: false });
  });
});

describe('ion-input / ion-textarea', () => {
  const input = (id: string) => host(id);
  test('plain item: 16px black text, 18/19 high line, no margin (global input margin 0), width calc(100% - 16)', () => {
    mount(<IonInputItem placeholder="Search" value="" onChangeText={() => undefined} testID="f" />);
    const t = input('f-input');
    expect(t.props.placeholderTextColor).toBe('#999');
    expect(t.props.autoCorrect).toBe(false);
    expect(t.props.keyboardType).toBe('default');
    expect(StyleSheet.flatten(t.props.style)).toMatchObject({ fontSize: 16, color: '#000', paddingTop: 0 });
  });
  test('types map to keyboards; password is masked; maxLength and readOnly pass through', () => {
    mount(
      <View>
        <IonInputItem type="tel" maxLength={10} value="" onChangeText={() => undefined} testID="t" />
        <IonInputItem type="email" value="" onChangeText={() => undefined} testID="e" />
        <IonInputItem type="number" value="" onChangeText={() => undefined} testID="n" />
        <IonInputItem type="password" value="" onChangeText={() => undefined} testID="p" />
        <IonInputItem readOnly value="x" onChangeText={() => undefined} testID="r" />
        <IonInputItem disabled value="x" onChangeText={() => undefined} testID="d" />
      </View>,
    );
    expect(input('t-input').props).toMatchObject({ keyboardType: 'phone-pad', maxLength: 10 });
    expect(input('e-input').props.keyboardType).toBe('email-address');
    expect(input('n-input').props.keyboardType).toBe('numeric');
    expect(input('p-input').props.secureTextEntry).toBe(true);
    expect(input('r-input').props.editable).toBe(false);
    expect(input('d-input').props.editable).toBe(false);
  });
  test('typing calls onChangeText', () => {
    const onChange = jest.fn();
    mount(<IonInputItem value="" onChangeText={onChange} testID="f" />);
    act(() => input('f-input').props.onChangeText('abc'));
    expect(onChange).toHaveBeenCalledWith('abc');
  });
  test('cs-input: 45 high item with 16px vertical margin, 1px #ccc border on the inner, 13px text with padding 15 13 0 13', () => {
    mount(<IonInputItem variant="csInput" floating label="Name" value="" onChangeText={() => undefined} testID="f" />);
    expect(style('f')).toMatchObject({ minHeight: 45, marginVertical: 16, paddingLeft: 0 });
    expect(style('f-inner')).toMatchObject({ borderWidth: 1, borderColor: '#ccc', borderBottomColor: '#ccc', paddingRight: 0 });
    expect(StyleSheet.flatten(input('f-input').props.style)).toMatchObject({ fontSize: 13, paddingTop: 15, paddingLeft: 13, paddingRight: 13 });
  });
  test('cs-input floating label: absolute, -15 top, 14px #949494, translateY 27 empty, scale .8 with a value or focus', () => {
    const Ci = ({ v }: { v: string }) => <IonInputItem variant="csInput" floating label="Name" value={v} onChangeText={() => undefined} testID="f" />;
    mount(<Ci v="" />);
    expect(style('f-label')).toMatchObject({ position: 'absolute', marginTop: -15, paddingLeft: 16 });
    expect(style('f-label').transform).toEqual([{ translateY: inputMd.csInput.labelTranslateY }]);
    expect(style('f-label').transformOrigin).toEqual([0, 80, 0]);
    expect(StyleSheet.flatten(host('f-label-text').props.style)).toMatchObject({ fontSize: 14, color: '#949494' });
    rerender(<Ci v="Ramesh" />);
    expect(style('f-label').transform).toEqual([{ translateY: 0 }, { scale: 0.8 }]);
  });
  test('focus floats the label (item-input-has-focus) and blur returns it', () => {
    mount(<IonInputItem variant="csInput" floating label="Name" value="" onChangeText={() => undefined} testID="f" />);
    act(() => input('f-input').props.onFocus());
    expect(style('f-label').transform).toEqual([{ translateY: 0 }, { scale: 0.8 }]);
    act(() => input('f-input').props.onBlur());
    expect(style('f-label').transform).toEqual([{ translateY: 27 }]);
  });
  test('cs-input error: red inner border and red label, input stays black', () => {
    mount(<IonInputItem variant="csInput" floating label="Name" error value="" onChangeText={() => undefined} testID="f" />);
    expect(style('f-inner')).toMatchObject({ borderWidth: 1, borderColor: inputMd.csInput.errorColor });
    expect(StyleSheet.flatten(host('f-label-text').props.style).color).toBe(inputMd.csInput.errorColor);
  });
  test('plain item underline: focus = primary line, valid + value = green, invalid + touched = red', () => {
    const It = (p: any) => <IonInputItem floating label="Mobile" onChangeText={() => undefined} testID="f" {...p} />;
    mount(<It value="" />);
    expect(style('f-inner').borderBottomColor).toBe('#dedede');
    act(() => input('f-input').props.onFocus());
    expect(style('f-inner').borderBottomColor).toBe(ionicColors.primary);
    expect(exists('f-inset-line')).toBe(true);
    act(() => input('f-input').props.onBlur());
    rerender(<It value="9999999999" validation={{ valid: true }} />);
    expect(style('f-inner').borderBottomColor).toBe(inputMd.underline.valid);
    rerender(<It value="" validation={{ invalid: true, touched: true }} />);
    expect(style('f-inner').borderBottomColor).toBe(inputMd.underline.invalid);
  });
  test('plain floating item: the input box sizes from its content in the column (flex-basis auto, not 0) and the input has a height', () => {
    mount(<IonInputItem floating label="Mobile" value="" onChangeText={() => undefined} testID="f" />);
    const boxOf = (id: string) => {
      let n: any = input(id).parent;
      while (n && !(typeof n.type === 'string' && StyleSheet.flatten(n.props.style)?.flexGrow !== undefined || StyleSheet.flatten(n.props.style)?.flex !== undefined)) n = n.parent;
      return StyleSheet.flatten(n.props.style);
    };
    const box = boxOf('f-input');
    expect(box.flexBasis).toBe('auto'); // flex: 1 (basis 0) in an auto-height column collapsed the input to 0 high
    expect(box.flexShrink).toBe(0); // the column must not squeeze the input to fit the 44 min-height
    expect(box.minHeight).toBeGreaterThan(0);
    // the item grows to its content: no fixed height on item / inner / wrapper, wrapper reserves label (13 + 19) + input
    for (const id of ['f', 'f-inner', 'f-wrapper']) {
      expect(style(id).height).toBeUndefined();
    }
    expect(style('f-wrapper').minHeight).toBe(13 + 19 + box.minHeight);
    expect(StyleSheet.flatten(host('f-label').props.style).flexShrink).toBe(0);
    expect(StyleSheet.flatten(input('f-input').props.style).height).toBeGreaterThan(0);
    // order: the label, then the input, in the column wrapper
    const wrapper = host('f-wrapper');
    const kids = React.Children.toArray(wrapper.props.children as any);
    expect(kids.length).toBe(2);
    // the non-floating (row) item keeps `flex: 1`
    mount(<IonInputItem label="Mobile" value="" onChangeText={() => undefined} testID="g" />);
    expect(boxOf('g-input').flex).toBe(1);
  });
  test('floating textarea keeps its 100px height + margins (no squeeze) and the column reserves it', () => {
    mount(<IonInputItem textarea floating label="Remark" value="" onChangeText={() => undefined} testID="b" />);
    expect(StyleSheet.flatten(input('b-input').props.style).height).toBe(100);
    expect(style('b-wrapper').minHeight).toBe(13 + 19 + 8 + 100 + 8);
    mount(<IonInputItem variant="csInput" textarea floating label="Remark" value="" onChangeText={() => undefined} testID="c" />);
    expect(StyleSheet.flatten(input('c-input').props.style).height).toBe(100);
    expect(style('c-wrapper').minHeight).toBe(100 + 8 + 8 + 20); // absolute label takes no room; element padding 10 10
  });
  test('.edit floating input: the ion-input element has the 1px #b5b5b5 border and 35 height', () => {
    mount(<IonInputItem variant="edit" floating label="Name" value="" onChangeText={() => undefined} testID="e" />);
    let n: any = input('e-input').parent;
    while (n && !(typeof n.type === 'string' && StyleSheet.flatten(n.props.style)?.borderWidth === 1)) n = n.parent;
    expect(StyleSheet.flatten(n.props.style)).toMatchObject({ borderWidth: 1, borderColor: '#b5b5b5', height: 35 });
    expect(style('e-wrapper').minHeight).toBe(0 + 14 + 0 + 35);
  });
  test('edit page input: 13px, padding-left 8, 35 high; cs-input has no underline colours', () => {
    mount(<IonInputItem variant="edit" floating label="Name" value="" onChangeText={() => undefined} testID="f" />);
    expect(StyleSheet.flatten(input('f-input').props.style)).toMatchObject({ fontSize: 13, paddingLeft: 8, height: 35 });
  });
  test('textarea: global 12px / 100 high with its 13px 8px margins (8px 8px 8px 0 floating)', () => {
    mount(
      <View>
        <IonInputItem textarea placeholder="Feedback" value="" onChangeText={() => undefined} testID="a" />
        <IonInputItem textarea floating label="Remark" value="" onChangeText={() => undefined} testID="b" />
      </View>,
    );
    expect(input('a-input').props.multiline).toBe(true);
    expect(StyleSheet.flatten(input('a-input').props.style)).toMatchObject({
      fontSize: 12,
      height: 100,
      marginTop: 13,
      marginBottom: 13,
      marginLeft: 8,
      marginRight: 8, // width: calc(100% - 16) with margin-left 8
    });
    expect(StyleSheet.flatten(input('b-input').props.style)).toMatchObject({ marginTop: 8, marginBottom: 8, marginLeft: 0, marginRight: 8 });
  });
  test('cs-textarea1 on .edit pages: 70 high, 13px, padding 10, 1px #ccc border, no margin', () => {
    mount(<IonInputItem variant="editTextarea" textarea value="" onChangeText={() => undefined} testID="f" />);
    expect(StyleSheet.flatten(input('f-input').props.style)).toMatchObject({
      height: 70,
      fontSize: 13,
      padding: 10,
      borderWidth: 1,
      borderColor: '#ccc',
      marginTop: 0,
      marginLeft: 0,
      marginRight: 0,
    });
  });
});

describe('ion-card', () => {
  test('card header with text + icon (survey-list) renders the text in a Text with the icon inline', () => {
    mount(
      <IonCardHeader testID="h">{['Text', <IonIcon key="i" name="add" testID="ic" />]}</IonCardHeader>,
    );
    expect(exists('ic')).toBe(true);
    const text = tree.root.findAll(n => n.props.numberOfLines === 1 && typeof n.type === 'string')[0];
    expect(text).toBeDefined();
    expect(React.Children.toArray(text.props.children)[0]).toBe('Text');
  });
  test('ionPadding is the [padding] attribute: 16', () => {
    expect(ionPadding).toEqual({ padding: 16 });
  });
  test('card: margin 10, radius 2, white, md shadow; header 16px #222 padding 16; content padding 13 16 (0 top after a header)', () => {
    mount(
      <IonCard testID="cd">
        <IonCardHeader testID="h">Survey</IonCardHeader>
        <IonCardContent afterHeader testID="c">
          Text
        </IonCardContent>
      </IonCard>,
    );
    expect(style('cd')).toMatchObject({ margin: 10, borderRadius: 2, backgroundColor: '#fff', boxShadow: cardMd.shadow });
    expect(style('h').padding).toBe(16);
    const t = (s: string) => StyleSheet.flatten(tree.root.findAll(n => n.props.children === s && typeof n.type === 'string')[0].props.style);
    expect(t('Survey')).toMatchObject({ fontSize: 16, color: '#222' });
    expect(style('c')).toMatchObject({ paddingHorizontal: 16, paddingVertical: 13, paddingTop: 0 });
    expect(t('Text')).toMatchObject({ fontSize: 14, lineHeight: 21 });
  });
});
