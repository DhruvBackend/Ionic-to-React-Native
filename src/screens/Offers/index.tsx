// Ported from: src/pages/offers/offers.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonItem } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import { activeNavNames } from '../../navigation/navigationRef';
import { collapseWs, datePipe, interp, titlecase } from '../../ui/angularPipes';
import { useIonViewWillEnter } from '../../navigation/useIonViewWillEnter';
import { colors } from '../../theme';
import { md } from '../../theme/ionicMd';
import { offersMd } from '../../theme/ionicMdOffers';
import { imageViewerMd } from '../../theme/ionicMdScroll';
import { useLoader } from '../../ui/useLoader';
import { styles, stripeColor } from './styles';





// app.getActiveNav() page names that offers.ts:121 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];


interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'blur' | 'focus', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: { id?: any; lang?: any } };
}

// NOTE (parity): `#redeem-points{padding-left:0;padding-right:70px;font-size:12px}` (variables.scss:3054-3058) + `.head p`
// (display block, nowrap): the <p>'s max-content width is 70px + the text width (it sizes the flex-shrinking `.head`), but once
// `.head` shrinks the content box is ~0 wide and the text overflows it, visibly. RN would measure a Text in that box at 0 width
// and draw nothing, so the text is absolutely positioned with a fixed wide box and the wrapper takes 70 + the measured width.
function RedeemLine({ testID, text }: { testID: string; text: string }) {
  const [textWidth, setTextWidth] = useState(Math.ceil(text.length * 12 * 0.55));
  return (
    <View testID={`${testID}-box`} style={[styles.redeem, { width: 70 + textWidth }]}>
      <Text
        testID={testID}
        style={[textStyle(12, 400, colors.textMuted), styles.redeemText]}
        numberOfLines={1}
        ellipsizeMode="clip"
        onTextLayout={e => {
          const w = e.nativeEvent.lines[0]?.width;
          if (w) setTextWidth(Math.ceil(w));
        }}
      >
        {text}
      </Text>
    </View>
  );
}

export default function OffersScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  // offers.ts:12-21 fields. `balance_point` and `offer_balance` are computed in the callback but never shown (the template that used
  // offer_balance is commented out), so they are not kept as state.
  const offerId = useRef<any>(''); // :12 offer_id
  const url = db.upload_url3; // :27 this.url = dbService.upload_url3
  const [offerDetail, setOfferDetail] = useState<any>({}); // :13 offer_detail:any={}
  const [giftList, setGiftList] = useState<any>(''); // :14 gift_list:any=''
  const [totalBalance, setTotalBalance] = useState<any>(0); // :18 total_balance:number=0
  const [notdata, setNotdata] = useState(false); // :20 notdata:boolean=false
  const [viewW, setViewW] = useState(0); // img-box width (border box)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [bannerFailed, setBannerFailed] = useState(false);
  const alive = useRef(true);

  // :36-40 ionViewDidEnter (runs on the first entry AND every time the page becomes the active one again, e.g. back from Terms/GiftDetail)
  function enter() {
    offerId.current = route?.params?.id; // :37 this.navParams.get('id')
    getofferDetail(offerId.current); // :38
    presentLoading(); // :39
  }

  useEffect(() => {
    alive.current = true;
    // Without a navigation object that has listeners (unit tests) there is no focus event: enter once on mount.
    if (!navigation.addListener) {
      enter();
    }
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ionViewDidEnter: the first entry and every return to this page (not after an Ionic modal above it is dismissed).
  useIonViewWillEnter(enter, { navigation: navigation.addListener ? (navigation as any) : undefined });

  // :111-132 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen and on a tab switch, like Ionic's didLeave.
  // NOTE (parity): when the nav that is active after leaving shows one of the root pages (and its previous page is not one of them),
  // this.navCtrl.popToRoot() resets this page's own stack (e.g. back to Home after a tab switch). At a stack root it does nothing.
  useEffect(() => {
    if (!navigation.addListener) {
      return undefined;
    }
    return navigation.addListener('blur', () => {
      const names = activeNavNames();
      if (names && ROOT_PAGES.includes(names.active) && !ROOT_PAGES.includes(names.previous)) {
        const stack = navigation.getState?.();
        if (stack && stack.routes.length > 1) {
          try {
            navigation.popToTop?.();
          } catch {
            // nothing to pop
          }
        }
      }
    });
  }, [navigation]);

  // :42-47 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response. No loader is shown on a refresh.
  function doRefresh(refresher: { complete: () => void }) {
    getofferDetail(offerId.current);
    refresher.complete();
  }

  // :49-51 goOntermsPage(id, term), :52-54 godiscriptionsPage(id, discriptions)
  // NOTE (parity): the only links that call these sit inside the `gift_list.length && notdata` block, which can never show (see below).
  function goOntermsPage(id: any, term: any) {
    navigation.push('Terms', { id, term });
  }
  function godiscriptionsPage(id: any, discriptions: any) {
    navigation.push('Terms', { id, term: discriptions });
  }

  // :56-59 goOnGiftDetail(id)
  function goOnGiftDetail(id: any) {
    navigation.push('GiftDetail', { id });
  }

  // NOTE (parity): goOnGiftDetail1() (:61-64, push(GiftDetailPage) with no params) is called from nowhere (its template button is commented
  // out): dead code, not ported.

  // :66-70 toInt(i) (the console.log is dropped)
  function toInt(i: any) {
    return parseInt(i);
  }

  // :72-100 getofferDetail(offer_id)
  function getofferDetail(offer_id: any) {
    db.onPostRequestDataFromApi({ offer_id, karigar_id: db.userStorageData?.id }, 'app_karigar/offerDetail', db.rootUrl).then(
      (r: any) => {
        // NOTE (parity): the callback has no guards: each line below throws on a missing/null field and aborts the rest, exactly where it
        // throws here (the try/catch stands for the uncaught error of Ionic's subscribe callback). What was assigned before stays shown.
        // `offer: null` (or no key, e.g. status NOT FOUND) throws at the first line: nothing changes and the loader stays up.
        // `gift: []` assigns offer_detail, then throws at `gift[0].offer_balance`: header title + banner show, no gift list, loader stays up.
        // A missing `karigar` throws at `karigar.total_balance`: the offer shows, the gifts do not, loader stays up.
        try {
          void r.offer.length; // :75 console.log(r.offer.length)
          if (alive.current) {
            setOfferDetail(r.offer); // :79
          }
          void parseInt(r.gift[0].offer_balance); // :81 this.offer_balance
          const total = r.karigar.total_balance; // :82
          if (alive.current) {
            setTotalBalance(total);
          }
          if (r.gift.length) {
            // :84
            if (alive.current) {
              setGiftList(r.gift);
            }
          } else if (r.gift.length == 0) { // eslint-disable-line eqeqeq
            // NOTE (parity): unreachable: an empty `gift` already threw at :81. So `notdata` never becomes true.
            if (alive.current) {
              setNotdata(true);
            }
          }
          void parseInt(r.karigar.balance_point + parseInt(r.karigar.reg_points)); // :89 this.balance_point (never shown)
          loader.hide(); // :93 this.loading.dismiss()
          for (let i = 0; i < r.gift.length; i++) {
            r.gift[i].coupon_points = parseInt(r.gift[i].coupon_points); // :96-99 (mutates the response items)
          }
        } catch {
          // uncaught error in Ionic's callback
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up.
      () => {},
    );
  }

  // :101-108 presentLoading(): content 'Please wait...', dismissOnPageChange: false
  // NOTE (parity): in Ionic every ionViewDidEnter creates a NEW loader and drops the reference to the previous one, so a loader left up by
  // a failed response is orphaned and stays on screen for good; here useLoader.show() closes the previous loader first.
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: false });
  }

  // html:57 `<img src="{{url+offer_detail.offer_banner}}">` (string concatenation: 'undefined' is appended while offer_detail is {})
  const bannerUri = url + offerDetail.offer_banner;
  useEffect(() => {
    let live = true;
    setNatural(null);
    setBannerFailed(false);
    Image.getSize?.(
      bannerUri,
      (w, h) => live && setNatural({ w, h }),
      () => live && setBannerFailed(true),
    );
    return () => {
      live = false;
    };
  }, [bannerUri]);
  // `img { max-width: 100% }` of an auto-sized <img> inside `.img-box` (border-box width minus the 6px borders): never enlarged.
  const innerW = Math.max(viewW - 12, 0);
  const imgW = natural ? Math.min(natural.w, innerW) : bannerFailed ? imageViewerMd.brokenImageSize : 0;
  const imgH = natural ? (natural.h * imgW) / natural.w : bannerFailed ? imageViewerMd.brokenImageSize : 0;

  const ink = colors.text;
  const muted = colors.textMuted;
  const title = interp(titlecase(offerDetail.title)); // `offer_detail.title | titlecase`

  return (
    <View style={styles.screen}>
      {/* html:1-5 */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(title)} />
      </IonHeader>

      <IonContent>
        {/* html:9-12 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:14-41 is commented out. html:56-70 */}
        <View style={styles.container}>
          <View testID="offer-banner-box" style={styles.imgBox} onLayout={e => setViewW(e.nativeEvent.layout.width)}>
            <Image testID="offer-banner" source={{ uri: bannerUri }} resizeMode="cover" style={{ width: imgW, height: imgH, borderRadius: 10 }} />
          </View>
          {/* html:61 `*ngIf="gift_list.length && notdata"`. NOTE (parity): never true: `notdata` is only set when `gift` is empty, and then
              gift_list stays '' (and the callback threw before). The block (title, valid-upto, Description / Terms links) never shows. */}
          {giftList.length && notdata ? (
            <View testID="offer-content-box" style={styles.contentBox}>
              <Text style={[textStyle(16, 500, md.textColor, 20), { textTransform: 'capitalize' }]}>{collapseWs(title)}</Text>
              <Text style={textStyle(14, 400, md.textColor)}> </Text>
              <Text style={textStyle(13, 400, md.textColor, 20)}>
                {`${collapseWs(t('Valid Upto'))}:${datePipe(offerDetail.end_date, 'd MMMM y')}`}
              </Text>
              <View style={styles.style}>
                <Text
                  testID="offer-description-link"
                  onPress={() => godiscriptionsPage(offerDetail.id, 'discriptions')}
                  numberOfLines={1}
                  style={[textStyle(12, 400, md.linkColor), { textAlign: 'right' }]}
                >
                  {collapseWs(t('Description'))}
                </Text>
                <Text
                  testID="offer-terms-link"
                  onPress={() => goOntermsPage(offerDetail.id, 'term_and_conditions')}
                  numberOfLines={1}
                  style={[textStyle(12, 400, md.linkColor), { textAlign: 'right' }]}
                >
                  {collapseWs(t('Terms & Condition'))}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* html:73-96 `*ngIf="gift_list.length !=''"` (0 != '' is false) */}
        {giftList.length ? (
          <View testID="offer-gifts" style={styles.listings}>
            {giftList.map((list: any, i: number) => (
              <IonItem
                key={i}
                testID={`gift-item-${i}`}
                button
                noLines
                style={[styles.item, { borderLeftColor: stripeColor(i + 1) }]}
                innerStyle={styles.itemInner}
                onPress={() => goOnGiftDetail(list.id)}
              >
                <View style={styles.label}>
                  <View style={styles.headDetail}>
                    <View style={styles.head}>
                      {/* html:77 <span>{{list.type}}</span> in the .head's anonymous line box. NOTE (parity): the strut is the
                          auto-created ion-label's font = `.item-md{font-size:1.6rem}` = 16px (the `[text-wrap] .label-md` 14px/1.5 rule does
                          not apply here), line-height normal -> a 19px line box with the baseline 15px down; the 12px span (ascent 11) sits
                          4px below the line top. */}
                      {list.type == null || list.type === '' ? null : (
                        <View testID={`gift-type-line-${i}`} style={styles.headSpanLine}>
                          <Text testID={`gift-type-${i}`} style={[textStyle(12, 400, muted), styles.headSpan]}>
                            {collapseWs(interp(list.type))}
                          </Text>
                        </View>
                      )}
                      <Text testID={`gift-points-${i}`} style={[textStyle(20, 600, ink, 24), styles.headH1]}>
                        {interp(list.coupon_points)}
                      </Text>
                      <RedeemLine testID={`gift-redeem-${i}`} text={collapseWs(t('Redeem Points'))} />
                      {toInt(list.coupon_points) <= totalBalance ? (
                        <View testID={`gift-verified-${i}`} style={styles.verified}>
                          <MaterialIcon name="verified_user" size={18} color={offersMd.verified} />
                        </View>
                      ) : null}
                      <View pointerEvents="none" style={styles.divider} />
                    </View>
                    <View style={styles.detail}>
                      {/* `.detail h1`: 16px, weight 400 (.item-md h1), ellipsis, nowrap */}
                      <Text testID={`gift-title-${i}`} numberOfLines={1} ellipsizeMode="tail" style={[textStyle(16, 400, ink, 19.2), { textAlign: 'left' }]}>
                        {collapseWs(interp(titlecase(list.gift_title)))}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.productImg}>
                    {list.image ? (
                      <Image testID={`gift-image-${i}`} source={{ uri: url + list.image }} resizeMode="stretch" style={styles.productImgImg} />
                    ) : null}
                  </View>
                </View>
              </IonItem>
            ))}
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
