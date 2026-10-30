// Fix round 1 for Task 9 part 3 (reviewer findings): label text with the required star, floating labels, the
// `.edit` page variants, imperative open()/close(), ionChange init rule, clear order, min="" crash, undefined writes.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet, View } from 'react-native';
import { IonDatetime } from '../src/components/ionic/IonDatetime';
import { IonicSelectable, type SelectableHandle } from '../src/components/ionic/IonicSelectable';
import { IonSelect } from '../src/components/ionic/IonSelect';
import { OverlayHost } from '../src/components/ionic/OverlayHost';
import { SelectSearchable } from '../src/components/ionic/SelectSearchable';
import { _resetOverlaysForTests, isModalOpen, isOverlayOpen } from '../src/ui/overlays';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = (fn: () => void) => ReactTestRenderer.act(fn);
const advance = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const exists = (id: string) => find(id).length > 0;
const style = (id: string) => StyleSheet.flatten(host(id).props.style);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(host(id).props.children);
// the style of the <Text> inside a label wrapper
const labelTextStyle = (id: string) => StyleSheet.flatten(host(`${id}-text`).props.style);
function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function');
  if (!n) { throw new Error(`nothing pressable with testID ${id}`); }
  act(() => n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } }));
}
const wrap = (el: React.ReactElement) => (<View>{el}<OverlayHost /></View>);
const mount = (el: React.ReactElement) => act(() => { tree = ReactTestRenderer.create(wrap(el)); });
const rerender = (el: React.ReactElement) => act(() => { tree.update(wrap(el)); });

beforeEach(() => { jest.useFakeTimers(); _resetOverlaysForTests(); });
afterEach(() => { act(() => tree.unmount()); jest.useRealTimers(); });

const STATES = ['Delhi', 'Haryana', 'Punjab'].map(n => ({ label: n, value: n }));
const EXEC = ['Ramesh Kumar', 'Suresh Verma'].map((n, i) => ({ id: i + 1, first_name: n }));
const selProps = { items: EXEC, itemValueField: 'first_name', itemTextField: 'first_name', canSearch: true };

describe('1. title = the label textContent, star included', () => {
  test('ion-select alert title is labelText exactly', () => {
    mount(<IonSelect testID="s" label="State" requiredMark labelText="State *" options={STATES} value="Delhi" />);
    press('s-cover'); advance(250);
    expect(textOf('alert-title')).toBe('State *');
  });
  test('ionic-selectable and select-searchable modal titles are labelText exactly', () => {
    mount(<IonicSelectable testID="x" label="Select plumber" labelText="Select plumber*" {...selProps} value={null} />);
    press('x-cover'); advance(300);
    expect(textOf('selectable-title')).toBe('Select plumber*');
    act(() => tree.unmount());
    _resetOverlaysForTests();
    mount(<SelectSearchable testID="y" label="Select Type" labelText="Select Type *" {...selProps} value={null} />);
    press('y-cover'); advance(300);
    expect(textOf('selectable-title')).toBe('Select Type *');
  });
});

describe('2. floating label (.edit pages: add-leave, travel-add)', () => {
  test('label is 13px/14px #a1a1a1, padding-left 10, shifted 10px down at scale .8 from the top-left; date box 35px with #b5b5b5 border', () => {
    mount(<IonDatetime testID="d" variant="edit" floating label="Leave Start Date *" displayFormat="MMM DD, YYYY" placeholder="Select Leave Start Date" value="" />);
    expect(style('d')).toMatchObject({ paddingLeft: 0 });
    expect(style('d-wrapper').flexDirection).toBe('column');
    const l = style('d-label');
    expect(l).toMatchObject({ paddingLeft: 10, marginTop: 0, marginBottom: 0, marginRight: 8 });
    expect(l.transform).toEqual([{ translateY: 10 }, { scale: 0.8 }]);
    expect(labelTextStyle('d-label')).toMatchObject({ fontSize: 13, lineHeight: 14, color: '#a1a1a1' });
    expect(style('d-box')).toMatchObject({ height: 35, borderWidth: 1, borderColor: '#b5b5b5', paddingLeft: 0, width: '100%' });
    expect(StyleSheet.flatten(host('d-text').props.style).fontSize).toBe(13);
  });
});

describe('3. .edit item variants', () => {
  test('cs-normal-select: height 35, inner 1px #dedede border all round, label 12px/30 pl10, select 0 8 0 16 text 13px black lh 18, black placeholder', () => {
    mount(<IonSelect testID="n" variant="editCsNormalSelect" label="Select type" placeholder="Select Type" options={STATES} />);
    expect(style('n')).toMatchObject({ height: 35, minHeight: 35, marginBottom: 15, paddingLeft: 0 });
    expect(style('n-inner')).toMatchObject({ borderWidth: 1, borderColor: '#dedede', paddingRight: 0 });
    expect(labelTextStyle('n-label')).toMatchObject({ fontSize: 12, lineHeight: 30 });
    expect(style('n-label')).toMatchObject({ paddingLeft: 10, marginTop: 0, marginBottom: 0, marginRight: 0 });
    expect(style('n-box')).toMatchObject({ paddingTop: 0, paddingRight: 8, paddingBottom: 0, paddingLeft: 16, maxWidth: '45%' });
    expect(StyleSheet.flatten(host('n-text').props.style)).toMatchObject({ fontSize: 13, color: '#000000', lineHeight: 18 });
  });
  test('cs-selectable: min-height 35, inner #ccc border, label span 13px/35 pl10, value padding 9 10 8 10 13px wrapping, arrow stays at top 20 for ionic-selectable', () => {
    mount(<IonicSelectable testID="x" variant="editCsSelectable" label="Select Product" {...selProps} value={EXEC[0]} />);
    expect(style('x')).toMatchObject({ minHeight: 35, marginBottom: 16, paddingLeft: 0 });
    expect(style('x-inner')).toMatchObject({ borderWidth: 1, borderColor: '#ccc' });
    expect(labelTextStyle('x-label')).toMatchObject({ fontSize: 13, lineHeight: 35 });
    expect(style('x-label')).toMatchObject({ paddingLeft: 10, marginTop: 0 });
    expect(style('x-value')).toMatchObject({ paddingTop: 9, paddingRight: 10, paddingBottom: 8, paddingLeft: 10 });
    const v = host('x-value-item-0');
    expect(v.props.numberOfLines).toBeUndefined();
    expect(StyleSheet.flatten(v.props.style).fontSize).toBe(13);
    expect(style('x-icon-inner').top).toBe(20); // the Topbath arrow rule only names .select-searchable-icon-inner
  });
  test('select-searchable inside cs-selectable gets the centred arrow (top 50%, left 4)', () => {
    mount(<SelectSearchable testID="y" variant="editCsSelectable" label="Category" {...selProps} value={EXEC[0]} />);
    expect(style('y-icon-inner')).toMatchObject({ top: '50%', left: 4 });
  });
  test('edit cs-select: ionic-selectable value wraps with break-all, label 12px lh 30', () => {
    mount(<IonicSelectable testID="x" variant="editCsSelect" label="State" {...selProps} value={EXEC[0]} />);
    expect(style('x-inner')).toMatchObject({ borderWidth: 1, borderColor: '#dedede' });
    expect(labelTextStyle('x-label')).toMatchObject({ fontSize: 12, lineHeight: 30 });
    expect(style('x-value')).toMatchObject({ paddingTop: 9, paddingLeft: 10 });
    expect(host('x-value-item-0').props.textBreakStrategy).toBe('simple');
  });
});

describe('4. imperative open()/close()', () => {
  test('ref.open() opens the modal, ref.close() closes it', () => {
    const ref = React.createRef<SelectableHandle>();
    mount(<IonicSelectable ref={ref} testID="x" label="L" {...selProps} value={null} />);
    act(() => { ref.current!.open(); });
    advance(300);
    expect(isModalOpen()).toBe(true);
    act(() => { ref.current!.close(); });
    advance(1); advance(300);
    expect(isModalOpen()).toBe(false);
  });
  test('select-searchable exposes the same handle', () => {
    const ref = React.createRef<SelectableHandle>();
    mount(<SelectSearchable ref={ref} testID="y" label="L" {...selProps} value={null} />);
    act(() => { ref.current!.open(); });
    advance(300);
    expect(isModalOpen()).toBe(true);
  });
});

describe('5. ionChange and the first external write (base-input.js writeValue / _initModel)', () => {
  test('ion-select: the first value written from outside is silent, later outside writes fire', () => {
    const onIon = jest.fn();
    mount(<IonSelect testID="s" label="S" options={STATES} value={undefined} onIonChange={onIon} />);
    rerender(<IonSelect testID="s" label="S" options={STATES} value="Delhi" onIonChange={onIon} />);
    expect(onIon).not.toHaveBeenCalled();
    rerender(<IonSelect testID="s" label="S" options={STATES} value="Punjab" onIonChange={onIon} />);
    expect(onIon).toHaveBeenCalledWith('Punjab');
  });
  test('ion-select: a value present at mount counts as the first write (silent)', () => {
    const onIon = jest.fn();
    mount(<IonSelect testID="s" label="S" options={STATES} value="Delhi" onIonChange={onIon} />);
    expect(onIon).not.toHaveBeenCalled();
  });
  test('ion-datetime: same rule', () => {
    const onIon = jest.fn();
    mount(<IonDatetime testID="d" label="D" displayFormat="DD/MM/YYYY" value={undefined} onIonChange={onIon} />);
    rerender(<IonDatetime testID="d" label="D" displayFormat="DD/MM/YYYY" value="1990-08-15" onIonChange={onIon} />);
    expect(onIon).not.toHaveBeenCalled();
    rerender(<IonDatetime testID="d" label="D" displayFormat="DD/MM/YYYY" value="1991-01-02" onIonChange={onIon} />);
    expect(onIon).toHaveBeenCalledWith('1991-01-02');
  });
});

describe('6. ionic-selectable clear order and onClose timing', () => {
  test('Clear: onChange(null) first, then onClear; onClose only after the modal has left', () => {
    const calls: string[] = [];
    mount(
      <IonicSelectable
        testID="x"
        label="L"
        {...selProps}
        canClear
        value={EXEC[0]}
        onChange={() => calls.push('change')}
        onClear={() => calls.push('clear')}
        onClose={() => calls.push('close')}
      />,
    );
    press('x-cover'); advance(300);
    press('selectable-clear');
    expect(calls).toEqual(['change', 'clear']);
    advance(100);
    expect(calls).toEqual(['change', 'clear']);
    advance(300);
    expect(calls).toEqual(['change', 'clear', 'close']);
  });
});

describe('7. min="" (add-leave end date before a start date is chosen)', () => {
  test('tapping does not throw, opens nothing, and a later tap with a valid min works', () => {
    mount(<IonDatetime testID="d" label="End" displayFormat="MMM DD, YYYY" min="" value="" />);
    expect(() => press('d-cover')).not.toThrow();
    advance(500);
    expect(isOverlayOpen()).toBe(false);
    rerender(<IonDatetime testID="d" label="End" displayFormat="MMM DD, YYYY" min="2026-10-30" max="2027" value="" />);
    press('d-cover'); advance(450);
    expect(isOverlayOpen()).toBe(true);
  });
});

describe('8. undefined writes are ignored', () => {
  test('ion-datetime keeps the previous text when value becomes undefined', () => {
    mount(<IonDatetime testID="d" label="D" displayFormat="DD/MM/YYYY" value="1990-08-15" />);
    expect(textOf('d-text')).toBe('15/08/1990');
    rerender(<IonDatetime testID="d" label="D" displayFormat="DD/MM/YYYY" value={undefined} />);
    expect(textOf('d-text')).toBe('15/08/1990');
    rerender(<IonDatetime testID="d" label="D" displayFormat="DD/MM/YYYY" value="" />);
    expect(exists('d-text')).toBe(true);
    expect(textOf('d-text')).toBe('');
  });
});
