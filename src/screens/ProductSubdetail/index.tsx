// Ported from: src/pages/product-subdetail/product-subdetail.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { client } from '../../config/client';
import { IonBarButton, IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { IonContent } from '../../components/ionic/IonContent';
import { IonSlide, IonSlides } from '../../components/ionic/IonSlides';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { shareText } from '../../native';
import { activeNavNames } from '../../navigation/navigationRef';
import { collapseWs, interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { imageViewerMd, slidesMd } from '../../theme/ionicMdScroll';
import { productSubdetailMd as P } from '../../theme/ionicMdProductSubdetail';
import { styles } from './styles';

// app.getActiveNav() page names that product-subdetail.ts:191 looks for, without the 'Page' suffix.
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile', 'MainHome'];

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'blur' | 'focus', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
  route?: { params?: { id?: any } };
}

// html:20-25 `<img src="{{url+image.actual_image_name}}" (click)="viewDetail(...)">`: natural size, `img { max-width: 100% }`.
function SlideImage({ uri, onPress }: { uri: string; onPress: () => void }) {
  const win = useWindowDimensions();
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    Image.getSize?.(
      uri,
      (w, h) => live && setNatural({ w, h }),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [uri]);
  const w = natural ? Math.min(natural.w, win.width - 2 * slidesMd.slideZoomMargin) : failed ? imageViewerMd.brokenImageSize : 0;
  const h = natural ? (natural.h * w) / natural.w : failed ? imageViewerMd.brokenImageSize : 0;
  return (
    <Pressable testID="product-subdetail-image-press" onPress={onPress}>
      <Image testID="product-subdetail-image" source={{ uri }} style={{ width: w, height: h }} />
    </Pressable>
  );
}

export default function ProductSubdetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  const url = db.product_image_url; // :37 this.url = dbService.product_image_url
  const [prodDetail, setProdDetail] = useState<any>({}); // :19 prod_detail:any={}
  const [prodImage, setProdImage] = useState<any>([]); // :21 prod_image:any=[]
  const imgData = useRef<any>(undefined); // :99 imgData: url + the LAST image's actual_image_name (the share image)
  const detail = useRef<any>({});
  detail.current = prodDetail;

  // :37-60 constructor + :69-75 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    // NOTE (parity): product-subdetail.module.ts has its own TranslateModule.forRoot, but app.module.ts:221 imports ProductSubdetailPageModule
    // eagerly, so the page uses the ONE app-wide TranslateService and never calls use(): the language is whatever the app already had.
    // NOTE (parity): the constructor's user_data / userType lines (:38-60) only feed add_to_fav / remove_from_fav / checkForExistInFavourite,
    // which product-subdetail.html never calls, so they are not ported (dead code, see route.ts).
    presentLoading(); // :58 (constructor, runs before ionViewDidLoad)
    getProductDetail(route?.params?.id); // :72-74 this.navParams.get('id')
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :164-171 presentLoading(): loadingCtrl.create({ dismissOnPageChange: true }) (no content)
  function presentLoading() {
    loader.show('', { dismissOnPageChange: true });
  }

  // :85-125 getProductDetail(id)
  function getProductDetail(id: any) {
    db.onPostRequestDataFromApi({ product_id: id }, 'app_master/productDetail', db.rootUrl).then(
      (r: any) => {
        if (!alive.current) {
          return;
        }
        const product = r?.product;
        if (product == null || product.image == null) {
          // NOTE (parity): `r['product']['image']` throws in Ionic (no product / no image list): the page keeps what it showed and the
          // loader stays up. RN skips the update the same way instead of crashing.
          return;
        }
        setProdDetail(product); // :90
        const images = product.image; // :91
        setProdImage(images);
        // :92-108 two loops, each overwriting imgData: it ends as url + the last image's actual_image_name
        for (let i = 0; i < images.length; i++) {
          imgData.current = url + images[i].actual_image_name;
        }
        // :110 changeImage() (:173-177): `filter(x => x.profile == 1)[0].image`
        // NOTE (parity): with images but none having profile == 1, `[0].image` throws: loader.dismiss() (:116) is never reached and the
        // loader stays up (until the page changes). The detail and the images are already set at that point, so they show.
        if (images.length) {
          const profile = images.filter((x: any) => x.profile == 1)[0]; // eslint-disable-line eqeqeq
          if (profile === undefined) {
            return;
          }
        }
        loader.hide(); // :116 this.loading.dismiss()
      },
      // NOTE (parity): the error callback (:117-119) is empty: after an HTTP error the loader stays up (until the page changes).
      () => {},
    );
  }

  // :127-158 shareproduct()
  function shareproduct() {
    const d = detail.current;
    const companyName = client.companyName; // :25 company_name:any='Machino Tech (Topsan)'
    let shareData;
    if (d.desc) {
      shareData =
        'Company Name:' + companyName + '\n' + 'Category : ' + d.main_category + '\n' + 'Product Name:  ' + d.product_name + '\n' +
        'Product Code:  ' + d.material_code + '\n' + 'Price : ' + d.price + '\n' + 'Description : ' + d.desc;
    } else {
      // NOTE (parity): "Product Name :  " has a space before the colon and a blank line follows it (copied as typed).
      shareData =
        'Company Name:' + companyName + '\n' + 'Category : ' + d.main_category + '\n' + 'Product Name :  ' + d.product_name + '\n' + '\n' +
        'Product Code:  ' + d.material_code + '\n' + 'Price : ' + d.price;
    }
    // :150 this.socialSharing.share(shareData, null, this.imgData, null): results ignored (empty then / console.log catch)
    void shareText(shareData, imgData.current);
  }

  // :394-397 viewDetail(image): modalCtrl.create(ViewProfilePage, {"Image": image, 'mode': "product_img"}).present()
  function viewDetail(image: any) {
    navigation.push('ViewProfile', { Image: image, mode: 'product_img' });
  }

  // :181-209 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen and on a tab switch, like Ionic's didLeave.
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

  const d = prodDetail;
  const images: any[] = Array.isArray(prodImage) ? prodImage : [];
  const th = textStyle(12, 400, P.thText);
  const td = textStyle(12, 400, P.tdText, 20);
  // html:35-57 rows: the Description row only shows with a product_name; `tr:last-child` has no bottom border
  const rows: { key: string; head: string; value: string }[] = [
    { key: 'category', head: 'Category', value: interp(titlecase(d.main_category)) },
    { key: 'subcategory', head: 'Subcategory', value: interp(titlecase(d.sub_category)) },
    { key: 'code', head: 'Code', value: interp(titlecase(d.material_code)) },
  ];
  if (d.product_name) {
    rows.push({ key: 'description', head: 'Description', value: interp(d.desc ? d.desc : 'NA') });
  }

  return (
    <View style={styles.screen}>
      {/* html:1-11 */}
      <IonHeader mainHeader remove>
        <IonNavbar
          color="primary"
          title={collapseWs(t('Product Detail'))}
          end={<IonBarButton testID="product-subdetail-share" icon="md-share" color="light" onPress={shareproduct} />}
        />
      </IonHeader>

      <IonContent>
        <View testID="product-subdetail-detais" style={styles.detais}>
          {/* html:13-16 */}
          <View style={styles.detailPrize}>
            {/* NOTE (parity): an empty <h4> has no line box in the browser (height 0, margins 0), so nothing is drawn for '' */}
            {interp(d.product_name ? d.product_name : d.desc) !== '' ? (
              <Text testID="product-subdetail-title" style={[textStyle(16, 600, P.title, 19.2), styles.h4]}>
                {interp(d.product_name ? d.product_name : d.desc)}
              </Text>
            ) : null}
            <Text testID="product-subdetail-price" style={[textStyle(30, 500, P.price, 36), styles.h3]}>
              <Text style={textStyle(22, 500, P.price, 36)}>₹</Text>
              {interp(d.price)}/-
            </Text>
          </View>

          {/* html:19-30 */}
          <IonSlides pager={false}>
            {images.length ? (
              images.map((image: any, i: number) => (
                <IonSlide key={i}>
                  <SlideImage uri={url + image.actual_image_name} onPress={() => viewDetail(image.actual_image_name)} />
                </IonSlide>
              ))
            ) : (
              <IonSlide>
                <View testID="product-subdetail-placeholder" style={styles.placeholder}>
                  <MaterialIcon name="perm_media" size={50} color={P.placeholderIcon} />
                </View>
              </IonSlide>
            )}
          </IonSlides>

          {/* html:33-58 */}
          <View style={styles.padding16}>
            <View testID="product-subdetail-table" style={styles.adhar}>
              {rows.map((row, i) => (
                <View key={row.key} testID={'product-subdetail-row-' + row.key} style={[styles.tr, i === rows.length - 1 && styles.trLast]}>
                  <View style={styles.th}>
                    <Text style={th}>{collapseWs(t(row.head))}</Text>
                  </View>
                  <View style={styles.td}>
                    <Text style={td}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </IonContent>
    </View>
  );
}
