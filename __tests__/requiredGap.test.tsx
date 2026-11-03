// IonField requiredGap: `Label <span>*</span>` (default, gap) vs `Label<span>*</span>` (add-new-complaint.html:20/29/66).
import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { IonInputItem } from '../src/components/ionic/IonInput';

function labelText(el: React.ReactElement) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  act(() => { r = ReactTestRenderer.create(el); });
  const node = r.root.find(n => typeof n.props.testID === 'string' && n.props.testID.endsWith('-label-text'));
  const flat = (c: any): string => (typeof c === 'string' ? c : Array.isArray(c) ? c.map(flat).join('') : c?.props ? flat(c.props.children) : '');
  return flat(node.props.children);
}

test('default keeps the space before the star', () => {
  expect(labelText(<IonInputItem variant="csInput" label="State" requiredMark value="" onChangeText={() => {}} testID="f" />)).toBe('State *');
});

test('requiredGap={false} draws the star right after the label', () => {
  expect(labelText(<IonInputItem variant="csInput" label="Mobile" requiredMark requiredGap={false} value="" onChangeText={() => {}} testID="f" />)).toBe('Mobile*');
});
