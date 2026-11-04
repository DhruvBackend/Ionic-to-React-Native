// Ported from: src/pages/news-detail/news-detail.scss (empty: `page-news-detail { }`) + the global rules of src/theme/variables.scss that reach the template
// Citations: [T] variables.scss line (Ionic source). `.box`, `.date` and `.social` exist only nested inside other selectors ([T] 2283, 5078, 7421...),
// so those three divs are unstyled blocks.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 3594-3599 / 5661-5666 `.fix { position: sticky; top: 0; left: 0; z-index: 1 }`: IonContent stickyChildIndices
  fix: { zIndex: 1 },
  // [T] 3507-3514 `.pr-img { line-height: 0 !important; height: 277px; display: flex; align-items: baseline }`, `img { height: 100% }`
  prImg: { height: 277, flexDirection: 'row', alignItems: 'flex-start' },
  // html:16 / 20 `<span><i class="material-icons">..</i></span>`: the icon (24px, line-height 1) sits on the baseline of a 14px line:
  // ~4px strut gap below it (inline <i> in a line box)
  iconLine: { height: 28, justifyContent: 'flex-start' },
  // [T] 3517-3533 `.pr-about { margin: 32px }`
  prAbout: { margin: 32 },
  // [T] 3518-3524 `.pr-about h1 { font-size: 16px; color: #1b1b1b; margin-bottom: 16px !important; line-height: 22px }` (the global
  // `h1..h6 { margin: 0 !important }` zeroes the other sides; `font-weight: semibold` is invalid CSS and drops out, so Ionic's h1 500 applies)
  h1: { marginBottom: 16 },
});
