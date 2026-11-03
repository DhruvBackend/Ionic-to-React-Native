// Ported from: src/pages/products/products.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonItem } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonSearchbar } from '../../components/ionic/IonSearchbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { activeNavNames } from '../../navigation/navigationRef';
import { useIonViewWillEnter } from '../../navigation/useIonViewWillEnter';
import { catalogueMd as C } from '../../theme/ionicMdCatalogue';
import { interp } from '../../ui/angularPipes';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { styles } from './styles';

// app.getActiveNav() page names that products.ts:132 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];
const SKELETON = Array.from({ length: 10 }); // :23 `this.skelton = new Array(10)`

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'focus' | 'blur', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: any };
}

export default function ProductsScreen({ navigation, route }: Props) {
  const alive = useRef(true);
  // products.ts:12-21 fields: prod_cat_list:any=[], filter:any={}, no_rec:any=false
  const filter = useRef<any>({});
  const [rows, setRows] = useState<any>([]);
  const [noRec, setNoRec] = useState<any>(false);
  const [viewport, setViewport] = useState(0); // ion-content height, for `.nothing-here { height: 80% }`

  // :29-32 ionViewDidLoad: filter.name = navParams.get('name') (it runs before the first ionViewWillEnter)
  // NOTE (parity): the page has no TranslateModule and the template has no `| translate`: every string is hardcoded English.
  if (filter.current.name === undefined && route?.params) {
    filter.current.name = route.params.name;
  }
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // :33-37 ionViewWillEnter: getProductCategoryList() on first entry and on every return to the page; presentLoading() is an empty method.
  useIonViewWillEnter(getProductCategoryList, { navigation: navigation.addListener ? (navigation as any) : undefined });

  // :126-148 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen and on a tab switch, like Ionic's didLeave.
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

  // :38-42 doRefresh(refresher): dead code, the <ion-refresher> in products.html:17-21 is commented out. Not ported.
  // :71-123 loadData(infiniteScroll): dead code, the <ion-infinite-scroll> in products.html:60-68 is commented out. Not ported.

  // :46-48 goOnProductDetailPage(id) (the html passes a second argument, ignored)
  function goOnProductDetailPage(id: any) {
    navigation.push('ProductDetail', { id });
  }

  // :49-69 getProductCategoryList()
  // NOTE (parity): there is no loader and the error callback is empty: after an HTTP error the skeleton stays.
  function getProductCategoryList() {
    filter.current.limit = 0;
    db.post_rqst({ filter: filter.current }, 'app_master/categoryList').then(
      (r: any) => {
        // NOTE (parity): a null body throws at r['categories']; a null `categories` throws at `.length` (after the assignment): no_rec stays.
        if (r == null) {
          return;
        }
        if (alive.current) {
          setRows(r.categories); // :53
        }
        if (r.categories == null) {
          return;
        }
        if (alive.current) {
          setNoRec(r.categories.length == 0); // eslint-disable-line eqeqeq
        }
      },
      () => {},
    );
  }

  // html:27 `*ngIf="prod_cat_list.length"`; a null list throws in Ionic's change detection: RN shows the skeleton while no_rec is false.
  const list: any[] = Array.isArray(rows) ? rows : [];
  const imgW = 150; // `.nothing-here img { width: 150px }`

  return (
    <View style={styles.screen}>
      {/* html:1-13 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title="Category" />
        <IonToolbar>
          <View style={styles.search}>
            <View style={styles.filter}>
              <View style={styles.fullWidth}>
                <IonSearchbar
                  type="text"
                  // [(ngModel)]="filter.category_name1": the typed text lands in the shared filter and goes out with the next request
                  onChangeText={v => {
                    filter.current.category_name1 = v;
                  }}
                  // NOTE (parity): (keyup.enter)="goToProductsWithSearch(...)" calls a method products.ts does not have: Enter throws in Ionic and does nothing.
                  onSubmit={() => {}}
                />
              </View>
            </View>
          </View>
        </IonToolbar>
      </IonHeader>

      {/* html:15 <ion-content class="listing add-images grid-listing"> */}
      {/* NOTE (parity, not verified on device): the global `.listing { margin: 16px 0; padding: 0 16px }` also reaches this ion-content; not applied (same as MainHome). */}
      <IonContent style={styles.content} onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:25-35 */}
        {!list.length && noRec ? (
          <View testID="products-empty" style={[styles.nothingHere, { height: viewport * 0.8 }]}>
            <View style={styles.innear}>
              <SvgXml xml={noFoundXml} width={imgW} height={(imgW * noFoundSize.height) / noFoundSize.width} />
              <Text style={[textStyle(14, 400, C.noDataText), styles.noDataText]}>Data not Available</Text>
            </View>
          </View>
        ) : null}

        {/* html:37-58 */}
        {list.length ? (
          <View style={styles.mainDiv}>
            {list.map((row: any, i: number) => {
              // NOTE (parity): a null row throws in Ionic's template; RN draws an empty cell.
              const list_ = row ?? {};
              return (
                <View key={i} style={i % 2 === 0 ? styles.cellLeft : styles.cellRight}>
                  <View style={styles.shadowBox}>
                    <IonItem
                      button
                      noLines
                      testID={`products-row-${i}`}
                      style={styles.item}
                      innerStyle={styles.itemInner}
                      onPress={() => goOnProductDetailPage(list_.id)}
                    >
                      <View style={styles.label}>
                        <View style={styles.imageManage}>
                          {/* NOTE (parity): without `image` the template renders src="imageUrl+{{actual_image_name}}" (the literal text `imageUrl+`
                              is part of a relative URL): the picture never loads, so RN draws nothing there. */}
                          {list_.image ? <Image testID={`products-image-${i}`} source={{ uri: list_.image }} resizeMode="contain" style={styles.image} /> : null}
                        </View>
                        <Text testID={`products-name-${i}`} style={[textStyle(13, 500, C.gridName), styles.name]}>
                          {interp(list_.category_name)}
                        </Text>
                      </View>
                    </IonItem>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* html:60-66 *ngIf="!prod_cat_list.length && !no_rec": ten skeleton cells */}
        {/* NOTE (not 1:1): `.skleton-box` animates a grey gradient (shine-avatar); RN draws it as a flat #ddd. */}
        {!list.length && !noRec ? (
          <View testID="products-skeleton" style={styles.mainDiv}>
            {SKELETON.map((_, i) => (
              <View key={i} style={i % 2 === 0 ? styles.cellLeft : styles.cellRight}>
                <View style={styles.skeleton} />
              </View>
            ))}
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
