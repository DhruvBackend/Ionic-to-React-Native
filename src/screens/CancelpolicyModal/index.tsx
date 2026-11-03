// Ported from: src/pages/cancelpolicy-modal/cancelpolicy-modal.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonCheckbox } from '../../components/ionic/IonChoice';
import { IonContent } from '../../components/ionic/IonContent';
import { IonItem } from '../../components/ionic/IonList';
import { Text } from '../../components/ionic/IonText';
import { client } from '../../config/client';
import { cancelpolicyModalMd, disabledButtonInk } from '../../theme/ionicMdCancelpolicyModal';
import { interp } from '../../ui/angularPipes';
import { showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    goBack: () => void;
    reset: (state: { index: number; routes: { name: string; params?: object }[] }) => void;
    addListener?: (type: 'blur' | 'focus', cb: () => void) => () => void;
    getState?: () => any;
    dispatch?: (action: any) => void;
  };
  route?: { key?: string; params?: { karigar_id?: any; gift_id?: any } };
}

// :140-165 showAlert(text): the 'Alert!' alert with Cancel and OK (both do nothing; the translated 'Alert' key is not used here)
function showAlertDialog(text: string) {
  showAlert({
    title: 'Alert!',
    cssClass: 'action-close',
    subTitle: text,
    buttons: [
      { text: 'Cancel', role: 'cancel', handler: () => {} },
      // NOTE (parity): the OK handler only had a commented-out `navCtrl.push(TransactionPage)`
      { text: 'OK', cssClass: 'close-action-sheet', handler: () => {} },
    ],
  });
}

// :167-174 showSuccess(text)
function showSuccess(text: string) {
  showAlert({ title: 'Success!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
}

export default function CancelpolicyModalScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  const giftId = useRef<any>(''); // :16 gift_id:any=''
  // :14 otp_value:any='' (falsy until the OTP typed matches), :17 otp:any='', :18 karigar_detail:any={}, :20 gift_detail:any=''
  const [otpValue, setOtpValue] = useState<any>('');
  const otp = useRef<any>('');
  const [kd, setKd] = useState<any>({});
  const [gift, setGift] = useState<any>('');
  // :13 data (ngModel targets). `check` and `check1` start undefined although the boxes are drawn checked (see the NOTE at the checkboxes).
  const [otpText, setOtpText] = useState('');
  const [touched, setTouched] = useState(false); // `otp?.touched`: set on blur
  const [check, setCheck] = useState<boolean | undefined>(undefined);
  const check1 = useRef<boolean | undefined>(undefined);
  const [shipping, setShipping] = useState<string | undefined>(undefined);
  const shippingRef = useRef<string | undefined>(undefined);
  const setShippingAddress = (v: string | undefined) => {
    shippingRef.current = v;
    setShipping(v);
  };

  // :36-49 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    // NOTE (parity): cancelpolicy-modal.module.ts has its own TranslateModule.forRoot, but app.module.ts:289 imports CancelpolicyModalPageModule
    // eagerly, so its providers merge into the root injector and the page uses the ONE app-wide TranslateService. The page never calls
    // use()/setDefaultLang(), so it shows whatever language the app already has (global in RN too).
    // NOTE (parity): navParams karigar_id (:38) is only logged; the requests use dbService.userStorageData.id.
    giftId.current = route?.params?.gift_id; // :40
    getOtpDetail(); // :42
    presentLoading(); // :43
    // :44-48 data.paytm_mobile / bank_account_number / bank_ifsc_code / bank_detail_type / bank_name = "" (only paytm_mobile and
    // bank_detail_type are ever sent, always '')
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :186-190 ionViewDidLeave -> this.dismiss(). React Navigation's 'blur' fires when CancelationPolicy is pushed over this screen.
  // NOTE (parity): Ionic ran dismiss() on EVERY didLeave, so pushing CancelationPolicy (goOnCancelationPolicy) closes the modal as soon as the
  // new page has arrived; the policy page stays. Here the modal route is removed from the stack at that moment (instant, like Ionic's
  // dismiss of a view that is already covered); a goBack() would have popped the policy page instead. After a normal dismiss the screen is
  // gone, so the second dismiss() of Ionic (didLeave after the dismiss) is a no-op, as here.
  useEffect(() => {
    if (!navigation.addListener) {
      return undefined;
    }
    return navigation.addListener('blur', () => {
      const state = navigation.getState?.();
      if (!state || !route?.key || state.routes[state.index]?.key === route.key) {
        return;
      }
      const at = state.routes.findIndex((r: any) => r.key === route.key);
      if (at < 0) {
        return;
      }
      const routes = state.routes.filter((r: any) => r.key !== route.key);
      navigation.dispatch?.(CommonActions.reset({ ...state, routes, index: routes.length - 1 }));
    });
  }, [navigation, route?.key]);

  // :176-181 presentLoading(): content 'Please wait...', dismissOnPageChange: false
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: false });
  }

  // :51-54 dismiss(): viewCtrl.dismiss({foo: 'bar'}); GiftDetail has no onDidDismiss, so the data goes nowhere
  function dismiss() {
    navigation.goBack();
  }

  // :56-58 goOnCancelationPolicy()
  function goOnCancelationPolicy() {
    navigation.push('CancelationPolicy');
  }

  // :60-79 getOtpDetail()
  function getOtpDetail() {
    db.onPostRequestDataFromApi(
      { karigar_id: db.userStorageData?.id, mobile_no: db.userStorageData?.mobile_no, gift_id: giftId.current },
      'app_karigar/sendOtp',
      db.rootUrl,
    ).then(
      (r: any) => {
        loader.hide(); // :66 this.loading.dismiss(), before anything is read
        if (!alive.current) {
          return;
        }
        // NOTE (parity): no guards in Ionic: each line below throws on a missing/null field and aborts the rest (the try/catch stands for
        // the uncaught error of the subscribe callback); what was assigned before stays. So `karigar: null` leaves gift_detail at ''.
        try {
          otp.current = r.otp; // :67
          const k = r.karigar;
          setKd(k); // :69
          // :70-73 data.account_holder_name / bank_name / bank_account_number / bank_ifsc_code = karigar_detail.* (never sent). Reading the first one is
          // what throws for `karigar: null`; the other reads cannot throw after it.
          void k.account_holder_name; // eslint-disable-line no-void
          setGift(r.gift); // :74
        } catch {
          // uncaught error in Ionic's callback
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (the page keeps its empty template).
      () => {},
    );
  }

  // :80-90 resendOtp(): no loader, no alert, no confirmation. Only the new otp is kept (the text typed is not cleared or re-checked).
  function resendOtp() {
    db.onPostRequestDataFromApi({ karigar_id: db.userStorageData?.id, gift_id: giftId.current }, 'app_karigar/sendOtp', db.rootUrl).then(
      (r: any) => {
        try {
          otp.current = r.otp; // :88
        } catch {
          // uncaught error in Ionic's callback (response null)
        }
      },
      // no error callback in Ionic
      () => {},
    );
  }

  // :92-99 otpvalidation(), fired by (ngModelChange)
  function onOtpChange(text: string) {
    setOtpText(text);
    // NOTE (security, not changed): the OTP is compared on the phone, loose ==, and the server sends it in the sendOtp response.
    setOtpValue(text == otp.current); // eslint-disable-line eqeqeq
  }

  // :213-224 myNumber() (the `(click)` of the "Same as Permanent Address" box, after the box has toggled and set data.check1)
  function myNumber() {
    if (check1.current === true) {
      // NOTE (parity): a missing part is concatenated as the text "undefined"; the separators are ' ,' (space before the comma)
      setShippingAddress(kd.address + ' ,' + kd.city + ' ,' + kd.district + ' ,' + kd.state + ' ,' + kd.pincode);
    } else {
      setShippingAddress('');
    }
  }

  // :101-141 submit(), (ngSubmit) of the form
  function submit() {
    if (gift.type === 'Gift') {
      if (!shippingRef.current) {
        showAlertDialog('Please fill Address'); // :107
        return;
      }
    }
    presentLoading(); // :113
    db.onPostRequestDataFromApi(
      {
        karigar_id: db.userStorageData?.id,
        mobile: kd.mobile_no,
        bank_detail_type: '', // :46 data.bank_detail_type = ""
        paytm_mobile: '', // :44 data.paytm_mobile.toString()
        gift_id: giftId.current,
        offer_id: gift.offer_id,
        bankDetails: '',
        shipping_address: shippingRef.current,
      },
      'app_karigar/redeemRequest',
      db.rootUrl,
    ).then(
      (r: any) => {
        loader.hide(); // :124
        if (!alive.current) {
          return;
        }
        try {
          if (r.status == 'SUCCESS') { // eslint-disable-line eqeqeq
            // NOTE (parity): setRoot(TabsPage, {index:'3'}) (not a dismiss): the modal, GiftDetail and everything below are replaced
            navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { index: '3' } }] });
            showSuccess('Redeemed Request Sent Successfully'); // :130
          } else if (r.status == 'monthly_redeem_limit_exceed') { // eslint-disable-line eqeqeq
            showAlertDialog(r.msg); // :133
          } else if (r.status == 'EXIST') { // eslint-disable-line eqeqeq
            // NOTE (parity): leading space in the text
            showAlertDialog(' Already Redeemed!'); // :138
          }
          // NOTE (parity): any other status (or none) does nothing at all: the loader is closed and the modal just stays
        } catch {
          // uncaught error in Ionic's callback (response null)
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up.
      () => {},
    );
  }

  // ---- the template's change detection ----
  // NOTE (parity): Angular's change detection throws when the template reads a property of null: `gift_detail.type` (an *ngIf input, checked
  // before every text binding) when `gift` is null, and `karigar_detail.mobile_no` (a text binding) when `karigar` is null. The exception
  // aborts the later bindings of the view, so the texts stay at their start values (empty), the Gift block stays hidden and the Yes
  // button's [disabled] stays at its start value (disabled) for good; the typed OTP and the "Wrong OTP value" ngIf (earlier) still work.
  const broken = kd == null || gift == null;
  const giftType = !broken && gift.type === 'Gift'; // *ngIf="gift_detail.type === 'Gift'"
  const points = broken ? '' : interp(gift.coupon_points);
  const mobile = broken ? '' : interp(kd.mobile_no);
  const disabled = broken || !check || !otpText || !otpValue; // [disabled]="!data.check || !data.otp || !otp_value"

  return (
    <View testID="cancelpolicy-modal" style={styles.screen}>
      {/* html:1-5 ion-header: `page-cancelpolicy-modal ion-header { display: none }` (scss:4-7), so no header is drawn */}
      <IonContent padding contentStyle={styles.contentFill}>
        <View style={styles.dflex1}>
          <View testID="modal-content" style={styles.modalContent}>
            <Text testID="modal-title" style={styles.h1}>
              {t(client.appName)}
            </Text>
            <Text testID="modal-question" style={styles.p}>
              {t('Are you sure to redeem your')} {points} points?
            </Text>
            <View style={styles.numberContent}>
              <Text style={styles.numberP}>
                {t('Enter your 6 digit number that sent to')}{' '}
                <Text testID="modal-mobile" style={styles.blue}>
                  {'+91 '}
                  {mobile}
                </Text>
              </Text>
            </View>
            <View style={styles.inputAdjust}>
              <TextInput
                testID="otp-input"
                style={styles.input}
                value={otpText}
                onChangeText={onOtpChange}
                onBlur={() => setTouched(true)}
                keyboardType="phone-pad"
                placeholder={t('Enter OTP')}
                placeholderTextColor={cancelpolicyModalMd.placeholder}
                autoComplete="off"
                autoCorrect={false}
                underlineColorAndroid="transparent"
              />
              {!otpValue && touched ? (
                <View testID="otp-error">
                  <Text style={styles.otpErrorP}>{t('Wrong OTP value')}</Text>
                </View>
              ) : null}
              <View style={styles.resend}>
                <Pressable testID="otp-resend" onPress={resendOtp} style={styles.resendA}>
                  <Text style={styles.resendText}>{t('Resend')}</Text>
                </Pressable>
              </View>
              {giftType ? (
                <View testID="gift-block">
                  <View style={styles.checkBx}>
                    {/* NOTE (parity): `checked="true"` (attribute) with [(ngModel)]="data.check1" (undefined): the box is DRAWN checked while the
                        model stays undefined until the first tap (which unchecks it and sets false). myNumber() then clears the address; a second
                        tap checks it and fills the address from the profile. */}
                    <IonItem testID="check1-item" style={styles.checkItem} innerStyle={styles.checkItemInner}>
                      <IonCheckbox
                        testID="check1"
                        color="secondary"
                        checked="true"
                        onChange={e => {
                          check1.current = e.checked;
                        }}
                        onPress={myNumber}
                      />
                    </IonItem>
                    <Text style={styles.checkP}>{t('Same as Permanent Address')}</Text>
                  </View>
                  <TextInput
                    testID="shipping-address"
                    style={styles.textarea}
                    value={shipping ?? ''}
                    onChangeText={setShippingAddress}
                    multiline
                    placeholder="Enter Shipping Address"
                    placeholderTextColor={cancelpolicyModalMd.placeholder}
                    autoCorrect={false}
                    underlineColorAndroid="transparent"
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.checkBx}>
              {/* NOTE (parity): same `checked="true"` + undefined model: drawn checked, data.check undefined, so Yes stays disabled until the
                  box is tapped twice (off, then on). */}
              <IonItem testID="check-item" style={styles.checkItem} innerStyle={styles.checkItemInner}>
                <IonCheckbox testID="check" color="secondary" checked="true" onChange={e => setCheck(e.checked)} />
              </IonItem>
              <Text style={styles.checkP} numberOfLines={1}>
                {t('I have read')}{' '}
                <Text testID="policy-link" style={styles.link} onPress={goOnCancelationPolicy}>
                  {t('Cancellation Policy')}
                </Text>
              </Text>
            </View>

            <View style={styles.btnAlign}>
              <Pressable testID="no" onPress={dismiss}>
                <Text style={styles.no}>{t('No')}</Text>
              </Pressable>
              <Pressable testID="yes" disabled={disabled} onPress={submit} style={[styles.yes, disabled && styles.disabled]}>
                <Text style={[styles.yesText, disabled && { color: disabledButtonInk }]}>{t('Yes')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </IonContent>
    </View>
  );
}
