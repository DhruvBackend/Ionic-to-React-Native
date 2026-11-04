// Ported from: src/pages/survey/survey-list/survey-list.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonCard, IonCardHeader } from '../../components/ionic/IonCard';
import { IonContent } from '../../components/ionic/IonContent';
import { IonIcon } from '../../components/ionic/IonIcon';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { cardMd } from '../../theme/ionicMdContent';
import { collapseWs, interp } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: object };
}

// NOTE (parity): survey-list.module.ts has its own TranslateModule.forRoot but the page never calls use(): global i18n (same as Contact).
// NOTE (parity): html:11-22 is a first <ion-content> that holds only the refresher. The second <ion-content padding> (html:24) is laid over it
// and takes every touch, so that refresher never pulls: doRefresh() (.ts:63-69, a 2 s timer + complete()) is dead code and is not ported.
export default function SurveyListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const loader = useLoader();
  const alive = useRef(true);
  const [, setTick] = useState(0);
  const rerender = () => {
    if (alive.current) {
      setTick(n => n + 1);
    }
  };
  const surveyList = useRef<any>([]); // :12 surveyList:any=[]
  const [viewport, setViewport] = useState(0);

  // :26-31 ionViewDidLoad: getSurveyList() first, then presentLoading() ('Please wait...', dismissOnPageChange: true)
  useEffect(() => {
    alive.current = true;
    getSurveyList();
    loader.show('Please wait...', { dismissOnPageChange: true });
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :39-54 getSurveyList()
  function getSurveyList() {
    db.onPostRequestDataFromApi({ user_id: db.userStorageData?.id }, 'master/surveyList', db.rootUrl).then(
      (response: any) => {
        loader.hide(); // :43 this.loading.dismiss(), before anything is read
        try {
          if (response != null) {
            surveyList.current = response.surveyList.data; // :47 (surveyList: null throws: the list keeps its value)
          }
        } catch {
          // TypeError in Ionic's subscribe callback
        } finally {
          rerender();
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (dismissOnPageChange only closes it on a page change).
      () => {},
    );
  }

  // :33-35 Slist(id)
  function Slist(id: any) {
    navigation.push('SurveyDetail', { id });
  }

  // html:26 `*ngIf="!surveyList.length == 0"` is (!length) == 0: true only for a non-empty list; html:34 `*ngIf="!surveyList.length"`.
  // NOTE (parity): a surveyList that is null / undefined (`data` missing) throws on `.length` in Angular's change detection: the DOM of the last
  // completed render stays, so the last valid list is kept here.
  const shown = useRef<any[]>([]);
  if (surveyList.current != null && typeof surveyList.current.length === 'number') {
    shown.current = surveyList.current;
  }
  const list: any[] = shown.current;
  const hasRows = list.length > 0;
  const imgH = 100; // [CSS] `.data-not img { height: 100px }`

  return (
    <View style={styles.screen}>
      {/* html:8-12 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(t('Survey'))} />
      </IonHeader>

      {/* html:24 <ion-content padding> */}
      <IonContent padding onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {hasRows ? (
          <View testID="surveylist-cards">
            {list.map((row: any, i: number) => (
              <IonCard key={i} stacked={i > 0} style={styles.card} testID={`surveylist-card-${i}`}>
                {/* html:28 (click)="Slist(list.id)" is on the card header */}
                <Pressable onPress={() => Slist(row?.id)}>
                  <IonCardHeader style={styles.cardHeader}>
                    <Text
                      testID={`surveylist-title-${i}`}
                      numberOfLines={1}
                      style={textStyle(14, 600, cardMd.header.color)}
                    >
                      {collapseWs(interp(row?.title))}
                    </Text>
                    <IonIcon name="arrow-forward" size={22} color={cardMd.header.color} style={styles.arrow} />
                  </IonCardHeader>
                </Pressable>
              </IonCard>
            ))}
          </View>
        ) : (
          // html:34-36 `.data-not`: height calc(100% - 50px) of the padded scroll-content (viewport - 32)
          <View testID="surveylist-empty" style={[styles.dataNot, { height: Math.max(viewport - 32 - 50, 0) }]}>
            <SvgXml xml={noFoundXml} width={(imgH * noFoundSize.width) / noFoundSize.height} height={imgH} />
          </View>
        )}
      </IonContent>
    </View>
  );
}
