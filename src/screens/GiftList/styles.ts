// Ported from: src/pages/gift-gallery/gift-list/gift-list.scss (empty: `page-gift-list { }`) + the global rules that reach gift-list.html
// Citations: [T] variables.scss (Ionic source), [CSS] the shipped main.css (the later `.listing` / `.search` / `.top-nav` rules win).
// Global reset [CSS]: `button,h1,h2,h3,h4,h5,h6,input,p,span { margin: 0 !important }`; `h1..h6 { font-weight: 500; line-height: 1.2 }`.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { giftDetailMd } from '../../theme/ionicMdGiftDetail';
import { giftListMd } from '../../theme/ionicMdGiftList';
import { stripeColor } from '../VideoCategory/styles';

export { stripeColor };

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [CSS] `.fix { position: sticky; top: 0; left: 0; z-index: 1 }` (see the NOTE (parity) in index.tsx: no sticky support in IonContent)
  fix: { zIndex: 1 },
  // [CSS] `.top-nav { background: #f5f7ff; position: relative; overflow: hidden }`
  topNav: { backgroundColor: giftDetailMd.topNavBackground, overflow: 'hidden' },
  // [CSS] `.top-nav p { padding-left: 16px !important; padding-top: 16px !important; color: #000; font-size: 14px }`
  topNavP: { paddingLeft: 16, paddingTop: 16 },
  // [CSS] `.top-nav h1 { padding-left: 16px !important; font-size: 24px; color: #000; padding-bottom: 30px !important; font-weight: 600 }`
  topNavH1: { paddingLeft: 16, paddingBottom: 30 },
  // [CSS] `.top-nav:after { bottom: -18px; right: 10px; 91 x 97; background: url(surprise.svg) no-repeat center; background-size: cover }`
  surprise: { position: 'absolute', bottom: -18, right: 10, width: 91, height: 97 },
  // [CSS] `.search { position: relative; padding-left: 16px; margin-top: -23px; display: flex; max-height: 40px }`
  search: { flexDirection: 'row', paddingLeft: 16, marginTop: -23, maxHeight: 40 },
  // ion-searchbar is `width: 100%` and a shrinking flex item of .search
  searchHost: { width: '100%', flexShrink: 1 },
  // [CSS] `.listing { margin: 16px 0; padding: 0 16px }`
  listing: { marginTop: 16, marginBottom: 16, paddingHorizontal: 16 },
  // [CSS] `.listing button { margin-bottom: 16px; border-radius: 6px; background: #fff; box-shadow: 0 3px 6px 0 #ccc; display: flex;
  // padding-right: 16px !important; padding-left: 0 }` + `.listing button:nth-child(..) { border-left: 5px solid .. !important }`
  // NOTE (parity): the global `button { margin: 0 !important }` beats `.listing button { margin-bottom: 16px }`: the cards touch.
  item: {
    marginBottom: 0,
    borderRadius: 6,
    backgroundColor: colors.white,
    boxShadow: giftListMd.itemShadow,
    paddingLeft: 0,
    paddingRight: 16,
    borderLeftWidth: 5,
  },
  // [CSS] `.listing button .item-inner { padding-right: 0 !important; border-bottom: 0 !important }`
  itemInner: { paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 },
  // the auto-created <ion-label>: `.listing button .item-inner .input-wrapper ion-label { margin: 0; display: flex; justify-content: space-between;
  // align-items: center }` (explicit sides: the kit label margins beat a shorthand)
  label: { flex: 1, overflow: 'hidden', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 },
  // [CSS] `.listing button .head-detail { display: flex; align-items: center; width: calc(100% - 50px) }` (the .product-img is 50 wide, no gap)
  headDetail: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  // [CSS] `.head { padding: 12px 20px; text-align: center; position: relative; min-width: 80px }`
  head: { paddingVertical: 12, paddingHorizontal: 20, minWidth: 80, flexShrink: 1 },
  headText: { textAlign: 'center' },
  // h1 is one word that never wraps; in CSS a line too long for its box is start-aligned and overflows right (CSS Text 3 §6.1).
  // The wrapper may grow past the box (negative right margin = room to measure), is at least the box wide, and centres the number:
  // it fits -> centred in the box; too long -> starts at the box's left edge and overflows right.
  headNumWrap: { alignSelf: 'flex-start', minWidth: '100%', marginRight: -200, alignItems: 'center' },
  // [CSS] `.head:after { position: absolute; top: 50%; transform: translateY(-50%); right: 0; height: 50px; border: 1px solid #dedede }`
  headAfter: { position: 'absolute', top: '50%', marginTop: -25, right: 0, width: 2, height: 50, borderWidth: 1, borderColor: colors.border },
  // [CSS] `.detail { margin-left: 16px; width: 100%; overflow: hidden }`
  detail: { marginLeft: 16, width: '100%', flexShrink: 1, minWidth: 0, overflow: 'hidden' },
  // [CSS] `.detail h1 { margin-top: 0 !important; margin-bottom: 2px !important; text-align: left; nowrap; ellipsis }`
  detailH1: { marginTop: 0, marginBottom: 2, textAlign: 'left' },
  // [CSS] `.detail p { margin-bottom: 0 !important; text-align: left; text-overflow: ellipsis; white-space: nowrap }` (shipped main.css; the phone shows the "...")
  detailP: { marginBottom: 0, textAlign: 'left' },
  // [CSS] `.product-img { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center }`
  giftImg: { width: 50 },
  productImg: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
});
