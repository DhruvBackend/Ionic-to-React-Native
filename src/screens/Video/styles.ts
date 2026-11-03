// Ported from: src/pages/video/video.scss (empty) + the global rules of src/theme/variables.scss that reach video.html
// Citations: [T] variables.scss line (Ionic source).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { videoMd } from '../../theme/ionicMdVideo';

// [T] 3976-3979 `.video .vid-text p { font-size: 13px; color; line-height: 20px }`
export const descColor = videoMd.descColor;

// the inline <iframe> (html:20) leaves the descender gap (~4px at 14px Roboto) below it, before `.vid-text`
export const iframeGap = 4;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 7353-7356 `.nothing-here { height: 80% }` (of the content height, set from the measurement in index.tsx);
  // [T] 7850-7858 `.outer { display: table; width: 100%; height: 100% }` > `.innear { display: table-cell; vertical-align: middle; text-align: center }`
  nothingHere: { width: '100%' },
  outer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  innear: { alignItems: 'center' },
  // [T] 7357-7359 `.nothing-here img { width: 150px }`
  // [T] 7360-7365 `.nothing-here p { font-size: 14px; letter-spacing: 1px }` (colour $black-clr = md.textColor, set in index.tsx)
  nothingText: { letterSpacing: 1 },
  // [T] 3972-3975 `.video .vid-text { margin: 10px 16px 20px 16px }`
  vidText: { marginTop: 10, marginRight: 16, marginBottom: 20, marginLeft: 16 },
});

