// IonFabButton size / iconSize: page SCSS overrides such as quotation-genrate-by-pdf.scss:38-45
// (.fab[mini]{width:30px;height:30px} .fab ion-icon{font-size:2rem}).
import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { IonFabButton } from '../src/components/ionic/IonFab';
import { IonIcon } from '../src/components/ionic/IonIcon';

function render(el: React.ReactElement) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  act(() => { r = ReactTestRenderer.create(el); });
  return r;
}
const boxOf = (r: ReactTestRenderer.ReactTestRenderer) =>
  StyleSheet.flatten(r.root.find(n => n.props.testID === 'ion-fab-button' && n.props.style && StyleSheet.flatten(n.props.style).width != null).props.style);

test('defaults unchanged: mini = 40 box, 24 icon', () => {
  const r = render(<IonFabButton mini icon="trash" />);
  expect(boxOf(r).width).toBe(40);
  expect(r.root.findByType(IonIcon).props.size).toBe(24);
});

test('size and iconSize override the box and the icon', () => {
  const r = render(<IonFabButton mini size={30} iconSize={20} icon="trash" />);
  const box = boxOf(r);
  expect([box.width, box.height, box.borderRadius]).toEqual([30, 30, 15]);
  expect(r.root.findByType(IonIcon).props.size).toBe(20);
});
