// RetailerListComplaint screen (Ionic RetailerListComplaintPage): static markup, no endpoints. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import RetailerListComplaintScreen from './index';

const act = ReactTestRenderer.act;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');

test('RetailerListComplaint.default: the static card renders', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(<RetailerListComplaintScreen />);
  });
  const texts = tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
  ['Complaint', 'Sunil', '2345', '99992', 'Date:', '12 April 2021', 'Satus:', 'Pending', 'Nature Problem:', 'Haryana ( INDIA)'].forEach(s =>
    expect(texts.some(x => x.includes(s))).toBe(true),
  );
  act(() => tree.unmount());
});
