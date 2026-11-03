// Ported from: src/pages/sub-category/sub-category.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import {
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  type InfiniteScrollHandle,
} from '../../components/ionic/IonInfiniteScroll';
import {
  IonHeader,
  IonNavbar,
  IonToolbar,
} from '../../components/ionic/IonNavbar';
import {
  IonRefresher,
  IonRefresherContent,
} from '../../components/ionic/IonRefresher';
import { IonSearchbar } from '../../components/ionic/IonSearchbar';
import { useLoader } from '../../ui/useLoader';
import { CatalogueRow } from '../Category/CatalogueRow';
import { styles } from '../Category/styles';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: any };
}

export default function SubCategoryScreen({ navigation, route }: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  // sub-category.ts:14-24 fields: prod_cat_list:any=[], filter:any={}, no_data:Boolean=false, flag:any (undefined)
  const data = useRef<any>([]); // the latest value (loadData reads `this.prod_cat_list`)
  const [rows, setRows] = useState<any>([]);
  const filter = useRef<any>({});
  const [flag, setFlag] = useState<any>(undefined);
  const [noData, setNoData] = useState(false);
  const catId = useRef<any>('');

  const setData = (v: any) => {
    data.current = v;
    if (alive.current) {
      setRows(v);
    }
  };

  // :34-52 ionViewDidLoad: cat_id = navParams.get('id'), then get_subcategory('').
  // NOTE (parity): the module has no TranslateModule and the template has no `| translate`: every string is hardcoded English.
  // NOTE (parity): `this.state = this.service.userStorageData.state` (:44) is never used; not ported.
  useEffect(() => {
    alive.current = true;
    catId.current = route?.params?.id;
    get_subcategory('');
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :129-135 presentLoading2(): content '', dismissOnPageChange: false
  function presentLoading2() {
    loader.show('', { dismissOnPageChange: false });
  }

  // :55-61 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response.
  function doRefresh(refresher: { complete: () => void }) {
    get_subcategory('');
    refresher.complete();
  }

  // :63-88 get_subcategory(name)
  // NOTE (parity): there is no error callback: after an HTTP error the loader stays up (no wrap).
  function get_subcategory(name: any) {
    presentLoading2();
    filter.current.limit = 0;
    filter.current.search = name;
    db.post_rqst(
      { filter: filter.current, category_id: catId.current },
      'app_master/childCategoryList',
    ).then(
      (r: any) => {
        // NOTE (parity): a null body / null `category` throws at `r['category'].length` before the dismiss: the loader stays up.
        if (r == null || r.category == null) {
          return;
        }
        if (r.category.length) {
          setData(r.category); // :72
        } else if (r.category.length == 0) { // eslint-disable-line eqeqeq
          // NOTE (parity): an empty answer leaves the old list in place and sets no_data for good (the no-found image shows only while the list is empty).
          if (alive.current) {
            setNoData(true);
          }
        }
        loader.hide(); // :84
      },
      () => {}, // NOTE (parity): Ionic has no error callback (an unhandled error); RN swallows the rejection, the loader stays up
    );
  }

  // :90-123 loadData(InfiniteScroll)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    filter.current.limit = data.current.length; // :93
    db.post_rqst(
      { filter: filter.current, category_id: catId.current },
      'app_master/childCategoryList',
    ).then(
      (r: any) => {
        // NOTE (parity): a null body throws at r['category']: the scroll stays loading.
        if (r == null) {
          return;
        }
        // :97 `r['category']==''` (loose): '' and [] end the paging for good (complete() is not called, the element is removed by *ngIf).
        if (r.category == '') { // eslint-disable-line eqeqeq
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            // NOTE (parity): the page REPLACES the list with the new page and then concats the same page again (every row twice, the first
            // page is dropped), calls complete(), then pads a list shorter than 7 with the numbers 0, 1, ... (rows that are not objects).
            // A null `category` makes concat throw: the list becomes null and complete() never runs.
            if (r.category == null) {
              setData(null);
              return;
            }
            const doubled = r.category.concat(r.category); // :104-105
            infiniteScroll.complete();
            for (let index = doubled.length; index < 7; index++) {
              doubled.push(doubled.length); // :111
            }
            setData(doubled);
          }, 500);
        }
      },
      () => {
        loader.hide(); // :117 (the earlier loader is long gone: a no-op)
      },
    );
  }

  // :124-128 get_subcategory1(id)
  function get_subcategory1(id: any) {
    navigation.push('ProductDetail', { id });
  }

  // html:21 `*ngIf="prod_cat_list.length"`; a null list throws in Ionic's change detection: RN shows no rows.
  const list: any[] = Array.isArray(rows) ? rows : [];
  const imgH = 100; // `.data-not img { height: 100px }`

  return (
    <View style={styles.screen}>
      {/* html:1-16 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title="Sub Category" />
        {/* NOTE (parity): `class="primary-bg"` has no CSS rule: the toolbar keeps its default colour. */}
        <IonToolbar>
          <View style={styles.search}>
            <View style={styles.filter}>
              <View style={styles.fullWidth}>
                <IonSearchbar
                  type="text"
                  placeholder="Search"
                  onChangeText={v => {
                    // [(ngModel)]="filter.category_name" + (ngModelChange)="filter.category_name=='' ? get_subcategory(filter.category_name) : ''"
                    filter.current.category_name = v;
                    if (filter.current.category_name == '') { // eslint-disable-line eqeqeq
                      get_subcategory(filter.current.category_name);
                    }
                  }}
                  onSubmit={() => get_subcategory(filter.current.category_name)} // (keyup.enter)
                />
              </View>
            </View>
          </View>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* html:20-24 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent
            pullingIcon="arrow-dropdown"
            pullingText="Pull to refresh"
            refreshingSpinner="circles"
            refreshingText="Refreshing..."
          />
        </IonRefresher>

        {/* html:30-52 <div class="padding16"> */}
        <View style={styles.padding16}>
          {list.map((row: any, i: number) => (
            <CatalogueRow
              key={i}
              row={row}
              index={i}
              testIDPrefix="subcategory"
              centerTitle
              onPress={() => get_subcategory1(row?.id)}
            />
          ))}
          {!list.length && noData ? (
            <View testID="subcategory-empty" style={styles.dataNot}>
              <SvgXml
                xml={noFoundXml}
                width={(imgH * noFoundSize.width) / noFoundSize.height}
                height={imgH}
              />
            </View>
          ) : null}
        </View>

        {/* html:73-79 *ngIf="flag!=1" */}
        {flag != 1 ? ( // eslint-disable-line eqeqeq
          <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
            <IonInfiniteScrollContent
              loadingSpinner="bubbles"
              loadingText="Loading more data..."
            />
          </IonInfiniteScroll>
        ) : null}
      </IonContent>
    </View>
  );
}
