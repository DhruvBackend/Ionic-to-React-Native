// Ported from: src/pages/product-detail/product-detail.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonHeader, IonNavbar, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSearchbar } from '../../components/ionic/IonSearchbar';
import { activeNavNames } from '../../navigation/navigationRef';
import { collapseWs, interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { ProductGrid } from './ProductGrid';
import { styles } from './styles';

// app.getActiveNav() page names that product-detail.ts:152 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'blur', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: { id?: any } };
}

export default function ProductDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const url = db.product_image_url; // :34 this.url = service.product_image_url
  const catId = useRef<any>(''); // :16 cat_id:any=''
  const filter = useRef<any>({}); // :17 filter:any = {} (one object, mutated by every call)
  const prodListRef = useRef<any>([]); // :18 prod_list:any=[] (the latest value; loadData reads `this.prod_list`)
  const [prodList, setProdList] = useState<any>([]);
  const [prodCat, setProdCat] = useState<any>({}); // :19 prod_cat:any={}
  const [noRec, setNoRec] = useState<any>(false); // :23 no_rec:any=false
  const [flag, setFlag] = useState<any>(''); // :22 flag:any='' (set to 1 for good by loadData, never reset: the reset at :55 is commented out)
  const [search, setSearch] = useState(''); // html:10 [(ngModel)]="filter.search"
  const [viewport, setViewport] = useState(0); // ion-content height, for `.data-not { height: calc(100% - 50px) }`
  const alive = useRef(true);

  // :37-45 ionViewDidLoad
  // NOTE (parity): the page's product-detail.module.ts has its own TranslateModule.forRoot, but the page never calls use(): the language
  // is whatever the app has (global).
  useEffect(() => {
    alive.current = true;
    catId.current = route?.params?.id; // :39 this.navParams.get('id')
    getProductList(catId.current, ''); // :40
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :145-168 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen and on a tab switch, like Ionic's didLeave.
  // NOTE (parity): when the nav that is active after leaving shows one of the root pages (and its previous page is not one of them),
  // this.navCtrl.popToRoot() resets this page's own stack. At a stack root it does nothing.
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

  // :47-49 goOnProductSubDetailPage(id)
  function goOnProductSubDetailPage(id: any) {
    navigation.push('ProductSubdetail', { id });
  }

  // :51-56 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response.
  function doRefresh(refresher: { complete: () => void }) {
    getProductList(catId.current, '');
    refresher.complete();
  }

  // :57-82 loadData(infiniteScroll)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    // NOTE (parity): `this.prod_list.length` throws when prod_list is null (malformed first answer): the handler dies before the request,
    // the infinite scroll stays in its loading state.
    if (prodListRef.current == null) {
      return;
    }
    filter.current.karigar_id = db.userStorageData?.id; // :66
    filter.current.limit = prodListRef.current.length; // :67 the next offset
    db.post_rqst({ filter: filter.current }, 'app_master/productList').then(
      (r: any) => {
        // NOTE (parity): a null body throws at r['products'] in Ionic: nothing happens (the infinite scroll stays loading).
        if (r == null) {
          return;
        }
        // :71 `r['products']==''` (loose): '' and [] both equal '' in JS, so an empty page ends paging for good. flag is never reset;
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
            const next = prodListRef.current.concat(r.products); // :79
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

  // :83-135 getProductList(id, search)
  function getProductList(id: any, searchText: any) {
    presentLoading(); // :84
    filter.current.search = searchText; // :86
    setSearch(searchText);
    filter.current.limit = 0; // :87
    filter.current.id = id; // :88
    filter.current.karigar_id = db.userStorageData?.id; // :89
    db.post_rqst({ filter: filter.current }, 'app_master/productList').then(
      (r: any) => {
        // NOTE (parity): a null body throws at r['products'] after the dismiss: only the loader goes away.
        loader.hide(); // :94 this.loading.dismiss()
        if (r == null) {
          return;
        }
        prodListRef.current = r.products; // :95
        if (alive.current) {
          // NOTE (parity): `*ngFor` over a null list renders nothing; the lines below (`.length`) then throw, so no_rec and the
          // category keep their previous values.
          setProdList(r.products ?? []);
        }
        if (r.products == null) {
          return;
        }
        // :103-110 no_rec
        if (alive.current) {
          setNoRec(r.products.length == 0); // eslint-disable-line eqeqeq
        }
        // NOTE (parity): `r['category_name'][0]` throws when category_name is missing: the title keeps its previous value. With an empty
        // array prod_cat becomes undefined and Ionic's title binding throws on every change detection; RN shows an empty title instead.
        if (r.category_name == null) {
          return;
        }
        if (alive.current) {
          setProdCat(r.category_name[0] ?? {}); // :123
        }
      },
      // NOTE (parity): the error callback is empty: after an HTTP error the loader stays up (until the page changes).
      () => {},
    );
  }

  // :139-144 presentLoading(): the `content: "Please wait..."` line is commented out, so the loader shows only the spinner.
  function presentLoading() {
    loader.show('', { dismissOnPageChange: true });
  }

  const imgH = 100; // `.data-not img { height: 100px }`
  // html:3-4 `*ngIf="!filter.globalSearchData"`. NOTE (parity): globalSearchData is never set in Ionic (filter only ever gets search, limit,
  // id and karigar_id), so the second title is dead code; it is kept as the template has it.
  const title = !filter.current.globalSearchData
    ? interp(titlecase(prodCat?.main_category))
    : `${interp(titlecase(filter.current.categoryName))} - Product List`;

  return (
    <View style={styles.screen}>
      {/* html:1-17 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={title} />
        {/* html:7: <ion-toolbar class="primary-bg"> (no rule defines primary-bg: a plain toolbar) */}
        <IonToolbar>
          <View style={styles.addSearch}>
            <View style={styles.filter}>
              {/* html:10 (ngModelChange) runs after the model is set: an emptied box reloads, (keyup.enter) searches */}
              <IonSearchbar
                type="text"
                placeholder={collapseWs(t('Search'))}
                value={search}
                onChangeText={(v: string) => {
                  filter.current.search = v;
                  setSearch(v);
                  if (filter.current.search == '') { // eslint-disable-line eqeqeq
                    getProductList(catId.current, filter.current.search);
                  }
                }}
                onSubmit={() => getProductList(catId.current, filter.current.search)}
              />
            </View>
          </View>
        </IonToolbar>
      </IonHeader>

      {/* html:20-76 */}
      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:21-24 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:25-40 is commented out; html:41-62 */}
        <View style={styles.padding16}>
          <ProductGrid list={Array.isArray(prodList) ? prodList : []} url={url} onPress={goOnProductSubDetailPage} testPrefix="product-detail" />
        </View>

        {/* html:63-65 */}
        {noRec ? (
          <View testID="product-detail-empty" style={[styles.dataNot, { height: Math.max(viewport - 50, 0) }]}>
            <SvgXml xml={noFoundXml} width={(imgH * noFoundSize.width) / noFoundSize.height} height={imgH} />
          </View>
        ) : null}

        {/* html:73-77 *ngIf="flag!=1" */}
        {flag != 1 ? ( // eslint-disable-line eqeqeq
          <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
          </IonInfiniteScroll>
        ) : null}
      </IonContent>
    </View>
  );
}
