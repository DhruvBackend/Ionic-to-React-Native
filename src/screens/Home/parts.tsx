// Ported from: src/pages/home/home.html (the repeated template fragments)
import React, { useEffect, useState } from 'react';
import { Image, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { SvgCss } from 'react-native-svg/css';
import { IonButton } from '../../components/ionic/IonButton';
import { IonIcon } from '../../components/ionic/IonIcon';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Text } from '../../components/ionic/IonText';
import { clipSafeLineBox, textStyle } from '../../components/ionic/text';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { buttonColors, buttonMd } from '../../theme/ionicMdContent';
import { homeMd } from '../../theme/ionicMdHome';
import { homeImages } from '../../assets/client/homeImages';

// `<img src="...">` with `.banner img { max-width: 100% }` / `img { max-width: 100%; border: 0 }`: its natural size, shrunk to the
// container width, with an inline image's baseline gap under it. A remote image has no size until it loaded (Ionic: 0x0).
export function AutoImage({ source, uri, testID }: { source?: ImageSourcePropType; uri?: string; testID?: string }) {
  const [box, setBox] = useState(0);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(() => {
    if (uri || source === undefined) {
      return null;
    }
    const s = Image.resolveAssetSource(source);
    return s?.width && s?.height ? { w: s.width, h: s.height } : null;
  });
  useEffect(() => {
    if (!uri) {
      return;
    }
    let live = true;
    try {
      Image.getSize(
        uri,
        (w, h) => live && setNatural({ w, h }),
        () => {},
      );
    } catch {
      // not loadable: stays 0x0 like a broken <img>
    }
    return () => {
      live = false;
    };
  }, [uri]);
  const width = natural && box ? Math.min(natural.w, box) : 0;
  const height = natural && width ? (width * natural.h) / natural.w : 0;
  return (
    <View testID={testID} style={{ width: '100%', alignItems: 'center' }} onLayout={e => setBox(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Image source={uri ? { uri } : source!} style={{ width, height }} resizeMode="stretch" />
      ) : null}
      <View style={{ height: homeMd.inlineImgGap }} />
    </View>
  );
}

// `<img src="assets/imgs/x.svg">` sized by CSS: `height` given, width auto from the SVG's own ratio.
export function SvgImg({ name, height, testID }: { name: string; height: number; testID?: string }) {
  const img = homeImages[name];
  if (!img) {
    return null;
  }
  const Svg = img.css ? SvgCss : SvgXml;
  return (
    <View testID={testID}>
      <Svg xml={img.xml} width={height * img.ratio} height={height} />
    </View>
  );
}

// `.group-btn button` / `a`: `<button ion-button color="primary" block round>` holding
// `<i class="material-icons">icon</i> label <ion-icon name="arrow-forward|call">`. The global `.group-btn button span`
// rule makes the button's inner row `justify-content: space-between` and `text-transform: capitalize`.
// NOTE (kit): IonButton centres its children and has no inner-width prop, so the three flex items are laid out here in a row as
// wide as the button's content box (screen width - 2x16 group padding - 2x26 round padding).
export function GroupButton({
  icon,
  label,
  end = 'arrow-forward',
  onPress,
  as = 'button',
  last,
  endMargin,
  testID,
}: {
  icon?: string; // omitted: the button has no <i class="material-icons"> (the inner row then holds the label and the arrow only)
  label: string;
  end?: string;
  onPress?: () => void;
  as?: 'button' | 'a';
  last?: boolean; // `.group-btn a:last-child { margin-bottom: 0 }`
  endMargin?: number; // inline `style="margin-bottom:16px !important"`
  testID?: string;
}) {
  const { width } = useWindowDimensions();
  const inner = width - 2 * homeMd.groupBtn.paddingHorizontal - 2 * buttonMd.round.paddingHorizontal;
  const fontSize = buttonMd.fontSize;
  const lineHeight = as === 'a' ? normalLineHeight(fontSize) : fontSize * buttonMd.lineHeight; // `button { line-height: 1 }`
  const box = clipSafeLineBox(fontSize, lineHeight);
  const fg = buttonColors('primary').solid.text;
  const bottom = endMargin ?? (last ? 0 : homeMd.groupBtn.gap);
  return (
    <IonButton
      testID={testID}
      as={as}
      color="primary"
      block
      round
      onPress={onPress}
      textTransform="capitalize"
      // the md `a` margin is 4px vertical but collapses with the neighbour's 16px bottom margin (block siblings), so only the
      // bottom margin is added; a <button> has none
      style={{ marginTop: 0, marginBottom: bottom }}
    >
      <View style={{ width: inner, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {icon ? <MaterialIcon name={icon} color={fg} /> : null}
        <Text
          numberOfLines={1}
          ellipsizeMode="clip" // `.button { white-space: nowrap }` clips, the inner row has no text-overflow
          style={{
            ...textStyle(fontSize, buttonMd.textWeight, fg, box.lineHeight),
            marginVertical: box.marginVertical,
            textTransform: 'capitalize',
          }}
        >
          {label}
        </Text>
        <IonIcon name={end} size={fontSize * 1.2} color={fg} />
      </View>
    </IonButton>
  );
}
