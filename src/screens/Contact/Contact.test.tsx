// Contact screen (Ionic ContactPage): states, links and quirks. See card.md. No endpoints.
import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { db } from '../../api/client';
import { client } from '../../config/client';
import i18n from '../../i18n';
import { navigationRef } from '../../navigation/navigationRef';
import ContactScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;

async function mount(nav: any = {}) {
  await act(async () => {
    tree = ReactTestRenderer.create(<ContactScreen navigation={nav} route={{ params: {} } as any} />);
  });
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));

beforeEach(async () => {
  db.userStorageData = { id: '900001', type: 'Plumber' };
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(() => {
  act(() => tree?.unmount());
  jest.restoreAllMocks();
});

describe('states (card States)', () => {
  test('Contact.default: title, address with the trailing ".", phone and e-mail from the client config, the map embed', async () => {
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining(['Contact Us', i18n.t(client.contact.addressKey).replace(/\s+/g, ' ') + '.', client.contact.phoneDisplay.trim(), client.contact.email, 'room', 'call', 'email']),
    );
    expect(find('contact-map')[0].props.uri).toBe(client.contact.mapEmbedUrl);
    expect(find('contact-map')[0].props.height).toBe('100%');
    expect(find('contact-map')[0].props.border).toBe('none');
  });

  test('Contact.customer: same page (the header only differs for a Plumber)', async () => {
    db.userStorageData = { id: '900002', type: 'Customer' };
    await mount();
    expect(allText()).toContain('Contact Us');
  });

  test('Contact.hin: title and address are translated', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toContain(i18n.t('Contact Us').replace(/\s+/g, ' '));
  });
});

describe('links (contact.html:23-36)', () => {
  test('the phone row opens tel: with the client phone', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    await mount();
    await act(async () => {
      find('contact-tel')[0].props.onPress();
    });
    expect(open).toHaveBeenCalledWith(`tel:${client.contact.phone}`);
  });

  test('the e-mail row opens mailto: with the client e-mail', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    await mount();
    await act(async () => {
      find('contact-mail')[0].props.onPress();
    });
    expect(open).toHaveBeenCalledWith(`mailto:${client.contact.email}`);
  });
});

describe('ionViewDidLeave (contact.ts:47-67)', () => {
  const stackState = (names: string[]) => ({ type: 'stack', index: names.length - 1, routes: names.map(name => ({ name })) });
  async function leave(stackRoutes: number, rootState: any) {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
    jest.spyOn(navigationRef, 'getRootState').mockReturnValue(rootState);
    const listeners: Record<string, () => void> = {};
    const nav = {
      popToTop: jest.fn(),
      getState: () => ({ routes: new Array(stackRoutes).fill({}) }),
      addListener: (type: string, cb: () => void) => {
        listeners[type] = cb;
        return () => {};
      },
    };
    await mount(nav);
    await act(async () => {
      listeners.blur();
    });
    return nav;
  }

  test('active nav shows Home with no root page before it and this stack has >1 page: popToTop', async () => {
    const nav = await leave(2, stackState(['Home']));
    expect(nav.popToTop).toHaveBeenCalledTimes(1);
  });
  test('active page is not a root page: nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'Contact', 'Video']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
});
