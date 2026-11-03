// MainHome screen (Ionic MainHomePage): role branch, translations, navigation and quirks. See card.md. No endpoints.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { db } from '../../api/client';
import { resetMock } from '../../api/mock';
import i18n from '../../i18n';
import { mainHomeMd as M } from '../../theme/ionicMdMainHome';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import MainHomeScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<MainHomeScreen navigation={navigation as any} />);
  });
}

const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const rowIds = () => tree.root.findAll(n => typeof n.props.testID === 'string' && /^mainhome-/.test(n.props.testID) && typeof n.props.onPress === 'function').map(n => n.props.testID as string).filter((v, i, a) => a.indexOf(v) === i);
const press = (id: string) => {
  const n = tree.root.findAll(x => x.props.testID === id && typeof x.props.onPress === 'function')[0];
  act(() => n.props.onPress());
};
const stripeOf = (id: string) => {
  const n = tree.root.findAll(x => x.props.testID === id && x.props.style)[0];
  const flatStyle = ([] as any[]).concat(n.props.style).flat(3).reduce((a, s) => ({ ...a, ...(s || {}) }), {});
  return flatStyle.borderLeftColor;
};

beforeEach(async () => {
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  db.userStorageData = { id: '900001', type: 'Plumber' };
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(() => {
  act(() => tree?.unmount());
});

describe('states', () => {
  test('Plumber: five rows in template order, title Menu', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Menu', 'Super 30 Plumber', M.aboutKey, 'Products', 'Videos', 'Contact Us']));
    expect(rowIds()).toEqual(['mainhome-super30', 'mainhome-about', 'mainhome-products', 'mainhome-videos', 'mainhome-contact']);
  });
  test.each(['Dealer', 'Sales_Boy', 'Sales_Executive'])('%s: no Super 30 row', async type => {
    db.userStorageData = { id: '900001', type };
    await mount();
    expect(rowIds()).toEqual(['mainhome-about', 'mainhome-products', 'mainhome-videos', 'mainhome-contact']);
    expect(allText()).not.toContain('Super 30 Plumber');
  });
  test('hin: translated labels', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    const texts = allText();
    expect(texts).toContain('मेन्यू');
    expect(texts).toContain('सुपर 30 प्लंबर');
    expect(texts).toContain('तोपसान के बारे में');
  });
  test('the stripe colour follows :nth-child of the rendered buttons', async () => {
    await mount();
    const c = ['super30', 'about', 'products', 'videos', 'contact'].map(k => stripeOf(`mainhome-${k}`));
    expect(c).toEqual([M.stripes[0], M.stripes[1], M.stripes[2], M.stripes[3], M.stripes[0]]);
    act(() => tree.unmount());
    db.userStorageData = { id: '900001', type: 'Dealer' };
    await mount();
    expect(['about', 'products', 'videos', 'contact'].map(k => stripeOf(`mainhome-${k}`))).toEqual([M.stripes[0], M.stripes[1], M.stripes[2], M.stripes[3]]);
  });
  test('Review Focus 2: an empty / missing / null session renders the non-Plumber list without throwing', async () => {
    for (const session of [{}, undefined, null]) {
      db.userStorageData = session as any;
      await mount();
      expect(rowIds()).toEqual(['mainhome-about', 'mainhome-products', 'mainhome-videos', 'mainhome-contact']);
      act(() => tree.unmount());
    }
  });
  test('shows no loader or overlay and sends no request (no endpoints)', async () => {
    await mount();
    expect(overlayStore.getEntries()).toHaveLength(0);
  });
});

describe('navigation (push, no params)', () => {
  test.each([
    ['mainhome-super30', 'Super30'],
    ['mainhome-about', 'About'],
    ['mainhome-products', 'Category'],
    ['mainhome-videos', 'VideoCategory'],
    ['mainhome-contact', 'Contact'],
  ])('%s pushes %s', async (id, target) => {
    await mount();
    press(id);
    expect(navigation.push).toHaveBeenCalledTimes(1);
    expect(navigation.push).toHaveBeenCalledWith(target);
  });
  test('the commented-out Notification / Feedback buttons are absent', async () => {
    await mount();
    expect(allText().join('|')).not.toMatch(/Notification|Feedback/);
  });
});
