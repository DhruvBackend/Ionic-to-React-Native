// Ported from: src/pages/aboutus-modal/aboutus-modal.html + .ts + .scss
import React from 'react';
import { Linking, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IonContent } from '../../components/ionic/IonContent';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { client } from '../../config/client';
import { colors } from '../../theme';
import { styles } from './styles';

interface Props {
  navigation: { reset: (state: { index: number; routes: { name: string; params?: object }[] }) => void };
  route?: { params?: { country?: any } };
}

// NOTE (parity): aboutus-modal.ts:19-24 reads navParams.data.country and dbService.userStorageData.country into fields that are never
// used (dead). The page has no endpoints, storage, loaders or alerts. dismiss() and exitapp() (ts:30-38) are never called by the
// template (dead, not ported).
export default function AboutusModalScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();

  // aboutus-modal.ts:40-44 gotoHomePage: this.navCtrl.setRoot(TabsPage, {index:'0'}) (the cancel icon, html:19-21)
  function gotoHomePage() {
    navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
  }

  return (
    <View style={styles.screen}>
      {/* html:1-5 header is commented out; `<ion-content padding>` */}
      <IonContent padding style={styles.content}>
        {/* html:7 `.main-modal`: height 100vh INSIDE the 16px content padding, so the page scrolls by 32 and the cancel icon
            (bottom 54) sits below the fold on a 360x800 screen */}
        <View testID="main-modal" style={[styles.mainModal, { height }]}>
          <View style={styles.modalBox}>
            <Text style={styles.h1}>{t(client.appName)}</Text>
            <Text style={styles.h2}>
              {/* i18n key = the Ionic template text with the client app name (double space kept) */}
              {t(`Your request to access the ${client.appName}  is under review. You will be able to log in as soon as the overseeing dealer acknowledges your application.`)}
              {'\n'}
              {/* NOTE (parity): en.json has a trailing space in this value; the Ionic reference shows none before the link (html:14 has no space
                  between the text and <a>), so it is trimmed. */}
              {t('Meanwhile, you can contact us').trimEnd()}
              <Text testID="aboutus-tel" style={styles.link} onPress={() => Linking.openURL('tel:8655050950')}>
                +91 8655050950
              </Text>
              {' '}
              {t('or mail us')}
              {' '}
              <Text testID="aboutus-mail" style={styles.link} onPress={() => Linking.openURL('mailto:care@topsan.in')}>
                care@topsan.in
              </Text>
              {' '}
              {t('if you any question')}
            </Text>
          </View>

          {/* html:19-21 `.modal-cls` (white circle) with a `<i class="material-icons">cancel</i>` of 30px, danger colour */}
          <View style={styles.modalClsWrap} pointerEvents="box-none">
            <Pressable testID="aboutus-cancel" onPress={gotoHomePage} style={styles.modalCls}>
              <MaterialIcon name="cancel" size={30} color={colors.danger} />
            </Pressable>
          </View>
        </View>
      </IonContent>
    </View>
  );
}
