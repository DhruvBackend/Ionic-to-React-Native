// Ported from: src/pages/language/language.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonRadio, IonRadioGroup } from '../../components/ionic/IonChoice';
import { IonContent } from '../../components/ionic/IonContent';
import { IonItem, IonList, IonListHeader } from '../../components/ionic/IonList';
import { IonHeader, IonToolbar } from '../../components/ionic/IonNavbar';
import { textStyle } from '../../components/ionic/text';
import i18n from '../../i18n';
import { storage } from '../../storage';
import { itemContentMd } from '../../theme/ionicMdContent';
import { headerShadowPng } from '../../theme/ionicMdPickers';
import { styles } from './styles';

// Logo: the client's logo.png (Ionic assets/imgs/logo.png), copied by scripts/use-client.mjs.
const logo = require('../../assets/client/logo.png');

// Ionic text is HTML: runs of whitespace collapse to one space (hin.json "Continue" has two).
const collapse = (s: string) => s.replace(/\s+/g, ' ');

// Intrinsic ratio of the logo, so `img { height: 45px }` keeps its width (CSS auto width).
const logoSize = Image.resolveAssetSource?.(logo);
const logoRatio = logoSize?.width && logoSize?.height ? logoSize.width / logoSize.height : 1;

interface Props {
  navigation: { navigate: (name: string, params?: object) => void };
  route?: { params?: { come_from?: unknown } };
}

export default function LanguageScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  // language.ts:23-35 fields. `lang` is state for rendering and a ref for the handlers, because Ionic's `this.lang` is read
  // synchronously (the radio's page-level (click) runs right after the group updated the model).
  const [lang, setLangState] = useState<any>('en'); // language.ts:35
  const langRef = useRef<any>('en');
  const karigarId = useRef<any>(''); // language.ts:25
  const karigarDetail = useRef<any>({}); // language.ts:27
  const comeFrom = useRef<any>(''); // language.ts:24
  const inputs = useRef<any>([]); // language.ts:72
  const alive = useRef(true);

  const setLang = (v: any) => {
    langRef.current = v;
    if (alive.current) {
      setLangState(v);
    }
  };

  // language.ts:37-58 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    change_language();

    // NOTE (parity): language.ts:44 reads the bare storage key 'token', which the shipped app never writes (it keeps the JWT in
    // 'userStorageData'). So on a real device JwtDecode(null) throws and get_user_lang() is never called (card quirk 1). The same
    // key is read here; Ionic has no catch (unhandled rejection), it is swallowed here so nothing surfaces.
    storage
      .get('token')
      .then(resp => {
        const tokendata: any = jwtDecode(resp);
        // NOTE (parity): language.ts:47-48 `// this.karigar_id = tokendata.sub; this.karigar_id = tokendata;` the whole payload
        // object is what gets posted as login_id / data.id (card quirk 2).
        karigarId.current = tokendata;
        get_user_lang();
      })
      .catch(() => {});

    comeFrom.current = route?.params?.come_from; // language.ts:55 (never used afterwards)
    // NOTE (parity): language.ts:56-57 setDefaultLang('en') + use('en'): the page resets the app language every time it opens
    // (card quirk 7). setDefaultLang('en') is the fixed fallbackLng 'en' of src/i18n.
    i18n.changeLanguage(langRef.current);
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // language.ts:74-85
  function change_language() {
    inputs.current = [];
    db.get_rqst('app_karigar/get_languages')
      .then(resp => {
        inputs.current = resp;
        // NOTE (parity): Ionic then calls this.loading.dismiss() while presentLoading() is commented out, so `loading` is
        // undefined and the callback throws after the assignment. `inputs` is never rendered (quirk 3).
      })
      .catch(() => {}); // Ionic has no error callback: nothing happens on failure
  }

  // language.ts:87-115 continue(). NOTE (parity): the three translate.get() strings it fetches (Please Select Country? / NO / OK)
  // are never shown, so they are not fetched here (quirk 5).
  function continue_() {
    karigarDetail.current.language = langRef.current;
    karigarDetail.current.id = karigarId.current;
    db.post_rqst({ data: karigarDetail.current }, 'app_karigar/update_language')
      .then(() => {
        // NOTE (parity): only in the success callback; an HTTP error does nothing at all (no loader, toast or alert) (quirk 5).
        navigation.navigate('SelectRegistrationType', { lang: langRef.current });
      })
      .catch(() => {});
  }

  // language.ts:117-120
  function set_lang() {
    // NOTE (parity): runs after the radio group updated the model, so the language changes at once (quirk 6).
    i18n.changeLanguage(langRef.current);
  }

  // language.ts:182-197 get_user_lang(). The second storage.get("token") + getDecodedAccessToken() only fills `tokenInfo`, which is
  // never read, so it is not repeated.
  function get_user_lang() {
    db.post_rqst({ login_id: karigarId.current }, 'app_karigar/get_user_lang')
      .then(resp => {
        // NOTE (parity): `resp['language']`: a response without it leaves `lang` undefined (no radio checked, Continue still shown)
        // (quirk 4); "" becomes "en".
        let l = resp?.language;
        if (l === '') {
          l = 'en';
        }
        setLang(l);
        i18n.changeLanguage(l);
      })
      .catch(() => {});
  }

  // NOTE (parity): `lang != ''` is true for undefined too.
  const showContinue = lang !== '';
  const paragraph = textStyle(itemContentMd.paragraph.fontSize, 400, itemContentMd.paragraph.color);

  return (
    <View style={styles.screen}>
      {/* language.html:1-7 */}
      <IonHeader>
        <IonToolbar color="white" style={styles.toolbar}>
          {/* NOTE (parity): toolbar, not navbar: no title and no back button, even when pushed (quirk 10). */}
          <View testID="header-logo" style={styles.headerLogo}>
            <Image source={logo} resizeMode="contain" style={[styles.headerLogoImg, { aspectRatio: logoRatio }]} />
          </View>
        </IonToolbar>
      </IonHeader>

      {/* language.html:10-47; the commented country list (:11-27) is not ported */}
      <IonContent padding>
        <View style={styles.mt16}>
          <IonList style={styles.list}>
            <IonRadioGroup value={lang} onChange={setLang}>
              <IonListHeader borderHeading>
                <View style={styles.headerLabel}>
                  <Text style={paragraph}>भाषा चुनिए / Choose Your Language</Text>
                </View>
                <View style={styles.headerBar} />
              </IonListHeader>

              <IonItem
                testID="lang-en"
                label="अंग्रेज़ी (English)" // NOTE (parity): the source has two spaces; HTML collapses them (quirk 9)
                style={styles.item}
                innerStyle={styles.itemInner}
                labelStyle={styles.itemLabel}
              >
                <IonRadio testID="lang-en-radio" value="en" checked={String(lang === 'en')} onPress={set_lang} />
              </IonItem>

              <IonItem
                testID="lang-hin"
                label="हिंदी (Hindi)"
                style={[styles.item, styles.itemLast]}
                innerStyle={styles.itemInner}
                labelStyle={styles.itemLabel}
              >
                <IonRadio testID="lang-hin-radio" value="hin" checked={String(lang === 'hin')} onPress={set_lang} />
              </IonItem>
            </IonRadioGroup>
          </IonList>
        </View>
      </IonContent>

      {/* language.html:48-51 */}
      <View style={styles.footer}>
        <View pointerEvents="none" style={styles.footerShadow}>
          <Image source={{ uri: headerShadowPng }} resizeMode="repeat" style={styles.footerShadowImg} />
        </View>
        {showContinue ? (
          <IonButton testID="lang-continue" full onPress={continue_}>
            {collapse(t('Continue'))}
          </IonButton>
        ) : null}
      </View>
    </View>
  );
}
