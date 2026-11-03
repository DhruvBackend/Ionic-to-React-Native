// Ported from: src/pages/gift-gallery/gift-detail/gift-detail.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { textStyle } from '../../components/ionic/text';
import { activeNavNames } from '../../navigation/navigationRef';
import { useIonViewWillEnter } from '../../navigation/useIonViewWillEnter';
import { collapseWs, datePipe, interp, titlecase } from '../../ui/angularPipes';
import { showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { colors } from '../../theme';
import { md } from '../../theme/ionicMd';
import { giftDetailMd } from '../../theme/ionicMdGiftDetail';
import { imageViewerMd } from '../../theme/ionicMdScroll';
import { styles } from './styles';
import { surpriseSize, surpriseXml } from './surprise';

// app.getActiveNav() page names that gift-detail.ts:152 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'blur' | 'focus', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: { id?: any } };
}

// The component fields of gift-detail.ts:17-35 that the template reads (`rating_star`, `star`, `offer_balance`, `balance_point`, `msg_Alert`,
// `otp`, `tokenInfo` are assigned or declared but never shown, so they are not kept).
interface Model {
  gift: any; // :18 gift_detail:any={}
  kd: any; // :27 karigar_detail:any={}
  total: any; // :31 total_balance:number=0
  flag: any; // :33 flag
}

// What the root view's text bindings show (the `{{ }}` interpolations of gift-detail.html).
interface Bindings {
  balance: string;
  title: string;
  points: string;
  banner: string;
  offerTitle: string;
  endDate: string;
  spec: string;
}

export default function GiftDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const [, setTick] = useState(0);
  const rerender = () => setTick(n => n + 1);
  const alive = useRef(true);
  const url = db.upload_url3; // :37 this.url = dbService.upload_url3
  const giftId = useRef<any>(''); // :16 gift_id:any=''
  const model = useRef<Model>({ gift: {}, kd: {}, total: 0, flag: undefined });
  // Angular keeps the views of the template's *ngIf blocks and the text of its last successful update between change detections.
  const views = useRef({ img: false, cond: false, btn: false });
  const lastGood = useRef<Bindings | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [boxW, setBoxW] = useState(0);

  // :45-50 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    // NOTE (parity): gift-detail.module.ts has its own TranslateModule.forRoot, but app.module.ts:205 imports GiftDetailPageModule eagerly, so
    // its providers merge into the root injector and the page uses the ONE app-wide TranslateService. The page never calls use()/setDefaultLang()
    // (no ionViewDidLoad language code), so it shows whatever language the app already has (global in RN too).
    // NOTE (parity): get_user_lang() (:62-77, endpoint app_karigar/get_user_lang, storage key 'token', jwt_decode) is dead code: nothing calls it,
    // so it is not ported (a test asserts the endpoint is never called). `lang` (:22) therefore stays '' and is what updateAddress() passes on.
    giftId.current = route?.params?.id; // :47 this.navParams.get('id')
    // NOTE (parity): a push with no params (push notification of type 'gift': home.ts:803/1011) gives gift_id undefined; JSON drops the key.
    getGiftDetail(giftId.current); // :48
    presentLoading(); // :49
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NOTE (parity): Angular change detection reads karigar_detail on every cycle, and Registration (pushed by updateAddress with that very
  // object as `data`) edits it in place; so on every return to this page it is drawn again (the object has the edited address by then).
  useIonViewWillEnter(rerender, { navigation: navigation.addListener ? (navigation as any) : undefined });

  // :147-173 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen and on a tab switch, like Ionic's didLeave.
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

  // :52-56 presentCancelPolicyModal(): modalCtrl.create(CancelpolicyModalPage, {karigar_id, gift_id}).present()
  // NOTE (parity): no onDidDismiss callback in Ionic: nothing happens in this page when the modal closes (and a modal does not re-enter the page).
  function presentCancelPolicyModal() {
    navigation.push('CancelpolicyModal', { karigar_id: db.userStorageData?.id, gift_id: giftId.current });
  }

  // NOTE (parity): goOnOfferDetailPage(offer_id) (:57-60, push(OffersPage, {id})) is only referenced by a commented-out template line
  // (`(click)="goOnOfferDetailPage(gift_detail.offer_id)"`): dead code, not ported.

  // :89-124 getGiftDetail(gift_id)
  function getGiftDetail(gift_id: any) {
    db.onPostRequestDataFromApi({ gift_id, karigar_id: db.userStorageData?.id }, 'app_karigar/giftDetail', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :95 this.loading.dismiss(), before anything is read
        const m = model.current;
        // NOTE (parity): the callback has no guards: each line below throws on a missing/null field and aborts the rest (the try/catch stands
        // for the uncaught error of Ionic's subscribe callback); what was assigned before stays. Angular runs change detection after the
        // callback in any case, which is the rerender() in `finally`.
        try {
          m.gift = r.gift; // :96
          m.kd = r.karigar; // :97
          m.total = r.karigar.total_balance; // :98
          void parseInt(r.gift.rating); // :99 this.rating_star (never shown)
          m.flag = r.flag; // :101
          void r.msg; // :102 this.msg_Alert (never shown)
          void parseInt(r.gift.offer_balance); // :105 this.offer_balance (never shown)
          // :106 this.balance_point (never shown)
          void (parseInt(r.karigar.balance_point) + parseInt(r.karigar.service_wallet_balance_points) + parseInt(r.karigar.referal_point_balance));
          if (m.flag == '1') { // eslint-disable-line eqeqeq
            // :107-114. translate.get(undefined/'') throws "Parameter "key" required" in ngx-translate, so no alert then.
            const msg = r.msg;
            // NOTE (parity): ngx-translate get(key) throws unless key is a non-empty string (get(5): `!key.length`), so no alert then.
            if (typeof msg !== "string" || !msg.length) {
              throw new Error('Parameter "key" required');
            }
            showAlertDialog(t(msg));
            return; // :114
          }
          m.gift.coupon_points = parseInt(m.gift.coupon_points); // :118 (mutates the response object)
          if (r.gift_star) {
            void parseInt(r.gift_star.star); // :120 this.star (never shown)
          }
        } catch {
          // uncaught error in Ionic's callback
        } finally {
          if (alive.current) {
            rerender();
          }
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (the page keeps its empty template).
      () => {},
    );
  }

  // :126-131 presentLoading(): content 'Please wait...', dismissOnPageChange: false
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: false });
  }

  // NOTE (parity): rating(star) (:135-146, endpoint app_karigar/giftRating) is only called by the commented-out 'Rate a Gift' block of the
  // template: dead code, not ported (a test asserts the endpoint is never called). Same for the commented-out rating stars (:34-41).

  // :174-187 showAlert(text): translate.get('Alert') then alertCtrl.create({title: resp + '!', subTitle: text, buttons: ['OK']})
  function showAlertDialog(text: string) {
    showAlert({ title: t('Alert') + '!', subTitle: text, buttons: ['OK'] });
  }

  // :189-192 updateAddress()
  function updateAddress() {
    model.current.kd.edit_profile = 'edit_profile'; // :191 (mutates karigar_detail)
    // NOTE (parity): `lang` is '' here: this.lang is only assigned by the dead get_user_lang(). Registration reads `data` (the karigar_detail
    // object itself, edited in place) and `mode: 'edit_page'`.
    navigation.push('Registration', { data: model.current.kd, mode: 'edit_page', lang: '' });
  }

  // ---- the template's change detection (Angular 5 view engine order: *ngIf inputs of the root view, then the embedded views, then the root
  // view's text bindings; an exception aborts everything after it, so the DOM keeps what the earlier steps wrote) ----
  const m = model.current;
  const v = views.current;
  // `influencer_point` (html:58) is not a field of the component: reading `.state` of it throws once the left operands are all false.
  const influencerPoint: any = undefined;
  const missing = (k: any) => k.address == '' || k.city == '' || k.district == '' || k.state == '' || k.pincode == ''; // eslint-disable-line eqeqeq
  let kyc = false; // [ngClass]="{'kyc-reject': ...}"
  let disabled = false; // [disabled]
  let condChecked = false;
  let btnChecked = false;
  let aborted = false;
  try {
    // html:20 *ngIf on the .phone-img <img>
    v.img = !!m.gift.image;
    // html:55-56 *ngIf="gift_detail.type == 'Gift' && (karigar_detail.address=='' || ...)"
    v.cond = m.gift.type == 'Gift' && missing(m.kd); // eslint-disable-line eqeqeq
    // html:68 *ngIf="total_balance >= gift_detail.coupon_points"
    v.btn = m.total >= m.gift.coupon_points;
  } catch {
    aborted = true;
  }
  if (!aborted) {
    try {
      if (v.cond) {
        // html:57-58 the .error-bg view: [ngClass] first
        kyc = m.kd.address == '' || m.kd.city == '' || m.kd.district == '' || influencerPoint.state == '' || m.kd.pincode == ''; // eslint-disable-line eqeqeq
        condChecked = true;
      }
      if (v.btn) {
        // html:67 [disabled]="flag == 1 || (...) && gift_detail.type == 'Gift'"
        disabled = m.flag == 1 || (missing(m.kd) && m.gift.type == 'Gift'); // eslint-disable-line eqeqeq
        btnChecked = true;
      }
    } catch {
      aborted = true;
    }
  }
  if (!aborted) {
    lastGood.current = {
      balance: interp(m.total || 0), // html:11 {{total_balance || 0}}
      title: interp(titlecase(m.gift.gift_title)), // html:16 {{ gift_detail.gift_title | titlecase}}
      points: interp(m.gift.coupon_points), // html:17 {{gift_detail.coupon_points}}
      banner: url + m.gift.offer_banner, // html:28 src="{{url+gift_detail.offer_banner}}"
      offerTitle: interp(titlecase(m.gift.title)), // html:31 {{ gift_detail.title | titlecase}}
      endDate: datePipe(m.gift.end_date, 'd MMMM y'), // html:32 {{gift_detail.end_date | date:.d MMMM y.}}
      spec: interp(m.gift.gift_specification), // html:51
    };
  }
  // The first change detection (initial `gift_detail = {}`) never throws, so there is always a last good update.
  const b: Bindings = lastGood.current ?? {
    balance: '0',
    title: '',
    points: '',
    banner: url + 'undefined',
    offerTitle: '',
    endDate: '',
    spec: '',
  };

  // html:20 <img src="{{url+gift_detail.image}}"> in .phone-img: `height: 100%` (the 228 inner height), auto width, `max-width: 100%`.
  const imageUri = v.img ? url + m.gift.image : '';
  useEffect(() => {
    if (!imageUri) {
      return undefined;
    }
    let live = true;
    setNatural(null);
    setImgFailed(false);
    Image.getSize?.(
      imageUri,
      (w, h) => live && setNatural({ w, h }),
      () => live && setImgFailed(true),
    );
    return () => {
      live = false;
    };
  }, [imageUri]);
  const innerH = 228; // .phone-img: 230 high, border-box, 1px borders
  const innerW = Math.max(boxW - 2, 0);
  // NOTE (parity): `img { max-width: 100% }` squeezes a very wide picture horizontally (its height stays 100%); a failed picture is Chrome's
  // 16px broken-image box (unverified, as in Offers).
  const imgW = natural ? Math.min((natural.w * innerH) / natural.h, innerW) : imgFailed ? imageViewerMd.brokenImageSize : 0;

  // NOTE (parity): Angular throws InvalidPipeArgument for a non-string title (titlecase) or an unparseable end_date (date pipe) and aborts that
  // change detection; the shared pipes convert / print empty instead, so those odd server values are not modelled.
  const ink = colors.text;
  const muted = colors.textMuted;

  return (
    <View style={styles.screen}>
      {/* html:1-5 */}
      <IonHeader mainHeader remove>
                <IonNavbar color="primary" title={collapseWs(t('Gift Gallery'))} />
      </IonHeader>

      <IonContent>
        {/* html:8-12 */}
        <View testID="gift-top-nav" style={styles.topNav}>
          <Text style={[textStyle(14, 400, md.textColor), styles.topNavP]}>{collapseWs(t('Balance Points'))}</Text>
          <Text testID="gift-balance" style={[textStyle(24, 600, md.textColor, 28.8), styles.topNavH1]}>
            {b.balance}
          </Text>
          <View pointerEvents="none" style={styles.surprise}>
            <SvgXml xml={surpriseXml} width={91} height={97} viewBox={`0 0 ${surpriseSize.width} ${surpriseSize.height}`} preserveAspectRatio="xMidYMid slice" />
          </View>
        </View>

        {/* html:13 */}
        <View style={styles.marginPadding}>
          {/* html:14-24 */}
          <View>
            <View style={styles.phoneHead}>
              <Text testID="gift-title" style={[textStyle(16, 500, ink, 19.2), styles.phoneHeadItem]}>
                {collapseWs(b.title)}
              </Text>
              {/* html:17 {{gift_detail.coupon_points}} {{ 'Points' | translate }}: the leading space of the block collapses away */}
              <Text testID="gift-points" style={[textStyle(16, 400, giftDetailMd.pointsColor, normalLineHeight(16)), styles.phoneHeadItem]}>
                {collapseWs(`${b.points} ${t('Points')}`).replace(/^ /, '')}
              </Text>
            </View>
            <View testID="gift-phone-img" style={styles.phoneImg} onLayout={e => setBoxW(e.nativeEvent.layout.width)}>
              {v.img ? <Image testID="gift-image" source={{ uri: imageUri }} resizeMode="stretch" style={{ width: imgW, height: imageUri ? innerH : 0 }} /> : null}
            </View>
          </View>

          {/* html:25-40 */}
          <View style={styles.detailList}>
            <View style={styles.detail}>
              <View style={styles.imgSection}>
                {/* html:28 src="{{url+gift_detail.offer_banner}}" (string concatenation: 'undefined' is appended while gift_detail is {}) */}
                <Image testID="gift-offer-banner" source={{ uri: b.banner }} resizeMode="stretch" style={styles.imgSectionImg} />
              </View>
              <View style={styles.info}>
                <Text testID="gift-offer-title" style={[textStyle(16, 500, ink, 19.2), styles.infoH1]}>
                  {collapseWs(b.offerTitle)}
                </Text>
                {/* html:32 <span>{{ 'Valid Upto' | translate }} :</span> {{gift_detail.end_date | date:'d MMMM y'}} */}
                <Text testID="gift-valid" style={[textStyle(11, 400, muted, normalLineHeight(12)), styles.infoP]}>
                  <Text style={textStyle(12, 600, muted, normalLineHeight(12))}>{`${collapseWs(t('Valid Upto'))} :`}</Text>
                  {` ${b.endDate}`}
                </Text>
              </View>
            </View>
          </View>

          {/* html:48-53 NOTE (parity): the hin_gift_specification variant of the specification is commented out; always the English text. */}
          <View style={styles.loremText}>
            <Text testID="gift-spec" style={textStyle(14, 700, md.textColor, 24)}>
              {collapseWs(`${collapseWs(t('Specification'))} : ${b.spec}`)}
            </Text>
          </View>

          {/* html:55-65 */}
          {v.cond ? (
            <View testID="gift-address-box" style={[styles.errorBg, condChecked && kyc ? styles.kycReject : null]}>
              {/* NOTE (parity): when the [ngClass] expression throws (address, city and district are all filled but state or pincode is empty:
                  `influencer_point` is undefined) the error-bg element exists without the 'kyc-reject' class and with no text and no link yet. */}
              {condChecked ? (
                <Text testID="gift-address-text" style={textStyle(12, 400, md.textColor, 20)}>
                  {collapseWs(t('Your Address Is Not Updated. Please Update Address'))}
                  {/* `.kyc-reject-text { margin-left: 5px }`: a 5px gap, drawn as a space of a 20px font (Roboto space = 0.2476 em) */}
                  <Text style={{ fontSize: 20.2 }}> </Text>
                  <Text testID="gift-update-now" onPress={updateAddress} style={styles.kycRejectText}>
                    {collapseWs(t('Update Now'))}
                  </Text>
                </Text>
              ) : (
                // NOTE (parity): the aborted view still holds its static nodes, among them the empty inline-block <a class="kyc-reject-text">:
                // one 20px line box inside the padding and border.
                <View testID="gift-address-empty-line" style={styles.emptyLine} />
              )}
            </View>
          ) : null}

          {/* html:67-68 NOTE (parity): `btn-radius` is a class with no CSS rule; `mb0` is a no-op next to `.cs-btn { margin: 0 !important }`.
              `page-gift-detail button { text-transform: capitalize !important }` (gift-detail.scss:2-4). */}
          {v.btn ? (
            <IonButton testID="gift-redeem" csBtn textTransform="capitalize" disabled={btnChecked ? disabled : false} onPress={presentCancelPolicyModal}>
              {btnChecked ? collapseWs(t('Send Redeem Request')) : ''}
            </IonButton>
          ) : null}
          {/* html:69 */}
          <View style={styles.h32} />
        </View>
      </IonContent>
    </View>
  );
}
