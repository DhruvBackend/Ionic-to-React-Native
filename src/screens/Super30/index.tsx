// Ported from: src/pages/super30/super30.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonItem } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import { colors } from '../../theme';
import { itemContentMd } from '../../theme/ionicMdContent';
import { super30Md as S } from '../../theme/ionicMdSuper30';
import { collapseWs, interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { styles } from './styles';

interface Props {
  navigation?: object;
}

// html:56-57 `<img [src]="row.profile">` inside `.photo` (55x55, overflow hidden, centred): `img { height: 100%; border-radius: 8px;
// max-width: inherit }`, width auto from the picture's own ratio (wider than 55 is cut off by the circle, centred).
function Photo({ uri, testID }: { uri: any; testID: string }) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (typeof uri !== 'string' || !uri) {
      return undefined;
    }
    let live = true;
    try {
      Image.getSize(
        uri,
        (w, h) => live && setNatural({ w, h }),
        () => {},
      );
    } catch {
      // not loadable: stays empty like a broken <img>
    }
    return () => {
      live = false;
    };
  }, [uri]);
  const width = natural && natural.h ? (55 * natural.w) / natural.h : 0;
  return (
    <View testID={testID} style={styles.photo}>
      {typeof uri === 'string' && uri && width > 0 ? <Image source={{ uri }} resizeMode="stretch" style={[styles.photoImg, { width }]} /> : null}
    </View>
  );
}

// `.list.active .detail { background: linear-gradient(to right, #11998e, #38ef7d) }`
function Gradient() {
  return (
    <View testID="super30-gradient" pointerEvents="none" style={styles.gradientClip}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={S.gradientFrom} />
            <Stop offset="1" stopColor={S.gradientTo} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#g)" />
      </Svg>
    </View>
  );
}

export default function Super30Screen(_props: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  // super30.ts:17-23 fields. NOTE (parity): `filter` is one shared object (limit, country), serialised at each send.
  const filter = useRef<any>({});
  const selfIndex = useRef<any>(undefined); // :20 SelfData.index (set once found, never reset)
  const [plumberList, setPlumberList] = useState<any>([]); // :17 plumber_list:any=[]
  const [shownIndex, setShownIndex] = useState<any>(undefined); // what the title shows
  const [viewport, setViewport] = useState(0); // ion-content height, for `.data-not { height: calc(100% - 50px) }`

  // :36-41 ionViewDidLoad: getcountry() (the constructor's calls are commented out; there is no ionViewWillEnter, so returning does not reload).
  // NOTE (parity): i18n: super30.module.ts has its own TranslateModule.forRoot but app.module.ts:240 imports Super30PageModule eagerly,
  // so the root TranslateService is shared; the page never calls use()/setDefaultLang(): it shows the app-wide language (global in RN too).
  useEffect(() => {
    alive.current = true;
    getcountry();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :43-49 presentLoading(): content 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show();
  }

  // :51-56 doRefresh(refresher)
  // NOTE (parity): getList('') is called with an EMPTY country (not this.country), and complete() right away, without waiting for the response.
  function doRefresh(refresher: { complete: () => void }) {
    getList('');
    refresher.complete();
  }

  // :58-72 getcountry()
  // NOTE (parity): no error callback: after an HTTP error nothing happens (no loader was shown yet). A null body throws at `r.country`
  // (nothing happens); a body without `country` calls getList(undefined).
  function getcountry() {
    db.get_rqst('app_karigar/get_country').then(
      (r: any) => {
        if (r == null) {
          return;
        }
        getList(r.country); // :64-69 (country, country_name = country)
      },
      () => {},
    );
  }

  // :73-103 getList(country)
  function getList(country: any) {
    filter.current.limit = 0; // :77
    filter.current.country = country; // :78
    presentLoading(); // :81
    // NOTE (parity): `this.loading.dismiss()` runs right after present(), BEFORE the request is sent: the 'Please wait...' loader only
    // flashes (Ionic queues the dismiss behind the present transition). The success callback has its own dismiss commented out.
    loader.hide(); // :82
    db.onPostRequestDataFromApi({ filter: filter.current }, 'app_karigar/getSuperPlumberList', db.rootUrl).then(
      (response: any) => {
        // NOTE (parity): a null body throws at `response['karigars']` (:88): nothing changes.
        if (response == null) {
          return;
        }
        const next = response.karigars; // :88
        // :90-97 NOTE (parity): `karigarData` null/missing (or a non-array) makes `.findIndex` throw AFTER the list was assigned: the list shows,
        // SelfData stays as it was. A null `karigars` makes `!plumber_list.length` throw in Ionic's change detection on every pass: the view
        // keeps what it showed (RN skips the update), the title index too.
        const data = response.karigarData;
        if (Array.isArray(data)) {
          try {
            const index = data.findIndex((row: any) => row.id == db.userStorageData?.id); // eslint-disable-line eqeqeq
            if (index != -1) { // eslint-disable-line eqeqeq
              selfIndex.current = index + 1; // :95 SelfData.index = index+1 (SelfData.id is never read)
            }
          } catch {
            // a null row: the callback dies like in Ionic
          }
        }
        if (next != null && alive.current) {
          setPlumberList(next);
          setShownIndex(selfIndex.current);
        }
      },
      // NOTE (parity): no error callback; the loader is already gone, so an HTTP error shows nothing and the old list stays.
      () => {},
    );
  }

  // :105-131 loadData(infiniteScroll): dead code. super30.html has no <ion-infinite-scroll>, so nothing calls it (and its
  // `app_karigar/getSuperPlumberList` call with {filter, country_name} never runs). Not ported.
  // :133 flag:any='' is only read by loadData.

  const list: any[] = Array.isArray(plumberList) ? plumberList : [];
  const empty = !list.length; // html:20 `*ngIf="!plumber_list.length"`
  const imgH = 100; // `.data-not img { height: 100px }`

  return (
    <View style={styles.screen}>
      {/* html:8-12 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        {/* NOTE (parity): the title is `{{ 'super30 || Your Rank' | translate }} : {{SelfData.index}}`: with no rank found yet it ends in ' : '. */}
        <IonNavbar color="primary" title={`${collapseWs(t('super30 || Your Rank'))} : ${interp(shownIndex)}`} />
      </IonHeader>

      {/* html:15 <ion-content class="super-plumber"> */}
      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:17-21 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:24-26 */}
        {empty ? (
          <View testID="super30-empty" style={[styles.dataNot, { height: Math.max(viewport - 50, 0) }]}>
            <SvgXml xml={noFoundXml} width={(imgH * noFoundSize.width) / noFoundSize.height} height={imgH} />
          </View>
        ) : null}

        {/* html:28-76 */}
        <View>
          {list.map((row0: any, i: number) => {
            // NOTE (parity): a null row throws in Ionic's template; RN renders an empty row.
            const row = row0 ?? {};
            const active = row.id == db.userStorageData?.id; // eslint-disable-line eqeqeq
            // html:36-52 `row.rating>='n'`: a loose JS comparison against the STRINGS '1'..'5' (a number is coerced, a string compares as text).
            const star = (n: string) => row.rating >= n;
            return (
              <View key={i} testID={`super30-item-${i}`} style={styles.listWrap}>
                {/* html:31-32 <ion-list *ngFor> > <button ion-item>. NOTE (parity): dead button (no click handler). */}
                <IonItem button noLines style={styles.item} innerStyle={styles.itemInner}>
                  <View style={styles.label}>
                    <View style={styles.list}>
                      {/* `.list:first-child:before` / `:last-child:after` are removed on the first/last row ([T] 4986-5008) */}
                      {i !== 0 ? <View testID={`super30-dash-top-${i}`} style={styles.dashTop} /> : null}
                      {i !== list.length - 1 ? <View testID={`super30-dash-bottom-${i}`} style={styles.dashBottom} /> : null}
                      <View testID={`super30-point-${i}`} style={[styles.point, active ? styles.pointActive : null]}>
                        <Text style={textStyle(14, 400, active ? colors.white : itemContentMd.textColor)}>{i + 1}</Text>
                      </View>
                      <View testID={`super30-detail-${i}`} style={[styles.detail, active ? styles.detailActive : null]}>
                        {active ? <Gradient /> : null}
                        <View style={[styles.arrow, active ? styles.arrowActive : null]} />
                        <View style={styles.info}>
                          <Text
                            testID={`super30-name-${i}`}
                            numberOfLines={1}
                            ellipsizeMode="clip"
                            style={[textStyle(14, 400, active ? colors.white : S.ink), styles.name]}
                          >
                            {interp(titlecase(row.first_name))}
                          </Text>
                          <Text testID={`super30-place-${i}`} numberOfLines={1} ellipsizeMode="clip" style={textStyle(14, 400, itemContentMd.paragraph.color)}>
                            {collapseWs(`${interp(titlecase(row.city))} ${interp(titlecase(row.state))}`)}
                          </Text>
                          <View style={styles.stars}>
                            {['1', '2', '3', '4', '5'].map(n => (
                              <View key={n} testID={`super30-star-${i}-${n}`} style={styles.star}>
                                <MaterialIcon name="star" size={16} color={star(n) ? S.starOn : S.starOff} />
                              </View>
                            ))}
                          </View>
                        </View>
                        <Photo testID={`super30-photo-${i}`} uri={row.profile} />
                      </View>
                    </View>
                  </View>
                </IonItem>
              </View>
            );
          })}
        </View>
      </IonContent>
    </View>
  );
}
