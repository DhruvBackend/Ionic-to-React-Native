// Ported from: src/pages/login-section/otp/otp.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import { Text } from '../../components/ionic/IonText';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { otpMatches } from '../../auth/otp';
import { session } from '../../auth/session';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import i18n from '../../i18n';
import { showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { logoHeight, normalLine, placeholderColor, styles } from './styles';

// Logo: the client's logo.png (Ionic assets/imgs/logo.png), copied by scripts/use-client.mjs.
const logo = require('../../assets/client/logo.png');
// Intrinsic ratio of the logo: CSS `img { height: 45px }` has an auto width of height * ratio (see Language).
const logoSize = Image.resolveAssetSource?.(logo);
const logoRatio = logoSize?.width && logoSize?.height ? logoSize.width / logoSize.height : 1;

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: { lang?: any; mobile_no?: any; otp?: any; loginType?: any } };
}

// dbservice.ts:190-200 onShowMessageAlertHandler
function messageAlert(subTitle: string) {
  showAlert({ title: 'Message!', cssClass: 'action-close', subTitle, buttons: ['OK'] });
}

export default function OtpScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const loader = useLoader();
  const params = route?.params ?? {};

  // otp.ts:68-84 fields. otp.ts:95 `lang` and :105-108 mobileNo / smsOTP / loginType come straight from navParams (MobileLogin
  // passes {lang, otp, mobile_no, loginType}); `country` is never set anywhere (undefined).
  const lang = params.lang;
  const mobileNo = params.mobile_no;
  const loginType = params.loginType;
  const smsOTP = useRef<any>(params.otp);
  const data = useRef<{ otp?: string; mobile_no?: any }>({}); // otp.ts:68 `data` (ngModel target and the resend body)
  const [otpText, setOtpText] = useState('');
  const [isOtpValid, setIsOtpValid] = useState<boolean | undefined>(undefined); // otp.ts:80, undefined until the first change
  const [touched, setTouched] = useState(false); // `otp?.touched`: set on blur
  const [resendActiveClass, setResendActiveClass] = useState(false); // otp.ts:83
  const [otpInputMaxTime, setOtpInputMaxTime] = useState(30); // otp.ts:79
  const alive = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const maxTime = useRef(30);

  // otp.ts:102-116 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    // otp.ts:110-111 setDefaultLang(lang) + use(lang). NOTE (parity): `lang` is whatever navParams carried; a missing one is not applied
    // (ngx-translate would try to load a bundle called "undefined").
    if (typeof lang === 'string' && lang) {
      i18n.changeLanguage(lang);
    }
    // NOTE (parity): onManageTimeCounter() (otp.ts:214-224) builds an Observable.timer that is never subscribed, so it does nothing
    // (the 30*60 counter never runs and smsOTP is never regenerated). Dead code, not ported.
    return () => {
      alive.current = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // otp.ts:247-258 onValidateUserOtpHandler (fired by (ngModelChange))
  function onChange(text: string) {
    // `(keypress)="dbService.onMobileValidateHandler($event)"` (dbservice.ts:177-187) blocks every key but 0-9; `maxlength="6"`.
    const next = text.replace(/[^0-9]/g, '').slice(0, 6);
    data.current.otp = next;
    setOtpText(next);
    // NOTE (security, not changed): the OTP is compared on the phone (loose ==, see src/auth/otp.ts).
    setIsOtpValid(otpMatches(next, smsOTP.current));
  }

  // otp.ts:120-166 onSubmitUserOtpHandler: (ngSubmit)="f.form.valid && onSubmitUserOtpHandler()"
  async function onSubmit() {
    // `required minlength="6"`: a matched OTP shorter than 6 digits (a short server OTP) leaves the form invalid.
    if (otpText.length < 6) {
      return;
    }
    loader.show();
    let result: any;
    try {
      result = await db.onPostRequestDataFromApi({ mobile_no: mobileNo, mode: 'App' }, 'auth/login', db.rootUrl);
    } catch {
      // NOTE (parity): Ionic's subscribe has no error callback (otp.ts:124), so after an HTTP error the "Please wait..." loader stays up
      // forever and nothing else happens. Same here (only leaving the page closes it, dismissOnPageChange).
      return;
    }
    loader.hide(); // otp.ts:127
    if (!alive.current) {
      return;
    }

    const status = result?.status;
    if (status === 'NOT FOUND') {
      if (loginType === 'Sales_Executive') {
        messageAlert('Sales Executive account not found. Please contact admin to get registered.');
        // NOTE (parity): pushes a NEW MobileLogin with no params (lang and registerType undefined), not a pop.
        navigation.push('MobileLogin');
        return;
      }
      // NOTE (parity): no `lang` goes along (otp.ts:137).
      navigation.push('Registration', { mobile_no: mobileNo, loginType });
      return;
    } else if (status === 'ACCOUNT SUSPENDED') {
      messageAlert('Your account has been suspended');
      navigation.push('MobileLogin');
      return;
    } else if (status === 'SUCCESS') {
      const user = result.user;
      if (!user || typeof user !== 'object') {
        // NOTE (parity): Ionic throws a TypeError at `result['user']['token'] = ...` (otp.ts:149) inside subscribe: nothing stored,
        // no navigation, the loader is already closed. Same here, without the red box.
        return;
      }
      // otp.ts:149-153: user.token = result.token, user.loginType = 'CMS', storage.set('userStorageData'), dbService.userStorageData
      await session.saveLoginResult(result);
      if (!alive.current) {
        return;
      }
      if (user.status !== 'Verified') {
        // NOTE (parity): `country` is undefined (otp.ts:157); the modal call is commented out, it is a pushed page.
        navigation.push('AboutusModal', { country: undefined });
        return;
      }
      // NOTE (parity): Ionic pushes TabsPage (otp.ts:163), it does not setRoot: the login pages stay below it in the stack.
      navigation.push('Tabs', { lang });
    }
    // NOTE (parity): any other status (or none) does nothing at all: no alert, the page just stays (loader already closed).
  }

  // otp.ts:226-244 onStartOtpExpireTimer: counts otpInputMaxTime down once a second, back to 30 when it reaches 0.
  function onStartOtpExpireTimer() {
    const id = setTimeout(() => {
      maxTime.current -= 1;
      if (maxTime.current > 0) {
        setOtpInputMaxTime(maxTime.current);
        onStartOtpExpireTimer();
      } else {
        maxTime.current = 30;
        setOtpInputMaxTime(30);
      }
    }, 1000);
    timers.current.push(id);
  }

  // otp.ts:169-211 onResendOtpHandler
  async function onResend() {
    loader.show();
    maxTime.current = 30;
    setOtpInputMaxTime(30);
    onStartOtpExpireTimer();
    // NOTE (parity): `if (this.counter == 0)` (otp.ts:176) never holds (the counter never runs): dead, not ported.
    data.current.mobile_no = mobileNo; // otp.ts:182
    // NOTE (parity): the body is the page's `data`: {otp: <what the user typed, absent when nothing was typed>, mobile_no}. No new
    // random OTP is generated here; the server's returned otp replaces smsOTP.
    const request = db.onPostRequestDataFromApi({ login_data: data.current }, 'app_karigar/karigarLoginOtp', db.rootUrl);
    setResendActiveClass(true);
    timers.current.push(
      setTimeout(() => {
        if (alive.current) {
          setResendActiveClass(false);
        }
      }, 30000),
    );
    try {
      const r = await request;
      if (r?.status === 'SUCCESS') {
        messageAlert('OTP has been sent.');
        smsOTP.current = r.otp;
      }
      loader.hide(); // otp.ts:195, after the alert was presented
    } catch {
      loader.hide();
      messageAlert('Error..!!!');
    }
  }

  const prompt = t('Enter your 6 digit number that sent to');
  const phrase = t('New OTP resent to be available in seconds');
  const resendLabel = t('Resend');
  const submitLabel = t('Submit');

  return (
    <View style={styles.screen}>
      {/* otp.html:2-8; NOTE (parity): navbar, so the back button shows when the page was pushed (the pop target is MobileLogin) */}
      <IonHeader>
        <IonNavbar
          color="white"
          tall
          overlay={
            <View testID="header-logo" style={styles.headerLogo}>
              <Image source={logo} resizeMode="contain" style={[styles.headerLogoImg, { width: logoHeight * logoRatio }]} />
            </View>
          }
        />
      </IonHeader>

      {/* otp.html:10-46 */}
      <IonContent contentStyle={styles.contentFill}>
        <View style={styles.form}>
          <View style={styles.mainLogin}>
            <View style={styles.mobileLogin}>
              <View style={styles.text}>
                <Text style={[styles.p, { lineHeight: normalLine(14, prompt) }]}>
                  {prompt}
                </Text>
                {/* otp.html:17-19: `<span>+91</span> {{mobileNo}}` */}
                <View style={styles.spanRow}>
                  <Text testID="otp-mobile" style={styles.span}>
                    {'+91 '}
                    {mobileNo}
                  </Text>
                </View>
              </View>

              <View>
                <View style={styles.inputAdjust}>
                  <TextInput
                    testID="otp-input"
                    style={styles.input}
                    value={otpText}
                    onChangeText={onChange}
                    onBlur={() => setTouched(true)}
                    keyboardType="phone-pad"
                    maxLength={6}
                    placeholder={t('Enter OTP')}
                    placeholderTextColor={placeholderColor}
                    autoComplete="off"
                    autoCorrect={false}
                    underlineColorAndroid="transparent"
                  />
                  {!isOtpValid && touched ? (
                    <View testID="otp-error" style={styles.eror}>
                      <Text style={styles.erorText}>{t('Wrong OTP value')}</Text>
                    </View>
                  ) : null}
                </View>
                {resendActiveClass === true ? (
                  <View testID="otp-resend-wait" style={[styles.resend, styles.resendDim]}>
                    <View style={styles.resendA}>
                      <Text style={[styles.resendText, { lineHeight: normalLine(12, phrase) }]}>
                        {phrase} {otpInputMaxTime}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.resend}>
                    <Pressable testID="otp-resend" onPress={onResend} style={styles.resendA}>
                      <Text style={[styles.resendText, { lineHeight: normalLine(12, resendLabel) }]}>
                        {resendLabel}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <View style={styles.loginBtn}>
                <Pressable
                  testID="otp-submit"
                  disabled={!isOtpValid}
                  onPress={onSubmit}
                  style={[styles.button, !isOtpValid && styles.buttonDisabled]}
                >
                  <Text style={styles.buttonText} numberOfLines={1}>
                    {submitLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </IonContent>
    </View>
  );
}
