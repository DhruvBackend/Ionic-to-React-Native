// Ported from: src/pages/nearest-dealer/nearest-dealer.scss (empty: `page-nearest-dealer { }`) + the global rules that reach nearest-dealer.html
// Citations: [CSS] the shipped main.css (`.prlist`, `.list-box`, `.nothing-here`, `.cs-type`, `.loacte`, `.search.add-search`), global
// `button,h1..h6,input,p,span { margin: 0 !important }`, `a { color: primary }` (UA underline).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { nearestDealerMd as N } from '../../theme/ionicMdNearestDealer';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [CSS] `.search.add-search { margin: 0; max-height: 68px; padding: 0 }`, `.search.add-search .filter { display: flex; align-items: center; justify-content: space-between; width: 100% }`
  addSearch: { margin: 0, maxHeight: 68, padding: 0 },
  filter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },

  // [CSS] `.nothing-here { height: 80% }` (of the scroll-content: set in index.tsx) with `.outer { display: table; height: 100% }` and
  // `.innear { display: table-cell; vertical-align: middle; text-align: center }`
  nothingHere: { justifyContent: 'center' },
  // [CSS] `.nothing-here p { color: #000; font-size: 14px; letter-spacing: 1px }` (stretch + textAlign: a centred shrink-wrapped Text clips on Android)
  nothingText: { alignSelf: 'stretch', textAlign: 'center', letterSpacing: 1 },
  // `<a href="tel:..."><p>Customer Care</p></a>`: UA underline, the `p` colour wins over the `a` colour
  nothingLink: { alignSelf: 'stretch', textAlign: 'center', letterSpacing: 1, textDecorationLine: 'underline' },

  // ---- type == 'Dealer': `.prlist .box` ----
  // [CSS] `.prlist .box { padding: 10px 16px; margin-bottom: 16px !important; box-shadow: ... !important; background: #fff }`, `.relative`
  box: { paddingVertical: 10, paddingHorizontal: 16, marginBottom: 16, backgroundColor: colors.white, boxShadow: N.boxShadow },
  // [CSS] `.prlist .box .heading { border-bottom: 1px solid #dcdcdc; padding-bottom: 5px; display: flex }`
  heading: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: N.headingBorder, paddingBottom: 5 },
  // [CSS] `.prlist .box .heading .dist-name { width: 100% }` + `.dflex`
  distName: { flexDirection: 'row', width: '100%' },
  // [CSS] `.first-leter { color: #fff; text-transform: uppercase; margin-left: -16px; height: 38px; width: 38px; line-height: 38px; text-align: center;
  // font-size: 14px; border-radius: 0 50px 50px 0; margin-right: 10px; font-weight: 700 !important }`; the background is set per box (nth-child)
  firstLetter: {
    marginLeft: -16,
    marginRight: 10,
    width: 38,
    height: 38,
    textAlign: 'center',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    borderBottomLeftRadius: 0,
    overflow: 'hidden',
  },
  // `.name-number` has no rule: a flex item that shrinks (its `p` is `width: 100%`)
  nameNumber: { flexShrink: 1 },
  // [CSS] `.prlist .box .heading p { font-size: 14px; width: 100% }`
  name: {},
  // [CSS] `.prlist .box .text-with-ic { position: relative }`, `.dflex`, `.mb0`
  textWithIc: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  // [CSS] `.prlist .box .text-with-ic .text-relat-icon { margin-top: 6px; font-size: 18px; margin-right: 10px }`
  textRelatIcon: { marginTop: 6, marginRight: 10 },
  // `<a class="f14" style="line-height: 32px">`: `.f14 { font-size: 14px !important }`, `a { color: primary }`, UA underline
  mobileLink: { textDecorationLine: 'underline' },
  // [CSS] `.loacte { position: absolute; right: 16px; top: 20px }` (inside `.box { position: relative }`)
  loacte: { position: 'absolute', right: 16, top: 20 },
  // `<button>` with the UA padding `1px 6px` (main.css only sets `border: 0`); `.loacte button { background: transparent }`
  loacteButton: { paddingVertical: 1, paddingHorizontal: 6 },
  // the ~4px descender gap of an inline <img> inside the button
  strut: { height: 4 },
  // [CSS] `.cs-type { display: flex; align-items: center; justify-content: flex-start; font-size: 12px; margin-top: 10px !important }`
  csType: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 10 },
  // [CSS] `.cs-type i { font-size: 16px; margin-right: 5px }`
  csTypeIcon: { marginRight: 5 },
  csTypeText: { flexShrink: 1 },

  // ---- type == 'Plumber': `.pd-left-right16.mt16` > `.list-box` ----
  // [CSS] `.pd-left-right16 { padding: 0 16px }`, `.mt16 { margin-top: 16px !important }`
  plumberList: { paddingHorizontal: 16, marginTop: 16 },
  // [CSS] `.list-box { padding: 8px 10px; border-radius: 10px; margin-bottom: 16px; background: #fff; box-shadow: ... !important; position: relative }`
  listBox: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, marginBottom: 16, backgroundColor: colors.white, boxShadow: N.listBoxShadow },
  // [CSS] `.list-box .mid { display: flex; align-items: center; justify-content: space-between; margin-top: 10px }`, beaten by `.mt0 { margin-top: 0 !important }`
  mid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 0 },
  // [CSS] `.list-box .mid .content-info { display: flex; align-items: center; width: 100% }`
  contentInfo: { flexDirection: 'row', alignItems: 'center', width: '100%', flexShrink: 1 },
  // [CSS] `.list-box .mid .content-info .left-info { margin-right: 10px }`
  leftInfo: { marginRight: 10 },
  // [CSS] `.circle { width: 30px; height: 30px; border-radius: 30px; background: #fff; box-shadow: ...; justify-content: center; align-items: center; display: flex }`
  circle: { width: 30, height: 30, borderRadius: 30, backgroundColor: colors.white, boxShadow: N.circleShadow, justifyContent: 'center', alignItems: 'center' },
  // `.right-info`: no rule of its own (a block of two `p`)
  rightInfo: {},
  // [CSS] `.list-box .mid .tag-info { display: flex; align-items: center; justify-content: center }`
  tagInfo: { alignItems: 'center', justifyContent: 'center' },
  // [CSS] `.lower { width: 100%; margin-top: 10px }`
  lower: { width: '100%', marginTop: 10 },
  // [CSS] `.lower p:nth-child(1) { opacity: .6; font-size: 11px }`
  lowerLabel: { opacity: 0.6 },
});
