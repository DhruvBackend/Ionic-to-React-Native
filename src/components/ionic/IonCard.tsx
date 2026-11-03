// <ion-card>, <ion-card-header>, <ion-card-content> in md mode (components/card/card.md.scss, card.scss; [CSS] 12784-12932).
// Values: src/theme/ionicMdContent.ts cardMd. Topbath styles the one card it uses (survey-list) in the page stylesheet.
import React from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from './IonText';
import { cardMd } from '../../theme/ionicMdContent';
import { textStyle } from './text';

const isText = (c: React.ReactNode): c is string | number => typeof c === 'string' || typeof c === 'number';

const hasText = (children: React.ReactNode) => React.Children.toArray(children).some(isText);

export interface IonCardProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

// .card-md { margin: 10px; border-radius: 2px; width: calc(100% - 20px); background #fff; box-shadow }; ion-card overflow hidden.
// NOTE (parity): `.card-md + ion-card { margin-top: 0 }` ([CSS] 12932): IonCard `stacked` drops the top margin of the 2nd+ card.
export function IonCard({ stacked, style, testID = 'ion-card', children }: IonCardProps & { stacked?: boolean }) {
  return (
    <View testID={testID} style={[styles.card, stacked && styles.stacked, style]}>
      {children}
    </View>
  );
}

// .card-header-md: font-size 1.6rem, color #222, padding 16px; display block, overflow hidden, nowrap + ellipsis
export function IonCardHeader({
  style,
  textStyle: ts,
  testID = 'ion-card-header',
  children,
}: IonCardProps & { textStyle?: StyleProp<TextStyle> }) {
  return (
    <View testID={testID} style={[styles.header, style]}>
      {hasText(children) ? (
        // text + inline element (survey-list: text followed by an <ion-icon>): one Text, the icon (itself a Text) nests inline
        <Text numberOfLines={1} style={[textStyle(cardMd.header.fontSize, 400, cardMd.header.color), ts]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

// .card-content-md: padding 13px 16px, font-size 1.4rem, line-height 1.5; right after a header the top padding is 0 ([CSS] 12925)
export function IonCardContent({
  afterHeader,
  style,
  textStyle: ts,
  testID = 'ion-card-content',
  children,
}: IonCardProps & { afterHeader?: boolean; textStyle?: StyleProp<TextStyle> }) {
  const c = cardMd.content;
  return (
    <View
      testID={testID}
      style={[{ paddingVertical: c.paddingVertical, paddingHorizontal: c.paddingHorizontal }, afterHeader && styles.afterHeader, style]}
    >
      {hasText(children) ? (
        <Text style={[textStyle(c.fontSize, 400, c.color, c.fontSize * c.lineHeight), ts]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: cardMd.margin,
    borderRadius: cardMd.borderRadius,
    backgroundColor: cardMd.backgroundColor,
    boxShadow: cardMd.shadow,
    overflow: 'hidden',
    // width: calc(100% - 20px) is margin 10 on a stretched child
  },
  stacked: { marginTop: 0 }, // .card-md + ion-card
  afterHeader: { paddingTop: 0 }, // .card-header-md + .card-content-md
  header: { padding: cardMd.header.padding, overflow: 'hidden' },
});
