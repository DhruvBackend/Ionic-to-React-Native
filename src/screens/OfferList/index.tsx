// Ported from: src/pages/offer-list/offer-list.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonItem } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import i18n from '../../i18n';
import { activeNavNames } from '../../navigation/navigationRef';
import { collapseWs, datePipe, titlecase } from '../../ui/angularPipes';
import { colors } from '../../theme';
import { useLoader } from '../../ui/useLoader';
import { noFoundSize, noFoundXml } from './noFound';
import { styles } from './styles';




// app.getActiveNav() page names that offer-list.ts:131 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];


interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'blur', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: { lang?: any } };
}

export default function OfferListScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  // offer-list.ts:16-23 fields. NOTE (parity): `lang` stays undefined when the page is pushed without params (tabs.ts:41 tab5Root has no
  // rootParams; home.ts:492/799/1007 and app.component.ts:942 push OfferListPage with no params), so Offers also gets lang: undefined.
  const lang = useRef<any>(route?.params?.lang); // :34 (the default 'en' of :20 is always overwritten, even by undefined)
  const url = db.upload_url3; // :32 this.url = dbService.upload_url3
  const [offerList, setOfferList] = useState<any>([]); // :17 offer_list:any=[]
  const [viewport, setViewport] = useState(0); // ion-content height, for `.data-not { height: calc(100% - 50px) }`
  const alive = useRef(true);

  // :47-57 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    // NOTE (parity): ionViewDidLoad runs setDefaultLang/use with `lang` as given. With lang undefined (every real entry) ngx-translate tries
    // assets/i18n/undefined.json, fails and keeps the current language, so changeLanguage is only called with a defined `lang`
    // (setDefaultLang(lang) is the fixed fallbackLng 'en' of src/i18n). The page's offer-list.module.ts has its own TranslateModule.forRoot
    // but app.module.ts imports OfferListPageModule eagerly, so it shares the root TranslateService: the language is global, like here.
    // NOTE (parity): the `if(connection!='offline')` at :49 guards only setDefaultLang; use(lang) and the block below run regardless.
    // dbService.connection is never assigned anywhere in the Ionic app, so the offline branches (:41-44) never run.
    // NOTE (parity): get_user_lang() (:91-112, endpoint app_karigar/get_user_lang) is dead code: nothing calls it, so it is not ported.
    if (lang.current !== undefined) {
      i18n.changeLanguage(lang.current);
    }
    getofferList(); // :53
    presentLoading(); // :54
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :118-143 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen and on a tab switch, like Ionic's didLeave.
  // NOTE (parity): when the nav that is active after leaving shows one of the root pages (and its previous page is not one of them),
  // this.navCtrl.popToRoot() resets this page's own stack. The only visible case: OfferList pushed on the Home tab, then another root tab
  // (Profile, ...) selected: the Home tab's stack returns to Home. At a stack root popToRoot does nothing.
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

  // :59-64 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response (the list updates when it arrives).
  function doRefresh(refresher: { complete: () => void }) {
    getofferList();
    refresher.complete();
  }

  // :66-70 goOnOffersPage(id)
  function goOnOffersPage(id: any) {
    navigation.push('Offers', { id, lang: lang.current });
  }

  // :71-80 getofferList()
  function getofferList() {
    db.onPostRequestDataFromApi({ karigar_id: db.userStorageData?.id }, 'app_karigar/offerList', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :75 this.loading.dismiss() (before the model is assigned)
        const next = r?.offer; // :76
        if (next == null) {
          // NOTE (parity): `offer: null` (or a missing key) makes `!offer_list.length` throw during Ionic's change detection: the view keeps
          // what it showed before (the empty-state image on first load, the old list after a refresh) and no error is shown. RN skips
          // the update the same way instead of crashing.
          return;
        }
        if (alive.current) {
          setOfferList(next);
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :82-89 presentLoading(): content 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show();
  }

  // html:12 `*ngIf="!offer_list.length"`, html:18 `*ngIf="offer_list.length"`
  const empty = !offerList.length;
  const imgH = 100; // `.data-not img { height: 100px }`

  return (
    <View style={styles.screen}>
      {/* html:1-7 */}
      <IonHeader mainHeader>
        {/* NOTE (parity): the title is 'My Offer' | translate with a trailing space inside the interpolation; the back button is hidden by
            `.main-header ion-navbar button { display: none !important }`. */}
        <IonNavbar color="primary" title={collapseWs(t('My Offer'))} />
      </IonHeader>

      {/* html:9-42 */}
      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:10-17 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:12-15 */}
        {empty ? (
          <View testID="offer-empty" style={[styles.dataNot, { height: Math.max(viewport - 50, 0) }]}>
            <SvgXml xml={noFoundXml} width={(imgH * noFoundSize.width) / noFoundSize.height} height={imgH} />
          </View>
        ) : null}

        {/* html:18-41. NOTE (parity): the source has `*ngIf="offer_list.length"class="main-div"` (no space): harmless in Angular. */}
        {!empty ? (
          <View testID="offer-list-main">
            <View style={styles.product}>
              {offerList.map((list: any, i: number) => (
                <IonItem
                  key={i}
                  testID={`offer-item-${i}`}
                  button
                  noLines
                  style={styles.bgProduct}
                  innerStyle={styles.itemInner}
                  onPress={() => goOnOffersPage(list.id)}
                >
                  <View style={styles.label}>
                    <View style={styles.thumbnail}>
                      {/* html:28 src="{{url+list.offer_banner}}" (string concatenation) */}
                      <Image testID={`offer-banner-${i}`} source={{ uri: url + list.offer_banner }} resizeMode="stretch" style={styles.thumbnailImg} />
                    </View>
                    <View style={styles.errow}>
                      <View style={styles.listTags}>
                        {/* html:33 {{list.title | titlecase | translate}}. NOTE (parity): the h1/p are nowrap inside ion-label (clipped, no
                            ellipsis); a very long title pushes the arrow out of the item, here the arrow overflows the same way. */}
                        <Text testID={`offer-title-${i}`} numberOfLines={1} ellipsizeMode="clip" style={[textStyle(15, 600, colors.white, 18), styles.h1]}>
                          {collapseWs(t(titlecase(list.title) ?? ''))}
                        </Text>
                        {/* html:34 {{ 'Valid Upto' | translate}} : {{list.end_date | date:'d MMMM y'}} */}
                        <Text testID={`offer-valid-${i}`} numberOfLines={1} ellipsizeMode="clip" style={[textStyle(12, 400, colors.white), styles.p]}>
                          {`${collapseWs(t('Valid Upto'))} : ${datePipe(list.end_date, 'd MMMM y')}`}
                        </Text>
                      </View>
                      {/* html:35 <i class="material-icons">trending_flat</i> */}
                      <MaterialIcon name="trending_flat" size={28} color={colors.white} style={styles.arrow} />
                    </View>
                  </View>
                </IonItem>
              ))}
            </View>
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
