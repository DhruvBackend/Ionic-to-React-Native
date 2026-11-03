// Ported from: src/pages/category/category.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonHeader, IonNavbar, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSearchbar } from '../../components/ionic/IonSearchbar';
import { activeNavNames } from '../../navigation/navigationRef';
import { collapseWs } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { CatalogueRow } from './CatalogueRow';
import { styles } from './styles';

// app.getActiveNav() page names that category.ts:182 looks for, without the 'Page' suffix.
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

export default function CategoryScreen({ navigation }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  // category.ts:14-16 fields: prod_cat_list:any=[], filter:any={}, flag:any=''
  const data = useRef<any>([]); // the latest value (loadData reads `this.prod_cat_list`)
  const [rows, setRows] = useState<any>([]);
  const filter = useRef<any>({});
  const [flag, setFlag] = useState<any>('');

  const setData = (v: any) => {
    data.current = v;
    if (alive.current) {
      setRows(v);
    }
  };

  // :34-38 ionViewDidLoad: presentLoading() is an empty method (its body is commented out), then getProductCategoryList('').
  // NOTE (parity): category.module.ts has its own TranslateModule.forRoot but the page never calls use(): the app language applies.
  // NOTE (parity): ionViewWillEnter (:39) is empty: returning to the page does not reload it.
  useEffect(() => {
    alive.current = true;
    getProductCategoryList('');
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :176-198 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen and on a tab switch, like Ionic's didLeave.
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

  // :169-175 presentLoading2(): content '', dismissOnPageChange: false
  function presentLoading2() {
    loader.show('', { dismissOnPageChange: false });
  }

  // :44-50 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response.
  function doRefresh(refresher: { complete: () => void }) {
    getProductCategoryList('');
    if (alive.current) {
      setFlag('');
    }
    refresher.complete();
  }

  // :56-83 goOnCategoryListPage(name)
  // NOTE (parity): filter.name stays set afterwards: every later parentCategory_List call (search, refresh, infinite scroll) sends it too.
  function goOnCategoryListPage(name: any) {
    presentLoading2();
    filter.current.limit = 0;
    filter.current.name = name;
    db.post_rqst({ filter: filter.current }, 'app_master/checkCategoryLength').then(
      (r: any) => {
        loader.hide(); // :62 dismiss before the answer is read
        // NOTE (parity): a null body / missing `categories` throws at `r['categories'].length` after the dismiss: no navigation.
        if (r == null || r.categories == null) {
          return;
        }
        if (r.categories.length == 1) { // eslint-disable-line eqeqeq
          navigation.push('SubCategory', { id: r.categories[0].id });
        } else {
          navigation.push('Products', { name });
        }
      },
      () => {
        loader.hide(); // :77
      },
    );
  }

  // :85-124 loadData(InfiniteScroll)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    // NOTE (parity): `this.prod_cat_list.length` throws when the list is null (malformed first answer): the handler dies before complete().
    if (data.current == null) {
      return;
    }
    filter.current.limit = data.current.length; // :88
    db.post_rqst({ filter: filter.current }, 'app_master/parentCategory_List').then(
      (r: any) => {
        // NOTE (parity): a null body throws at r['categories']: the scroll stays loading.
        if (r == null) {
          return;
        }
        // :95 `r['categories']==''` (loose). NOTE (parity): the endpoint answers `category`, so `categories` is normally undefined and this
        // never ends the paging; only `categories: ''` / `[]` / 0 sets flag = 1 (complete() is not called, the element is removed by *ngIf).
        if (r.categories == '') { // eslint-disable-line eqeqeq
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            // NOTE (parity): concat of a missing/null `category` appends one undefined/null row; an empty page appends nothing and
            // complete() runs: the next scroll asks again with the same limit.
            if (data.current == null) {
              return;
            }
            setData(data.current.concat(r.category)); // :101
            infiniteScroll.complete();
          }, 500);
        }
      },
      () => {
        loader.hide(); // :118 (the earlier loader is long gone: a no-op)
      },
    );
  }

  // :201-232 getProductCategoryList(search)
  // NOTE (parity): the error callback does nothing (its dismiss is commented out): after an HTTP error the loader stays up (no wrap).
  function getProductCategoryList(search: any) {
    presentLoading2();
    filter.current.limit = 0;
    filter.current.search = search;
    db.post_rqst({ filter: filter.current }, 'app_master/parentCategory_List').then(
      (r: any) => {
        // NOTE (parity): the dismiss (:212) runs before r['category'] is read; a null body then throws at :213 and the list stays.
        loader.hide(); // :212
        if (r == null) {
          return;
        }
        setData(r.category); // :211
      },
      () => {},
    );
  }

  // html:20 `*ngFor="let list of prod_cat_list"`; a null list (malformed) throws in Ionic's change detection: RN shows no rows.
  const list: any[] = Array.isArray(rows) ? rows : [];

  return (
    <View style={styles.screen}>
      {/* html:1-15 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(t('Category'))} />
        {/* NOTE (parity): `class="primary-bg"` has no CSS rule: the toolbar keeps its default colour. */}
        <IonToolbar>
          <View style={styles.search}>
            <View style={styles.filter}>
              <View style={styles.fullWidth}>
                <IonSearchbar
                  type="text"
                  placeholder={collapseWs(t('Search'))}
                  onChangeText={v => {
                    // [(ngModel)]="filter.category_name" + (ngModelChange)="filter.category_name=='' ? getProductCategoryList(filter.category_name) : ''"
                    filter.current.category_name = v;
                    if (filter.current.category_name == '') { // eslint-disable-line eqeqeq
                      getProductCategoryList(filter.current.category_name);
                    }
                  }}
                  onSubmit={() => getProductCategoryList(filter.current.category_name)} // (keyup.enter)
                />
              </View>
            </View>
          </View>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* html:19-23 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:25-41 <div class="padding16"> */}
        <View style={styles.padding16}>
          {list.map((row: any, i: number) => (
            <CatalogueRow key={i} row={row} index={i} testIDPrefix="category" onPress={() => goOnCategoryListPage(row?.main_category)} />
          ))}
          {/* NOTE (parity): html:36 `*ngIf="!prod_cat_list.length == 57"` is `(!length) == 57`: a boolean never equals 57, so the no-found image never shows. */}
        </View>

        {/* html:62-69 *ngIf="flag!=1" */}
        {flag != 1 ? ( // eslint-disable-line eqeqeq
          <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
          </IonInfiniteScroll>
        ) : null}
      </IonContent>
    </View>
  );
}
