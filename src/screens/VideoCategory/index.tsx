// Ported from: src/pages/video-category/video-category.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonItem, IonLabel, IonList } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import { useLoader } from '../../ui/useLoader';
import { collapseWs } from '../../ui/angularPipes';
import { colors } from '../../theme';
import { md } from '../../theme/ionicMd';
import { imgSize as noFoundSize, noFoundXml } from './noFound';
import { styles, stripeColor } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: object };
}

// NOTE (parity): video-category.module.ts has its own TranslateModule.forRoot, but the page never calls use(): the app's current
// language shows (RN: global i18n). navParams is injected but never read.
export default function VideoCategoryScreen({ navigation }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  const [noRec, setNoRec] = useState<any>(false); // :19 noRec:any=false
  const [categoryData, setCategoryData] = useState<any>([]); // :20 categoryData:any=[]
  const [viewport, setViewport] = useState(0);

  // :26 constructor -> getCatData() (the page itself, not ionViewDidLoad, which only logs)
  useEffect(() => {
    alive.current = true;
    getCatData();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :33-50 getCatData()
  function getCatData() {
    loader.show(); // :35 dbService.onShowLoadingHandler()
    db.onPostRequestDataFromApi({ type: db.userStorageData?.type }, 'app_master/VideoCatData', db.rootUrl).then(
      (r: any) => {
        const next = r?.categories; // :38
        if (next == null) {
          // NOTE (parity): `categories: null` (or a missing key) makes `categoryData.length` throw at :40 before the loader is dismissed
          // (:45): the loader stays up and the page stays empty. RN stops at the same point.
          return;
        }
        if (alive.current) {
          setCategoryData(next);
          if (next.length == 0) { // eslint-disable-line eqeqeq
            setNoRec(true); // :42
          }
        }
        loader.hide(); // :45
      },
      // :47-49 error callback: dismisses the loader
      () => {
        loader.hide();
      },
    );
  }

  // :52-55 goToVideosPage(cat)
  function goToVideosPage(cat: any) {
    navigation.push('Video', { cat });
  }

  const imgH = 100; // `.data-not img { height: 100px }`

  return (
    <View style={styles.screen}>
      {/* html:2-8 `.main-header.remove` + `<ion-navbar color="primary">`: back button shown */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(t('Video Categories'))} />
      </IonHeader>

      {/* html:11-23 `<ion-content padding class="listing mt0">` */}
      <IonContent padding onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:12-14. NOTE (parity): `.mt0` on the host only cancels `.listing`'s margin; the scroll-content keeps the header margin. `.data-not` is
            `calc(100% - 50px)` of the scroll-content's content box (viewport - 32 padding). */}
        {noRec ? (
          <View testID="videocat-empty" style={[styles.dataNot, { height: Math.max(viewport - 32 - 50, 0) }]}>
            <SvgXml xml={noFoundXml} width={(imgH * noFoundSize.width) / noFoundSize.height} height={imgH} />
          </View>
        ) : null}
        {/* html:15-21 */}
        <View style={noRec ? styles.listAdjustAfterNoRec : styles.listAdjust}>
          <IonList style={styles.list}>
            {categoryData.map((row: any, i: number) => (
              <IonItem
                key={i}
                testID={`videocat-item-${i}`}
                button
                noLines
                style={[styles.item, { borderLeftColor: stripeColor(i + 1) }]}
                innerStyle={styles.itemInner}
                onPress={() => goToVideosPage(row.category)}
              >
                {/* html:18 `{{row.category | translate}} <i class="material-icons">keyboard_arrow_right</i>` */}
                <IonLabel style={styles.label}>
                  <Text testID={`videocat-name-${i}`} style={textStyle(16, 400, md.textColor)}>
                    {collapseWs(t(row.category))}
                  </Text>
                  <MaterialIcon name="keyboard_arrow_right" size={24} color={colors.primary} />
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </View>
      </IonContent>
    </View>
  );
}
