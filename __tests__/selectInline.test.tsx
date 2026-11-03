// IonSelectInline: <ion-input> + <ion-select> in ONE <ion-item> (my-camplaints .serach-filter).
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { View } from 'react-native';
import { IonInputItem } from '../src/components/ionic/IonInput';
import { IonSelectBox, IonSelectInline, useIonSelect } from '../src/components/ionic/IonSelect';
import { OverlayHost } from '../src/components/ionic/OverlayHost';
import { _resetOverlaysForTests } from '../src/ui/overlays';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = (fn: () => void) => ReactTestRenderer.act(fn);
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(find(id).find(n => typeof n.type === 'string')!.props.children);
function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function')!;
  act(() => n.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } }));
}
beforeEach(() => { jest.useFakeTimers(); _resetOverlaysForTests(); });
afterEach(() => { act(() => tree.unmount()); jest.useRealTimers(); });

const OPTS = [{ label: 'All', value: '' }, { label: 'Pending', value: 'Pending' }, { label: 'Closed', value: 'Closed' }];

test('select inside an input item: one item, selected text shown, alert with options, onChange on OK', () => {
  const onChange = jest.fn();
  act(() => {
    tree = ReactTestRenderer.create(
      <View>
        <IonInputItem testID="f" placeholder="Search" trailing={<IonSelectInline testID="s" options={OPTS} value="Pending" onChange={onChange} />} />
        <OverlayHost />
      </View>,
    );
  });
  expect(find('f').length).toBeGreaterThan(0);
  expect(find('f-input').length).toBeGreaterThan(0);
  expect(find('s-box').length).toBeGreaterThan(0);
  expect(find('s-cover').length).toBeGreaterThan(0);
  expect(textOf('s-text')).toBe('Pending');
  press('s-cover');
  act(() => { jest.advanceTimersByTime(250); });
  expect(find('alert-radio-2').length).toBeGreaterThan(0);
  expect(textOf('alert-button-0-text')).toBe('Cancel');
  expect(textOf('alert-button-1-text')).toBe('OK');
  press('alert-radio-2');
  press('alert-button-1');
  expect(onChange).toHaveBeenCalledWith('Closed');
});

test('useIonSelect + IonSelectBox + IonInputItem cover: the whole item opens the select (Ionic item-cover)', () => {


  const opts = [{ value: '', label: 'All' }, { value: 'Pending', label: 'Pending' }];
  function Row() {
    const sel = useIonSelect({ options: opts, value: 'Pending', onChange: () => {} });
    return <IonInputItem testID="row" value="" onChangeText={() => {}} cover={{ onPress: sel.open }} trailing={<IonSelectBox text={sel.text} />} />;
  }
  let r!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => { r = ReactTestRenderer.create(<Row />); });
  expect(r.root.findAll(n => n.props.testID === 'row-cover').length).toBeGreaterThan(0);
  expect(JSON.stringify(r.toJSON())).toContain('Pending');
});

test('IonSelect fontSize / isLast pass through (plumber-checkin .bodr-botm ion-item { font-size: 14px })', () => {
  const { IonSelect } = require('../src/components/ionic/IonSelect');
  const { StyleSheet } = require('react-native');
  let r!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    r = ReactTestRenderer.create(<IonSelect label="Complaint" options={[{ value: 1, label: 'A' }]} value={1} fontSize={14} isLast testID="s" />);
  });
  expect(StyleSheet.flatten(r.root.find(n => n.props.testID === 's-text').props.style).fontSize).toBe(14);
  expect(StyleSheet.flatten(r.root.find(n => n.props.testID === 's-label-text').props.style).fontSize).toBe(14);
  expect(StyleSheet.flatten(r.root.find(n => n.props.testID === 's-inner').props.style).borderBottomWidth).toBe(0);
});
