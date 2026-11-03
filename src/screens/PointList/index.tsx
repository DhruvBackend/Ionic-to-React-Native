// Ported from: src/pages/points/point-list/point-list.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import { activeNavNames } from '../../navigation/navigationRef';
import { md } from '../../theme/ionicMd';
import { pointListMd as P } from '../../theme/ionicMdPointList';
import { collapseWs, interp } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { nextSvg } from './nextSvg';
import { styles } from './styles';

const scanIcon = require('./assets/scan.png');
const serviceIcon = require('./assets/service.png');
const referalIcon = require('./assets/referal.png');
const walletIcon = require('./assets/wallet.png');

// app.getActiveNav() page names that point-list.ts:146 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'blur', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: any };
}

export default function PointListScreen({ navigation }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  // point-list.ts:17-26 fields. NOTE (parity): userType is read once in the constructor (:34).
  const userType = useRef<any>(db.userStorageData?.type);
  const [karigarPoint, setKarigarPoint] = useState<any>({}); // :20 karigar_point:any={}
  const filter = useRef<any>({}); // :23 filter:any={}
  const offerId = useRef<any>({}); // :19 offerId:any={}

  // :44-55 ionViewDidLoad
  // NOTE (parity): the page's point-list.module.ts has its own TranslateModule.forRoot, but app.module.ts:210 imports PointListPageModule
  // eagerly, so it shares the root TranslateService; the page never calls setDefaultLang/use(), so the language is whatever the app has.
  // NOTE (parity): the offline guards (:37-41 constructor, :48 and :132) read dbService.connection, which is never assigned in the Ionic
  // app (never 'offline'), so they never run and are not ported. The dead methods are not ported either: loadData() (no ion-infinite-scroll
  // in the template; it would send couponHistory again with filter.limit = coupon_list.length), service() (:158, getPlumberComplaintList),
  // referal() (:172, referal_logs), goOnPointDetailPage, goOnHomePage, conInt.
  useEffect(() => {
    alive.current = true;
    getCoupanHistory(); // :50
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :130-154 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen and on a tab switch, like Ionic's didLeave.
  // NOTE (parity): when the nav that is active after leaving shows one of the root pages (and its previous page is not one of them),
  // this.navCtrl.popToRoot() resets this page's own stack. PointList is a tab root, so at a stack root popToRoot does nothing; it only
  // matters when PointList was pushed over Home (home.ts:196-198) and another root tab is then selected.
  useEffect(() => {
    if (!navigation.addListener) {
      return undefined;
    }
    return navigation.addListener('blur', () => {
      const names = activeNavNames();
      if (names && ROOT_PAGES.includes(names.active) && !ROOT_PAGES.includes(names.previous)) {
        const stack = navigation.getState?.();
        if (stack && stack.routes.length > 1) {
          try {
            navigation.popToTop?.();
          } catch {
            // nothing to pop
          }
        }
      }
    });
  }, [navigation]);

  // :57-62 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response (the values update when it arrives).
  function doRefresh(refresher: { complete: () => void }) {
    getCoupanHistory();
    refresher.complete();
  }

  // :75-94 getCoupanHistory()
  function getCoupanHistory() {
    presentLoading(); // :77
    filter.current.limit = 0; // :78
    db.onPostRequestDataFromApi({ filter: filter.current, karigar_id: db.userStorageData?.id }, 'app_karigar/couponHistory', db.rootUrl).then(
      (r: any) => {
        if (r) {
          // :83
          const next = r.karigar; // :85 r['karigar']
          loader.hide(); // :87 this.loading.dismiss() (after the model is assigned)
          if (next == null) {
            // NOTE (parity): `karigar: null` (or a missing key) makes `karigar_point.length` throw in the template's *ngIf during Ionic's
            // change detection: the view keeps what it showed before (blank values on first load, the old values after a refresh) and no
            // error is shown. RN skips the update the same way instead of crashing.
            return;
          }
          if (alive.current) {
            setKarigarPoint(next);
          }
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :99-107 presentLoading(): content 'Please wait...', dismissOnPageChange: true, enableBackdropDismiss: true
  // NOTE (parity): a refresh while the first request is pending creates a second loader in Ionic and orphans the first (stuck until the
  // page changes); the kit's useLoader dismisses the first one instead.
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: true, enableBackdropDismiss: true });
  }

  // :185-210 change_page(mode)
  function changePage(mode: string) {
    if (mode === 'scan') {
      navigation.push('PointHistory', { scan: mode });
    }
    if (mode === 'service') {
      navigation.push('PointHistory', { service: mode });
    }
    if (mode === 'referal') {
      navigation.push('PointHistory', { referal: mode });
    }
    if (mode == 'redeem') { // eslint-disable-line eqeqeq
      navigation.push('PointHistory', { redeem: mode });
    }
    // NOTE (parity): dead branch: filter.active_mode is never assigned (the line that set it, :187, is commented out), so Offers is never pushed.
    if (filter.current.active_mode == 'offer_list') { // eslint-disable-line eqeqeq
      navigation.push('Offers', { id: offerId.current });
    }
  }

  // html:14 `*ngIf="karigar_point.length != null || karigar_point.length != '' || karigar_point.length != undefind"`.
  // NOTE (parity): `length` of a plain object is undefined, and `undefined != ''` is true, so the block is always shown (also while the
  // values are still empty, before the response). A null karigar_point would throw, see getCoupanHistory().
  const kp = karigarPoint;
  const isPlumber = userType.current == 'Plumber'; // eslint-disable-line eqeqeq

  // `{{x}}` inside <p>/<td>: null/undefined print nothing
  const val = (v: any) => interp(v);
  // html:57-60 the <p> of the Redeem cell holds `{{total_redeem}}` and the icon: an all-white-space text run is no flex item
  const redeem = val(kp.total_redeem);

  const card = (key: string, icon: any, label: string, value: any, onPress?: () => void, flat?: boolean) => (
    <Pressable testID={key} onPress={onPress} style={styles.cardList}>
      <View style={styles.cardContent}>
        <Image source={icon} resizeMode="cover" style={styles.cardImg} />
        <Text style={[textStyle(14, 400, md.textColor), styles.cardText]}>{collapseWs(t(label))}</Text>
      </View>
      <View style={[styles.points, flat ? styles.pointsFlat : null]}>
        <Text testID={`${key}-value`} style={[textStyle(18, 600, md.textColor), styles.right]}>
          {val(value)}
        </Text>
        {flat ? null : (
          <View testID={`${key}-chevron`} style={styles.pointsAfter}>
            <View style={styles.pointsAfterBox}>
              <SvgXml xml={nextSvg} width={25} height={25} />
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      {/* html:2-6 */}
      <IonHeader mainHeader>
        <IonNavbar color="primary" title={collapseWs(t('My Points'))} />
      </IonHeader>

      {/* html:8-107 */}
      <IonContent>
        {/* html:10-13 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        <View style={styles.wrap}>
          {/* html:16-24 */}
          {card('point-scan', scanIcon, 'Earn By Scan Points', kp.earn_by_scan, () => changePage('scan'))}

          {/* html:26-34 */}
          {isPlumber ? card('point-service', serviceIcon, 'Earn By Service Points', kp.earn_by_service, () => changePage('service')) : null}

          {/* html:37-45 */}
          {card('point-referal', referalIcon, 'Earn By Referal Points', kp.earn_by_referal, () => changePage('referal'))}

          {/* html:47-64 */}
          <View style={styles.pointTable}>
            <View style={styles.tr}>
              <Text style={[styles.td, styles.tdLabel, textStyle(14, 400, md.textColor, 20)]}>{collapseWs(t('Total Earn Point'))}</Text>
              <Text testID="point-total-earn" style={[styles.td, styles.tdValue, styles.pr29, textStyle(18, 600, md.textColor, 20), styles.right]}>
                {val(kp.total_earn)}
              </Text>
            </View>
            {/* html:54-62 the Redeem row is clickable */}
            <Pressable testID="point-redeem" onPress={() => changePage('redeem')} style={styles.tr}>
              <Text style={[styles.td, styles.tdLabel, textStyle(14, 400, md.textColor, 20)]}>{collapseWs(t('Redeem Point'))}</Text>
              <View style={[styles.td, styles.tdValue]}>
                <View style={styles.tdP}>
                  {redeem.trim() !== '' ? (
                    <Text testID="point-total-redeem" style={textStyle(18, 600, P.red, 20)}>
                      {redeem}
                    </Text>
                  ) : null}
                  <MaterialIcon name="chevron_right" size={24} color={P.red} />
                </View>
              </View>
            </Pressable>
          </View>

          {/* html:67-75 `.points.flat`: no arrow, no click */}
          {card('point-balance', walletIcon, 'Total Balance', kp.total_balance, undefined, true)}
        </View>
      </IonContent>
    </View>
  );
}
