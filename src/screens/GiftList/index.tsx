// Ported from: src/pages/gift-gallery/gift-list/gift-list.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonItem } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSearchbar } from '../../components/ionic/IonSearchbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { activeNavNames } from '../../navigation/navigationRef';
import { useIonViewWillEnter } from '../../navigation/useIonViewWillEnter';
import { colors } from '../../theme';
import { md } from '../../theme/ionicMd';
import { imageViewerMd } from '../../theme/ionicMdScroll';
import { collapseWs, datePipe, interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { surpriseSize, surpriseXml } from '../GiftDetail/surprise';
import { stripeColor, styles } from './styles';

// app.getActiveNav() page names that gift-list.ts:135 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'blur' | 'focus', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: { mode?: any } };
}

// html:41 <img src="{{url+list.image}}"> in `.product-img` (50 x 50 flex box, centred): `img { width: 100% }` of the 50px box, natural aspect ratio
// (Image.getSize gives the height), a flex item (blockified: no baseline gap), centred vertically, overflowing the box when taller.
function GiftImage({ uri, testID }: { uri: string; testID: string }) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    setNatural(null);
    setFailed(false);
    Image.getSize?.(
      uri,
      (w, h) => live && setNatural({ w, h }),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [uri]);
  // NOTE (parity): a failed picture is Chrome's 16px broken-image box (unverified, as in GiftDetail/Offers).
  const height = natural ? (50 * natural.h) / natural.w : failed ? imageViewerMd.brokenImageSize : 0;
  return <Image testID={testID} source={{ uri }} resizeMode="stretch" style={[styles.giftImg, { height }]} />;
}

export default function GiftListScreen({ navigation, route }: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  const [, setTick] = useState(0);
  const rerender = () => {
    if (alive.current) {
      setTick(n => n + 1);
    }
  };
  const url = db.upload_url3; // :27 this.url = dbService.upload_url3
  // :29-37 this.mode = navParams.get('mode'), '' when falsy
  const mode = useRef<any>(route?.params?.mode ? route.params.mode : '');
  const filter = useRef<any>({}); // :12 filter:any={} (one object, mutated by every call)
  const giftList = useRef<any>([]); // :13 gift_list:any=[]
  const totalBalance = useRef<any>(0); // :16 total_balence:number=0
  const [flag, setFlag] = useState<any>(''); // :95 flag:any=''
  const [search, setSearch] = useState(''); // html:24 [(ngModel)]="filter.search"

  // :45-48 ionViewDidLoad -> presentLoading() (:87-94): 'Please wait...', dismissOnPageChange: true
  useEffect(() => {
    alive.current = true;
    loader.show('Please wait...', { dismissOnPageChange: true });
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :49-52 ionViewWillEnter: first entry and every return from GiftDetail.
  useIonViewWillEnter(() => {
    getGiftList('');
  });

  // :118-142 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen, like Ionic's didLeave.
  // NOTE (parity): when the nav that is active after leaving shows one of the root pages (and its previous page is not one of them),
  // this.navCtrl.popToRoot() runs. After GiftDetail is pushed the active page is GiftDetail and nothing happens; the one case is a tab
  // switch to Home/Profile/Wallet while this page sits in a tab's stack.
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

  // :54-59 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response; the request clears the search text (filter.search = '').
  function doRefresh(refresher: { complete: () => void }) {
    getGiftList('');
    refresher.complete();
  }

  // :61-63 goOnGiftDetail(id)
  function goOnGiftDetail(id: any) {
    navigation.push('GiftDetail', { id });
  }

  // :65-86 getGiftList(search)
  function getGiftList(searchText: any) {
    filter.current.limit = 0; // :67
    filter.current.search = searchText; // :68
    setSearch(searchText);
    filter.current.redeemable = mode.current; // :69
    db.onPostRequestDataFromApi({ filter: filter.current, karigar_id: db.userStorageData?.id }, 'app_karigar/giftList', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :74 this.loading.dismiss(), before anything is read
        // NOTE (parity): the callback has no guards: each line below throws on a missing/null field and aborts the rest (the try/catch stands
        // for the uncaught error of Ionic's subscribe callback); what was assigned before stays. Angular runs change detection after the
        // callback in any case, which is the rerender() in `finally`.
        try {
          giftList.current = r.gift; // :75 (a null body throws here)
          totalBalance.current = r.karigar.total_balance; // :76 (karigar: null throws: the list shows, the balance keeps its value)
          // :79-84 coupon_points and offer_balance of every row become integers (NaN when missing)
          for (let i = 0; i < giftList.current.length; i++) {
            giftList.current[i].coupon_points = parseInt(String(giftList.current[i].coupon_points)); // eslint-disable-line radix
            giftList.current[i].offer_balance = parseInt(String(giftList.current[i].offer_balance)); // eslint-disable-line radix
          }
        } catch {
          // TypeError in Ionic's subscribe callback
        } finally {
          rerender();
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (the page keeps its empty template).
      () => {},
    );
  }

  // :96-117 loadData(infiniteScroll)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    // NOTE (parity): `this.gift_list.length` throws when gift_list is null (malformed first answer): the handler dies before the request,
    // the infinite scroll stays in its loading state.
    if (giftList.current == null) {
      return;
    }
    filter.current.limit = giftList.current.length; // :101
    db.onPostRequestDataFromApi({ filter: filter.current, karigar_id: db.userStorageData?.id }, 'app_karigar/giftList', db.rootUrl).then(
      (r: any) => {
        if (r == '') { // eslint-disable-line eqeqeq
          // NOTE (parity): loose `r==''` compares the WHOLE answer: only '' (or []) ends paging; a normal answer object never equals ''. An empty
          // page ({gift: []}) takes the else branch: nothing is appended and complete() runs. complete() is not called here; the element is
          // removed by *ngIf="flag!=1".
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            // NOTE (parity): `r['gift']` on a null answer throws inside the timer: complete() never runs.
            if (r == null || giftList.current == null) {
              return;
            }
            giftList.current = giftList.current.concat(r.gift); // :111 (appended rows keep the server's raw types: no parseInt)
            rerender();
            infiniteScroll.complete();
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: the infinite scroll stays in its loading state.
      () => {},
    );
  }

  // NOTE (parity): `[ngClass]="{'verify': list.coupon_points <= total_balence}"` (html:28) adds a class that no stylesheet defines: no effect.
  // NOTE (parity): `mode`/`id`/`balance_point` (:10-15) and the commented-out balance line (:78) are never read by the template.
  const list: any[] = Array.isArray(giftList.current) ? giftList.current : [];

  return (
    <View style={styles.screen}>
      {/* html:1-5 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        <IonNavbar title="Gift Gallery" />
      </IonHeader>

      {/* html:8-51 <ion-content padding> */}
      <IonContent padding>
        {/* html:9-15 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:18-26 NOTE (parity): `.fix { position: sticky; top: 0 }` keeps the balance and the search box at the top while the list scrolls
            under them in Ionic; IonContent has no sticky children, so here they scroll away with the list (STOP item for the lead). */}
        <View testID="giftlist-fix" style={styles.fix}>
          <View testID="giftlist-top-nav" style={styles.topNav}>
            <Text style={[textStyle(14, 400, md.textColor), styles.topNavP]}>Balance Points</Text>
            <Text testID="giftlist-balance" style={[textStyle(24, 600, md.textColor, 28.8), styles.topNavH1]}>
              {interp(totalBalance.current)}
            </Text>
            <View pointerEvents="none" style={styles.surprise}>
              <SvgXml xml={surpriseXml} width={91} height={97} viewBox={`0 0 ${surpriseSize.width} ${surpriseSize.height}`} preserveAspectRatio="xMidYMid slice" />
            </View>
          </View>
          {/* html:23-25: (ngModelChange) searches on EVERY keystroke, no debounce */}
          <View style={styles.search}>
            <View style={styles.searchHost}>
              <IonSearchbar
                type="text"
                context="search"
                value={search}
                onChangeText={(v: string) => {
                  filter.current.search = v;
                  setSearch(v);
                  getGiftList(filter.current.search);
                }}
              />
            </View>
          </View>
        </View>

        {/* html:27-50 */}
        <View testID="giftlist-listing" style={styles.listing}>
          {list.map((row: any, i: number) => {
            const gift = row ?? {};
            return (
              <IonItem
                key={i}
                testID={`giftlist-item-${i}`}
                button
                noLines
                style={[styles.item, { borderLeftColor: stripeColor(i + 1) }]}
                innerStyle={styles.itemInner}
                onPress={() => goOnGiftDetail(gift.id)}
              >
                <View style={styles.label}>
                  <View style={styles.headDetail}>
                    {/* html:30-33 */}
                    <View style={styles.head}>
                      <Text testID={`giftlist-points-${i}`} style={[textStyle(20, 600, colors.text, 24), styles.headText]}>
                        {interp(gift.coupon_points)}
                      </Text>
                      <Text style={[textStyle(14, 400, colors.textMuted), styles.headText]}>Points</Text>
                      <View style={styles.headAfter} />
                    </View>
                    {/* html:34-38 */}
                    <View style={styles.detail}>
                      <Text testID={`giftlist-title-${i}`} numberOfLines={1} style={[textStyle(16, 600, colors.text, 19.2), styles.detailH1]}>
                        {collapseWs(interp(titlecase(gift.gift_title)))}
                      </Text>
                      <Text testID={`giftlist-offer-${i}`} numberOfLines={1} ellipsizeMode="clip" style={[textStyle(11, 400, colors.textMuted), styles.detailP]}>
                        {/* html:36 <span>Offer Points:</span>{{list.offer_balance || 0}}: no space between the span and the number */}
                        {`Offer Points:${collapseWs(interp(gift.offer_balance || 0))}`}
                      </Text>
                      <Text testID={`giftlist-offer-title-${i}`} numberOfLines={1} ellipsizeMode="clip" style={[textStyle(11, 400, colors.textMuted), styles.detailP]}>
                        {collapseWs(`${interp(titlecase(gift.title))} | ${datePipe(gift.end_date, 'd MMMM y')}`)}
                      </Text>
                    </View>
                  </View>
                  {/* html:40-42 */}
                  <View style={styles.productImg}>
                    <GiftImage testID={`giftlist-image-${i}`} uri={url + gift.image} />
                  </View>
                </View>
              </IonItem>
            );
          })}
          {/* html:44-49 *ngIf="flag!=1" (inside .listing, after the buttons) */}
          {flag != 1 ? ( // eslint-disable-line eqeqeq
            <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
              <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
            </IonInfiniteScroll>
          ) : null}
        </View>
      </IonContent>
    </View>
  );
}
