// CSS `display:-webkit-box; -webkit-line-clamp:1; overflow:hidden; text-overflow:ellipsis` (Chrome). Chrome wraps the text
// by words as usual and shows only the first line, with "…" after its last whole word when more text follows
// ("Rain Shower With…"). Android's numberOfLines={1} instead cuts mid-word ("Rain Shower With Ext…"): phone pass 2026-11-04.
// An invisible copy with free wrapping is measured (onTextLayout); the visible Text shows that first line + "…". It keeps
// numberOfLines={1}, so a first line that cannot take the "…" is still cut by the platform, and before the measure
// arrives (or under Jest, where onTextLayout never fires) the plain one-line text is shown.
import React, { useState } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import { Text } from './IonText';

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

export function LineClamp1({ children, style, testID }: Props) {
  const [shown, setShown] = useState<string | null>(null);
  return (
    <View>
      <Text testID={testID} numberOfLines={1} ellipsizeMode="tail" style={style}>
        {shown ?? children}
      </Text>
      <Text
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[style, styles.measure]}
        onTextLayout={e => {
          const lines = e.nativeEvent.lines;
          setShown(lines.length > 1 ? `${lines[0].text.trimEnd()}…` : null);
        }}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  measure: { position: 'absolute', left: 0, right: 0, top: 0, opacity: 0 },
});
