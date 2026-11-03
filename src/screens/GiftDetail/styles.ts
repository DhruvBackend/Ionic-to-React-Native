// Ported from: src/pages/gift-gallery/gift-detail/gift-detail.scss + the global rules of src/theme/variables.scss that reach gift-detail.html
// Citations: [T] variables.scss line (Ionic source), [S] gift-detail.scss line, [CSS] shipped main.css rule.
// Global reset [CSS]: `button,h1,h2,h3,h4,h5,h6,input,p,span { margin: 0 !important }`; `h1..h6 { font-weight: 500; line-height: 1.2 }`.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { md } from '../../theme/ionicMd';
import { giftDetailMd } from '../../theme/ionicMdGiftDetail';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 3535-3539 `.top-nav { background: #F5F7FF; position: relative; overflow: hidden }`
  topNav: { backgroundColor: giftDetailMd.topNavBackground, overflow: 'hidden' },
  // [T] 3540-3545 `.top-nav p { padding-left: 16px !important; padding-top: 16px !important; font-size: 14px; color: #000 }`
  topNavP: { paddingLeft: 16, paddingTop: 16 },
  // [T] 3546-3552 `.top-nav h1 { padding-left: 16px; font-size: 24px; color: #000; padding-bottom: 30px; font-weight: 600 }`, then
  // [T] 3565-3568 `.nav-adjust h1 { padding-bottom: 11px !important }` (same specificity, later)
  topNavH1: { paddingLeft: 16, paddingBottom: 11 },
  // [T] 3553-3562 `.top-nav:after`, [T] 3569-3571 `.nav-adjust:after { bottom: -35px }`: absolute, right 10, 91 x 97, the surprise.svg
  // as `background: no-repeat center / cover`; the clipping is the .top-nav's overflow hidden
  surprise: { position: 'absolute', bottom: -35, right: 10, width: 91, height: 97 },
  // [T] 3741-3742 `.margin-padding { padding: 32px }`, [T] 173 `.pb0 { padding-bottom: 0 !important }`
  marginPadding: { paddingTop: 32, paddingRight: 32, paddingBottom: 0, paddingLeft: 32 },
  // [T] 3745-3748 `.phone-head { margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between }`
  phoneHead: { marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // both are flex items that may shrink (CSS default flex-shrink 1)
  phoneHeadItem: { flexShrink: 1 },
  // [T] 3760-3773 `.phone-img { height: 230px; margin-bottom: 20px; overflow: hidden; display: flex; center; border: solid 1px #ccc }`
  phoneImg: {
    height: 230,
    marginBottom: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: giftDetailMd.phoneImgBorder,
  },
  // [T] 3775-3779 `.detail-list { display: flex; align-items: center; justify-content: space-between }`
  detailList: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // [T] 3780-3782 `.detail-list .detail { display: flex; align-items: center }` (shrink-to-fit inside the flex parent)
  detail: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  // [T] 3783-3794 `.img-section`: flex, center, justify left, margin-right 16, shadow, width 40; `img { 37 x 37 }`
  imgSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 16,
    boxShadow: giftDetailMd.imgSectionShadow,
    // NOTE (parity): the CSS box is width 40 with flex-shrink 1 next to `.info { width: 100% }`; the row overflows, so it shrinks to its
    // min-content, the 37px img ([T] 3783-3794, main.css). Hence 37, not 40.
    width: 37,
    flexShrink: 0,
  },
  imgSectionImg: { width: 37, height: 37 },
  // [T] 3795 `.info { width: 100% }`
  info: { flexShrink: 1 },
  // [T] 3796-3802 `.info h1 { font-size: 16px; color: #1b1b1b; margin-bottom: 2px !important; text-align: left }`
  infoH1: { marginBottom: 2, textAlign: 'left' },
  // [T] 3803-3814 `.info p { font-size: 11px; color: #747474; text-align: left }`, `p span { 12px, 600 }`
  infoP: { textAlign: 'left' },
  // [T] 3822-3824 `.lorem-text { padding: 20px 0 !important }`
  loremText: { paddingVertical: 20 },
  // [S] 35-41 `.error-bg { margin-bottom: 16px; padding: 10px; font-size: 12px; line-height: 20px; border-radius: 6px; border: 2px solid }`
  // (border colour = currentColor = the content's #000)
  errorBg: { marginBottom: 16, padding: 10, borderRadius: 6, borderWidth: 2, borderColor: md.textColor },
  // [S] 48-52 `.error-bg.kyc-reject { background: #ffe9e9; border-color: #ff0008 }`
  kycReject: { backgroundColor: giftDetailMd.rejectBackground, borderColor: giftDetailMd.rejectBorder },
  // [S] 28-33 `.kyc-reject-text { color: #3a40ff; text-decoration: underline; margin-left: 5px; display: inline-block }`
  kycRejectText: { color: giftDetailMd.linkColor, textDecorationLine: 'underline' },
  // the empty inline-block <a> of the aborted error block: one 20px line box
  emptyLine: { height: 20 },
  // [CSS] `.h32 { height: 32px !important }`
  h32: { height: 32 },
});
