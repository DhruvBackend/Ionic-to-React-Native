// QuotationGenrateByPdf screen (Ionic QuotationGenrateByPdfPage): contracts, form rules, list building, submit, PDF open and nav. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import sessions from '../../api/fixtures/_sessions.json';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { openExternal } from '../../native';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import route from './route';
import QuotationScreen from './index';

jest.mock('../../native', () => ({ ...jest.requireActual('../../native'), openExternal: jest.fn(() => Promise.resolve({ ok: true })) }));

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { popTo: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  }
}
async function mount() {
  db.userStorageData = { ...(sessions as any).Sales_Boy };
  await act(async () => {
    tree = ReactTestRenderer.create(<QuotationScreen navigation={navigation as any} />);
  });
  await settle();
}
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const input = (id: string) => find(id).find(n => typeof n.props.onChangeText === 'function')!;
const val = (id: string): string => find(id + '-input').find(n => typeof n.props.value === 'string')!.props.value;
const selectable = () => find('product_name').find(n => typeof n.props.onChange === 'function')!;
const press = async (id: string) => {
  const target = find(id).find(n => typeof n.props.onPress === 'function')!;
  expect(target).toBeDefined();
  await act(async () => {
    target.props.onPress();
  });
  await settle();
};
async function type(id: string, text: string) {
  await act(async () => {
    input(id).props.onChangeText(text);
  });
}
async function pick(i: number) {
  const item = selectable().props.items[i];
  await act(async () => {
    selectable().props.onChange(item, { value: item });
  });
}
async function fillCustomer() {
  await type('full_name', 'ravi kumar');
  await type('mobile_no', '9812345670');
  await type('address', 'new delhi');
}
async function addOne(qty = '2', idx = 0) {
  await pick(idx);
  await type('qty', qty);
  await press('add-to-list');
}
const toasts = () => overlayStore.getEntries().filter(o => o.kind === 'toast').map((o: any) => o.options.message);
const callsTo = (fn: string) => calls.filter(c => c.fn === fn).map(c => ({ ...c, body: typeof c.body === 'string' ? JSON.parse(c.body) : c.body }));

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.popTo.mockClear();
  (openExternal as jest.Mock).mockClear();
  calls = [];
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return previous(req);
  });
  restoreTransport = () => setTransport(previous);
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

test('route: a pushed card page behind the quotation flag that pops to Home', () => {
  expect(route.name).toBe('QuotationGenrateByPdf');
  expect(route.presentation).toBe('card');
  expect(route.feature).toBe('quotation');
  expect(route.links).toEqual(['Home']);
});

describe('contract (card Endpoints)', () => {
  test('app_master/parentCategory_List_quotation on load', async () => {
    await expectContract('app_master/parentCategory_List_quotation', () => mount());
  });
  test('app_master/quotation_List on load and on picker search', async () => {
    await mount();
    await expectContract('app_master/quotation_List', async () => {
      await act(async () => {
        selectable().props.onSearch({ text: 'tap' });
      });
      await settle();
    });
  });
  test('app_karigar/quotation_pdf', async () => {
    await mount();
    await fillCustomer();
    await addOne();
    await expectContract('app_karigar/quotation_pdf', () => press('quotation-save'));
  });
});

describe('render', () => {
  test('default: title, fields, picker, disabled add button, no list and no Save', async () => {
    await mount();
    const t = allText();
    expect(t).toContain('Add Quotation');
    expect(t.join('|')).toContain('Select Product');
    expect(find('add-to-list').find(n => n.props.disabled !== undefined)!.props.disabled).toBe(true);
    expect(find('quotation-save')).toHaveLength(0);
    expect(callsTo('app_master/quotation_List')[0].body).toEqual({ filter: { limit: 0 } });
    expect(selectable().props.items).toHaveLength(2);
    expect(selectable().props.canSearch).toBe(true);
    expect(selectable().props.itemValueField).toBe('product_name');
  });
  test.each(['empty', 'malformed'])('%s answers render without throwing', async variant => {
    setFixtureVariant('app_master/quotation_List', variant);
    setFixtureVariant('app_master/parentCategory_List_quotation', variant);
    await mount();
    expect(allText()).toContain('Add Quotation');
  });
});

describe('form rules', () => {
  test('name keeps only letters, + - and space; address is capitalised word by word', async () => {
    await mount();
    await type('full_name', 'ra1vi+k-u mar!');
    expect(input('full_name').props.value).toBe('ravi+k-u mar');
    await type('address', 'new delhi, 2nd floor');
    expect(input('address').props.value).toBe('New Delhi, 2nd Floor');
  });
  test('picking a product fills category, sub category, price; quantity makes the total', async () => {
    await mount();
    await pick(0);
    expect(input('main_category').props.value).toBe('Taps');
    expect(input('sub_category').props.value).toBe('Mixers');
    expect(val('price')).toBe('1500');
    await type('qty', '3');
    expect(val('total_amount')).toBe('4500');
    expect(find('price-input').some(n => n.props.readOnly === true || n.props.editable === false)).toBe(true);
    expect(find('total_amount-input').some(n => n.props.readOnly === true || n.props.editable === false)).toBe(true);
  });
});

describe('list', () => {
  test('Add To List adds a card, clears the fields and shows Save; the same product is listed again', async () => {
    await mount();
    await addOne('2', 0);
    expect(allText().some(s => s.includes('Product: ') && s.includes('Basin Mixer'))).toBe(true);
    expect(find('quotation-save').length).toBeGreaterThan(0);
    expect(input('qty').props.value).toBe('');
    await addOne('1', 0);
    expect(find('quotation-row-0').length).toBeGreaterThan(0);
    expect(find('quotation-row-1').length).toBeGreaterThan(0);
    expect(find('quotation-img-0')[0].props.source.uri).toBe(db.product_image_url + 'tb101.jpg');
  });
  test('delete removes the card and toasts', async () => {
    await mount();
    await addOne();
    await press('delete-0');
    expect(find('quotation-row-0')).toHaveLength(0);
    expect(toasts()).toContain('Delete successfully');
    expect(find('quotation-save')).toHaveLength(0);
  });
});

describe('submit', () => {
  test('missing customer fields: toast, no request', async () => {
    await mount();
    await addOne();
    await press('quotation-save');
    expect(toasts()).toContain('Please fill in all required fields!');
    expect(callsTo('app_karigar/quotation_pdf')).toHaveLength(0);
  });
  test('flow: build a list -> quotation_pdf -> openExternal(upload_url3 + file_name) -> popTo Home', async () => {
    await mount();
    await fillCustomer();
    await addOne('2', 0);
    await addOne('1', 1);
    await press('quotation-save');
    const [c] = callsTo('app_karigar/quotation_pdf');
    expect(c.body.karigar_id).toBe(db.userStorageData.id);
    expect(c.body.product_list).toHaveLength(2);
    expect(c.body.address).toBe('New Delhi');
    expect(openExternal).toHaveBeenCalledWith(db.upload_url3 + 'quotation_900001.pdf', '_system');
    expect(navigation.popTo).toHaveBeenCalledWith('Home');
    expect(overlayStore.getEntries().filter(o => o.kind === 'loading' && !o.leaving)).toHaveLength(0);
  });
  test('any other status: nothing opens and the loader stays up (as in Ionic)', async () => {
    setFixtureVariant('app_karigar/quotation_pdf', 'failed');
    await mount();
    await fillCustomer();
    await addOne();
    await press('quotation-save');
    expect(openExternal).not.toHaveBeenCalled();
    expect(navigation.popTo).not.toHaveBeenCalled();
    expect(overlayStore.getEntries().filter(o => o.kind === 'loading' && !o.leaving)).toHaveLength(1);
  });
});
