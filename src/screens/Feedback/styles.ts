// Ported from: src/pages/feedback/feedback.scss (empty) + the global rules of src/theme/variables.scss that reach feedback.html
// Citations: [T] variables.scss line.
import { StyleSheet } from 'react-native';
import { fontFor } from '../../theme/typography';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  // [T] 3990-3994 `.header-icons { position: absolute; top: 10px; right: 0 }` (against the navbar box)
  headerIcons: { position: 'absolute', top: 10, right: 0, zIndex: 1 },
  // [T] 3996-4001 `button.cs-hdr-icons`: transparent, no radius / shadow, `padding: 0 !important`. `mr12` is defined nowhere (no margin).
  hdrIconButton: { borderRadius: 0, boxShadow: 'none', paddingHorizontal: 0, paddingVertical: 0 },
  // [T] 4003 `img { width: 25px }`: the image (assets/icons/sent.svg) does not exist in Ionic (404), see index.tsx
  sentImg: { width: 25, height: 16 },
  // [T] 4045-4047 `.feedback-input { margin: 32px }`
  feedbackInput: { margin: 32 },
  // [T] 4048-4056 `.feedback-input textarea { width 100%; height 500px; font-size 24px; border 0; font-weight 300; color $black-clr }`
  // + Chrome's default textarea padding (2px); global `input,label,select,textarea { line-height: normal }`.
  textarea: {
    width: '100%',
    height: 500,
    padding: 2,
    borderWidth: 0,
    fontSize: 24,
    ...fontFor(300),
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
});
