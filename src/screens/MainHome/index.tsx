// Ported from: src/pages/main-home/main-home.html + .ts + .scss (+ .module.ts)
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonItem, IonList } from '../../components/ionic/IonList';
import { Header } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import { colors } from '../../theme';
import { itemContentMd } from '../../theme/ionicMdContent';
import { mainHomeMd as M } from '../../theme/ionicMdMainHome';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { collapseWs } from '../../ui/angularPipes';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
}

export default function MainHomeScreen({ navigation }: Props) {
  // `| translate` re-renders on i18n.changeLanguage.
  // NOTE (parity): main-home.module.ts has its own TranslateModule.forRoot, but app.module.ts:213 imports MainHomePageModule eagerly, so the
  // page shares the root TranslateService; it never calls use()/setDefaultLang(): the language is whatever the app already had (global in RN too).
  const { t } = useTranslation();

  // NOTE (parity): main-home.ts:32-36 constructor: `if (dbService.connection == 'offline') { onShowMessageAlertHandler('Offline ! Please Connect To An
  // Active Internet Connection'); navCtrl.setRoot(HomePage) }`. dbService.connection is declared (dbservice.ts:63) but never assigned in the Ionic app,
  // so this guard is dead and is not ported (same as Home/OfferList/PointList).
  // NOTE (parity): goOnNotificationPage / goOnFeedbackPage (:47, :63): their buttons are commented out in the template (html:27-32) -> dead, not ported.
  // goOnNewsPage (:59) has no button at all; `items` (:19) is never used.

  const userType = db.userStorageData?.type; // html:13 dbService.userStorageData.type, read on every change detection
  const isPlumber = userType == 'Plumber'; // eslint-disable-line eqeqeq

  // The rows in template order; the Plumber-only row is an *ngIf (html:13). The stripe colour follows :nth-child among the rendered buttons.
  const rows: { id: string; label: string; target: string }[] = [];
  if (isPlumber) {
    rows.push({ id: 'super30', label: 'Super 30 Plumber', target: 'Super30' }); // :71 goOnSuper30Page
  }
  rows.push({ id: 'about', label: M.aboutKey, target: 'About' }); // :43 goOnAboutPage
  rows.push({ id: 'products', label: 'Products', target: 'Category' }); // :67 goOnProductsPage pushes CategoryPage
  rows.push({ id: 'videos', label: 'Videos', target: 'VideoCategory' }); // :55 goOnVideoPage
  rows.push({ id: 'contact', label: 'Contact Us', target: 'Contact' }); // :51 goOnContactPage

  // CSS `.listing button:nth-child(1n+1 | 2n+2 | 3n+3 | 4n+4)`: the later matching rule wins (1n+1 matches all, so child 1 and 5 are the first colour).
  const stripe = (n: number) => (n % 4 === 0 ? M.stripes[3] : n % 3 === 0 ? M.stripes[2] : n % 2 === 0 ? M.stripes[1] : M.stripes[0]);

  return (
    <View style={styles.screen}>
      {/* html:1-7 */}
      <Header mainHeader color="primary" title={collapseWs(t('Menu'))} />

      {/* html:10 <ion-content padding class="listing mt0">; html:11 <div class="list-adjust mt0"> */}
      <IonContent padding>
        <View style={styles.listAdjust}>
          <IonList style={styles.list}>
            {rows.map((row, i) => (
              <View key={row.id} style={styles.shadowBox}>
                <IonItem
                  button
                  noLines
                  testID={`mainhome-${row.id}`}
                  style={[styles.item, { borderLeftColor: stripe(i + 1) }]}
                  innerStyle={styles.itemInner}
                  onPress={() => navigation.push(row.target)}
                >
                  <View style={styles.label}>
                    <Text style={[textStyle(16, 400, itemContentMd.textColor, normalLineHeight(16)), styles.labelText]} numberOfLines={1} ellipsizeMode="clip">
                      {collapseWs(t(row.label))}
                    </Text>
                    {/* `<i class="material-icons">`: [T] 4035-4037 `.list-adjust ion-list button .item-inner .input-wrapper ion-label i { color: #002d25 }` (the brand colour) */}
                    <MaterialIcon name="keyboard_arrow_right" color={colors.primary} style={styles.icon} />
                  </View>
                </IonItem>
              </View>
            ))}
          </IonList>
        </View>
      </IonContent>
    </View>
  );
}
