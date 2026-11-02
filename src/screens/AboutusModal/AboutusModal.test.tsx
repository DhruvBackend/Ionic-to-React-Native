// AboutusModal screen (Ionic AboutusModalPage): static text, tel/mail links, the cancel icon's setRoot(Tabs). See card.md.
import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { client } from '../../config/client';
import i18n from '../../i18n';
import route from './route';
import AboutusModalScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { reset: jest.fn() };

const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const text = () => flat(tree.root.findAll(n => (n.type as any) === 'Text').map(n => n.props.children));

async function mount(params: object = { country: undefined }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<AboutusModalScreen navigation={navigation as any} route={{ params } as any} />);
  });
}

beforeEach(async () => {
  navigation.reset.mockClear();
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(() => act(() => tree?.unmount()));

test('route: a pushed card page (the modalCtrl call is commented out in otp.ts / registration.ts)', () => {
  expect(route.presentation).toBe('card');
  expect(route.links).toEqual(['Tabs']);
});

test('AboutusModal.default: title, under-review text and the contact line', async () => {
  await mount();
  const t = text();
  expect(t).toContain(client.appName);
  expect(t).toContain(`Your request to access the ${client.appName}  is under review. You will be able to log in as soon as the overseeing dealer acknowledges your application.`);
  expect(t).toContain('Meanwhile, you can contact us+91 8655050950');
  expect(t).toContain('or mail us');
  expect(t).toContain('care@topsan.in');
  expect(t).toContain('if you any question');
});

test('AboutusModal.hin: the texts are translated', async () => {
  await act(async () => {
    await i18n.changeLanguage('hin');
  });
  await mount();
  expect(text()).toContain('तोपसान');
  expect(text()).toContain('या हमें मेल करें');
});

test('phone and mail links open tel: / mailto:', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);
  await mount();
  find('aboutus-tel')[0].props.onPress();
  find('aboutus-mail')[0].props.onPress();
  expect(open).toHaveBeenNthCalledWith(1, 'tel:8655050950');
  expect(open).toHaveBeenNthCalledWith(2, 'mailto:care@topsan.in');
  open.mockRestore();
});

test('cancel icon: setRoot(Tabs, {index: "0"}) as a stack reset', async () => {
  await mount();
  const btn = find('aboutus-cancel').find(n => typeof n.props.onPress === 'function')!;
  await act(async () => {
    btn.props.onPress({ nativeEvent: {} });
  });
  expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
});

test('the cancel icon is inside a content as tall as the screen (100vh), so it sits below the fold', async () => {
  await mount();
  const main = find('main-modal').find(n => typeof n.type === 'string')!;
  expect(main.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ height: expect.any(Number) })]));
});
