// Catalogue + quotation flows (plan Phase 3): Home -> Category -> SubCategory -> ProductDetail (infinite scroll) -> ProductSubdetail (share);
// Home -> QuotationGenrateByPdf (build a list, submit). Real RootNavigator in MOCK mode, a Sales_Boy session, controls pressed by testID.
// shareText / openExternal are jest.fn wrappers (the MOCK natives record nothing).
jest.mock('../../src/native', () => ({
  ...jest.requireActual('../../src/native'),
  shareText: jest.fn(() => Promise.resolve({ ok: true })),
  openExternal: jest.fn(() => Promise.resolve({ ok: true })),
}));
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, getTransport, setTransport, type ApiRequest } from '../../src/api/client';
import sessions from '../../src/api/fixtures/_sessions.json';
import { resetMock } from '../../src/api/mock';
import i18n from '../../src/i18n';
import { RootNavigator } from '../../src/navigation/RootNavigator';
import { navigationRef } from '../../src/navigation/navigationRef';
import { openExternal, shareText } from '../../src/native';
import { resetMockNative } from '../../src/native';
import { _resetOverlaysForTests } from '../../src/ui/overlays';

const act = ReactTestRenderer.act;
let tree: ReactTestRenderer.ReactTestRenderer | undefined;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

// let the mock's 300 ms latency, screen transitions and pending promises run
async function settle(ms = 350, rounds = 6) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}
const find = (id: string) => tree!.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
// the deepest focused route (a page pushed inside a tab, or a modal), and the route focused in the ROOT stack
const current = () => navigationRef.getCurrentRoute()?.name;

async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function');
  if (!n) {
    throw new Error(`no pressable "${id}" on screen (current: ${current()})`);
  }
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
  });
  await settle();
}
async function type(id: string, text: string) {
  await act(async () => {
    find(id).find(n => typeof n.props.onChangeText === 'function')!.props.onChangeText(text);
  });
}


const sent = (fn: string) => calls.filter(c => c.fn === fn).map(c => (typeof c.body === 'string' ? JSON.parse(c.body) : c.body));
const infinite = () => tree!.root.findAll(n => typeof n.props.onInfinite === 'function').pop()!;

async function start() {
  db.userStorageData = { ...(sessions as any).Sales_Boy };
  await act(async () => {
    tree = ReactTestRenderer.create(<RootNavigator initialRouteName="Tabs" />);
  });
  await settle();
  expect(current()).toBe('Home');
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  resetMockNative();
  _resetOverlaysForTests();
  (shareText as jest.Mock).mockClear();
  (openExternal as jest.Mock).mockClear();
  db.userStorageData = null;
  calls = [];
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return previous(req);
  });
  restoreTransport = () => setTransport(previous);
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(async () => {
  restoreTransport();
  await act(async () => {
    tree?.unmount();
  });
  tree = undefined;
  jest.useRealTimers();
});

test('Category -> SubCategory -> ProductDetail (infinite scroll offset) -> ProductSubdetail -> share text + image', async () => {
  await start();
  await press('home-box-products');
  expect(current()).toBe('Category');
  await press('category-row-0');
  // checkCategoryLength default answers one category: SubCategory {id}
  expect(sent('app_master/checkCategoryLength')).toHaveLength(1);
  expect(current()).toBe('SubCategory');
  expect(navigationRef.getCurrentRoute()?.params).toEqual({ id: 7 });
  expect(sent('app_master/childCategoryList')[0]).toMatchObject({ category_id: 7 });

  await press('subcategory-row-0');
  expect(current()).toBe('ProductDetail');
  expect(sent('app_master/productList')).toHaveLength(1);
  expect(sent('app_master/productList')[0].filter.limit).toBe(0);
  expect(exists('product-detail-item-3')).toBe(true);
  expect(exists('product-detail-item-4')).toBe(false);

  // infinite scroll: the next page is asked from offset = the current list length (4)
  await act(async () => {
    infinite().props.onInfinite({ complete: jest.fn() });
  });
  await settle();
  const lists = sent('app_master/productList');
  expect(lists).toHaveLength(2);
  expect(lists[1].filter.limit).toBe(4);
  expect(lists[1].filter.id).toBe(11);

  await press('product-detail-item-0');
  expect(current()).toBe('ProductSubdetail');
  expect(navigationRef.getCurrentRoute()?.params).toEqual({ id: 31 });
  await press('product-subdetail-share');
  expect(shareText).toHaveBeenCalledTimes(1);
  expect(shareText).toHaveBeenCalledWith(
    'Company Name:Machino Tech (Topsan)\nCategory : BATH FITTINGS\nProduct Name:  Rain Shower\nProduct Code:  tb-1001\nPrice : 2499\nDescription : chrome finish 8 inch',
    db.product_image_url + 'shower_b.png',
  );
});

test('Quotation: add a product through the picker, fill the customer, submit -> quotation_pdf body -> openExternal(upload_url3 + file_name)', async () => {
  await start();
  await press('home-box-quotation');
  expect(current()).toBe('QuotationGenrateByPdf');

  await type('full_name', 'ravi kumar');
  await type('mobile_no', '9812345670');
  await type('address', 'new delhi');
  const picker = find('product_name').find(n => typeof n.props.onChange === 'function')!;
  const item = picker.props.items[0];
  await act(async () => {
    picker.props.onChange(item, { value: item });
  });
  await type('qty', '2');
  await press('add-to-list');
  expect(exists('quotation-row-0')).toBe(true);

  await press('quotation-save');
  const [body] = sent('app_karigar/quotation_pdf');
  expect(body).toMatchObject({ full_name: 'ravi kumar', mobile_no: '9812345670', address: 'New Delhi', karigar_id: (sessions as any).Sales_Boy.id });
  expect(body.product_list).toHaveLength(1);
  expect(body.product_list[0]).toMatchObject({ product_id: 11, product_name: 'Basin Mixer', qty: '2', price: 1500, total_amount: 3000 });
  expect(openExternal).toHaveBeenCalledWith(db.upload_url3 + 'quotation_900001.pdf', '_system');
  expect(current()).toBe('Home');
});
