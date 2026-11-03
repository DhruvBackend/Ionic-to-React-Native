// Phase 2 kit (2026-11-03): IonField `labelStyle` lets a page apply its own SCSS label overrides (ScanPoint's
// scan-point.scss restyles the cs-input label: 13px at margin-top -17) without a variant per page.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { IonField } from '../src/components/ionic/IonField';
import { inputMd } from '../src/theme/ionicMdContent';

function labelStyle(el: React.ReactElement) {
  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(el);
  });
  const box = StyleSheet.flatten(tree!.root.findByProps({ testID: 'ion-field-label' }).props.style);
  const text = StyleSheet.flatten(tree!.root.findAll(n => n.props.testID === 'ion-field-label-text' && typeof n.type === 'string')[0].props.style);
  return { fontSize: text.fontSize, marginTop: box.marginTop, paddingLeft: box.paddingLeft };
}

test('csInput label keeps the kit values without labelStyle', () => {
  const s = labelStyle(<IonField variant="csInput" floating label="Mobile" />);
  expect(s.fontSize).toBe(inputMd.csInput.labelFontSize);
  expect(s.marginTop).toBe(inputMd.csInput.labelMarginTop);
});

test('labelStyle overrides font size, top margin and left padding', () => {
  const s = labelStyle(
    <IonField variant="csInput" floating label="Mobile" labelStyle={{ fontSize: 13, marginTop: -17, paddingLeft: 12 }} />,
  );
  expect(s.fontSize).toBe(13);
  expect(s.marginTop).toBe(-17);
  expect(s.paddingLeft).toBe(12);
});
