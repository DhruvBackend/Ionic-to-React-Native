// Ported from: src/pages/favorite-product/favorite-product.html + .ts + .scss (+ .module.ts)
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
import { useIonViewWillEnter } from '../../navigation/useIonViewWillEnter';
import { catalogueMd as C } from '../../theme/ionicMdCatalogue';
import { favoriteProductMd as F } from '../../theme/ionicMdFavoriteProduct';
import { interp } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { styles as gridStyles } from '../ProductDetail/styles';
import { nothingXml, imgSize } from '../Video/nothing';
import { styles } from './styles';

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'focus' | 'blur', cb: () => void) => () => void;
  };
  route?: { params?: object };
}

export default function FavoriteProductScreen({ navigation }: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  const filter = useRef<any>({}); // :27 filter:any = {} (one object, mutated by every call)
  const userType = useRef<any>(undefined); // :139 userType:any
  const [prodList, setProdList] = useState<any>([]); // :28 prod_list:any=[]
  const [loadData, setLoadData] = useState<any>(''); // :26 load_data:any=''
  const [search, setSearch] = useState(''); // html:10 [(ngModel)]="filter.search"
  const [viewport, setViewport] = useState(0); // ion-content height, for `.nothing-here { height: 80% }`

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // :42-47 ionViewWillEnter: user_data = userStorageData; filter.user_id = user_data.id; get_favorite_product() (every entry, also on return)
  // :49-53 ionViewDidLoad only logs.
  // NOTE (parity): `this.user_data` (also reassigned in the 1000 ms timer, :101/:108) is never read by the template or any other code: not kept.
  useIonViewWillEnter(
    () => {
      // NOTE (parity): `user_data.id` throws when userStorageData is undefined (not logged in): the handler dies, nothing is requested.
      if (db.userStorageData == null) {
        return;
      }
      filter.current.user_id = db.userStorageData.id; // :45
      getFavoriteProduct(); // :46
    },
    { navigation: navigation.addListener ? (navigation as any) : undefined },
  );

  // :55-57 goOnProductSubDetailPage(id)
  function goOnProductSubDetailPage(id: any) {
    navigation.push('ProductSubdetail', { id });
  }

  // :61-137 get_favorite_product()
  function getFavoriteProduct() {
    if (!filter.current.search) {
      loader.show(); // :65 dbService.onShowLoadingHandler(): 'Please wait...', dismissOnPageChange true
    }
    setLoadData(''); // :67
    filter.current.start = 0; // :68
    let userId: any = ''; // :69

    const sd = db.userStorageData;
    const loginType = sd.login_type; // :71
    if (loginType == 'CMS') { // eslint-disable-line eqeqeq
      userType.current = 'CMS';
    } else if (sd.loggedInUserType == 'Employee') { // eslint-disable-line eqeqeq
      userType.current = 'Employee';
      userId = sd.id; // :89
    } else {
      userType.current = 'drLogin';
    }

    // :98-136 the request goes out 1000 ms later (not cancelled when the page is left, like Ionic's timer)
    setTimeout(() => {
      if (userType.current == 'CMS') { // eslint-disable-line eqeqeq
        userId = db.userStorageData.id; // :102 (:101 user_data = tokenInfo is not read anywhere)
      } else if (userType.current != 'Employee') { // eslint-disable-line eqeqeq
        userId = db.userStorageData.id; // :109
      }
      filter.current.user_id = userId; // :112
      db.onPostRequestDataFromApi({ filter: filter.current, userType: userType.current }, 'dealerData/favorite_product', db.rootUrlSfa).then(
        (resp: any) => {
          if (alive.current) {
            // NOTE (parity): `resp['product_list']` throws on a null body AFTER load_data = '1' and the dismiss timer: the list stays as it was.
            if (resp == null) {
              setLoadData('1'); // :116
            }
          }
          if (!filter.current.search) {
            setTimeout(() => loader.hide(), 1000); // :121-123 onDismissLoadingHandler()
          }
          if (resp == null) {
            return;
          }
          // NOTE (parity): a null/missing product_list is assigned (:127) and the template then throws on `prod_list.length`: the DOM of the
          // last completed render stays (neither load_data nor the list changes on screen).
          if (resp.product_list == null) {
            return;
          }
          if (alive.current) {
            setLoadData('1');
            setProdList(resp.product_list);
          }
        },
        // :129-132 the error callback dismisses the loader at once
        () => {
          loader.hide();
        },
      );
    }, 1000);
  }

  // :140-163 loadData(infiniteScroll): dead code, the <ion-infinite-scroll> in favorite-product.html:38-45 is commented out. Not ported.
  // The `skelton` array (:37) and the skeleton lists (html:49-53) are commented out too.

  const list: any[] = Array.isArray(prodList) ? prodList : [];
  const imgW = 150; // `.nothing-here img { width: 150px }`

  return (
    <View style={styles.screen}>
      {/* html:1-14 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title="My Favourites" />
        <IonToolbar>
          <View style={gridStyles.addSearch}>
            <View style={gridStyles.filter}>
              {/* html:10 (ngModelChange) searches on EVERY keystroke, no debounce, no keyup.enter */}
              <IonSearchbar
                type="text"
                value={search}
                onChangeText={(v: string) => {
                  filter.current.search = v;
                  setSearch(v);
                  getFavoriteProduct();
                }}
              />
            </View>
          </View>
        </IonToolbar>
      </IonHeader>

      {/* html:16 <ion-content class="listing grid-listing category-product sub-category"> */}
      <IonContent style={styles.content} onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:18-25 *ngIf="!prod_list.length && load_data == '1'" */}
        {!list.length && loadData == '1' ? ( // eslint-disable-line eqeqeq
          <View testID="favorite-empty" style={[styles.nothingHere, { height: viewport * 0.8 }]}>
            <View style={styles.innear}>
              <SvgXml xml={nothingXml} width={imgW} height={(imgW * imgSize.height) / imgSize.width} />
              {/* NOTE (parity): the inline <img> sits on the text baseline: ~4px descender gap below it before the <p> */}
              <View style={styles.imgGap} />
              <Text style={[textStyle(14, 400, C.noDataText), styles.noDataText]}>Data not Available</Text>
            </View>
          </View>
        ) : null}

        {/* html:27-47 `*ngIf="prod_list.length"class="main-div"` (no space: harmless in Angular) */}
        {list.length ? (
          <View testID="favorite-main" style={styles.mainDiv}>
            <View style={styles.subListing}>
              {list.map((row: any, i: number) => {
                // NOTE (parity): a null row throws in Ionic's template; RN draws an empty cell.
                const l = row ?? {};
                return (
                  // html:30 <ion-list (click)="goOnProductSubDetailPage(list.id)">
                  <View key={i} style={styles.list}>
                    <IonItem button noLines testID={`favorite-item-${i}`} style={styles.item} innerStyle={styles.itemInner} onPress={() => goOnProductSubDetailPage(l.id)}>
                      <View style={styles.label}>
                        <View style={styles.imageManage}>
                          {/* NOTE (not 1:1): Ionic hardcodes the picture host (html:14 `http://app.gravitybath.com/dd_api/...productImage/`);
                              a client URL cannot live in a screen, so the client's product_image_url (the same folder on the configured host) is used. */}
                          <Image testID={`favorite-image-${i}`} source={{ uri: `${db.product_image_url}${interp(l.actual_image_name)}` }} resizeMode="stretch" style={styles.image} />
                        </View>
                        <View style={styles.detail}>
                          <Text testID={`favorite-name-${i}`} style={[textStyle(12, 600, F.text, 14.4), styles.h4]}>
                            {interp(l.product_name)}
                          </Text>
                          <View style={styles.h3}>
                            {/* html:17 `<span>₹​</span>` (the rupee sign is followed by a zero-width space) */}
                            <Text style={[textStyle(20, 400, F.price, 24), styles.rupee]}>{'₹​'}</Text>
                            <Text testID={`favorite-price-${i}`} style={textStyle(22, 400, F.price, 26)}>{`${interp(l.price)}/-`}</Text>
                          </View>
                        </View>
                      </View>
                    </IonItem>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
