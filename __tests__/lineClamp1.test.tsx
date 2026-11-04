import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { LineClamp1 } from '../src/components/ionic/LineClamp1';

const lines = (...t: string[]) => ({ nativeEvent: { lines: t.map(text => ({ text })) } });
const shown = (r: ReactTestRenderer.ReactTestRenderer) => r.root.find((n: any) => n.props.testID === 't' && n.props.numberOfLines === 1);

test('one line of text: shown as is', () => {
  let r!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    r = ReactTestRenderer.create(<LineClamp1 testID="t">Hand Shower</LineClamp1>);
  });
  expect(shown(r).props.children).toBe('Hand Shower');
});

test('wrapped text: first line up to its last whole word + "…" (Chrome -webkit-line-clamp:1)', () => {
  let r!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    r = ReactTestRenderer.create(<LineClamp1 testID="t">Rain Shower With Extension Arm</LineClamp1>);
  });
  const measure = r.root.findAll((n: any) => typeof n.props.onTextLayout === 'function')[0];
  act(() => measure.props.onTextLayout(lines('Rain Shower With ', 'Extension Arm')));
  expect(shown(r).props.children).toBe('Rain Shower With…');
});
