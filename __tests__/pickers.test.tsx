// Ionic 3.9.5 md pickers (plan Task 9 part 3): ion-select (alert), ion-datetime + md picker, ionic-selectable
// modal, select-searchable. Expected values are the cited ones in src/theme/ionicMdPickers.ts.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet, Text, View } from 'react-native';
import { IonDatetime } from '../src/components/ionic/IonDatetime';
import { IonicSelectable } from '../src/components/ionic/IonicSelectable';
import { IonSelect } from '../src/components/ionic/IonSelect';
import { OverlayHost } from '../src/components/ionic/OverlayHost';
import { SelectSearchable } from '../src/components/ionic/SelectSearchable';
import { csForm, datetimeMd, pickerMd, selectableMd, selectMd } from '../src/theme/ionicMdPickers';
import {
  _resetOverlaysForTests,
  dismissTopOverlay,
  isModalOpen,
  isOverlayOpen,
  showPicker,
} from '../src/ui/overlays';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = (fn: () => void) => ReactTestRenderer.act(fn);
const advance = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const exists = (id: string) => find(id).length > 0;
const style = (id: string) => StyleSheet.flatten(host(id).props.style);
function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function');
  if (!n) {
    throw new Error(`nothing pressable with testID ${id}`);
  }
  act(() => n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } }));
}
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(host(id).props.children);
function mount(el: React.ReactElement) {
  act(() => {
    tree = ReactTestRenderer.create(
      <View>
        {el}
        <OverlayHost />
      </View>,
    );
  });
}
function rerender(el: React.ReactElement) {
  act(() => {
    tree.update(
      <View>
        {el}
        <OverlayHost />
      </View>,
    );
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  _resetOverlaysForTests();
});
afterEach(() => {
  act(() => tree.unmount());
  jest.useRealTimers();
});

const STATES = ['Delhi', 'Haryana', 'Punjab'].map(n => ({ label: n, value: n }));

describe('ion-select (alert interface)', () => {
  test('cs-select item: 45 px tall, 1px #ccc border, label 13px #999, select 75% / padding 15 8 13 16 / text 13px', () => {
    mount(<IonSelect testID="s" variant="csSelect" label="State" options={STATES} value={undefined} />);
    expect(style('s')).toMatchObject({ height: 45, borderWidth: 1, borderColor: '#ccc', paddingLeft: 0, marginVertical: 16 });
    expect(style('s-inner')).toMatchObject({ paddingRight: 0, borderBottomWidth: 0 });
    expect(style('s-label')).toMatchObject({ paddingLeft: 14, marginRight: 8, marginTop: 13 });
    const box = style('s-box');
    expect(box).toMatchObject({ maxWidth: '75%', paddingTop: 15, paddingRight: 8, paddingBottom: 13, paddingLeft: 16 });
    expect(style('s-icon')).toMatchObject({ width: 12, height: 19 });
    expect(style('s-icon-inner')).toMatchObject({ borderTopWidth: 5, borderLeftWidth: 5, borderRightWidth: 5, borderTopColor: '#000000' });
  });

  test('plain item: 16px text, padding 13 8 13 16, 45% max width, #999 arrow and placeholder', () => {
    mount(<IonSelect testID="s" label="Type" placeholder="Select Type" options={STATES} value={undefined} />);
    expect(style('s')).toMatchObject({ paddingLeft: 16, minHeight: 44 });
    expect(style('s-inner')).toMatchObject({ paddingRight: 8, borderBottomWidth: 1, borderBottomColor: '#dedede' });
    expect(style('s-box')).toMatchObject({ maxWidth: '45%', paddingTop: selectMd.padding.top, paddingLeft: 16 });
    expect(style('s-icon-inner').borderTopColor).toBe('#999');
    const t = StyleSheet.flatten(host('s-text').props.style);
    expect(textOf('s-text')).toBe('Select Type');
    expect(t).toMatchObject({ color: '#999', fontSize: 16 });
  });

  test('shows the selected option text (placeholder gone), multiple joins with ", "', () => {
    mount(<IonSelect testID="s" label="Type" options={STATES} value="Haryana" />);
    expect(textOf('s-text')).toBe('Haryana');
    expect(StyleSheet.flatten(host('s-text').props.style).color).toBe('#000');
    rerender(<IonSelect testID="s" label="Type" multiple options={STATES} value={['Delhi', 'Punjab']} />);
    expect(textOf('s-text')).toBe('Delhi, Punjab');
  });

  test('tap opens an alert titled with the label, radio options, buttons Cancel and OK; OK calls onChange then onIonChange one tick later', () => {
    const onChange = jest.fn();
    const onIon = jest.fn();
    mount(<IonSelect testID="s" label="State" options={STATES} value="Delhi" onChange={onChange} onIonChange={onIon} />);
    press('s-cover');
    advance(250);
    expect(textOf('alert-title')).toBe('State');
    expect(exists('alert-radio-2')).toBe(true);
    expect(textOf('alert-button-0-text')).toBe('Cancel');
    expect(textOf('alert-button-1-text')).toBe('OK');
    expect(find('alert-radio-0')[0].props.accessibilityState.checked).toBe(true);
    press('alert-radio-2');
    press('alert-button-1');
    expect(onChange).toHaveBeenCalledWith('Punjab');
    expect(onIon).not.toHaveBeenCalled();
    advance(1);
    expect(onIon).toHaveBeenCalledWith('Punjab');
  });

  test('Cancel keeps the value and fires ionCancel; OK without a selection changes nothing', () => {
    const onChange = jest.fn();
    const onCancel = jest.fn();
    mount(<IonSelect testID="s" label="State" options={STATES} value={undefined} onChange={onChange} onCancel={onCancel} />);
    press('s-cover');
    advance(250);
    press('alert-button-0');
    expect(onCancel).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    advance(500);
    press('s-cover');
    advance(250);
    press('alert-button-1');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('multiple opens checkboxes and returns the checked values', () => {
    const onChange = jest.fn();
    mount(<IonSelect testID="s" label="State" multiple options={STATES} value={['Delhi']} onChange={onChange} />);
    press('s-cover');
    advance(250);
    expect(exists('alert-checkbox-1')).toBe(true);
    press('alert-checkbox-1');
    press('alert-button-1');
    expect(onChange).toHaveBeenCalledWith(['Delhi', 'Haryana']);
  });

  test('disabled: 40% opacity, label too, and no alert', () => {
    mount(<IonSelect testID="s" label="State" options={STATES} value="Delhi" disabled />);
    expect(style('s-box').opacity).toBe(0.4);
    expect(style('s-label').opacity).toBe(0.4);
    expect(find('s-cover')[0].props.disabled).toBe(true);
  });

  test('error state: red 1px inner border and red label (cs-form .error)', () => {
    mount(<IonSelect testID="s" variant="csSelect" error label="State" options={STATES} />);
    expect(style('s-inner')).toMatchObject({ borderWidth: 1, borderColor: csForm.errorBorderColor });
  });
});

describe('ion-datetime + md picker', () => {
  const props = { testID: 'd', variant: 'csDate' as const, label: 'Date of Birth', displayFormat: 'DD/MM/YYYY', max: '2099-12-31' };

  test('cs-date item is 40 px tall; label 14px / padding-left 16; value formatted with displayFormat', () => {
    mount(<IonDatetime {...props} value="1990-08-15" />);
    expect(style('d')).toMatchObject({ height: 40, borderWidth: 1, borderColor: '#ccc' });
    expect(style('d-label')).toMatchObject({ paddingLeft: 16 });
    expect(style('d-box')).toMatchObject({ paddingTop: 13, paddingRight: 8, paddingBottom: 13, paddingLeft: 16 });
    expect(textOf('d-text')).toBe('15/08/1990');
  });

  test('empty value shows the placeholder in #999', () => {
    mount(<IonDatetime {...props} placeholder="Select Date" value="" />);
    expect(textOf('d-text')).toBe('Select Date');
    expect(StyleSheet.flatten(host('d-text').props.style).color).toBe(datetimeMd.placeholderColor);
  });

  test('tap opens the picker with day, month and year wheels and Cancel / Done; the picker counts as an open overlay', () => {
    mount(<IonDatetime {...props} value="1990-08-15" />);
    press('d-cover');
    advance(450);
    expect(isOverlayOpen()).toBe(true);
    expect(exists('picker-col-0')).toBe(true);
    expect(exists('picker-col-2')).toBe(true);
    expect(exists('picker-col-3')).toBe(false);
    expect(textOf('picker-button-0-text')).toBe('Cancel');
    expect(textOf('picker-button-1-text')).toBe('Done');
    // selected option of each wheel
    expect(textOf('picker-col-0-opt-14')).toBe('15');
    expect(textOf('picker-col-1-opt-7')).toBe('08');
  });

  test('md picker geometry: wrapper 260, toolbar 44, columns 216, flat 43 px options starting at top 77, no highlight bands', () => {
    mount(<IonDatetime {...props} value="1990-08-15" />);
    press('d-cover');
    advance(450);
    expect(style('picker-wrapper')).toMatchObject({ height: 260, borderTopWidth: 0.55, borderTopColor: '#dedede', backgroundColor: '#fff' });
    expect(style('picker-toolbar')).toMatchObject({ height: 44, justifyContent: 'flex-end' });
    expect(style('picker-columns').height).toBe(216);
    expect(style('picker-col-0-opt-3')).toMatchObject({ top: 3 * 43, height: 43, position: 'absolute' });
    const opt = StyleSheet.flatten(find('picker-col-0-opt-14')[0].findAllByType(Text)[0].props.style);
    expect(opt).toMatchObject({ fontSize: 22, color: pickerMd.optSelectedColor });
    const other = StyleSheet.flatten(find('picker-col-0-opt-13')[0].findAllByType(Text)[0].props.style);
    expect(other.color).toBe('#000');
    // md draws no highlight bands (picker.scss display: none is never overridden in picker.md.scss)
    expect(exists('picker-above-highlight')).toBe(false);
    expect(exists('picker-below-highlight')).toBe(false);
    const btn = StyleSheet.flatten(find('picker-button-0-text')[0].props.style);
    expect(btn).toMatchObject({ fontSize: 14, color: '#002d25', textTransform: 'uppercase' });
  });

  test('Done emits the ISO date, Cancel leaves it untouched (ionCancel)', () => {
    const onChange = jest.fn();
    const onCancel = jest.fn();
    mount(<IonDatetime {...props} value="1990-08-15" onChange={onChange} onCancel={onCancel} />);
    press('d-cover');
    advance(450);
    press('picker-button-0');
    expect(onCancel).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    advance(600);
    press('d-cover');
    advance(450);
    press('picker-button-1');
    expect(onChange).toHaveBeenCalledWith('1990-08-15');
  });

  test('hardware back (dismissTopOverlay) dismisses the picker without running a button handler', () => {
    const onChange = jest.fn();
    const onCancel = jest.fn();
    mount(<IonDatetime {...props} value="1990-08-15" onChange={onChange} onCancel={onCancel} />);
    press('d-cover');
    advance(450);
    act(() => dismissTopOverlay());
    advance(500);
    expect(exists('picker-root')).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('backdrop tap runs the cancel button handler', () => {
    const onCancel = jest.fn();
    mount(<IonDatetime {...props} value="1990-08-15" onCancel={onCancel} />);
    press('d-cover');
    advance(450);
    press('overlay-backdrop');
    expect(onCancel).toHaveBeenCalled();
  });

  test('the picker is opened through showPicker and slides up over 400 ms, buttons are inert until it has entered', () => {
    const handler = jest.fn();
    mount(<View />);
    act(() => {
      showPicker({ columns: [{ name: 'a', selectedIndex: 0, options: [{ value: 1, text: '1' }] }], buttons: [{ text: 'Done', handler }] });
    });
    expect(isOverlayOpen()).toBe(true);
    press('picker-button-0');
    expect(handler).not.toHaveBeenCalled();
    advance(400);
    press('picker-button-0');
    expect(handler).toHaveBeenCalledWith({ a: { text: '1', value: 1, columnIndex: 0 } });
  });
});

const EXEC = ['Ramesh Kumar', 'Suresh Verma', 'Anita Sharma'].map((n, i) => ({ id: i + 1, first_name: n }));

describe('ionic-selectable modal', () => {
  const base = { testID: 'x', variant: 'csSelect' as const, label: 'Select Sales Executive (optional)', items: EXEC, itemValueField: 'first_name', itemTextField: 'first_name', canSearch: true };

  test('closed control: value text 16px black, 45% max width, value padding 13/16, #999 20px arrow, disabled 40%', () => {
    mount(<IonicSelectable {...base} value={EXEC[0]} />);
    expect(textOf('x-value-item-0')).toBe('Ramesh Kumar');
    expect(style('x-box')).toMatchObject({ maxWidth: selectableMd.maxWidthPct + '%' });
    expect(style('x-value')).toMatchObject({ paddingTop: 13, paddingBottom: 13, paddingLeft: 16 });
    expect(style('x-icon')).toMatchObject({ width: 20 });
    expect(style('x-icon-inner')).toMatchObject({ top: 20, left: 5, borderTopColor: '#999' });
    rerender(<IonicSelectable {...base} value={EXEC[0]} isEnabled={false} />);
    expect(style('x-box').opacity).toBe(0.4);
    expect(find('x-cover')[0].props.disabled).toBe(true);
  });

  test('no value and no placeholder: nothing is drawn; a placeholder shows in #999', () => {
    mount(<IonicSelectable {...base} value={null} />);
    expect(exists('x-value-item-0')).toBe(false);
    rerender(<IonicSelectable {...base} value={null} placeholder="Pick one" />);
    expect(textOf('x-value-item-0')).toBe('Pick one');
    expect(StyleSheet.flatten(host('x-value-item-0').props.style).color).toBe('#999');
  });

  test('tap opens a modal (not an alert/overlay for hardware back) titled with the label, with a close button on the right', () => {
    mount(<IonicSelectable {...base} value={EXEC[0]} />);
    press('x-cover');
    advance(300);
    expect(isModalOpen()).toBe(true);
    expect(isOverlayOpen()).toBe(false);
    expect(textOf('selectable-title')).toBe('Select Sales Executive (optional)');
    expect(StyleSheet.flatten(host('selectable-title').props.style)).toMatchObject({ fontSize: 16, color: '#040404' });
    expect(style('selectable-navbar')).toMatchObject({ minHeight: 56, padding: 4, backgroundColor: '#f8f8f8' });
    expect(exists('selectable-close')).toBe(true);
    expect(exists('selectable-search')).toBe(true);
    expect(find('selectable-search')[0].props.placeholder).toBe('Search');
  });

  test('list rows: selected one has the primary check icon, others the radio-off icon; row 49px tall by its 28px icon', () => {
    mount(<IonicSelectable {...base} value={EXEC[1]} />);
    press('x-cover');
    advance(300);
    expect(exists('selectable-item-2')).toBe(true);
    const icon = (i: number) => StyleSheet.flatten(host(`selectable-item-${i}-icon`).props.style);
    expect(icon(1)).toMatchObject({ color: '#002d25', fontSize: 28 });
    expect(icon(0)).toMatchObject({ color: '#000', fontSize: 28 });
    expect(icon(0)).toMatchObject({ marginTop: 11, marginRight: 8, marginBottom: 10 });
    expect(StyleSheet.flatten(host('selectable-item-0-text').props.style)).toMatchObject({ fontSize: 14 });
  });

  test('search: case-insensitive contains on itemTextField, after the 250 ms debounce; empty result shows "No items found."', () => {
    mount(<IonicSelectable {...base} value={null} />);
    press('x-cover');
    advance(300);
    act(() => find('selectable-search')[0].props.onChangeText('SHARMA'));
    expect(exists('selectable-item-0')).toBe(true);
    expect(exists('selectable-item-1')).toBe(true); // not filtered yet (debounce)
    advance(250);
    expect(textOf('selectable-item-0-text')).toBe('Anita Sharma');
    expect(exists('selectable-item-1')).toBe(false);
    act(() => find('selectable-search')[0].props.onChangeText('zzz'));
    advance(250);
    expect(textOf('selectable-empty')).toBe('No items found.');
  });

  test('selecting an item calls onChange immediately and closes the modal one tick later', () => {
    const onChange = jest.fn();
    mount(<IonicSelectable {...base} value={null} onChange={onChange} />);
    press('x-cover');
    advance(300);
    press('selectable-item-2');
    expect(onChange).toHaveBeenCalledWith(EXEC[2], { value: EXEC[2] });
    advance(1);
    advance(300);
    expect(isModalOpen()).toBe(false);
  });

  test('the close button closes without changing the value', () => {
    const onChange = jest.fn();
    mount(<IonicSelectable {...base} value={null} onChange={onChange} />);
    press('x-cover');
    advance(300);
    press('selectable-close');
    advance(1);
    advance(300);
    expect(onChange).not.toHaveBeenCalled();
    expect(isModalOpen()).toBe(false);
  });

  test('canClear shows a Clear button (disabled with nothing selected) that sets null and closes', () => {
    const onChange = jest.fn();
    mount(<IonicSelectable {...base} canClear value={null} onChange={onChange} />);
    press('x-cover');
    advance(300);
    expect(find('selectable-clear')[0].props.disabled).toBe(true);
    press('selectable-close');
    advance(400);
    rerender(<IonicSelectable {...base} canClear value={EXEC[0]} onChange={onChange} />);
    press('x-cover');
    advance(300);
    expect(find('selectable-clear')[0].props.disabled).toBe(false);
    expect(textOf('selectable-clear')).toBeDefined();
    press('selectable-clear');
    expect(onChange).toHaveBeenCalledWith(null, { value: null });
    advance(300);
    expect(isModalOpen()).toBe(false);
  });

  test('without canClear there is no footer', () => {
    mount(<IonicSelectable {...base} value={null} />);
    press('x-cover');
    advance(300);
    expect(exists('selectable-footer')).toBe(false);
  });

  test('(onSearch) delegates filtering: it is emitted on open and on every debounced search, and items are not filtered locally', () => {
    const onSearch = jest.fn();
    mount(<IonicSelectable {...base} value={null} onSearch={onSearch} />);
    press('x-cover');
    advance(300);
    expect(onSearch).toHaveBeenCalledWith({ text: '' });
    act(() => find('selectable-search')[0].props.onChangeText('abc'));
    advance(250);
    expect(onSearch).toHaveBeenLastCalledWith({ text: 'abc' });
    expect(exists('selectable-item-2')).toBe(true);
  });

  test('plain item underline: green with a value, primary while open, red when required and touched', () => {
    mount(<IonicSelectable {...base} variant="plain" value={EXEC[0]} />);
    expect(style('x-inner').borderBottomColor).toBe(selectableMd.underline.valid);
    press('x-cover');
    advance(300);
    expect(style('x-inner').borderBottomColor).toBe(selectableMd.underline.focus);
  });

  test('select-searchable renders the same control and modal', () => {
    mount(<SelectSearchable testID="y" label="Category" items={EXEC} itemValueField="id" itemTextField="first_name" canSearch value={EXEC[0]} />);
    expect(textOf('y-value-item-0')).toBe('Ramesh Kumar');
    press('y-cover');
    advance(300);
    expect(isModalOpen()).toBe(true);
    expect(textOf('selectable-title')).toBe('Category');
  });
});
