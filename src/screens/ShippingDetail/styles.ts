// Ported from: src/pages/shipping-detail/shipping-detail.scss (`page-shipping-detail button.ion-button { text-transform: capitalize !important }`)
// + the global rules of src/theme/variables.scss that reach shipping-detail.html. Citations: [T] variables.scss line (Ionic source);
// [CSS] the compiled main.css that Ionic shipped. Global reset [CSS]: `button,h1..h6,input,p,span { margin: 0 !important }`.
// Text styles (font size, weight, line height) are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { shippingDetailMd as S } from '../../theme/ionicMdShippingDetail';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: S.white },
  // html:9 `.content-box.mt0.mb10`: [T] 12468 `.conatiner .content-box { margin-top: 10px }` loses to `.mt0 { margin-top: 0 !important }`; `.mb10`
  contentBoxTitle: { marginTop: 0, marginBottom: 10 },
  // [T] 12451-12466 `.conatiner .img-box`: width 100%, shadow, 6px white border, radius 10, overflow hidden, flex + align-items center
  imgBox: {
    width: '100%',
    boxShadow: S.shadow,
    borderWidth: 6,
    borderColor: S.white,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: S.white,
  },
  // [T] 12462-12464 `img { object-fit: cover; border-radius: 10px }`; [CSS] `img { max-width: 100% }`
  img: { borderRadius: 10 },
  // a broken <img> without alt/size: Chromium's 16 x 16 icon box (unverified, as in GiftDetail)
  imgBroken: { width: 16, height: 16 },
  // html:17 the second `.content-box`: [T] 12468 margin-top 10
  contentBox: { marginTop: 10 },
  // [T] 12475-12489 `.content-box p { font-size: 13px; line-height: 20px }`
  // [T] 12493-12497 `.cs-card { box-shadow; padding: 10px; border-radius: 10px 5px }` + `.mt16`
  csCard: {
    marginTop: 16,
    boxShadow: S.shadow,
    padding: 10,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 5,
    backgroundColor: S.white,
  },
  // [T] 12498-12501 `.cs-card table { width: 100%; table-layout: fixed }`, rows `tr td { padding: 5px }`; vertical-align: middle (UA)
  tr: { flexDirection: 'row', alignItems: 'center' },
  // `td.w120` / `td.w140` ([T] 209-211 `.w#{$i} { width: 1px * $i !important }`): the first row's cell fixes the column width
  td120: { width: 120, padding: 5 },
  td140: { width: 140, padding: 5 },
  // `td:last-child { text-align: right }` takes the remaining width
  tdLast: { flex: 1, padding: 5 },
  tdLastText: { textAlign: 'right' },
  // html:70 `.padding16` ([T] 12572 `padding: 16px !important`)
  padding16: { padding: 16 },
  // html:75 `.h50` with an &nbsp; ([T] 223-225 `height: 50px !important`)
  h50: { height: 50 },
});
