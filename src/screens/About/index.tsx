// Ported from: src/pages/about/about.html + .ts + .scss
import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { client } from '../../config/client';
import { collapseWs } from '../../ui/angularPipes';
import { md } from '../../theme/ionicMd';
import { formatSize, formatXml } from './format';
import { styles } from './styles';

interface Props {
  navigation?: object;
  route?: { params?: object };
}

// NOTE (parity): about.ts has no module and no endpoints, storage, loaders or nav calls (navCtrl is injected but unused). The page never
// calls use(): the app's current language shows (RN: global i18n).
export default function AboutScreen(_props: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const usertype = db.userStorageData?.type; // :13 this.usertype = dbService.userStorageData.type
  const isPlumber = usertype == 'Plumber'; // eslint-disable-line eqeqeq

  return (
    <View style={styles.screen}>
      {/* html:1-7 <ion-header class="main-header" [ngClass]="{'remove': usertype == 'Plumber'}"> + <ion-navbar color="primary"> */}
      <IonHeader mainHeader remove={isPlumber}>
        <IonNavbar color="primary" title={collapseWs(t('Company Profile'))} />
      </IonHeader>

      {/* html:9-44 */}
      <IonContent>
        <View style={styles.aboutInfo}>
          {/* html:11-16 */}
          <View style={styles.content}>
            <SvgXml xml={formatXml} width={formatSize.width} height={formatSize.height} />
            {/* NOTE (parity): the inline <img> sits on the text baseline: ~4px descender gap below it before the paragraph */}
            <View style={styles.gap} />
            <View style={styles.pWrap}>
              {/* html:13 {{ 'Welcome To Topsan' | translate }} (the key is the template text with the client app name) */}
              <Text testID="about-welcome" style={[textStyle(16, 600, md.textColor, 28), styles.welcome]}>
                {collapseWs(t(`Welcome To ${client.appName}`))}
              </Text>
              <View style={styles.bar} />
            </View>
          </View>

          {/* html:18-42: the four <li> keys come from the client config (exact template text, white space kept) */}
          <View style={styles.perha}>
            {(client.aboutParagraphs ?? []).map((k, i) => (
              <View key={i} style={styles.li}>
                <Text testID={`about-p-${i}`} style={textStyle(14, 400, md.textColor, 22)}>
                  {collapseWs(t(k))}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </IonContent>
    </View>
  );
}
