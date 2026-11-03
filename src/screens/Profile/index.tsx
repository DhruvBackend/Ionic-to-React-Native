// Ported from: src/pages/profile/profile.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { client } from '../../config/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { Text } from '../../components/ionic/IonText';
import { Header, IonFooter } from '../../components/ionic/IonNavbar';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { clipSafeLineBox, textStyle } from '../../components/ionic/text';
import { shareText, takePhoto } from '../../native';
import { resetTo } from '../../navigation/navigationRef';
import { storage } from '../../storage';
import { colors, scssColors } from '../../theme';
import { profileMd as P } from '../../theme/ionicMdProfile';
import { showActionSheet, showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { giftSvg } from './giftSvg';
import { styles } from './styles';

const defaultPhoto = require('./assets/profile.jpg');

interface Props {
  navigation: { push: (name: string, params?: object) => void; addListener?: (event: string, cb: () => void) => () => void };
  route?: { params?: any };
}

// ---- Angular template pipes / interpolation ---------------------------------------------------------------------
// `{{ x }}`: null and undefined print as an empty string.
const s = (v: any): string => (v === null || v === undefined ? '' : String(v));
// TitleCasePipe (@angular/common 5.2.11): null / '' pass through, every `\b` segment gets its first character upper-cased and the rest lower-cased.
// NOTE (parity): Angular throws InvalidPipeArgument for a non-string; the value is converted instead.
const tc = (v: any): string =>
  !v
    ? ''
    : String(v)
        .split(/\b/g)
        .map(w => (w ? w.charAt(0).toUpperCase() + w.substr(1).toLowerCase() : w))
        .join('');
// HTML collapses runs of white space (not &nbsp;) and a block drops the white space at its edges.
const ws = (v: string): string => v.replace(/[ \t\n\r\f]+/g, ' ').replace(/^ | $/g, '');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// `| date:'d MMM,y'` (en-US). NOTE (parity): Angular throws InvalidPipeArgument for text that is no date; an empty string is shown instead.
function formatDate(v: any): string {
  if (v === null || v === undefined || v === '') {
    return '';
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
  return isNaN(d.getTime()) ? '' : `${d.getDate()} ${MONTHS[d.getMonth()]},${d.getFullYear()}`;
}

// dbservice.ts:190-200 onShowMessageAlertHandler
function messageAlert(subTitle: string) {
  showAlert({ title: 'Message!', cssClass: 'action-close', subTitle, buttons: ['OK'] });
}

// `class="{{status}}"`: .Verified / .Pending / .Suspect / .Reject (+ .Cancel) set the colour, any other status keeps the `.name a` green
const statusColor = (status: any) =>
  status === 'Verified'
    ? P.statusVerified
    : status === 'Pending'
      ? P.statusPending
      : status === 'Suspect'
        ? P.statusSuspect
        : status === 'Reject' || status === 'Cancel'
          ? P.statusReject
          : P.statusDefault;

const t12 = (weight: number, color: string, lineHeight?: number) => textStyle(12, weight, color, lineHeight);

export default function ProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const loader = useLoader();
  const [, setTick] = useState(0);
  const rerender = () => setTick(n => n + 1);
  const alive = useRef(true);
  const started = useRef(false);
  const lastEnter = useRef(0);

  // profile.ts:30-35 fields
  const detail = useRef<any>({}); // karigar_detail
  const todayPoint = useRef<any>(''); // read from the response, never shown
  const lastPoint = useRef<any>(''); // read from the response, never shown
  const url = db.upload_url3; // profile.ts:60 this.url = dbService.upload_url3

  // NOTE (parity): `dbService.connection` is never assigned anywhere in the Ionic app, so this offline branch is dead there too.
  const offline = () => (db as any).connection == 'offline'; // eslint-disable-line eqeqeq

  // profile.ts:152-180
  function getKarigarDetail() {
    db.onPostRequestDataFromApi({ karigar_id: db.userStorageData?.id }, 'app_karigar/profile', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // this.loading.dismiss(): a no-op when the loader is gone already
        if (!alive.current) {
          return;
        }
        // NOTE (parity): `r['karigar']` of a null body, or a missing / null karigar, throws a TypeError inside Ionic's subscribe
        // (after the loader is closed): karigar_detail stays null and the template then fails; here the body stays empty.
        detail.current = r ? r.karigar : null;
        if (!detail.current) {
          rerender();
          return;
        }
        const k = detail.current;
        // profile.ts:176 (NaN when a balance is missing; it is part of the object that Registration later posts)
        k.totalpoints = parseInt(k.balance_point, 10) + parseInt(k.service_wallet_balance_points, 10);
        lastPoint.current = r.last_point;
        todayPoint.current = r.today_point;
        rerender();
      },
      () => {
        // NOTE (parity): no error callback in Ionic: after an HTTP error the "Please wait..." loader stays up (until the page is left).
      },
    );
  }

  // profile.ts:62-66 (constructor), :135-141 ionViewDidLoad, :143-149 ionViewWillEnter
  useEffect(() => {
    alive.current = true;
    if (!started.current) {
      started.current = true;
      if (offline()) {
        messageAlert('Offline ! Please Connect To An Active Internet Connection');
        resetTo('Home');
      } else {
        loader.show(); // presentLoading(): "Please wait...", dismissOnPageChange
        lastEnter.current = Date.now();
        getKarigarDetail();
      }
    }
    // ionViewWillEnter again when the page comes back into view (after Registration, PointLocation ...)
    const unsubscribe = navigation.addListener?.('focus', () => {
      if (Date.now() - lastEnter.current < 150) {
        return; // the focus event of the first appearance: ionViewWillEnter already ran above
      }
      lastEnter.current = Date.now();
      if (!offline()) {
        getKarigarDetail();
      }
    });
    return () => {
      alive.current = false;
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // profile.ts:73-131
  function logout() {
    showAlert({
      title: t('Logout!'),
      message: t('Are you sure you want Logout?'),
      buttons: [
        { text: t('No'), handler: () => {} },
        {
          text: t('Yes'),
          handler: () => {
            // NOTE (security, not changed): logout only clears the phone; the token stays valid on the server.
            storage.set('userStorageData', {});
            db.userStorageData = {};
            showAlert({
              title: 'Success!',
              subTitle: 'Logout Successfully',
              buttons: [{ text: 'Ok', handler: () => {} }],
            });
            resetTo('Language'); // app.getRootNav().setRoot(LanguagePage)
          },
        },
      ],
    });
  }

  // profile.ts:182-186
  function pointLocation() {
    const k = detail.current;
    // NOTE (parity): a null karigar_detail would throw a TypeError in Ionic; the values are then undefined.
    navigation.push('PointLocation', { lat: k?.cust_lat, log: k?.cust_long, old_loc: k?.cust_geo_address });
  }

  // profile.ts:263-273
  function uploadImage(profile: string) {
    db.onPostRequestDataFromApi({ karigar_id: db.userStorageData?.id, profile }, 'app_karigar/updateProfilePic', db.rootUrl).then(
      () => {
        showAlert({ title: 'Success!', subTitle: 'Profile Photo Updated', buttons: ['OK'] }); // showSuccess()
        getKarigarDetail();
      },
      () => {
        // NOTE (parity): no error callback in Ionic: nothing happens.
      },
    );
  }

  // profile.ts:223-262 takePhoto / getImage. NOTE (parity): the data URL is stored into karigar_detail.profile, which the template then
  // prefixes with `url`, so the picture stays broken until getKarigarDetail() brings the server path back.
  async function pick(source: 'camera' | 'gallery') {
    const r = await takePhoto(source, source === 'camera' ? { quality: 70, maxWidth: 500, maxHeight: 400 } : { quality: 70 });
    if (!r.ok || !alive.current) {
      return; // the plugin's error callback is empty
    }
    detail.current.profile = r.value;
    rerender();
    if (detail.current.profile) {
      uploadImage(detail.current.profile);
    }
  }

  // profile.ts:187-222
  function openeditprofile() {
    showActionSheet({
      title: 'Profile photo',
      cssClass: 'cs-actionsheet',
      buttons: [
        { cssClass: 'sheet-m', text: 'Camera', icon: 'camera', handler: () => void pick('camera') },
        { cssClass: 'sheet-m1', text: 'Gallery', icon: 'image', handler: () => void pick('gallery') },
        { cssClass: 'cs-cancel', text: 'Cancel', role: 'cancel', handler: () => {} },
      ],
    });
  }

  // profile.ts:275-278 (a modal in Ionic)
  function viewProfiePic() {
    navigation.push('ViewProfile', { Image: detail.current.profile, mode: 'profile' });
  }

  // profile.ts:303-310
  function ShareApp() {
    const refCode = ' and use my Code *' + detail.current.referral_code + '* to get points back in your wallet';
    // NOTE (parity): the text (double space after the app name, " ..Give it a try") is copied as typed.
    void shareText(
      `Hey There ! here is an awesome app from ${client.appName}  ..Give it a try https://play.google.com/store/apps/details?id=${client.playStoreId}` +
        refCode,
    );
  }

  // profile.ts:312-317
  function updateProfile() {
    const k = detail.current;
    k.edit_profile = 'edit_profile';
    navigation.push('Registration', { data: k, sales_boy_id: k.sales_boy_id });
  }

  const d = detail.current;
  const type = db.userStorageData?.type;
  /* eslint-disable eqeqeq */
  const isStaff = type == 'Plumber' || type == 'Sales_Boy' || type == 'Dealer' || type == 'Sales_Executive';
  const isCustomer = type == 'Customer';
  /* eslint-enable eqeqeq */

  // `<img *ngIf="profile != ''">` / `<img *ngIf="profile == ''">` + the camera badge (profile.html:15-24 and :184-196)
  function profilePic() {
    return (
      <View style={styles.profilePic}>
        {d.profile != '' /* eslint-disable-line eqeqeq */ ? (
          <Pressable testID="profile-image" onPress={viewProfiePic}>
            <Image style={styles.picImage} source={{ uri: url + d.profile }} />
          </Pressable>
        ) : (
          <Image style={styles.picImage} source={defaultPhoto} />
        )}
        <View style={styles.picCamera}>
          <Pressable testID="profile-photo-edit" onPress={openeditprofile}>
            <MaterialIcon name="camera_alt" size={11} color={colors.white} />
          </Pressable>
        </View>
      </View>
    );
  }

  const pencil = (
    <Pressable testID="profile-edit" style={styles.pencil} onPress={updateProfile}>
      <View style={styles.pencilButton}>
        <MaterialIcon name="edit" size={18} color={colors.white} />
      </View>
    </Pressable>
  );

  const nameP = () => <Text style={textStyle(14, 500, P.nameInk)}>{tc(d.first_name)}</Text>;

  // profile.html:28-33 (Plumber)
  function plumberStatus() {
    const color = statusColor(d.status);
    const icon =
      d.status == 'Verified' // eslint-disable-line eqeqeq
        ? 'check_circle'
        : d.status == 'Pending' // eslint-disable-line eqeqeq
          ? 'hourglass_full'
          : d.status == 'Suspect' // eslint-disable-line eqeqeq
            ? 'info'
            : d.status == 'Reject' // eslint-disable-line eqeqeq
              ? 'cancel'
              : null;
    return (
      <View style={styles.nameLink} testID="profile-status">
        {icon ? (
          <View style={styles.statusIcon}>
            <MaterialIcon name={icon} size={18} color={color} style={styles.statusIconGlyph} />
          </View>
        ) : null}
        <Text style={t12(400, color)}>{`${s(d.status)} ${s(d.reason)} (${s(d.type)})`}</Text>
      </View>
    );
  }

  const rLabel = (key: string) => (
    <Text style={[textStyle(11, 400, P.ink, 11 * 1.2), { textTransform: 'capitalize' }]}>{t(key)}</Text>
  );
  const rValue = (value: string) => <Text style={t12(500, P.ink, 20)}>{ws(value)}</Text>;

  function staffBody() {
    const sellerName = d.linked_seller_name || d.sales_boy_name;
    const sellerMobile = d.linked_seller_mobile || d.sales_boy_mobile_no;
    const boxP = textStyle(12, 400, P.ink);
    const boxH4 = [textStyle(12, 400, scssColors.black, 22), { textTransform: 'capitalize' as const }];
    /* eslint-disable eqeqeq */
    return (
      <View style={styles.profile}>
        <View style={styles.profileDetail}>
          {profilePic()}
          <View style={styles.name}>
            {nameP()}
            {type == 'Plumber' ? plumberStatus() : null}
            {type != 'Plumber' ? (
              <View style={styles.nameLink}>
                <Text style={t12(400, P.statusDefault)}>
                  {type === 'Sales_Boy' ? 'Seller' : type === 'Sales_Executive' ? 'Sales Executive' : s(type)}
                </Text>
              </View>
            ) : null}
          </View>
          {pencil}

          <View style={styles.ratingArea}>
            <View style={styles.borderBox}>
              <View style={styles.boxs}>
                <Text style={boxP}>{t('Mobile No.')}</Text>
                <Text style={boxH4}>{`+91${s(d.mobile_no)}`}</Text>
              </View>
              <View style={[styles.boxs, styles.boxsLast]}>
                <Text style={boxP}>{t('Date of Birth')}</Text>
                <Text style={boxH4}>{d.dob != '' ? formatDate(d.dob) : '----'}</Text>
              </View>
            </View>

            <View style={[styles.ratings, styles.borderBottom]}>
              {rLabel('Working Address')}
              {rValue(`${tc(d.address)} ${tc(d.address2)} ${tc(d.state)} ${tc(d.district)} ${tc(d.city)} ${s(d.pincode)}`)}
            </View>
            {d.permanent_address ? (
              <View style={[styles.ratings, styles.borderBottom]}>
                {rLabel('Permanent Address')}
                {/* NOTE (parity): `parmanent_district` is spelled like that in Ionic and in the server response. */}
                {rValue(`${tc(d.permanent_address)} ${tc(d.permanent_address2)} ${tc(d.permanent_state)} ${tc(d.parmanent_district)}  ${tc(d.permanent_city)} ${s(d.permanent_pincode)}`)}
              </View>
            ) : null}
            {type == 'Sales_Boy' || type == 'Dealer' ? (
              <View style={[styles.ratings, styles.borderBottom]}>
                {rLabel('Dealer Information')}
                {rValue(` ${tc(d.dealer_contact_person)} (${s(d.dealer_mobile)})`)}
              </View>
            ) : null}
            {type == 'Plumber' ? (
              <View style={[styles.ratings, styles.borderBottom]}>
                {rLabel('Seller Information')}
                {rValue(`${tc(sellerName)}${sellerMobile ? ` (${s(sellerMobile)}) ` : ''}`)}
              </View>
            ) : null}
            {type == 'Plumber' && d.linked_dealer_name ? (
              <View style={[styles.ratings, styles.borderBottom]}>
                {rLabel('Dealer Information')}
                {rValue(`${tc(d.linked_dealer_name)} ${d.linked_dealer_mobile ? `(${s(d.linked_dealer_mobile)})` : ''}`)}
              </View>
            ) : null}
            {type == 'Plumber' && d.linked_sales_exec_name ? (
              <View style={[styles.ratings, styles.borderBottom]}>
                {rLabel('Sales Executive Information')}
                {rValue(`${tc(d.linked_sales_exec_name)} ${d.linked_sales_exec_mobile ? `(${s(d.linked_sales_exec_mobile)})` : ''}`)}
              </View>
            ) : null}
          </View>
        </View>

        {d.type == 'Plumber' ? (
          <View testID="profile-document">
            <Text style={[textStyle(14, 400, P.black, 14 * 1.2), { paddingBottom: 10 }]}>{t('Document Information')}</Text>
            <View style={styles.documentImg}>
              <Image style={styles.documentImage} source={{ uri: url + d.document_image }} />
              <View style={styles.documentGap} />
              <View style={styles.documentInfo}>
                <Text style={[textStyle(13, 400, scssColors.black, 13 * 1.2), { paddingBottom: 2 }]}>{s(d.document_type)}</Text>
                <Text style={textStyle(14, 400, scssColors.black)}>{s(d.document_no)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {type != 'Sales_Executive' ? shareCode() : null}
      </View>
    );
    /* eslint-enable eqeqeq */
  }

  // profile.html:140-149
  function shareCode() {
    const box = clipSafeLineBox(12, 12);
    const p = textStyle(12, 400, colors.white);
    const span = textStyle(12, 600, P.shareText, 22);
    return (
      <View testID="profile-share-code" style={styles.shareCode}>
        <View style={styles.shareIconCol}>
          <SvgXml xml={giftSvg} width={20} height={20.87} />
        </View>
        <View style={styles.shareMiddle}>
          <Text style={p}>
            {`${t('Invite friends, get rewards')} `}
            <Text style={span}>{s(d.refer_own_point)}</Text>
            {` ${t('points')}`}
          </Text>
          <Text style={p}>
            {`${t('Share your code')} `}
            <Text style={[span, { textTransform: 'uppercase' }]}>{d.referral_code ? d.referral_code : 'N/A'}</Text>
          </Text>
        </View>
        <View style={styles.shareButtonCol}>
          <IonButton
            testID="profile-share"
            kind="clear"
            style={{ paddingHorizontal: 0, width: '100%' }}
            labelStyle={{ fontSize: 12, color: P.shareText, lineHeight: box.lineHeight, marginVertical: box.marginVertical }}
            onPress={ShareApp}
          >
            {t('Share')}
          </IonButton>
        </View>
      </View>
    );
  }

  function customerBody() {
    const row = (key: string, value: string, last: boolean, plusPrefix?: boolean) => (
      <View key={key} style={[styles.ratings, last ? null : styles.newClRatings]}>
        {rLabel(key)}
        <Text style={t12(500, P.ink, 20)}>{plusPrefix ? `+91${ws(value)}` : ws(value)}</Text>
      </View>
    );
    return (
      <View style={styles.profile}>
        <View style={styles.profileDetail}>
          {profilePic()}
          <View style={styles.name}>{nameP()}</View>
          {pencil}
          <View style={styles.ratingArea}>
            {row('Mobile No.', s(d.mobile_no), false, true)}
            {row('Address', tc(d.address), false)}
            {row('Area', tc(d.city), false)}
            {row('District', tc(d.district), false)}
            {row('State', tc(d.state), false)}
            {row('Pincode', s(d.pincode), true)}
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      {/* ion-header class="main-header": back + buttons hidden, only the .header-icons button is shown again */}
      <Header
        mainHeader
        noBorder
        color="primary"
        title={t('Profile')}
        overlay={
          <View style={styles.headerIcons}>
            <IonButton testID="profile-logout" background="transparent" style={styles.hdrIconButton} onPress={logout}>
              <MaterialIcon name="power_settings_new" color={colors.white} />
            </IonButton>
          </View>
        }
      />
      {/* NOTE (parity): Retailer (and any other type) matches neither *ngIf: header only. A null karigar leaves the body empty. */}
      {isStaff ? <IonContent style={styles.staffContent}>{d ? staffBody() : null}</IonContent> : null}
      {isCustomer ? <IonContent>{d ? customerBody() : null}</IonContent> : null}
      {isCustomer ? (
        <IonFooter padding>
          <View>
            {d && d.cust_geo_address ? (
              <View style={styles.pointAdd}>
                <Text style={[textStyle(14, 600, scssColors.black), styles.pointAddText]}>{t('Geo Location')}</Text>
                <TextInput
                  testID="profile-geo"
                  style={[styles.geoTextarea, textStyle(12, 400, scssColors.black, 18)]}
                  multiline
                  editable={false}
                  value={d.cust_geo_address}
                />
              </View>
            ) : null}
            <IonButton
              testID="profile-location"
              block
              color="danger"
              background={scssColors.success}
              style={styles.buttonLocation}
              labelStyle={{ letterSpacing: 2, color: colors.white }}
              onPress={pointLocation}
            >
              {d && d.cust_geo_address ? 'Update location' : 'Add location'}
            </IonButton>
          </View>
        </IonFooter>
      ) : null}
    </>
  );
}
