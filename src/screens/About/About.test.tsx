// About screen (Ionic AboutPage): states. See card.md. No endpoints, no nav targets.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { db } from '../../api/client';
import { client } from '../../config/client';
import i18n from '../../i18n';
import AboutScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<AboutScreen />);
  });
}
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));

beforeEach(async () => {
  db.userStorageData = { id: '900001', type: 'Plumber' };
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(() => act(() => tree?.unmount()));

describe('states (card States)', () => {
  test('About.default: title, welcome line and the four paragraphs (white space collapsed like HTML)', async () => {
    await mount();
    const texts = allText();
    expect(texts).toContain('Company Profile');
    expect(texts).toContain(`Welcome To ${client.appName}`);
    expect(client.aboutParagraphs).toHaveLength(4);
    for (const k of client.aboutParagraphs!) {
      expect(texts).toContain(k.replace(/[ \t\n\r\f]+/g, ' '));
    }
  });

  test('About.customer: same page', async () => {
    db.userStorageData = { id: '900002', type: 'Customer' };
    await mount();
    expect(allText()).toContain('Company Profile');
  });

  test('About.hin: title is translated', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toContain(i18n.t('Company Profile').replace(/\s+/g, ' '));
  });
});
