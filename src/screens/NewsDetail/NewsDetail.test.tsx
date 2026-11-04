// NewsDetail screen (Ionic NewsDetailPage): contract, states, nav param. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import NewsDetailScreen from './index';

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
    tree = ReactTestRenderer.create(<NewsDetailScreen navigation={{} as any} route={{ params: { id: 11 } }} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const bodyOf = (c: ApiRequest) => JSON.parse(c.body!);

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
  test('app_master/newsDetail: {news_id} from the nav param, loader up until the answer', async () => {
    installSpy();
    await expectContract('app_master/newsDetail', () => mount());
    expect(bodyOf(calls[0])).toEqual({ news_id: 11 });
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('states (card States)', () => {
  test('NewsDetail.default: title-cased heading, date "d MMM, y", source, description', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining([
        'News Detail',
        'date_range',
        '14 Mar, 2026',
        'public',
        'Business Standard',
        'New Bathroom Collection Launched This Season',
      ]),
    );
    expect(flat(find('news-desc')[0].props.children)).toBe(
      'Description : The new range of showers, mixers and concealed fittings is now available at all authorised dealers across the country.',
    );
  });

  test('NewsDetail.empty (news: {}): blank values, only the static "Description :"', async () => {
    setFixtureVariant('app_master/newsDetail', 'empty');
    installSpy();
    await mount();
    expect(flat(find('news-desc')[0].props.children)).toBe('Description : ');
    expect(flat(find('news-date')[0].props.children)).toBe('');
  });

  test('NewsDetail.malformed (news: null): no crash, the blank first render stays, loader gone', async () => {
    setFixtureVariant('app_master/newsDetail', 'malformed');
    installSpy();
    await mount();
    expect(exists('news-box')).toBe(true);
    expect(flat(find('news-title')[0].props.children)).toBe('');
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the loader up (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
  });
});
