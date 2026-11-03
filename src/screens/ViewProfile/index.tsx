// Ported from: src/pages/view-profile/view-profile.html + .ts + .scss
import React, { useEffect, useState } from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { db } from '../../api/client';
import { imageViewerMd } from '../../theme/ionicMdScroll';
import { styles } from './styles';

interface Props {
  navigation: { goBack: () => void };
  route?: { params?: { Image?: any; mode?: string } };
}

// NOTE (parity): view-profile.module.ts imports PinchZoomModule (ngx-pinch-zoom) but the template never uses it: a plain <img>, no
// pinch zoom, no backdrop tap close, no swipe. Only the red close button dismisses (and the hardware back button).
// NOTE (parity): no TranslateModule and no use() call; the page has no text (only the "clear" icon ligature).
export default function ViewProfileScreen({ navigation, route }: Props) {
  const win = useWindowDimensions();
  const v = imageViewerMd;
  // view-profile.ts:36-37 ionViewDidLoad: profile_pic = navParams.get("Image"); mode = navParams.get("mode")
  const profile_pic = route?.params?.Image;
  const mode = route?.params?.mode;

  // html:5 `src="{{url+profile_pic}}"` (mode 'profile', url = db.upload_url3); html:19 `{{product_image_url+profile_pic}}` (mode 'product_img').
  // NOTE (parity): a missing Image prints "undefined" (string concatenation), the URL is requested as is.
  // NOTE (parity): any other mode (callers that send only {Image}: dealer-profile, home, order-detail, complaint-detail, ...) matches
  // neither *ngIf: the page is an empty dark modal with NO close button (only the hardware back button leaves it).
  const uri = mode == 'profile' ? db.upload_url3 + profile_pic : mode == 'product_img' ? db.product_image_url + profile_pic : null; // eslint-disable-line eqeqeq

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (uri === null) {
      return;
    }
    let live = true;
    Image.getSize(
      uri,
      (w, h) => live && setNatural({ w, h }),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [uri]);

  // view-profile.ts:40-42 closeModal: viewCtrl.dismiss()
  function closeModal() {
    navigation.goBack();
  }

  if (uri === null) {
    return <View testID="view-profile" style={styles.page} />;
  }
  // global `img{max-width:100%}`: natural size, shrunk to the container (width - 2 * 20 padding), never enlarged
  const maxW = win.width - 2 * v.popPadding;
  const w = natural ? Math.min(natural.w, maxW) : maxW;
  // NOTE (parity): a failed load leaves Ionic's <img> as a broken-image box (16 x 16), same as src/components/ImageViewer.tsx.
  const h = natural ? (natural.h * w) / natural.w : failed ? v.brokenImageSize : 0;
  const boxW = natural || !failed ? w : v.brokenImageSize;
  return (
    <View testID="view-profile" style={styles.page}>
      <View testID="pop-imge" style={styles.pop}>
        {/* NOTE (parity): view-profile.html:5 the <img> is inline, so `.pop-imge` gets the line box's strut descent below it
            (body font 14px, line-height normal: descent round(14 * 500/2048) = 3px). */}
        <Image testID="view-profile-image" source={{ uri }} style={{ width: boxW, height: h, borderRadius: v.imageRadius, marginBottom: 3 }} />
        <Pressable testID="view-profile-close" onPress={closeModal} style={styles.close}>
          <MaterialIcon name="clear" size={v.closeIconSize} color={v.closeIconColor} />
        </Pressable>
      </View>
    </View>
  );
}
