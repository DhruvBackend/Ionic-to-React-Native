// Ported from: src/pages/language/language.scss (+ the global rules of src/theme/variables.scss that reach language.html)
// Citations: [P] language.scss line, [T] variables.scss line, [CSS] compiled main.css rule (.reference/aab .../build/main.css),
// [M] measured in the Ionic reference build (parity/out/ref/Language.default.png, Chrome 360x800).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { listMd } from '../../theme/ionicMdContent';
import { toolbarMd } from '../../theme/ionicMdPage';

export const logoHeight = 45; // [T] 1215 `.header-logo img { height: 45px }`

export const styles = StyleSheet.create({
  // [T] 1201-1213 `.header-logo`: position absolute; top 0; left 0; width/height 100% (of the toolbar, so it spans the
  // toolbar's 4 px padding); flex centre; padding 0 10px; z-index -1; border-bottom 2px solid $primary.
  headerLogo: {
    position: 'absolute',
    top: -toolbarMd.padding,
    left: -toolbarMd.padding,
    right: -toolbarMd.padding,
    bottom: -toolbarMd.padding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerLogoImg: { height: logoHeight },

  // <div class="mt16">: [CSS] `.mt16 { margin-top: 16px !important }`
  mt16: { marginTop: 16 },

  // [P] 3-6 page-language ion-list { border-radius: 10px; border: 1px solid #dedede }  ([M] list 328x157 at 16,111)
  list: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: listMd.borderColor,
  },

  // [P] 8-27 page-language ion-list ion-item { padding: 0 !important; min-height: 55px !important;
  //   .item-inner { padding-left: 16px; ion-label { margin: 0 } } }
  item: { paddingLeft: 0, minHeight: 55 },
  itemInner: { paddingLeft: 16, minHeight: 55 },
  itemLabel: { margin: 0 },
  // [P] 23-26 `&:last-child { border-bottom-left-radius: 8px; border-bottom-right-radius: 8px }`
  itemLast: { borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },

  screen: { flex: 1, backgroundColor: colors.white },
});
