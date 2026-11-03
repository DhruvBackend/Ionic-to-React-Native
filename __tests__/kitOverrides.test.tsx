// Page-SCSS overrides on kit controls (Phase 4 S8):
// - IonButton activatedBackground: `.rupee-btn button{background:green}` (no !important) loses to `.button-md-primary.activated`.
// - IonField labelStyle.color / innerStyle.paddingRight: `.cs-textarea ion-label{color:#949494 !important}`, `.item-inner{padding-right:0}`.
import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { IonButton } from '../src/components/ionic/IonButton';
import { IonInputItem } from '../src/components/ionic/IonInput';

function render(el: React.ReactElement) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  act(() => { r = ReactTestRenderer.create(el); });
  return r;
}

test('IonButton passes activatedBackground to the pressed style; default keeps background', () => {
  const withProp = render(<IonButton background="#008000" activatedBackground="#00281f" testID="b">X</IonButton>);
  const without = render(<IonButton background="#008000" testID="b">X</IonButton>);
  const act1 = withProp.root.findAll(n => n.props.activatedStyle != null)[0].props.activatedStyle;
  const act2 = without.root.findAll(n => n.props.activatedStyle != null)[0].props.activatedStyle;
  expect(StyleSheet.flatten(act1).backgroundColor).toBe('#00281f');
  expect(StyleSheet.flatten(act2).backgroundColor).toBe('#008000');
});

test('IonField labelStyle.color and innerStyle.paddingRight override the variant', () => {
  const r = render(
    <IonInputItem floating label="Remark" value="" onChangeText={() => {}} testID="f" labelStyle={{ color: '#949494' }} innerStyle={{ paddingRight: 0 }} />,
  );
  const label = r.root.find(n => n.props.testID === 'f-label-text');
  expect(StyleSheet.flatten(label.props.style).color).toBe('#949494');
  const inners = r.root.findAll(n => n.props.style && StyleSheet.flatten(n.props.style)?.paddingRight === 0 && StyleSheet.flatten(n.props.style)?.flexDirection === 'row');
  expect(inners.length).toBeGreaterThan(0);
});
