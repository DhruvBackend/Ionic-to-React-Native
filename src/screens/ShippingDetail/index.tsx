// Ported from: src/pages/shipping-detail/shipping-detail.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { activeNavNames, resetTo } from '../../navigation/navigationRef';
import { md } from '../../theme/ionicMd';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { shippingDetailMd as S } from '../../theme/ionicMdShippingDetail';
import { collapseWs, interp } from '../../ui/angularPipes';
import { showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

// app.getActiveNav() page names that shipping-detail.ts:135 looks for, without the 'Page' suffix.
// NOTE (parity): like Transaction, 'MainHomePage' is NOT in this list (shipping-detail.ts:135).
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile'];

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'blur' | 'focus', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: { id?: any; offer_gift_id?: any } };
}

// The template's text bindings. Angular keeps the DOM of the last change detection that got through, so these live in a ref.
interface Shown {
  title: string; // html:11 {{gift_detail.title}}
  image: string; // html:14 [src]="gift_detail.image"
  giftTitle: string; // html:17 {{gift_detail.gift_title}}
  points: string; // html:18 {{gift_detail.coupon_points}}
  status: string; // html:19 {{karigar_gift.receive_status}}
  spec: string; // html:20 {{gift_detail.gift_title}}
  bankName: string; // html:29
  holder: string; // html:33
  account: string; // html:37
  ifsc: string; // html:41
  shipType: string; // html:51
  shipDate: string; // html:55
  shipInfo: string; // html:59
}

export default function ShippingDetailScreen({ navigation, route }: Props) {
  const loader = useLoader();
  const [, setTick] = useState(0);
  const rerender = () => setTick(n => n + 1);
  const alive = useRef(true);
  // shipping-detail.ts:9-17 fields
  const karigarGiftId = useRef<any>(''); // karigar_gift_id:any=''
  const offerGiftId = useRef<any>(''); // offer_gift_id:any=''
  const shippedDetail = useRef<any>({}); // shipped_detail:any={}
  const giftDetail = useRef<any>({}); // gift_detail:any={}
  const karigarGift = useRef<any>({}); // karigar_gift:any={}
  // The first change detection runs with the empty objects above: texts are '', the image src is the string 'undefined' (Angular sets the
  // property to undefined), the Receive button exists (undefined != 'Received') and there is no Shipping Detail card.
  const views = useRef({ ship: false, btn: true });
  const shown = useRef<Shown>({
    title: '',
    image: 'undefined',
    giftTitle: '',
    points: '',
    status: '',
    spec: '',
    bankName: '',
    holder: '',
    account: '',
    ifsc: '',
    shipType: '',
    shipDate: '',
    shipInfo: '',
  });
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [boxW, setBoxW] = useState(0);

  // :29-37 ionViewDidLoad (once; Ionic has no ionViewWillEnter here)
  useEffect(() => {
    alive.current = true;
    // NOTE (parity): shipping-detail.module.ts imports only IonicPageModule (no TranslateModule): every text is plain, nothing is translated and
    // the page never calls use().
    karigarGiftId.current = route?.params?.id; // :31 this.navParams.get('id')
    // NOTE (parity): Transaction pushes only {id} (transaction.ts:44), so offer_gift_id is undefined: giftDetail is asked with gift_id missing
    // (JSON.stringify drops the key) and karigar_id only.
    offerGiftId.current = route?.params?.offer_gift_id; // :32
    getShippedDetail(); // :34
    getGiftDetail(); // :35
    presentLoading(); // :36
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :117-143 ionViewDidLeave (popToRoot :138). React Navigation's 'blur' fires on a push over this screen / tab switch, like Ionic's didLeave.
  // NOTE (parity): when the nav that is active after leaving shows one of the root pages (and its previous page is not one of them),
  // this.navCtrl.popToRoot() runs.
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

  // :39-46 getShippedDetail()
  function getShippedDetail() {
    db.onPostRequestDataFromApi({ karigar_gift_id: karigarGiftId.current }, 'app_karigar/shippedDetail', db.rootUrl).then(
      (r: any) => {
        try {
          if (r.shipped) { // :44 if(r['shipped'])
            shippedDetail.current = r.shipped;
          }
        } catch {
          // TypeError on a null body: uncaught error in Ionic's callback
        } finally {
          if (alive.current) {
            rerender(); // Angular runs change detection after the callback in any case
          }
        }
      },
      // NOTE (parity): no error callback in Ionic: an HTTP error does nothing.
      () => {},
    );
  }

  // :47-54 presentLoading(): content 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: true });
  }

  // :55-74 getGiftDetail()
  function getGiftDetail() {
    db.onPostRequestDataFromApi(
      { gift_id: offerGiftId.current, karigar_id: db.userStorageData?.id },
      'app_karigar/giftDetail',
      db.rootUrl,
    ).then(
      (r: any) => {
        // NOTE (parity): the callback has no guards: a missing field throws and aborts the rest (the try/catch stands for the uncaught error of
        // Ionic's subscribe callback); what was assigned before stays. Change detection runs afterwards in any case (rerender in `finally`).
        try {
          loader.hide(); // :61 this.loading.dismiss(), before anything is read
          giftDetail.current = r.gift; // :62
          karigarGift.current = r.karigar_gift; // :63
          // :66-69 receive_status is copied to a field that is never shown
          // NOTE (parity): `gift: null` (or no gift) throws a TypeError here: the loader is already closed and gift_detail stays null.
          // An empty `gift: {}` gives NaN (parseInt(undefined)), printed as 'NaN'.
          giftDetail.current.coupon_points = parseInt(giftDetail.current.coupon_points); // eslint-disable-line radix
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

  // :75-105 recvConfirmation(redeem_id)
  function recvConfirmation(redeemId: any) {
    showAlert({
      title: 'Confirmation!',
      subTitle: 'Did you receive this gift?',
      cssClass: 'action-close',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => {},
        },
        {
          text: 'Yes',
          cssClass: 'close-action-sheet',
          handler: () => {
            db.onPostRequestDataFromApi(
              { id: redeemId, karigar_id: db.userStorageData?.id },
              'app_karigar/redeemReceiveStatus',
              db.rootUrl,
            ).then(
              () => {
                // NOTE (parity): the response is not looked at: any answer shows 'Success!' (the text has the typo 'receive').
                showSuccess('You have receive gift successfully');
                // :98 this.navCtrl.setRoot(TabsPage, {index:'3'}): the pages below are replaced by Tabs (Wallet tab)
                resetTo('Tabs', { index: '3' });
              },
              // NOTE (parity): no error callback in Ionic: after an HTTP error nothing happens (no alert).
              () => {},
            );
          },
        },
      ],
    });
  }

  // :106-116 showSuccess(text)
  function showSuccess(text: string) {
    showAlert({ title: 'Success!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  }

  // html:71 (click)="recvConfirmation(karigar_gift.id)"
  function onReceivePress() {
    try {
      recvConfirmation(karigarGift.current.id);
    } catch {
      // TypeError: Cannot read property 'id' of null (karigar_gift null): the handler dies, nothing happens
    }
  }

  // ---- the template's change detection (Angular 5 view engine order: *ngIf inputs of the root view, then the embedded views, then the root
  // view's text bindings; an exception aborts everything after it, so the DOM keeps what the earlier steps wrote) ----
  const v = views.current;
  const sh = shown.current;
  const sd = shippedDetail.current;
  const gd = giftDetail.current;
  const kg = karigarGift.current;
  let aborted = false;
  try {
    v.ship = !!sd.shipped_type; // html:46 *ngIf="shipped_detail.shipped_type"
    // html:70 *ngIf="karigar_gift.receive_status != 'Received'"
    // NOTE (parity): karigar_gift null/missing throws here, so the button keeps its last state and no text of this change detection is updated.
    v.btn = kg.receive_status != 'Received'; // eslint-disable-line eqeqeq
  } catch {
    aborted = true;
  }
  if (!aborted) {
    // embedded view of the Shipping Detail card
    if (v.ship) {
      sh.shipType = interp(sd.shipped_type);
      sh.shipDate = interp(sd.estimated_date);
      sh.shipInfo = interp(sd.shipping_information);
    }
    // root view text bindings, in template order. NOTE (parity): gift_detail null/missing throws at the first one ({{gift_detail.title}}, html:11).
    if (gd != null) {
      sh.title = interp(gd.title);
      sh.image = String(gd.image);
      sh.giftTitle = interp(gd.gift_title);
      sh.points = interp(gd.coupon_points);
      sh.status = interp(kg.receive_status);
      sh.spec = interp(gd.gift_title);
      sh.bankName = interp(kg.bank_name);
      sh.holder = interp(kg.account_holder_name);
      sh.account = interp(kg.bank_account_number);
      sh.ifsc = interp(kg.bank_ifsc_code);
    }
  }

  // html:14 <img [src]="gift_detail.image"> in `.img-box` (`img { max-width: 100% }`, height auto)
  // NOTE (parity): the value is used as it is (no upload url in front, unlike GiftDetail): a bare file name resolves against the app's own
  // origin in Ionic and 404s, so the picture is a broken-image icon unless the server sends a full URL.
  const imageUri = sh.image;
  useEffect(() => {
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
  const innerW = Math.max(boxW - 12, 0); // 6px border each side
  const imgW = natural ? Math.min(natural.w, innerW) : 0;
  const imgH = natural ? (natural.h * imgW) / natural.w : 0;

  const ink = md.textColor;
  const h2 = [textStyle(16, 500, ink, 20), { textTransform: 'capitalize' as const }];
  const p13 = textStyle(13, 400, ink, 20);
  const strong = textStyle(13, 700, ink, 20);
  const td = textStyle(13, 400, ink, normalLineHeight(13));
  const h5 = textStyle(14, 500, ink, 20);

  return (
    <View style={styles.screen}>
      {/* html:1-5 NOTE (parity): `<ion-title>Redeem  Detail</ion-title>` has two spaces; HTML collapses them. */}
      <IonHeader mainHeader remove>
        <IonNavbar title={collapseWs('Redeem  Detail')} />
      </IonHeader>

      {/* html:7-74 <ion-content padding> */}
      <IonContent padding>
        {/* html:9 <div class="conatiner"> */}
        <View>
          <View style={styles.contentBoxTitle}>
            <Text testID="shipping-title" style={h2}>
              {sh.title}
            </Text>
          </View>
          <View testID="shipping-img-box" style={styles.imgBox} onLayout={e => setBoxW(e.nativeEvent.layout.width)}>
            {imgFailed ? (
              <View testID="shipping-image-broken" style={styles.imgBroken} />
            ) : (
              <Image testID="shipping-image" source={{ uri: imageUri }} resizeMode="cover" style={[styles.img, { width: imgW, height: imgH }]} />
            )}
          </View>
          <View style={styles.contentBox}>
            <Text testID="shipping-gift-title" style={h2}>
              {sh.giftTitle}
            </Text>
            <Text testID="shipping-points" style={p13}>
              <Text style={strong}>Points</Text>
              {' '}
              <Text style={textStyle(18, 600, S.pointsColor, 20)}>{sh.points}</Text>
            </Text>
            <Text testID="shipping-status" style={p13}>
              <Text style={strong}>Gift Status</Text>
              {` ${sh.status}`}
            </Text>
            <Text testID="shipping-spec" style={p13}>
              <Text style={strong}>Specification</Text>
              {` ${sh.spec}`}
            </Text>
          </View>
        </View>

        {/* html:24-44 */}
        <View testID="shipping-bank-card" style={styles.csCard}>
          <Text style={h5}>Bank Detail</Text>
          <View style={styles.tr}>
            <View style={styles.td120}>
              <Text style={td}>Bank Name</Text>
            </View>
            <View style={styles.tdLast}>
              <Text testID="shipping-bank-name" style={[td, styles.tdLastText]}>
                {sh.bankName}
              </Text>
            </View>
          </View>
          <View style={styles.tr}>
            <View style={styles.td120}>
              <Text style={td}>Account Holder</Text>
            </View>
            <View style={styles.tdLast}>
              <Text testID="shipping-holder" style={[td, styles.tdLastText]}>
                {sh.holder}
              </Text>
            </View>
          </View>
          <View style={styles.tr}>
            <View style={styles.td120}>
              <Text style={td}>Account NO.</Text>
            </View>
            <View style={styles.tdLast}>
              <Text testID="shipping-account" style={[td, styles.tdLastText]}>
                {sh.account}
              </Text>
            </View>
          </View>
          <View style={styles.tr}>
            <View style={styles.td120}>
              <Text style={td}>IFSC Code</Text>
            </View>
            <View style={styles.tdLast}>
              <Text testID="shipping-ifsc" style={[td, styles.tdLastText]}>
                {sh.ifsc}
              </Text>
            </View>
          </View>
        </View>

        {/* html:46-62 *ngIf="shipped_detail.shipped_type" */}
        {v.ship ? (
          <View testID="shipping-ship-card" style={styles.csCard}>
            <Text style={h5}>Shipping Detail</Text>
            <View style={styles.tr}>
              <View style={styles.td140}>
                <Text style={td}>Shipped Type</Text>
              </View>
              <View style={styles.tdLast}>
                <Text testID="shipping-ship-type" style={[td, styles.tdLastText]}>
                  {sh.shipType}
                </Text>
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.td140}>
                <Text style={td}>Estimate Delivery Date</Text>
              </View>
              <View style={styles.tdLast}>
                {/* NOTE (parity): printed as the server sends it (no date pipe) */}
                <Text testID="shipping-ship-date" style={[td, styles.tdLastText]}>
                  {sh.shipDate}
                </Text>
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.td140}>
                <Text style={td}>Shipping Information</Text>
              </View>
              <View style={styles.tdLast}>
                <Text testID="shipping-ship-info" style={[td, styles.tdLastText]}>
                  {sh.shipInfo}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* html:70-72 NOTE (parity): text typo 'Recieve'; `button.ion-button { text-transform: capitalize !important }` (scss:4) */}
        {v.btn ? (
          <View style={styles.padding16}>
            <IonButton testID="shipping-receive" color="success" full round textTransform="capitalize" onPress={onReceivePress}>
              Click Here if you Recieve
            </IonButton>
          </View>
        ) : null}
        {/* html:73 <div class="h50">&nbsp;</div> */}
        <View style={styles.h50} />
      </IonContent>
    </View>
  );
}
