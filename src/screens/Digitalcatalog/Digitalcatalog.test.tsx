// Digitalcatalog screen (Ionic DigitalcatalogPage): contract, states, PDF link. See card.md.
import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import DigitalcatalogScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

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

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<DigitalcatalogScreen />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  calls = [];
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/product_catalogue_list: {} on entry, loader up until the answer', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<DigitalcatalogScreen />);
    });
    expect(openLoaders()).toHaveLength(1);
    await settle();
    expect(openLoaders()).toHaveLength(0);
    act(() => tree.unmount());
    calls = [];
    await expectContract('app_karigar/product_catalogue_list', () => mount());
    expect(JSON.parse(calls[0].body!)).toEqual({});
  });
});

describe('states (card States)', () => {
  test('Digitalcatalog.default: title and one card per PDF, no empty image', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Digital Catalogue', 'Showers and mixers 2026', 'Concealed fittings', 'Accessories']));
    expect(exists('digitalcatalog-item-2')).toBe(true);
    expect(exists('digitalcatalog-item-3')).toBe(false);
    expect(exists('digitalcatalog-empty')).toBe(false);
    expect(tree.root.findAll(n => typeof n.props.onInfinite === 'function')).toHaveLength(1);
  });

  test('Digitalcatalog.hin: title translated', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toContain(i18n.t('Digital Catalogue').replace(/\s+/g, ' '));
  });

  test('the empty image is shown from the first render (pdf starts as []), before the answer', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<DigitalcatalogScreen />);
    });
    expect(exists('digitalcatalog-empty')).toBe(true);
    await settle();
    expect(exists('digitalcatalog-empty')).toBe(false);
  });

  test('Digitalcatalog.empty: the no_found image, no cards', async () => {
    setFixtureVariant('app_karigar/product_catalogue_list', 'empty');
    installSpy();
    await mount();
    expect(exists('digitalcatalog-empty')).toBe(true);
    expect(exists('digitalcatalog-item-0')).toBe(false);
  });

  test('Digitalcatalog.malformed (pdf: null): no crash, empty state, loader gone', async () => {
    setFixtureVariant('app_karigar/product_catalogue_list', 'malformed');
    installSpy();
    await mount();
    expect(exists('digitalcatalog-item-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the loader up (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
  });
});

describe('PDF link and infinite scroll', () => {
  test('tapping a card opens upload_url3 + pdf', async () => {
    installSpy();
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);
    await mount();
    const press = find('digitalcatalog-item-1').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => {
      press.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
    });
    expect(open).toHaveBeenCalledWith(db.upload_url3 + 'concealed.pdf');
    open.mockRestore();
  });

  test('loadDataBill does not exist in Ionic: scrolling to the bottom sends no request and never completes', async () => {
    installSpy();
    await mount();
    const before = calls.length;
    const complete = jest.fn();
    await act(async () => {
      tree.root.findAll(n => typeof n.props.onInfinite === 'function')[0].props.onInfinite({ complete });
    });
    await settle();
    expect(calls.length).toBe(before);
    expect(complete).not.toHaveBeenCalled();
  });
});
