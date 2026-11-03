// Ported from: src/pages/cancelation-policy/cancelation-policy.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { Header } from '../../components/ionic/IonNavbar';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { stripHtml } from '../../components/ionic/html';
import { textStyle } from '../../components/ionic/text';
import { md } from '../../theme/ionicMd';
import { buttonColors } from '../../theme/ionicMdContent';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation: { goBack: () => void };
  route?: { params?: object };
}

// NOTE (parity): cancelation-policy.module.ts has its own TranslateModule.forRoot, but app.module.ts:288 imports the module eagerly, so it
// shares the root TranslateService. The page never calls use()/setDefaultLang(): it shows the app's current language (RN: global i18n).
// NOTE (parity): the page reads no nav params (navParams is injected but unused); modalCtrl/translate/navCtrl fields are unused.
export default function CancelationPolicyScreen({ navigation }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  // :12 get_cancellation_policy:any (undefined until the response; `[innerHTML]` of undefined/null renders nothing)
  const [policy, setPolicy] = useState<any>(undefined);

  // :28-32 ionViewDidLoad -> get_notification()
  useEffect(() => {
    alive.current = true;
    getNotification();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :34-44 presentLoading(): translate.get("Please wait...") -> loadingCtrl.create({content, dismissOnPageChange: false}).present()
  // NOTE (parity): dismissOnPageChange is false in Ionic (the loader would outlive a page change); useLoader also hides it on unmount,
  // which only matters when the page is left while loading.
  function presentLoading() {
    loader.show(t('Please wait...'), { dismissOnPageChange: false });
  }

  // :46-56 get_notification()
  function getNotification() {
    presentLoading();
    db.post_rqst({}, 'app_master/cancellations_policy').then(
      (resp: any) => {
        // NOTE (parity): `resp.getData.tnc` throws inside Ionic's subscribe callback when getData is null/missing: the policy stays empty
        // and `this.loading.dismiss()` (the next line) never runs, so the 'Please wait...' loader stays up. RN returns at the same point.
        if (resp == null || resp.getData == null) {
          return;
        }
        if (alive.current) {
          setPolicy(resp.getData.tnc); // :52
        }
        loader.hide(); // :53 this.loading.dismiss()
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the loader stays up (until the page changes) and the page stays blank.
      () => {},
    );
  }

  // :59-61 closmodal(): this.viewCtrl.dismiss()
  // NOTE (parity): the page lives in Ionic's OverlayPortal (see route.ts), so dismiss() removes it and reveals what is underneath.
  function closmodal() {
    navigation.goBack();
  }

  return (
    <View style={styles.screen}>
      {/* html:1-10. Plain <ion-header> + <ion-navbar> (no main-header, no colour: white bar). */}
      {/* NOTE (parity): Ionic computes the back button when the page enters: the OverlayPortal still holds the modal view below it at
          that moment, so enableBack() is true and the arrow is shown (the md transition adds `show-back-button` and nothing removes it
          when the modal then dismisses itself). Its tap calls navCtrl.pop(), which removes the page from the portal, like the close icon. */}
      <Header
        title={t('Cancellation Policy')}
        overlay={
          // html:5-9 `<div class="header-icons">`: the `clear` icon button, class `cs-hdr-icons mr16`
          <View style={styles.headerIcons}>
            {/* NOTE (parity): `<button ion-button>` has no colour attribute, so its text colour is the primary button's white; on this plain
                white navbar the transparent button's `clear` icon is therefore white on white (to be confirmed on the Ionic capture). */}
            <IonButton testID="cancelpolicy-close" background="transparent" style={styles.hdrIconButton} onPress={closmodal}>
              <MaterialIcon name="clear" color={buttonColors(undefined).solid.text} />
            </IonButton>
          </View>
        }
      />
      {/* html:12-16 `<ion-content padding>` > `.policy-text` > `<p [innerHTML]="get_cancellation_policy">` */}
      <IonContent padding>
        <View testID="policy-text">
          {/* NOTE (parity): innerHTML text goes through the kit's stripHtml (only <br> and entities are interpreted, other tags are dropped);
              the server HTML may contain more (cancelation-policy.scss hides list bullets: `ul li { list-style: none }`). The global
              `p { margin: 0 !important; font-family: Roboto }` leaves a 14px Roboto black paragraph. */}
          <Text testID="policy-p" style={textStyle(14, 400, md.textColor)}>
            {policy == null ? '' : stripHtml(String(policy))}
          </Text>
        </View>
      </IonContent>
    </View>
  );
}
