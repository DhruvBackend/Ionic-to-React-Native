// Ionic 3 <ion-icon name="…">, drawn with the bundled Ionicons 3.0.0 font (the shipped version).
// In md mode a plain name resolves to its md- variant; ios- and logo- names are used as given.
// Ionic's ion-icon has no size of its own (it inherits font-size), so callers pass the computed size.
import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import glyphs from './ionicons3.json';

const MAP = glyphs as Record<string, number>;

export function ionIconGlyph(name: string): string | null {
  const key = /^(ios|md|logo)-/.test(name) ? name : `md-${name}`;
  const cp = MAP[key];
  return cp ? String.fromCodePoint(cp) : null;
}

export interface IonIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

export function IonIcon({ name, size = 14, color, style, testID }: IonIconProps) {
  const glyph = ionIconGlyph(name);
  if (!glyph) {
    console.warn(`[IonIcon] unknown ionicons 3 name "${name}"`);
    return null;
  }
  return (
    <Text testID={testID} style={[styles.icon, { fontSize: size, lineHeight: size, color }, style]} allowFontScaling={false}>
      {glyph}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: { fontFamily: 'ionicons', fontWeight: 'normal', fontStyle: 'normal', includeFontPadding: false },
});
