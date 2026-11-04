// Ported from: src/pages/newarrivals/newarrivals.html + .ts + .scss (+ .module.ts)
import { bannerImage } from '../../assets/client/images';
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonHeader, IonNavbar, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSearchbar } from '../../components/ionic/IonSearchbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { productListMd as P } from '../../theme/ionicMdProductList';
import { collapseWs } from '../../ui/angularPipes';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { ProductGrid } from '../ProductDetail/ProductGrid';
import { styles as gridStyles } from '../ProductDetail/styles';
import { styles } from './styles';

// Ionic assets/imgs/banner.png: the client's file, copied by scripts/use-client.mjs.
// the file keeps Ionic's bytes but is saved as .jpg (it is a JPEG named banner.png), see scripts/use-client.mjs
const bannerPng = bannerImage;

interface Props {
  navigation: { push: (name: string, params?: object) => void };
}

export default function NewarrivalsScreen({ navigation }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const imageUrl = db.product_image_url; // :44 this.imageUrl = service.product_image_url
  const catId = ''; // :16 cat_id:any='' (this page never reads a param)
  const usertype = useRef<any>(db.userStorageData?.type); // :31 this.usertype = userStorageData.type (read once, in the constructor)
  const filter = useRef<any>({}); // :17 filter:any = {} (one object, mutated by every call)
  const prodListRef = useRef<any>([]); // :18 prod_list:any=[] (the latest value; loadData reads `this.prod_list`)
  const [prodList, setProdList] = useState<any>([]);
  const [noRec, setNoRec] = useState<any>(false); // :23 no_rec:any=false
  const [flag, setFlag] = useState<any>(''); // :22 flag:any='' (loadData sets 1, doRefresh resets it)
  const [search, setSearch] = useState(''); // html:8 [(ngModel)]="filter.search"
  const [viewport, setViewport] = useState(0); // ion-content height, for `.data-not { height: calc(100% - 50px) }`
  const alive = useRef(true);

  // :34-47 constructor + :48-50 ionViewDidLoad
  // NOTE (parity): getProductList runs twice on entry (constructor and ionViewDidLoad): two identical requests, the later answer wins.
  // There is no loader (presentLoading is never called: the call at :99 is commented out).
  // NOTE (parity): the page's newarrivals.module.ts has its own TranslateModule.forRoot, but the page never calls use(): the language is
  // whatever the app has (global).
  useEffect(() => {
    alive.current = true;
    getProductList(catId, ''); // :36
    getProductList(catId, ''); // :49
    return () => {
      alive.current = false;
    };
  }, []);

  // :59-61 goOnProductSubDetailPage(id)
  function goOnProductSubDetailPage(id: any) {
    navigation.push('ProductSubdetail', { id });
  }

  // :63-68 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response; flag is reset so the infinite scroll comes back.
  function doRefresh(refresher: { complete: () => void }) {
    setFlag(''); // :66
    getProductList(catId, '');
    refresher.complete();
  }

  // :69-92 loadData(infiniteScroll)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    // NOTE (parity): `this.prod_list.length` throws when prod_list is null (malformed first answer): the handler dies before the request,
    // the infinite scroll stays in its loading state.
    if (prodListRef.current == null) {
      return;
    }
    filter.current.karigar_id = db.userStorageData?.id; // :73
    filter.current.limit = prodListRef.current.length; // :74 the next offset
    // NOTE (parity): 'New Arivals' (sic) is the typo the server receives from this call site only; getProductList sends no `type`.
    db.post_rqst({ filter: filter.current, type: 'New Arivals' }, 'app_master/newArrivals').then(
      (r: any) => {
        // NOTE (parity): a null body throws at r['products'] in Ionic: nothing happens (the infinite scroll stays loading).
        if (r == null) {
          return;
        }
        // :78 `r['products']==''` (loose): '' and [] both equal '' in JS, so an empty page ends paging until the next refresh.
        // complete() is not called, the element is removed by *ngIf="flag!=1".
        if (r.products == '') { // eslint-disable-line eqeqeq
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            // NOTE (parity): `this.prod_list.concat(...)` on a null list throws inside the timer: complete() never runs.
            if (prodListRef.current == null) {
              return;
            }
            const next = prodListRef.current.concat(r.products); // :86
            prodListRef.current = next;
            if (alive.current) {
              setProdList(next);
            }
            infiniteScroll.complete();
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the infinite scroll stays in its loading state.
      () => {},
    );
  }

  // :94-130 getProductList(id, search)
  function getProductList(id: any, searchText: any) {
    filter.current.search = searchText; // :97
    setSearch(searchText);
    filter.current.limit = 0; // :98
    filter.current.id = id; // :99
    filter.current.karigar_id = db.userStorageData?.id; // :100
    db.post_rqst({ filter: filter.current }, 'app_master/newArrivals').then(
      (r: any) => {
        // NOTE (parity): a null body throws at r['products']: nothing happens.
        if (r == null) {
          return;
        }
        prodListRef.current = r.products; // :107
        // NOTE (parity): a null `products` makes the `.length` reads throw (here and in the template's *ngIf="prod_list.length"): the
        // view keeps what it showed before and no error is shown. RN skips the state update the same way.
        if (r.products == null) {
          return;
        }
        if (alive.current) {
          setProdList(r.products);
          setNoRec(r.products.length == 0); // eslint-disable-line eqeqeq
        }
      },
      // NOTE (parity): the error callback is empty: no loader, the page just keeps what it shows.
      () => {},
    );
  }

  const removeHeader = usertype.current == 'Plumber'; // eslint-disable-line eqeqeq
  const imgH = 100; // `.data-not img { height: 100px }`
  const list: any[] = Array.isArray(prodList) ? prodList : [];

  return (
    <View style={styles.screen}>
      {/* html:1-16: [ngClass]="{'remove': usertype == 'Plumber'}" */}
      <IonHeader mainHeader remove={removeHeader}>
        <IonNavbar color="primary" title={collapseWs(t('New Arrivals'))} />
        {/* html:6: <ion-toolbar class="primary-bg"> (no rule defines primary-bg: a plain toolbar) */}
        <IonToolbar>
          <View style={gridStyles.addSearch}>
            <View style={gridStyles.filter}>
              {/* html:8 (ngModelChange) searches on EVERY keystroke, no debounce, no keyup.enter */}
              <IonSearchbar
                type="text"
                placeholder={collapseWs(t('Search'))}
                value={search}
                onChangeText={(v: string) => {
                  filter.current.search = v;
                  setSearch(v);
                  getProductList(catId, filter.current.search);
                }}
              />
            </View>
          </View>
        </IonToolbar>
      </IonHeader>

      {/* html:17-76 <ion-content class="listing grid-listing category-product sub-category"> */}
      <IonContent style={styles.content} onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:18-21 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:23-25 */}
        {noRec ? (
          <View testID="newarrivals-empty" style={[gridStyles.dataNot, { height: Math.max(viewport - 50, 0) }]}>
            <SvgXml xml={noFoundXml} width={(imgH * noFoundSize.width) / noFoundSize.height} height={imgH} />
          </View>
        ) : null}

        {/* html:29-68 `*ngIf="prod_list.length"class="main-div"` (no space: harmless in Angular) */}
        {list.length ? (
          <View testID="newarrivals-main" style={styles.mainDiv}>
            <View style={styles.subListing}>
              {/* html:31-35 */}
              <View style={styles.tydoItem}>
                <Text testID="newarrivals-heading" style={[textStyle(17, 700, P.tydoText, 17), styles.h3]}>
                  {collapseWs(t('New Arrivals'))}
                  {'\n'}
                  <Text testID="newarrivals-count" style={[textStyle(12, 700, P.tydoText, 17), styles.h3Span]}>
                    {`"${list.length}" Products Found`}
                  </Text>
                </Text>
                {/* html:34 assets/imgs/banner.png (the line above it, a remote newarrival.jpg, is commented out) */}
                <Image testID="newarrivals-banner" source={bannerPng} resizeMode="stretch" style={styles.banner} />
              </View>

              {/* html:38-59 */}
              {/* NOTE (parity): the `<div>` holding the grid is a flex item with auto width: it is as wide as the grid's max-content, which for
                  real product names (long) fills the row; RN gives it the full width. */}
              <View style={styles.gridWrap}>
                <ProductGrid list={list} url={imageUrl} onPress={goOnProductSubDetailPage} testPrefix="newarrivals" />
              </View>
            </View>

            {/* html:62-69 *ngIf="flag!=1" (inside .main-div) */}
            {flag != 1 ? ( // eslint-disable-line eqeqeq
              <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
                <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
              </IonInfiniteScroll>
            ) : null}
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
