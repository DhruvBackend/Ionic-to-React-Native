// Kit pass Phase 2 (2026-11-03): browsers break lines greedily; Android Text defaults to textBreakStrategy
// "highQuality" (balanced paragraphs). The kit Text defaults to "simple" so every screen wraps like Chrome.
import React from 'react';
import path from 'path';
import { execFileSync } from 'child_process';
import ReactTestRenderer from 'react-test-renderer';
import { Text as RNText } from 'react-native';
import { Text } from '../src/components/ionic/IonText';

function render(el: React.ReactElement) {
  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(el);
  });
  return tree!;
}

test('kit Text defaults to the browser-like simple break strategy', () => {
  const r = render(<Text>hello world</Text>);
  expect(r.root.findByType(RNText).props.textBreakStrategy).toBe('simple');
});

test('kit Text keeps an explicit break strategy and passes other props through', () => {
  const r = render(
    <Text textBreakStrategy="balanced" numberOfLines={2} testID="t">
      x
    </Text>,
  );
  const t = r.root.findByType(RNText);
  expect(t.props.textBreakStrategy).toBe('balanced');
  expect(t.props.numberOfLines).toBe(2);
  expect(t.props.testID).toBe('t');
});

test('kit Text forwards its ref to the native Text', () => {
  const ref = React.createRef<any>();
  render(<Text ref={ref}>x</Text>);
  expect(ref.current).toBeTruthy();
});

test('lint bans react-native Text in screens and components (use the kit Text)', () => {
  const root = path.resolve(__dirname, '..');
  let out = '';
  try {
    out = execFileSync('npx', ['eslint', '--no-ignore', '-f', 'json', 'test-fixtures/lint/text-violation.tsx'], {
      cwd: root,
      encoding: 'utf8',
      shell: true,
    });
  } catch (e: any) {
    out = e.stdout;
  }
  const messages = JSON.parse(out)[0].messages.filter((m: any) => m.ruleId === 'no-restricted-imports');
  expect(messages.map((m: any) => m.line)).toEqual([4]);
});
