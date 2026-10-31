// The "image viewer" of Topbath is no plugin (package.json has no photo/image viewer); product-subdetail and the
// profile pages open ViewProfilePage (view-profile.html, ion-content class="module") as an ionic modal:
// a full-screen 90 % black layer, the image centred vertically at its natural size shrunk to the width
// (`.pop-imge{padding:20px;width:100%;margin:0 auto}`, global `img{max-width:100%}`), radius 5, and a red 30 px
// round close button with a white "clear" icon at top 9 / right 9 (variables.scss:4188-4229). No pinch zoom, no
// backdrop tap close: only the close button dismisses (and the modal slide, via showModal).
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { imageViewerMd } from '../theme/ionicMdScroll';
import { showModal } from '../ui/overlays';
import { MaterialIcon } from './ionic/MaterialIcon';

export interface ImageViewerProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
}

function Page({ uri, close }: { uri: string; close: () => void }) {
  const win = useWindowDimensions();
  const v = imageViewerMd;
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
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
  const maxW = win.width - 2 * v.popPadding; // .pop-imge is 100% wide with 20 px padding
  const w = natural ? Math.min(natural.w, maxW) : maxW; // max-width:100%, never enlarged
  // NOTE (parity): a failed load leaves Ionic's <img> as a broken-image box (an unsized, alt-less <img> draws a 16 x 16 icon
  // box); the area stays in the layout instead of vanishing. Verify the exact box in the parity harness.
  const h = natural ? (natural.h * w) / natural.w : failed ? v.brokenImageSize : 0;
  const boxW = natural || !failed ? w : v.brokenImageSize;
  return (
    <View testID="image-viewer" style={styles.page}>
      <View style={[styles.pop, { padding: v.popPadding }]}>
        <Image testID="image-viewer-image" source={{ uri }} style={{ width: boxW, height: h, borderRadius: v.imageRadius }} />
        <Pressable
          testID="image-viewer-close"
          onPress={close}
          style={[styles.close, { top: v.closeTop, right: v.closeRight, width: v.closeSize, height: v.closeSize, borderRadius: v.closeRadius, backgroundColor: v.closeColor }]}
        >
          <MaterialIcon name="clear" size={v.closeIconSize} color={v.closeIconColor} />
        </Pressable>
      </View>
    </View>
  );
}

export function ImageViewer({ uri, visible, onClose }: ImageViewerProps) {
  const handle = useRef<{ dismiss(): void } | null>(null);
  const closing = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!visible) {
      return;
    }
    closing.current = false;
    handle.current = showModal({
      render: modal => <Page uri={uri} close={() => modal.dismiss()} />,
      onDidDismiss: () => {
        handle.current = null;
        if (!closing.current) {
          onCloseRef.current();
        }
      },
    });
    return () => {
      closing.current = true; // dismissed by the parent: no second onClose
      handle.current?.dismiss();
    };
  }, [visible, uri]);
  return null;
}

const styles = StyleSheet.create({
  // ion-content.module{background:rgba(0,0,0,.9)!important}; .scroll-content{top:50%;translateY(-50%)} centres the block
  page: { flex: 1, backgroundColor: imageViewerMd.backdrop, justifyContent: 'center' },
  pop: { position: 'relative', width: '100%', borderRadius: 5, alignItems: 'flex-start' },
  close: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
