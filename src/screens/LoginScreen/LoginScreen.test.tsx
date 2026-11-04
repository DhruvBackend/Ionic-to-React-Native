// LoginScreen screen (Ionic LoginScreenPage): state only. See card.md. No endpoints, no nav targets.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import LoginScreenScreen from './index';
import route from './route';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;

const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));

afterEach(() => act(() => tree?.unmount()));

test('route carries the inventory feature flag and no nav targets', () => {
  expect(route.feature).toBe('loginScreen');
  expect(route.links).toEqual([]);
});

test('LoginScreen.default: only the navbar title, as typed in the template', async () => {
  await act(async () => {
    tree = ReactTestRenderer.create(<LoginScreenScreen />);
  });
  expect(allText()).toEqual(['login-screen']);
});
