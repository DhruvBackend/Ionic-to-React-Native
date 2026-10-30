/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { db } from '../src/api/client';
import { RootNavigator } from '../src/navigation/RootNavigator';

test('app starts on Language (a placeholder until that screen is ported)', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  expect(tree!.root.findAllByProps({ testID: 'placeholder-Language' }).length).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () => tree!.unmount());
});

test('Tabs for a Plumber show the Home tab root first', async () => {
  db.userStorageData = { type: 'Plumber', token: 't', loginType: 'CMS' };
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<RootNavigator initialRouteName="Tabs" />);
  });
  expect(tree!.root.findAllByProps({ testID: 'placeholder-Home' }).length).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () => tree!.unmount());
});

test('Tabs for an unknown user type render no tabs (Ionic parity)', async () => {
  db.userStorageData = { type: 'Employee', token: 't', loginType: 'SFA' };
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<RootNavigator initialRouteName="Tabs" />);
  });
  expect(tree!.root.findAllByProps({ testID: 'tabs-none' }).length).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () => tree!.unmount());
});
