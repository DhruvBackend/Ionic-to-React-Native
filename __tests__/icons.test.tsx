// IonIcon (Ionicons 3.0.0, md mode) and MaterialIcon (Google Material Icons ligatures) — plan Task 9.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet, Text } from 'react-native';
import { IonIcon, ionIconGlyph } from '../src/components/ionic/IonIcon';
import { MaterialIcon } from '../src/components/ionic/MaterialIcon';

const glyph = (cp: number) => String.fromCodePoint(cp);

test('a plain name resolves to the md- glyph (Ionic 3 md mode)', () => {
  expect(ionIconGlyph('arrow-back')).toBe(glyph(0xf27d));
  expect(ionIconGlyph('md-arrow-back')).toBe(glyph(0xf27d));
});

test('explicit ios- and logo- names are used as they are', () => {
  expect(ionIconGlyph('ios-arrow-back')).toBe(glyph(0xf3cf));
  expect(ionIconGlyph('logo-whatsapp')).toBe(glyph(0xf2c5));
});

test('an unknown name has no glyph', () => {
  expect(ionIconGlyph('no-such-icon')).toBeNull();
});

function render(el: React.ReactElement) {
  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(el);
  });
  return tree!;
}

test('IonIcon draws the glyph in the bundled ionicons font', () => {
  const text = render(<IonIcon name="search" size={20} color="red" />).root.findByType(Text);
  expect(text.props.children).toBe(glyph(0xf375));
  expect(StyleSheet.flatten(text.props.style)).toMatchObject({ fontFamily: 'ionicons', fontSize: 20, color: 'red' });
});

test('IonIcon with an unknown name renders nothing (Ionic shows an empty icon)', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(render(<IonIcon name="no-such-icon" />).toJSON()).toBeNull();
  warn.mockRestore();
});

test('MaterialIcon renders the ligature name in the Material Icons font, 24px by default', () => {
  const text = render(<MaterialIcon name="room" />).root.findByType(Text);
  expect(text.props.children).toBe('room');
  expect(StyleSheet.flatten(text.props.style)).toMatchObject({ fontFamily: 'MaterialIcons-Regular', fontSize: 24 });
});
