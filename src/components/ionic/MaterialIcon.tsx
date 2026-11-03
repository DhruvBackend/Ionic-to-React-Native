// <i class="material-icons">name</i> (Google Material Icons, loaded by index.html:18).
// The font draws icons through ligatures, so the text is the icon name, exactly as in the HTML.
// Defaults are Google's .material-icons rule: font-size 24px, line-height 1.
import React from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { Text } from './IonText';

export interface MaterialIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function MaterialIcon({ name, size = 24, color, style }: MaterialIconProps) {
  return (
    <Text style={[styles.icon, { fontSize: size, lineHeight: size, color }, style]} allowFontScaling={false}>
      {name}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontFamily: 'MaterialIcons-Regular',
    fontWeight: 'normal',
    fontStyle: 'normal',
    letterSpacing: 0,
    includeFontPadding: false,
  },
});
