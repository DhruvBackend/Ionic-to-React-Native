// ViewProfile screen (Ionic ViewProfilePage, an Ionic modal): image URL per mode, close, route. See card.md.
import React from 'react';
import { Image } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { db } from '../../api/client';
import modalPages from '../../navigation/ionicModalPages.json';
import route from './route';
import ViewProfileScreen from './index';

const act = ReactTestRenderer.act;
let tree: ReactTestRenderer.ReactTestRenderer;
const navigation = { goBack: jest.fn() };
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);

async function mount(params?: { Image?: any; mode?: string }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<ViewProfileScreen navigation={navigation} route={{ params }} />);
  });
}

beforeEach(() => {
  navigation.goBack.mockClear();
  jest.spyOn(Image, 'getSize').mockImplementation(((_u: string, ok: (w: number, h: number) => void) => ok(1000, 500)) as any);
});
afterEach(() => act(() => tree?.unmount()));

test('route: a modal page with no links', () => {
  expect(route.presentation).toBe('modal');
  expect(route.links).toEqual([]);
  expect(modalPages).toContain('ViewProfile');
});

test("mode 'profile': upload_url3 + Image", async () => {
  await mount({ Image: 'profile/ramesh.jpg', mode: 'profile' });
  expect(find('view-profile-image')[0].props.source).toEqual({ uri: db.upload_url3 + 'profile/ramesh.jpg' });
});

test("mode 'product_img': product_image_url + Image", async () => {
  await mount({ Image: 'p1.png', mode: 'product_img' });
  expect(find('view-profile-image')[0].props.source).toEqual({ uri: db.product_image_url + 'p1.png' });
});

test('parity: the inline <img> leaves the strut descent (3px) below it', async () => {
  await mount({ Image: 'profile/ramesh.jpg', mode: 'profile' });
  const { StyleSheet } = require('react-native');
  expect(StyleSheet.flatten(find('view-profile-image')[0].props.style).marginBottom).toBe(3);
});

test('no mode (most callers): empty page, no image, no close button', async () => {
  await mount({ Image: 'y.jpg' });
  expect(find('view-profile')).not.toHaveLength(0);
  expect(find('view-profile-image')).toHaveLength(0);
  expect(find('view-profile-close')).toHaveLength(0);
});

test('missing Image prints "undefined" in the URL', async () => {
  await mount({ mode: 'profile' });
  expect(find('view-profile-image')[0].props.source.uri).toBe(db.upload_url3 + 'undefined');
});

test('close button dismisses the modal (goBack)', async () => {
  await mount({ Image: 'a.jpg', mode: 'profile' });
  await act(async () => find('view-profile-close')[0].props.onPress());
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
});
