// `.edit … .label[floating] span { background:#fff; padding:0 5px }` boxes only the red star, not the label text;
// floating edit ion-input is 37 tall (35 input + 2 border); inset iframe colours are the measured Chrome values.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { IonInputItem } from '../src/components/ionic/IonInput';
import { iframeDefaults } from '../src/theme/ionicMdScroll';

const flat = (n: any) => StyleSheet.flatten(n.props.style) ?? {};

it('edit floating label: only the star gets the white box and 5px padding', () => {
  let t!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    t = ReactTestRenderer.create(<IonInputItem testID="f" variant="edit" floating label="Name" requiredMark value="" />);
  });
  const star = t.root.findAll(n => n.props.testID === 'f-label-star')[0];
  expect(flat(star)).toMatchObject({ backgroundColor: '#fff', paddingHorizontal: 5 });
  const text = t.root.findAll(n => n.props.testID === 'f-label-text')[0];
  expect(flat(text).backgroundColor).toBeUndefined();
  const input = t.root.findAll(n => flat(n).borderColor === '#b5b5b5')[0];
  expect(flat(input).height).toBe(37);
});

it('edit floating label without a star has no white box', () => {
  let t!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    t = ReactTestRenderer.create(<IonInputItem testID="g" variant="edit" floating label="Qty" value="" />);
  });
  expect(t.root.findAll(n => n.props.testID === 'g-label-star')).toHaveLength(0);
});

it('inset iframe border colours are the measured Chrome values', () => {
  expect(iframeDefaults.insetTopLeft).toBe('#9a9a9a');
  expect(iframeDefaults.insetBottomRight).toBe('#eeeeee');
});
