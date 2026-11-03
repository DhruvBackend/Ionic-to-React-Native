// Ported from: src/pages/login-section/mobile-login/mobile-login.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import { Text } from '../../components/ionic/IonText';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { generateLoginOtp } from '../../auth/otp';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { clipSafeLineBox, textStyle } from '../../components/ionic/text';
import i18n from '../../i18n';
import { colors } from '../../theme';
import { loginMd } from '../../theme/ionicMdLogin';
import { showAlert, showToast } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { logoHeight, styles } from './styles';

// Logo: the client's logo.png (Ionic assets/imgs/logo.png), copied by scripts/use-client.mjs.
const logo = require('../../assets/client/logo.png');
// Intrinsic ratio of the logo: CSS `img { height: 45px }` has an auto width (see Language: an aspectRatio style is not enough on Android).
const logoSize = Image.resolveAssetSource?.(logo);
const logoRatio = logoSize?.width && logoSize?.height ? logoSize.width / logoSize.height : 1;

// Ionic text is HTML: runs of whitespace collapse to one space.
const collapse = (s: string) => s.replace(/\s+/g, ' ');

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: { registerType?: any; lang?: any } };
}

export default function MobileLoginScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  // mobile-login.ts:16-22 fields. NOTE (parity): `registerType` / `lang` are undefined when Otp pushes the page with no params
  // (otp.ts:87, :97, :217); they are passed on as undefined (checkType then has no `type` key, quirk 1).
  const loginType = useRef<any>(route?.params?.registerType); // :32
  const lang = useRef<any>(route?.params?.lang); // :34
  const data = useRef<any>({}); // :16 `data:any = {}` (ngModel target)
  const country = useRef<any>(undefined); // :22, never assigned (quirks 7, 10)
  const [mobileNo, setMobileNo] = useState<string>(''); // data.mobile_no (undefined until typed; '' after clearing)

  // :40-44 ionViewDidLoad
  useEffect(() => {
    // NOTE (parity): setDefaultLang(undefined)/use(undefined) fail in Ionic (assets/i18n/undefined.json) and leave the language as it
    // was, so changeLanguage is only called with a defined `lang` (quirk 1). setDefaultLang(lang) is the fixed fallbackLng 'en' of src/i18n.
    if (lang.current !== undefined) {
      i18n.changeLanguage(lang.current);
    }
  }, []);

  // html:23 (keypress)="dbService.onMobileValidateHandler($event)" (dbservice.ts:177-186)
  // NOTE (parity): Ionic blocks each TYPED character that is not 0-9 (paste is not filtered, quirk 3). RN has no keypress: a change that
  // adds exactly one non-digit character is rejected; a longer insertion (paste) is accepted.
  function onChangeText(text: string) {
    if (text.length === mobileNo.length + 1) {
      let i = 0;
      while (i < mobileNo.length && mobileNo[i] === text[i]) {
        i++;
      }
      if (!/[0-9]/.test(text[i])) {
        return;
      }
    }
    data.current.mobile_no = text;
    setMobileNo(text);
  }

  // :56-81 showAlert(). NOTE (parity): `translate.get('Change Language')` is overwritten by the next get() (:58-70), so the title is the key
  // 'This mobile  number is not vaild in ' + undefined; message is `this.sure` = ''. Unit-tested only (quirk 10).
  function showCountryAlert() {
    showAlert({
      title: collapse(t('This mobile  number is not vaild in ' + country.current)),
      message: '',
      buttons: [
        {
          text: t('Ok'),
          handler: () => {
            navigation.push('Language'); // :79 navCtrl.push(LanguagePage), no params
          },
        },
      ],
    });
  }

  // :87-93 presentToast(): ToastController.create({ message, duration: 3000 }) (default position bottom)
  function presentToast() {
    showToast(`${data.current.mobile_no} This mobile number has already been registered please use another number.`);
  }

  // :95-146 onLoginSubmitHandler()
  function onLoginSubmitHandler() {
    // NOTE (parity): no loader and no error callback on checkType; a failure does nothing (quirks 5, 11).
    db.onPostRequestDataFromApi({ mobile_no: data.current.mobile_no, type: loginType.current }, 'app_karigar/checkType', db.rootUrl)
      .then(r => {
        if (r?.status == 'TYPE_NOT_FOUND') { // eslint-disable-line eqeqeq
          presentToast();
          return;
        }

        loader.show(); // :103 dbService.onShowLoadingHandler(): 'Please wait...', dismissOnPageChange
        // NOTE (security, not changed): the OTP is generated on the phone and sent to the server (quirk 7); the bypass numbers get '123456'.
        data.current.otp = generateLoginOtp(data.current.mobile_no); // :104-112
        data.current.country = country.current; // :113 (undefined, dropped from the JSON body)
        db.onPostRequestDataFromApi({ login_data: data.current }, 'app_karigar/karigarLoginOtp', db.rootUrl)
          .then(r2 => {
            loader.hide(); // :119 onDismissLoadingHandler()

            if (r2?.status == 'REQUIRED MOBILE NO') { // eslint-disable-line eqeqeq
              // dbservice.ts:190-201 onShowMessageAlertHandler
              showAlert({ title: 'Message!', cssClass: 'action-close', subTitle: 'Please enter Mobile No to continue.', buttons: ['OK'] });
            } else if (r2?.status == 'WRONG COUNTRY') { // eslint-disable-line eqeqeq
              showCountryAlert();
            } else if (r2?.status == 'SUCCESS') { // eslint-disable-line eqeqeq
              // NOTE (parity): the OTP handed to the Otp page is the server's `r['otp']`, not the generated one (quirk 8).
              navigation.push('Otp', {
                lang: lang.current,
                otp: r2.otp,
                mobile_no: data.current.mobile_no,
                loginType: loginType.current,
              });
            }
            // any other status: nothing (quirk 9)
          })
          // NOTE (parity): Ionic has no error callback here, so after an HTTP error its 'Please wait...' loader stays up for good and blocks
          // the app (quirk 11). Copied: the loader is only hidden in the success callback (or when the page is left, dismissOnPageChange).
          .catch(() => {});
      })
      .catch(() => {});
  }

  // html:36 [disabled]="!data.mobile_no || data.mobile_no.length != '10'" (loose compare of 10 and '10')
  const disabled = !mobileNo || (mobileNo.length as any) != '10'; // eslint-disable-line eqeqeq

  // html:36 (click)="f.valid && onLoginSubmitHandler()": the form is valid with required + minlength 10 + maxlength 10, which `disabled`
  // already guarantees. NOTE (parity): `f.submitted` / 'is-invalid' have no CSS (quirk 4), so nothing else is ported.
  function onContinuePress() {
    if (!disabled) {
      onLoginSubmitHandler();
    }
  }

  return (
    <View style={styles.screen}>
      {/* html:2-8 */}
      <IonHeader>
        {/* NOTE (parity): a navbar, not a toolbar: the back arrow shows when the page is pushed (quirk 13). */}
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

      {/* html:10-46 */}
      <IonContent contentStyle={styles.content}>
        <View style={styles.mainLogin}>
          <View style={styles.mobileLogin}>
            <View style={styles.text}>
              {/* NOTE (parity): literal " !" after the translation (quirk 14) */}
              <Text style={textStyle(14, 500, loginMd.ink)}>{`${collapse(t('Enter your mobile number to get started'))} !`}</Text>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputAdjust}>
                {/* NOTE (parity): a native <input type=tel maxlength=10> (not ion-input) */}
                <TextInput
                  testID="mobile-input"
                  value={mobileNo}
                  onChangeText={onChangeText}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder={t('Mobile number')}
                  placeholderTextColor={loginMd.placeholder}
                  autoComplete="off"
                  autoCorrect={false}
                  underlineColorAndroid="transparent"
                  style={[styles.input, textStyle(14, 400, loginMd.ink, 16)]}
                />
                <View style={styles.fixedNumber}>
                  <Text style={textStyle(14, 600, loginMd.ink)}>+91</Text>
                </View>
              </View>
              <View style={styles.icon} pointerEvents="none">
                <MaterialIcon name="local_phone" color={loginMd.ink} />
              </View>
            </View>

            <View style={styles.loginBtn}>
              <Pressable
                testID="login-continue"
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={onContinuePress}
                style={[styles.loginBtnPress, disabled && styles.disabled]}
              >
                {/* NOTE (parity): a 14px line box clips the Devanagari matras above the ascent on Android ("आगे बढ़ें" lost े and ं);
                    clipSafeLineBox grows the Text box and gives the layout height back with a negative margin (see IonButton). */}
                <Text style={[textStyle(14, 100, colors.white, 14), clipSafeLineBox(14, 14), styles.loginBtnText]}>{collapse(t('Continue'))}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </IonContent>
    </View>
  );
}
