// Ported from: src/pages/select-registration-type/select-registration-type.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IonButton } from '../../components/ionic/IonButton';
import { IonRadio, IonRadioGroup } from '../../components/ionic/IonChoice';
import { IonContent } from '../../components/ionic/IonContent';
import { IonItem, IonList, IonListHeader, IonParagraph } from '../../components/ionic/IonList';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { IonFooter, IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import i18n from '../../i18n';
import { logoHeight, styles } from './styles';

// Logo: the client's logo.png (Ionic assets/imgs/logo.png), copied by scripts/use-client.mjs.
const logo = require('../../assets/client/logo.png');
// CSS `img { height: 45px }` gives an auto width of height * intrinsic ratio (an aspectRatio style left the width at the intrinsic size on Android).
const logoSize = Image.resolveAssetSource?.(logo);
const logoRatio = logoSize?.width && logoSize?.height ? logoSize.width / logoSize.height : 1;

interface Props {
  navigation: { navigate: (name: string, params?: object) => void };
  route?: { params?: { lang?: unknown } };
}

export default function SelectRegistrationTypeScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  // NOTE (parity): select-registration-type.ts:36 `this.lang = navParams.get("lang")`, no default (card quirk 4).
  const lang = useRef<any>(route?.params?.lang).current;
  // NOTE (parity): `data: any = []` used as an object; `data.registerType = ''` (ts:27, :35, card quirk 6).
  const [registerType, setRegisterType] = useState<any>('');

  // ts:42-45 ionViewDidLoad. NOTE (parity): setDefaultLang(lang) + use(lang); Ionic's is per page module, here the global
  // i18n switches (card quirk 5). The fixed fallbackLng is 'en'. A missing lang is skipped (Ionic would request undefined.json).
  useEffect(() => {
    if (lang) {
      i18n.changeLanguage(lang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ts:50-60
  function goToRegisterPage() {
    // NOTE (parity): loose `==`; 'Employee'/'DrLogin' are offered by no radio, so the Login branch is dead (card quirk 2).
    // eslint-disable-next-line eqeqeq
    if (registerType == 'Employee' || registerType == 'DrLogin') {
      navigation.navigate('Login', { registerType, lang });
    } else {
      navigation.navigate('MobileLogin', { registerType, lang });
    }
  }

  // NOTE (parity): presentLoading() (ts:62-72, "Please wait...") and onBackButtonClickHanlder() (ts:75-77) are never called: not ported (card quirk 7).

  const radio = (id: string, label: string, value: string) => (
    <IonItem testID={`reg-${id}`} label={t(label)} style={styles.item} innerStyle={styles.itemInner} labelStyle={styles.itemLabel}>
      <IonRadio testID={`reg-${id}-radio`} color="primary" value={value} />
    </IonItem>
  );

  return (
    <View style={styles.screen}>
      {/* html:2-8. NOTE (parity): a navbar, so the back arrow shows when pushed (card quirk 8). */}
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

      {/* html:12-47 */}
      <IonContent>
        <IonList style={styles.list}>
          <IonRadioGroup value={registerType} onChange={setRegisterType}>
            <IonListHeader borderHeading>
              <IonParagraph>{t('Select Registration Type')}</IonParagraph>
            </IonListHeader>
            {radio('plumber', 'Plumber', 'Plumber')}
            {radio('seller', 'Seller', 'Sales_Boy')}
            {/* NOTE (parity): 'Dealer' and 'Sales Executive' exist in no i18n file: the key itself shows in every language (card quirk 3). */}
            {radio('dealer', 'Dealer', 'Dealer')}
            {radio('sales-executive', 'Sales Executive', 'Sales_Executive')}
            {/* html:37-40: the Customer ("Consumer") radio is commented out (card quirk 1). */}
          </IonRadioGroup>
        </IonList>
      </IonContent>

      {/* html:49-53. NOTE (parity): absolute bottom-right pill inside a 0-high footer (card quirk 9). */}
      <IonFooter>
        <IonButton
          testID="reg-go"
          color="primary"
          disabled={!registerType}
          onPress={goToRegisterPage}
          style={styles.signupBtn}
          labelStyle={styles.signupLabel}
        >
          {t('Go')}
          <MaterialIcon name="arrow_forward" style={styles.signupIcon} />
        </IonButton>
      </IonFooter>
    </View>
  );
}
