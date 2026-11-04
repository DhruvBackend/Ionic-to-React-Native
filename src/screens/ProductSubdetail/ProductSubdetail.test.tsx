// ProductSubdetail screen (Ionic ProductSubdetailPage): contract, states, share text, ViewProfile modal, loaders, malformed. See card.md.
import React from 'react';
import { Image } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { client } from '../../config/client';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import route from './route';
import ProductSubdetailScreen from './index';

jest.mock('../../native', () => ({ ...jest.requireActual('../../native'), shareText: jest.fn() }));

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};
const navigation = { push: jest.fn(), addListener: jest.fn(() => () => {}), getState: jest.fn(), popToTop: jest.fn() };
const share = () => require('../../native').shareText as jest.Mock;

function installSpy(failing = false) {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return failing ? Promise.reject(new HttpError(500, {})) : previous(req);
  });
  restoreTransport = () => setTransport(previous);
}

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  }
}

async function mount(params: any = { id: 31 }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<ProductSubdetailScreen navigation={navigation} route={{ params }} />);
  });
  await settle();
  const host = find('ion-slides')[0];
  if (host) {
    await act(async () => host.props.onLayout({ nativeEvent: { layout: { width: 360 } } }));
  }
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const images = () => find('product-subdetail-image').filter(n => typeof n.type === 'string');
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const textOf = (id: string) => (id.includes('-row-') ? find(id)[0].findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children)).join('') : flat(find(id)[0].props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  calls = [];
  navigation.push.mockClear();
  share().mockClear();
  db.userStorageData = { id: '900001', type: 'Plumber' };
  jest.spyOn(Image, 'getSize').mockImplementation(((_u: string, ok: (w: number, h: number) => void) => ok(1000, 500)) as any);
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

afterEach(() => {
  act(() => tree?.unmount());
  restoreTransport();
  restoreTransport = () => {};
  jest.restoreAllMocks();
});

test('route: a card page that links to the ViewProfile modal', () => {
  expect(route.presentation).toBe('card');
  expect(route.links).toEqual(['ViewProfile']);
});

describe('contract (card Endpoints)', () => {
  test('app_master/productDetail: {product_id} on mount', async () => {
    installSpy();
    await expectContract('app_master/productDetail', () => mount());
    expect(JSON.parse(calls.find(c => c.fn === 'app_master/productDetail')!.body!)).toEqual({ product_id: 31 });
  });
  test('the favourites endpoints are dead code in Ionic (no template call): never requested', async () => {
    installSpy();
    await mount();
    expect(calls.map(c => c.fn)).toEqual(['app_master/productDetail']);
  });
});

describe('states (card States)', () => {
  test('default: title, price, images, table rows, loader gone', async () => {
    installSpy();
    await mount();
    expect(allText()).toContain('Product Detail');
    expect(textOf('product-subdetail-title')).toBe('Rain Shower');
    expect(textOf('product-subdetail-price')).toBe('₹2499/-');
    expect(images()).toHaveLength(2);
    expect(images()[0].props.source).toEqual({ uri: db.product_image_url + 'shower_a.png' });
    expect(textOf('product-subdetail-row-category')).toBe('CategoryBath Fittings');
    expect(textOf('product-subdetail-row-subcategory')).toBe('SubcategoryShowers');
    expect(textOf('product-subdetail-row-code')).toBe('CodeTb-1001');
    expect(textOf('product-subdetail-row-description')).toBe('Descriptionchrome finish 8 inch');
    expect(openLoaders()).toHaveLength(0);
  });

  test('loader is shown (no content) until the response', async () => {
    const previous = getTransport();
    restoreTransport = () => setTransport(previous);
    setTransport(() => new Promise(() => {}));
    await act(async () => {
      tree = ReactTestRenderer.create(<ProductSubdetailScreen navigation={navigation} route={{ params: { id: 31 } }} />);
    });
    expect(openLoaders()).toHaveLength(1);
  });

  test('noName: the title falls back to desc and the Description row is hidden', async () => {
    setFixtureVariant('app_master/productDetail', 'noName');
    await mount({ id: 32 });
    expect(textOf('product-subdetail-title')).toBe('wall mixer');
    expect(exists('product-subdetail-row-description')).toBe(false);
  });

  test("noDesc: the Description row shows 'NA'", async () => {
    setFixtureVariant('app_master/productDetail', 'noDesc');
    await mount({ id: 33 });
    expect(textOf('product-subdetail-row-description')).toBe('DescriptionNA');
  });

  test('empty (no images): the perm_media placeholder', async () => {
    setFixtureVariant('app_master/productDetail', 'empty');
    await mount({ id: 35 });
    expect(exists('product-subdetail-placeholder')).toBe(true);
    expect(images()).toHaveLength(0);
    expect(openLoaders()).toHaveLength(0);
  });

  test('noProfileImage: changeImage throws in Ionic, the loader stays up, the page shows', async () => {
    setFixtureVariant('app_master/productDetail', 'noProfileImage');
    await mount({ id: 34 });
    expect(textOf('product-subdetail-title')).toBe('Soap Dish');
    expect(openLoaders()).toHaveLength(1);
  });

  test('hin: the translated labels (global language)', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toContain(i18n.t('Product Detail'));
    expect(allText()).toContain(i18n.t('Category'));
  });

  test('malformed (no product): no crash, empty first-load view, loader stays', async () => {
    setFixtureVariant('app_master/productDetail', 'malformed');
    await mount();
    expect(textOf('product-subdetail-price')).toBe('₹/-');
    expect(exists('product-subdetail-placeholder')).toBe(true);
    expect(openLoaders()).toHaveLength(1);
  });

  test('HTTP error: nothing shown, the loader stays up (empty error callback)', async () => {
    installSpy(true);
    await mount();
    expect(find('product-subdetail-title')).toHaveLength(0); // empty <h4>: no line box, nothing drawn
    expect(openLoaders()).toHaveLength(1);
  });
});

describe('actions', () => {
  test('share with a description: the Ionic text, the last image URL', async () => {
    await mount();
    await act(async () => find('product-subdetail-share')[0].props.onPress());
    expect(share()).toHaveBeenCalledWith(
      'Company Name:' + client.companyName + '\nCategory : BATH FITTINGS\nProduct Name:  Rain Shower\nProduct Code:  tb-1001\nPrice : 2499\nDescription : chrome finish 8 inch',
      db.product_image_url + 'shower_b.png',
    );
  });

  test('share without a description: the other Ionic text (blank line after the name)', async () => {
    setFixtureVariant('app_master/productDetail', 'noDesc');
    await mount({ id: 33 });
    await act(async () => find('product-subdetail-share')[0].props.onPress());
    expect(share()).toHaveBeenCalledWith(
      'Company Name:' + client.companyName + '\nCategory : BATH FITTINGS\nProduct Name :  Health Faucet\n\nProduct Code:  tb-3003\nPrice : 799',
      db.product_image_url + 'faucet.png',
    );
  });

  test('tapping an image opens the ViewProfile modal with {Image, mode: product_img}', async () => {
    await mount();
    await act(async () => find('product-subdetail-image-press').filter(n => typeof n.props.onPress === 'function')[1].props.onPress());
    expect(navigation.push).toHaveBeenCalledWith('ViewProfile', { Image: 'shower_b.png', mode: 'product_img' });
  });
});
