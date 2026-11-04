// Scan screen (Ionic ScanPage): state and navigation. See card.md. No endpoints.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import ScanScreen from './index';
import route from './route';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };

const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));

beforeEach(async () => {
  navigation.push.mockClear();
  await act(async () => {
    tree = ReactTestRenderer.create(<ScanScreen navigation={navigation as any} />);
  });
});
afterEach(() => act(() => tree?.unmount()));

test('route carries the inventory feature flag and its nav target', () => {
  expect(route.feature).toBe('scanPage');
  expect(route.links).toEqual(['CoupanCode']);
});

test('Scan.default: the navbar title is the template text', () => {
  expect(allText()).toContain('scan');
});

test('a tap on the content pushes CoupanCode without params', async () => {
  const content = tree.root.findAll(n => n.props.testID === 'scan-content' && typeof n.props.onPress === 'function')[0];
  await act(async () => content.props.onPress());
  expect(navigation.push).toHaveBeenCalledTimes(1);
  expect(navigation.push).toHaveBeenCalledWith('CoupanCode');
});
