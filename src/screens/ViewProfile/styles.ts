// Ported from: src/pages/view-profile/view-profile.scss (empty `page-view-profile {}`) + the global `.module` rules of
// src/theme/variables.scss:4188-4229 (values in src/theme/ionicMdScroll.ts imageViewerMd, shared with the ImageViewer kit component).
import { StyleSheet } from 'react-native';
import { imageViewerMd } from '../../theme/ionicMdScroll';

export const styles = StyleSheet.create({
  // ion-content.module{background:rgba(0,0,0,.9)!important}; .scroll-content{top:50%;translateY(-50%)} centres the block vertically
  page: { flex: 1, backgroundColor: imageViewerMd.backdrop, justifyContent: 'center' },
  // .pop-imge: padding 20, width 100%, margin 0 auto, position relative
  pop: { position: 'relative', width: '100%', borderRadius: 5, alignItems: 'flex-start', padding: imageViewerMd.popPadding },
  // `a` close button: absolute top 9 / right 9, 30x30 round, flex centre
  close: {
    position: 'absolute',
    top: imageViewerMd.closeTop,
    right: imageViewerMd.closeRight,
    width: imageViewerMd.closeSize,
    height: imageViewerMd.closeSize,
    borderRadius: imageViewerMd.closeRadius,
    backgroundColor: imageViewerMd.closeColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
