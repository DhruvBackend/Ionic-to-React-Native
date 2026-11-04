// Ported from: src/pages/sales-exec-home/sales-exec-home.html + .ts + .scss
import { bannerImage } from '../../assets/client/images';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { Text } from '../../components/ionic/IonText';
import { IonBarButton, IonButtons, IonHeader, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSlide, IonSlides } from '../../components/ionic/IonSlides';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { resetTo } from '../../navigation/navigationRef';
import { useIonViewWillEnter } from '../../navigation/useIonViewWillEnter';
import { storage } from '../../storage';
import { homeMd } from '../../theme/ionicMdHome';
import { salesExecHomeMd as S } from '../../theme/ionicMdSalesExecHome';
import { showAlert } from '../../ui/overlays';
import { titlecase } from '../../ui/angularPipes';
import { AutoImage, GroupButton } from './parts';
import { styles } from './styles';

// Ionic assets/imgs/logo.png and banner.png: the client's files, copied by scripts/use-client.mjs.
const logo = require('../../assets/client/logo.png');
const logoSize = Image.resolveAssetSource?.(logo);
const logoRatio = logoSize?.width && logoSize?.height ? logoSize.width / logoSize.height : 1;
// the file keeps Ionic's bytes but is saved as .jpg (it is a JPEG named banner.png), see scripts/use-client.mjs
const bannerPng = bannerImage;

interface Props {
  navigation: { push: (name: string, params?: object) => void; addListener?: (e: string, cb: () => void) => () => void };
}

// Angular `{{value}}`: null / undefined print nothing.
const show = (v: any) => (v === null || v === undefined ? '' : String(v));

// Ionic `*ngIf="x.length"` on a non-array would misbehave (blank page); RN shows the empty branch instead.
const list = (v: any): any[] => (Array.isArray(v) ? v : []);

export default function SalesExecHomeScreen({ navigation }: Props) {
  // :16-17, :29 constructor (read once)
  const user = useRef<any>(db.userStorageData || {}).current;
  const imageUrl: string = (db as any).upload_url3 || '';
  const [summary, setSummary] = useState<any>({ total_plumbers: 0, active_count: 0, inactive_count: 0, my_total_points: 0 });
  const [banner, setBanner] = useState<any[]>([]);
  const [offerList, setOfferList] = useState<any[]>([]);
  const mounted = useRef(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // :37-48 (NOTE (parity): no error callback and no loader; a failure is silent)
  const loadSummary = useCallback(() => {
    if (!user || !user.id) {
      return;
    }
    db.onPostRequestDataFromApi({ sales_executive_id: user.id }, 'app_karigar/sales_exec/summary', db.rootUrl)
      .then((r: any) => {
        if (mounted.current && r && r.status === 'SUCCESS') {
          setSummary(r);
        }
      })
      .catch(() => {});
  }, [user]);

  // :50-56
  const loadBanners = useCallback(() => {
    db.onPostRequestDataFromApi('', 'app_karigar/loginBannersApp', db.rootUrl).then(
      (r: any) => {
        if (mounted.current) {
          setBanner(r && r.banner ? r.banner : []);
        }
      },
      () => {
        if (mounted.current) {
          setBanner([]);
        }
      },
    );
  }, []);

  // :58-68
  const loadOfferBanners = useCallback(() => {
    if (!user || !user.id) {
      return;
    }
    db.onPostRequestDataFromApi({ karigar_id: user.id }, 'app_karigar/offerList', db.rootUrl).then(
      (r: any) => {
        if (mounted.current) {
          setOfferList(r && r.offer ? r.offer : []);
        }
      },
      () => {
        if (mounted.current) {
          setOfferList([]);
        }
      },
    );
  }, [user]);

  // :32-36 ionViewWillEnter: first entry and every re-entry
  const willEnter = useCallback(() => {
    loadSummary();
    loadBanners();
    loadOfferBanners();
  }, [loadSummary, loadBanners, loadOfferBanners]);
  useIonViewWillEnter(willEnter, { navigation: navigation.addListener ? (navigation as any) : undefined });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(refreshTimer.current);
    };
  }, []);

  // :77-82 doRefresh
  const doRefresh = (refresher: { complete: () => void }) => {
    loadSummary();
    loadBanners();
    loadOfferBanners();
    refreshTimer.current = setTimeout(() => {
      refresher.complete();
    }, 800);
  };

  // :70-75 bannerSrc: '' -> the bundled banner; a data URI as is; else imageUrl + value
  const bannerImage = (value: string) => {
    if (!value) {
      return <AutoImage source={bannerPng} />;
    }
    if (value.indexOf('data:image') === 0) {
      return <AutoImage uri={value} />;
    }
    return <AutoImage uri={imageUrl + value} />;
  };

  // :82-104 (NOTE (parity): goGiftGallery :106 and goTransaction :110 are never called from the template: not ported)
  const goAddPlumber = () => navigation.push('SalesExecAddPlumber');
  const goPlumberList = () => navigation.push('SalesExecPlumberList');
  const goAddSeller = () => navigation.push('SalesExecAddSeller');
  const goSellerList = () => navigation.push('SalesExecPlumberList', { list_type: 'Sales_Boy' });
  const goAddDealer = () => navigation.push('SalesExecAddDealer');
  const goDealerList = () => navigation.push('SalesExecPlumberList', { list_type: 'Dealer' });

  // :114-127
  const logout = () => {
    showAlert({
      title: 'Logout',
      message: 'Do you want to logout?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Yes',
          handler: () => {
            // NOTE (security, not changed): logout only clears the phone; the token stays valid on the server.
            storage.set('userStorageData', {});
            db.userStorageData = {};
            resetTo('Language'); // app.getRootNav().setRoot(LanguagePage)
          },
        },
      ],
    });
  };

  const offers = list(offerList);
  const banners = list(banner);

  const pointCard = (index: number, value: any, label: string, unit: string, testID: string) => (
    <Pressable
      key={testID}
      testID={testID}
      onPress={goPlumberList}
      style={[styles.pointsCard, index > 0 && { marginLeft: homeMd.pointsRow.columnGap }]}
    >
      <View style={styles.pints}>
        <Text style={styles.pintsValue}>{show(value)}</Text>
        <Text style={styles.pintsLabel}>{label}</Text>
      </View>
      {/* `.pints` is not positioned: the span anchors to the `li` card */}
      <View testID={`${testID}-unit`} style={styles.pintsUnit}>
        <Text style={styles.pintsUnitText}>{unit}</Text>
      </View>
      <View pointerEvents="none" style={[styles.pointsBar, { backgroundColor: homeMd.pointsRow.barColors[index] }]} />
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <IonHeader>
        <IonToolbar
          color="white"
          end={
            <View style={styles.mr10}>
              <IonButtons>
                <IonBarButton testID="seh-logout" icon="log-out" color="primary" onPress={logout} />
              </IonButtons>
            </View>
          }
        >
          <View testID="seh-company-logo" style={styles.companyLogo}>
            <Image
              source={logo}
              style={{ height: S.logo.imgHeight, width: S.logo.imgHeight * logoRatio, marginLeft: S.logo.marginLeft }}
            />
            <View style={{ height: homeMd.inlineImgGap }} />
          </View>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        <View testID="seh-banner" style={styles.banner}>
          {offers.length ? (
            <IonSlides pager autoplay={3000} testID="seh-offer-slides">
              {offers.map((o: any, i: number) => (
                <IonSlide key={i}>{bannerImage(o.offer_banner)}</IonSlide>
              ))}
            </IonSlides>
          ) : banners.length ? (
            <IonSlides pager autoplay={3000} testID="seh-banner-slides">
              {banners.map((b: any, i: number) => (
                <IonSlide key={i}>{bannerImage(b.banner)}</IonSlide>
              ))}
            </IonSlides>
          ) : (
            <IonSlides testID="seh-banner-slides">
              <IonSlide>
                <AutoImage source={bannerPng} />
              </IonSlide>
            </IonSlides>
          )}
        </View>

        <View style={styles.greetCard}>
          <Text testID="seh-greet" style={styles.greetTitle}>{'Hello, ' + show(titlecase(user?.first_name))}</Text>
          <Text testID="seh-mobile" style={styles.greetSub}>{show(user?.mobile_no)}</Text>
        </View>

        <View style={{ position: 'relative' }}>
          <View style={styles.profilePoint}>
            <View style={styles.pointsList}>
              {pointCard(0, summary.active_count, 'Active', 'PLUMBERS', 'seh-active')}
              {pointCard(1, summary.inactive_count, 'Inactive', 'PLUMBERS', 'seh-inactive')}
              {pointCard(2, summary.total_plumbers, 'Total', 'PLUMBERS', 'seh-total')}
            </View>
          </View>
        </View>

        <View style={styles.myPointsCard}>
          <View>
            <Text style={styles.myPointsLabel}>My Points</Text>
            <Text testID="seh-my-points" style={styles.myPointsValue}>{show(summary.my_total_points)}</Text>
          </View>
          <View style={styles.myPointsIcon}>
            <MaterialIcon name="account_balance_wallet" size={S.points.iconSize} color={S.points.valueColor} />
          </View>
        </View>

        <View style={styles.groupBtn}>
          <GroupButton testID="seh-add-plumber" icon="person_add" label="Add Plumber" onPress={goAddPlumber} />
          <GroupButton testID="seh-plumber-list" icon="list" label="Plumber List" onPress={goPlumberList} />
          <GroupButton testID="seh-add-seller" icon="person_add" label="Add Seller" onPress={goAddSeller} />
          <GroupButton testID="seh-seller-list" icon="store" label="Seller List" onPress={goSellerList} />
          <GroupButton testID="seh-add-dealer" icon="person_add" label="Add Dealer" onPress={goAddDealer} />
          {/* `.group-btn button:last-child { margin-bottom: 0 !important }` beats `.mb16` */}
          <GroupButton testID="seh-dealer-list" icon="business" label="Dealer List" onPress={goDealerList} last />
        </View>

        <View style={styles.h50} />
      </IonContent>
    </View>
  );
}
