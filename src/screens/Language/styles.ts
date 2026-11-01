// Ported from: src/pages/language/language.scss (+ the global rules of src/theme/variables.scss that reach language.html)
// Citations: [P] language.scss line, [T] variables.scss line, [CSS] compiled main.css rule (.reference/aab .../build/main.css),
// [M] measured in the Ionic reference build (parity/out/ref/Language.default.png, Chrome 360x800).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { listMd } from '../../theme/ionicMdContent';
import { toolbarMd } from '../../theme/ionicMdPage';

export const logoHeight = 45; // [T] 1215 `.header-logo img { height: 45px }`
export const footerShadowHeight = 2; // [CSS] `.footer-md::before { top: -2px; height: 2px; background-position: left 0 top 0 }`

export const styles = StyleSheet.create({
  // <ion-toolbar class="h80" color="white">: [CSS] `.h80 { height: 80px !important }` ([M] toolbar 360x80)
  toolbar: { height: toolbarMd.tallHeight },

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

  // ion-list-header.border-heading content. NOTE (parity): ion-list-header is an Item (selector `ion-list-header, ion-item, ...`), so
  // Ionic renders .item-inner > .input-wrapper > ion-label around the projected <p>; that is why the .border-heading label rules and the
  // ::after bar match ([M] DOM probe). The kit's IonListHeader has no such wrapper, so it is drawn here.
  // [T] 9743+ / [CSS] `ion-list ion-list-header.border-heading .item-inner .input-wrapper ion-label { margin-left: 15px; font-size: 16px;
  // font-weight: 600; color: #000 }` + .label-md margin 13px 8px 13px 0 ([M] label 287x19 at 48,125).
  headerLabel: { flex: 1, marginTop: 13, marginRight: 8, marginBottom: 13, marginLeft: 15 },
  // `...ion-label::after { content: ""; position: absolute; top: 20px; left: 0; width: 22px; height: 5px; background: #002d25 }`
  // (sits against the header: .item is position: relative; [M] after 22x5 at top 20 left 0). #002d25 is the client primary.
  headerBar: { position: 'absolute', top: 20, left: 0, width: 22, height: 5, backgroundColor: colors.primary },

  // <ion-footer>: [CSS] .footer-md::before draws the 2px shadow strip above it.
  footer: { position: 'relative' },
  footerShadow: { position: 'absolute', left: 0, right: 0, top: -footerShadowHeight, height: footerShadowHeight, overflow: 'hidden' },
  footerShadowImg: { width: '100%', height: 7 },

  screen: { flex: 1, backgroundColor: colors.white },
});
