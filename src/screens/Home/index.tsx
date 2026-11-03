// Ported from: src/pages/home/home.html + .ts + .scss
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { Text } from '../../components/ionic/IonText';
import { IonIcon } from '../../components/ionic/IonIcon';
import { IonBarButton, IonButtons, IonHeader, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSlide, IonSlides } from '../../components/ionic/IonSlides';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { useIonViewWillEnter } from '../../navigation/useIonViewWillEnter';
import { client } from '../../config/client';
import { scanQr, shareText, initPushNotification } from '../../native';
import { colors } from '../../theme';
import { homeMd } from '../../theme/ionicMdHome';
import { toolbarMd } from '../../theme/ionicMdPage';
import { showAlert, showToast } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { momentFormat } from '../../ui/angularPipes';
import { AutoImage, GroupButton, SvgImg } from './parts';
import { styles } from './styles';

// Ionic assets/imgs/logo.png and banner.png: the client's files, copied by scripts/use-client.mjs.
const logo = require('../../assets/client/logo.png');
const logoSize = Image.resolveAssetSource?.(logo);
const logoRatio = logoSize?.width && logoSize?.height ? logoSize.width / logoSize.height : 1;
const bannerPng = require('../../assets/client/banner.png');
const receiptPng = require('../../assets/client/receipt.png');

interface Props {
  navigation: { push: (name: string, params?: object) => void; addListener?: (e: string, cb: () => void) => () => void };
}

// Angular `{{value}}`: null / undefined print nothing.
const show = (v: any) => (v === null || v === undefined ? '' : String(v));

// Ionic `*ngIf="x.length"` on a null from the server throws inside the template (blank page); RN shows the empty branch instead.
const list = (v: any): any[] => (Array.isArray(v) ? v : []);

// NOTE (parity): `dbService.connection` is declared in dbservice.ts:63 but never assigned anywhere in the Ionic app (only
// `connectionChk` is, dashboard.ts:81-84), so every `connection == 'offline'` branch of home.ts (toasts, offline alerts) is dead.
const offline = () => (db as any).connection == 'offline'; // eslint-disable-line eqeqeq

export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation(); // global TranslateService: home has no module of its own (imported by tabs.ts), no use() call
  const loader = useLoader();
  const userType = db.userStorageData?.type; // html: dbService.userStorageData.type, read on every render

  // home.ts fields shown by the template
  const [banner, setBanner] = useState<any>([]);
  const [offerList, setOfferList] = useState<any>([]);
  const [lastPoint, setLastPoint] = useState<any>('');
  const [todayPoint, setTodayPoint] = useState<any>('');
  const [totalBalence, setTotalBalence] = useState<any>(undefined);
  const [notificationCount, setNotificationCount] = useState<any>(undefined);
  const [productCount, setProductCount] = useState<any>('');
  const [complaintCount, setComplaintCount] = useState<any>('');
  const [installationCount, setInstallationCount] = useState<any>('');
  const [plumberComplaint, setPlumberComplaint] = useState<any>('');
  const [plumberInstallation, setPlumberInstallation] = useState<any>('');
  // home.ts fields only the handlers read
  const karigarDetail = useRef<any>({});
  const serviceExist = useRef<any>(undefined);
  const installationExist = useRef<any>(undefined);
  const totalBalenceRef = useRef<any>(undefined);
  const mounted = useRef(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const imageUrl: string = db.upload_url3; // :95

  // :200-219 getData(): presentLoading() then karigarHome; the loader is dismissed on success AND on error.
  const getData = useCallback(() => {
    loader.show(); // :537 presentLoading(): 'Please wait...', dismissOnPageChange
    db.onPostRequestDataFromApi({ karigar_id: db.userStorageData.id }, 'app_karigar/karigarHome', db.rootUrl)
      .then((r: any) => {
        loader.hide();
        if (!mounted.current) {
          return;
        }
        // NOTE (parity): a null body makes `r['karigar']` throw BEFORE the assignment, so karigar_detail stays {} (handlers then
        // answer 'not verified'); a body without karigar assigns undefined first.
        if (r === null || r === undefined) {
          return;
        }
        karigarDetail.current = r.karigar;
        // NOTE (parity): `r['karigar'].total_balance` throws a TypeError when karigar is null/missing; Ionic's subscribe callback
        // dies there, so the points, total and notification count keep their old values and every handler that reads
        // karigar_detail later throws too (swallowed by safe()).
        if (r?.karigar === null || r?.karigar === undefined) {
          return;
        }
        totalBalenceRef.current = r.karigar.total_balance; // :211 (the misspelling total_balence is Ionic's)
        setTotalBalence(r.karigar.total_balance);
        setLastPoint(r.last_point);
        setTodayPoint(r.today_point);
        setNotificationCount(r.notification);
      })
      .catch(() => {
        loader.hide(); // :216-218
      });
  }, [loader]);

  // :254-272 get_countWithLiveServer(); no error callback (NOTE (parity): a failure is silent)
  const getCountWithLiveServer = useCallback(() => {
    db.onPostRequestDataFromApi({ customer_id: db.userStorageData.id }, 'app_master/product_catalogue_count', db.rootUrl)
      .then((result: any) => {
        if (!mounted.current) {
          return;
        }
        setProductCount(result?.master_product);
        setComplaintCount(result?.complaint);
        setInstallationCount(result?.installation);
        installationExist.current = result?.installation_exist;
        serviceExist.current = result?.service_exist;
        setPlumberComplaint(result?.plumber);
        setPlumberInstallation(result?.plumberInstallation);
        // :263 complaint_exist and :266 open_complaint are stored but only used by goOnOpenComplaintAdd (dead, never called)
      })
      .catch(() => {});
  }, []);

  // :275-285 getofferBannerList(); no error callback
  const getofferBannerList = useCallback(() => {
    db.onPostRequestDataFromApi({ karigar_id: db.userStorageData.id }, 'app_karigar/offerList', db.rootUrl)
      .then((r: any) => {
        if (mounted.current) {
          setOfferList(r?.offer);
        }
      })
      .catch(() => {});
  }, []);

  // :883-905 loginBanner(); no error callback
  const loginBanner = useCallback(() => {
    db.onPostRequestDataFromApi('', 'app_karigar/loginBannersApp', db.rootUrl)
      .then((d: any) => {
        if (mounted.current) {
          setBanner(d?.banner);
        }
      })
      .catch(() => {});
  }, []);

  // :152-168 ionViewWillEnter(): every time the page becomes the active one (first load, tab re-selected, a pushed page popped)
  const willEnter = useCallback(() => {
    if (!offline()) {
      getData();
      getofferBannerList();
    }
  }, [getData, getofferBannerList]);

  // :152 ionViewWillEnter: first entry and every re-entry (not after a dismissed modal). NOTE: loader/overlapping-request race
  // (a refresh while the entry request is pending: the first answer closes the only loader) is not reproduced.
  useIonViewWillEnter(willEnter, { navigation: navigation.addListener ? (navigation as any) : undefined });
  useEffect(() => {
    mounted.current = true;
    // constructor, :95-120 (in this order)
    initPushNotification(); // :98 initPushNotification(): a no-op for Topbath (client.features.push is false, no push plugin)
    loginBanner(); // :101
    getCountWithLiveServer(); // :104
    // NOTE (parity): :111-114 events.subscribe('getCountProducts', ...) is not ported: nothing publishes that event (its only
    // publish, offline-db.ts:147, is commented out) and its handler would call get_count(), which is commented out too.
    return () => {
      mounted.current = false;
      clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A throwing Ionic click handler only logs to the console (e.g. `karigar_detail` is null after a malformed karigarHome);
  // in RN an exception in onPress would be fatal.
  const safe =
    <A extends any[]>(fn: (...a: A) => void) =>
    (...a: A) => {
      try {
        fn(...a);
      } catch (e) {
        console.log(e);
      }
    };

  // :906-920 doRefresh(refresher)
  const doRefresh = (refresher: { complete: () => void }) => {
    if (!offline()) {
      getCountWithLiveServer(); // :912
    }
    getCountWithLiveServer(); // :914 NOTE (parity): called twice (product_catalogue_count is requested twice per pull)
    getData();
    getofferBannerList();
    refreshTimer.current = setTimeout(() => {
      refresher.complete();
    }, 1000);
  };

  // :717-726 / :743-752
  const showAlertMsg = (text: string) =>
    showAlert({ title: 'Alert!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  const showSuccess = (text: string) =>
    showAlert({ title: 'Success!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  // dbservice.ts:190-201 onShowMessageAlertHandler is only reached from offline branches (dead, see offline())
  const offlineAlert = () =>
    showAlert({ title: 'Message!', cssClass: 'action-close', subTitle: 'Offline ! Please Connect To An Active Internet Connection', buttons: ['OK'] });
  // NOTE (parity): the alert text has two spaces ("account  not") in Ionic.
  const notVerified = () => showAlertMsg('You are account  not verified');

  // :169-185
  const goToNewArrivals = () => {
    if (offline()) {
      showToast('You Are Offline .. You May Miss The Updates!');
    }
    navigation.push('Newarrivals');
  };
  const goToWallet = () => navigation.push('PointList'); // :196-198
  const goOnProductPage = () => navigation.push('Category', { mode: 'home' }); // :587-590
  const goOnnotification = () => navigation.push('Notification'); // :953-955
  const goToVideosPage = (cat: string) => navigation.push('Video', { cat }); // :922-926
  const goOnVideoPage = () => navigation.push('VideoCategory'); // :949-951
  const goOnQuotationPage = () => navigation.push('QuotationGenrateByPdf', { mode: 'home' }); // :1091-1095
  const pointTransfer = () => navigation.push('Pointtranfer', { totalPoint: totalBalenceRef.current }); // :657-659
  const gotoPointTransfer = () => navigation.push('SalesPointTransfer', { totalPoint: totalBalenceRef.current }); // :661-663
  const goOnCustomerPage = () => navigation.push('Customerlist', { mode: 'home' }); // :611-616
  const goOnOffersPage = (id: any) => {
    // :496-507
    if (offline()) {
      offlineAlert();
    } else {
      navigation.push('Offers', { id });
    }
  };
  const goOnMyCamplaintsPage = (type: string) => {
    // :522-533
    if (offline()) {
      offlineAlert();
    } else {
      navigation.push('MyCamplaints', { type });
    }
  };
  const complaintHistory = (type: string) => {
    // :700-715
    if (offline()) {
      offlineAlert();
    } else {
      navigation.push('ComplaintHistory', { mode: 'home', type });
    }
  };
  const goOnComplaintAdd = (type: string) => {
    // :617-655
    if (karigarDetail.current.status != 'Verified') { // eslint-disable-line eqeqeq
      notVerified();
      return;
    }
    if (type == 'Service') { // eslint-disable-line eqeqeq
      if (serviceExist.current == true) { // eslint-disable-line eqeqeq
        showAlertMsg('You have already add service request');
        return;
      }
    }
    if (type == 'Installation') { // eslint-disable-line eqeqeq
      if (installationExist.current == true) { // eslint-disable-line eqeqeq
        showAlertMsg('You have already add installation request');
        return;
      }
    }
    if (offline()) {
      offlineAlert();
    } else {
      navigation.push('AddNewComplaint', { mode: 'home', type });
    }
  };
  const goOnPlumberPage = () => {
    // :600-609
    if (karigarDetail.current.status != 'Verified') { // eslint-disable-line eqeqeq
      notVerified();
    } else {
      navigation.push('PlumberList', { mode: 'home' });
    }
  };
  const goToQrCode = () => {
    // :592-599
    if (karigarDetail.current.status != 'Verified') { // eslint-disable-line eqeqeq
      notVerified();
    } else {
      navigation.push('CoupanCode', { mode: 'home' });
    }
  };
  const checkin = () => {
    // :928-937 NOTE (parity): only 'Pending' is blocked (the other two checks use != 'Verified')
    if (karigarDetail.current.status == 'Pending') { // eslint-disable-line eqeqeq
      notVerified();
    } else {
      navigation.push('PlumberCheckin');
    }
  };

  // :869-876 ShareApp()
  const shareApp = () => {
    // NOTE (parity): a null karigar_detail makes the next line throw, so nothing is shared (swallowed by safe()).
    const refCode = ' and use my Code *' + karigarDetail.current.referral_code + '* to get points back in your wallet';
    // NOTE (parity): two spaces before '..Give' as in Ionic. App name and store id come from the client config.
    shareText(
      'Hey There ! here is an awesome app from ' + client.appName + '  ..Give it a try https://play.google.com/store/apps/details?id=' + client.playStoreId + refCode,
    );
  };

  // :363-413 scan() (plumber QR scan; the OK handler of scanPlumber's 'scan' radio)
  const scan = () => {
    if (karigarDetail.current.manual_permission == 1) { // eslint-disable-line eqeqeq
      navigation.push('CoupanCode'); // :368, no params
      return;
    }
    // NOTE (parity): phonegap-plugin-barcodescanner resolves { text: '' } when the user backs out; Ionic has no catch, so a
    // denied permission / plugin error simply does nothing.
    scanQr().then(res => {
      if (!res.ok) {
        return;
      }
      const qrCode = res.value; // :375
      if (qrCode != '') { // eslint-disable-line eqeqeq
        db.onPostRequestDataFromApi({ karigar_id: db.userStorageData.id, qr_code: qrCode }, 'app_karigar/karigarCoupon', db.rootUrl)
          .then((r: any) => {
            try {
              if (r.status == 'INVALID') { // eslint-disable-line eqeqeq
                showAlertMsg('Invalid Coupon Code');
                return;
              } else if (r.status == 'USED') { // eslint-disable-line eqeqeq
                const scanDate = momentFormat(r.scan_date, 'D-M-Y'); // home.ts:390 moment(r.scan_date).format("D-M-Y")
                showAlertMsg('Coupon Already Used By ' + r.karigar_data.first_name + ' ( ' + r.karigar_data.mobile_no + ' ) on ' + scanDate);
                return;
              } else if (r.status == 'POINTS NOT EXIST') { // eslint-disable-line eqeqeq
                showAlertMsg('No Points Exit This Product');
                return;
              } else if (r.status == 'UNASSIGNED OFFER') { // eslint-disable-line eqeqeq
                showAlertMsg('This Coupon Code is not applicable in your Area');
                return;
              }
              showSuccess(r.coupon_value + ' points has been added into your wallet');
              getData();
            } catch (e) {
              console.log(e); // a subscribe callback that throws: nothing visible in Ionic either
            }
          })
          .catch(() => {});
      }
    });
  };

  // :294-356 scanPlumber() and :420-483 goOnScanePage(): the same radio alert, different OK handler
  const radioAlert = (onChoice: (value: string) => void) => {
    // NOTE (parity): `alertCtrl.create()` has no title; translate.get('Coupon') is read but never shown.
    showAlert({
      inputs: [
        { type: 'radio', label: t('Coupon Scan'), value: 'scan', checked: true },
        { type: 'radio', label: t('Enter Coupon Code'), value: 'code' },
      ],
      buttons: [
        t('Cancel'),
        {
          text: t('OK'),
          handler: (data: any) => {
            onChoice(data);
          },
        },
      ],
    });
  };
  const scanPlumber = () => {
    if (karigarDetail.current.status != 'Verified') { // eslint-disable-line eqeqeq
      notVerified();
    } else {
      radioAlert(value => {
        if (value == 'scan') { // eslint-disable-line eqeqeq
          scan();
        } else if (value == 'code') { // eslint-disable-line eqeqeq
          goToQrCode();
        }
      });
    }
  };
  const goOnScanePage = () => {
    if (karigarDetail.current.status != 'Verified') { // eslint-disable-line eqeqeq
      notVerified();
    } else {
      radioAlert(value => {
        if (value == 'scan') { // eslint-disable-line eqeqeq
          navigation.push('ScanPoint', { mode: 'home', type: 'scan' });
        } else if (value == 'code') { // eslint-disable-line eqeqeq
          navigation.push('ScanPoint', { mode: 'home', type: 'enter_coupon' });
        }
      });
    }
  };

  const callCustomerCare = () => {
    Linking.openURL(`tel:${client.contact.phone}`).catch(() => {}); // html: <a href="tel:...">
  };

  // ---- template pieces -------------------------------------------------------------------------------------------------------
  const logoBlock = (
    <View testID="home-company-logo" style={styles.companyLogo}>
      <Image source={logo} style={{ height: homeMd.companyLogo.imgHeight, width: homeMd.companyLogo.imgHeight * logoRatio }} />
      <View style={{ height: homeMd.inlineImgGap }} />
    </View>
  );

  const refresher = (
    <IonRefresher onRefresh={safe(doRefresh)}>
      <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
    </IonRefresher>
  );

  // `<div class="main-box">` with the coloured `:before` bar (nth-child 1..3 of `.product-option`)
  const mainBox = (index: number, onPress: () => void, testID: string, children: React.ReactNode) => (
    <Pressable key={testID} testID={testID} onPress={safe(onPress)} style={styles.mainBox}>
      {children}
      <View pointerEvents="none" style={[styles.bar, { backgroundColor: homeMd.productOption.barColors[index] }]} />
    </Pressable>
  );
  const heading = (key: string) => (
    <View style={styles.heading}>
      <Text style={styles.headingText}>{t(key)}</Text>
    </View>
  );
  const pointBlock = (value: any, testID: string) => (
    <View style={styles.point}>
      <Text testID={testID} style={styles.pointText}>{show(value)}</Text>
    </View>
  );
  const chip = (value: any, testID: string) => (
    <View style={styles.chip}>
      <Text testID={testID} style={styles.chipText}>{show(value)}</Text>
    </View>
  );

  // `.home-pint .profile-point` (Today / Last 7 Days / Wallet Balance)
  const pointCard = (index: number, value: any, labelKey: string, testID: string) => (
    <Pressable
      key={testID}
      testID={testID}
      onPress={safe(goToWallet)}
      style={[styles.pointsCard, index > 0 && { marginLeft: homeMd.pointsRow.columnGap }]}
    >
      <View style={styles.pints}>
        <Text style={styles.pintsValue}>{show(value)}</Text>
        <Text style={styles.pintsLabel}>{t(labelKey)}</Text>
      </View>
      {/* NOTE (parity): `.pints` is not positioned, so `.pints span{position:absolute;right:-16px;bottom:35px}`
          anchors to the `li` card (position:relative) -> the unit is a direct child of the card. */}
      <View testID={`${testID}-unit`} style={styles.pintsUnit}>
        <Text style={styles.pintsUnitText}>{t('POINTS')}</Text>
      </View>
      <View pointerEvents="none" style={[styles.pointsBar, { backgroundColor: homeMd.pointsRow.barColors[index] }]} />
    </Pressable>
  );
  const pointsRow = (
    <View style={{ position: 'relative' }}>
      <View style={styles.profilePoint}>
        <View style={styles.pointsList}>
          {pointCard(0, todayPoint, 'Today', 'home-today')}
          {pointCard(1, lastPoint, 'Last 7 Days', 'home-last')}
          {pointCard(2, totalBalence, 'Wallet Balance', 'home-wallet')}
        </View>
      </View>
    </View>
  );

  // Plumber / Sales_Boy / Dealer banner: offers (plain slides, tap = Offers) else login banners else the bundled banner
  const offers = list(offerList);
  const banners = list(banner);
  const loyaltyBanner = (
    <View testID="home-banner" style={styles.banner}>
      {offers.length ? (
        <IonSlides testID="home-offer-slides">
          {offers.map((o: any, i: number) => (
            <Pressable key={i} onPress={safe(() => goOnOffersPage(o.id))}>
              <IonSlide>
                <AutoImage uri={imageUrl + o.offer_banner} />
              </IonSlide>
            </Pressable>
          ))}
        </IonSlides>
      ) : banners.length ? (
        <IonSlides pager autoplay={3000} testID="home-banner-slides">
          {banners.map((b: any, i: number) => (
            <IonSlide key={i}>
              <AutoImage uri={imageUrl + b.banner} />
            </IonSlide>
          ))}
        </IonSlides>
      ) : (
        <IonSlides pager autoplay={3000} testID="home-banner-slides">
          <IonSlide>
            <AutoImage source={bannerPng} />
          </IonSlide>
        </IonSlides>
      )}
    </View>
  );

  const loyaltyHeader = (
    <IonHeader>
      <IonToolbar
        color="white"
        end={
          <>
            <View style={styles.mr10}>
              <IonButtons>
                <IonBarButton testID="home-share" icon="share" color="primary" onPress={safe(shareApp)} />
              </IonButtons>
            </View>
            <View style={styles.mr10}>
              <IonButtons>
                <IonBarButton testID="home-notifications" onPress={safe(goOnnotification)}>
                  <View style={styles.barIcon}>
                    <IonIcon name="notifications" size={toolbarMd.iconOnlyButton.iconSize} color={colors.primary} />
                  </View>
                  <View style={styles.badge}>
                    <Text testID="home-badge" style={styles.badgeText}>{show(notificationCount)}</Text>
                  </View>
                </IonBarButton>
              </IonButtons>
            </View>
            <View style={styles.mr10}>
              <IonButtons>
                <IonBarButton
                  testID="home-scan-icon"
                  icon="qr-scanner"
                  color="primary"
                  onPress={safe(userType == 'Plumber' ? scanPlumber : goOnScanePage)} // eslint-disable-line eqeqeq
                />
              </IonButtons>
            </View>
          </>
        }
      >
        {logoBlock}
      </IonToolbar>
    </IonHeader>
  );

  const videosBlock = (
    <Pressable testID="home-videos-card" onPress={safe(() => goToVideosPage('Product Installation'))} style={styles.videosWrap}>
      <View style={styles.goBtn}>
        <View style={styles.goLeft}>
          <View style={styles.goLeftImg}>
            <SvgImg name="online-learning" height={homeMd.goBtn.imgSize} />
          </View>
        </View>
        <View style={styles.goRight}>
          <Text style={styles.goContentText}>{t('Installation Videos')}</Text>
          <MaterialIcon name="arrow_right_alt" size={homeMd.goBtn.arrowSize} color={homeMd.goBtn.arrowColor} />
        </View>
      </View>
    </Pressable>
  );

  // ---- Customer (html:3-129) -------------------------------------------------------------------------------------------------
  if (userType == 'Customer') { // eslint-disable-line eqeqeq
    return (
      <View style={styles.screen}>
        <IonHeader>
          <IonToolbar
            end={
              <View style={styles.mr16}>
                <IonButtons>
                  {/* class="icon-md-primary" colours the <ion-buttons>, not the bar-button's own colour */}
                  <IonBarButton testID="home-share" icon="share" onPress={safe(shareApp)} />
                </IonButtons>
              </View>
            }
          >
            {logoBlock}
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {refresher}
          <View testID="home-banner" style={styles.banner}>
            {banners.length ? (
              <IonSlides pager autoplay={3000} testID="home-banner-slides">
                {banners.map((b: any, i: number) => (
                  <IonSlide key={i}>
                    <AutoImage uri={imageUrl + b.banner} />
                  </IonSlide>
                ))}
              </IonSlides>
            ) : (
              <AutoImage source={bannerPng} testID="home-banner-static" />
            )}
          </View>

          <View style={styles.productOption}>
            {mainBox(0, goOnProductPage, 'home-box-products', (
              <>
                <View style={styles.productBox}><SvgImg name="package" height={39} /></View>
                {heading('Product Catalogue')}
                {pointBlock(productCount, 'home-products-count')}
              </>
            ))}
            {mainBox(1, () => complaintHistory('Service'), 'home-box-service', (
              <>
                <View style={styles.productBox}><SvgImg name="request" height={39} /></View>
                {heading('Service Request')}
                {pointBlock(complaintCount, 'home-service-count')}
              </>
            ))}
            {mainBox(2, () => complaintHistory('Installation'), 'home-box-installation', (
              <>
                <View style={styles.productBox}><SvgImg name="server" height={39} /></View>
                {heading('Installation Request')}
                {pointBlock(installationCount, 'home-installation-count')}
              </>
            ))}
          </View>

          <View style={styles.groupBtn}>
            <GroupButton testID="home-add-service" icon="build" label={t('Add Service Request')} onPress={safe(() => goOnComplaintAdd('Service'))} />
            <GroupButton testID="home-add-installation" icon="build" label={t('Add Installation Request')} onPress={safe(() => goOnComplaintAdd('Installation'))} />
            <GroupButton testID="home-new-arrivals" icon="new_releases" label={t('New Arrivals')} onPress={safe(goToNewArrivals)} />
            <GroupButton testID="home-videos" icon="play_arrow" label={t('Videos')} onPress={safe(goOnVideoPage)} />
            <GroupButton testID="home-customer-care" as="a" icon="support_agent" label={t('Customer Care')} end="call" endMargin={homeMd.mb16} onPress={callCustomerCare} />
          </View>
        </IonContent>
      </View>
    );
  }

  // ---- Plumber (html:131-327) ------------------------------------------------------------------------------------------------
  if (userType == 'Plumber') { // eslint-disable-line eqeqeq
    return (
      <View style={styles.screen}>
        {loyaltyHeader}
        <IonContent>
          {refresher}
          {loyaltyBanner}
          {pointsRow}

          <View style={styles.productOption}>
            {mainBox(0, goOnProductPage, 'home-box-products', (
              <>
                <View style={styles.productBox}><SvgImg name="design" height={39} /></View>
                {heading('Our Products')}
                {chip(productCount ? productCount : 0, 'home-products-count')}
              </>
            ))}
            {mainBox(1, () => goOnMyCamplaintsPage('Service'), 'home-box-service', (
              <>
                <View style={styles.productBox}><SvgImg name="complaint" height={39} /></View>
                {heading('Service Request')}
                {chip(plumberComplaint, 'home-service-count')}
              </>
            ))}
            {mainBox(2, () => goOnMyCamplaintsPage('Installation'), 'home-box-installation', (
              <>
                <View style={styles.productBox}><SvgImg name="complaint" height={39} /></View>
                {heading('Installation Request')}
                {chip(plumberInstallation, 'home-installation-count')}
              </>
            ))}
          </View>

          {videosBlock}

          <View style={styles.groupBtn}>
            <GroupButton testID="home-new-arrivals" icon="new_releases" label={t('New Arrivals')} onPress={safe(goToNewArrivals)} />
            <GroupButton testID="home-point-transfer" icon="transfer_within_a_station" label={t('Point Transfer')} onPress={safe(pointTransfer)} />
            <GroupButton testID="home-scan" icon="qr_code_2" label={t('Scan or enter QR Code for coupon')} onPress={safe(scanPlumber)} />
            <GroupButton testID="home-checkin" icon="location_on" label={t('Start Checkin')} onPress={safe(checkin)} />
            <GroupButton testID="home-customer-care" as="a" icon="support_agent" label={t('Customer Care')} end="call" last onPress={callCustomerCare} />
          </View>
          <View testID="home-h50" style={styles.h50} />
        </IonContent>
      </View>
    );
  }

  // ---- Sales_Boy / Dealer (html:131-165, 330-514) ----------------------------------------------------------------------------
  if (userType == 'Sales_Boy' || userType == 'Dealer') { // eslint-disable-line eqeqeq
    return (
      <View style={styles.screen}>
        {loyaltyHeader}
        <IonContent>
          {refresher}
          {loyaltyBanner}
          {pointsRow}

          <View style={styles.productOption}>
            {mainBox(0, goOnProductPage, 'home-box-products', (
              <>
                <View style={styles.productBox}><SvgImg name="design" height={39} /></View>
                {heading('Our Products')}
                {chip(productCount ? productCount : 0, 'home-products-count')}
              </>
            ))}
            {mainBox(1, () => complaintHistory('Service'), 'home-box-service', (
              <>
                <View style={styles.productBox}><SvgImg name="request" height={39} /></View>
                {heading('Service Request')}
                {pointBlock(complaintCount, 'home-service-count')}
              </>
            ))}
            {mainBox(2, goOnQuotationPage, 'home-box-quotation', (
              <>
                <View style={styles.productBox}>
                  <View>
                    <Image source={receiptPng} style={{ width: 39, height: 39 }} />
                  </View>
                </View>
                {heading('Add Quotation')}
              </>
            ))}
          </View>

          <View style={styles.groupBtn}>
            <GroupButton testID="home-scan" icon="qr_code_2" label={t('Scan or enter QR Code for coupon')} onPress={safe(goOnScanePage)} />
            <GroupButton testID="home-add-quotation" icon="receipt_long" label={t('Add Quotation')} onPress={safe(goOnQuotationPage)} />
            <GroupButton testID="home-add-plumber" icon="engineering" label={t('Add Plumber')} onPress={safe(goOnPlumberPage)} />
            <GroupButton testID="home-point-transfer" icon="transfer_within_a_station" label={t('Point Transfer')} onPress={safe(gotoPointTransfer)} />
            <GroupButton testID="home-add-customer" icon="person" label={t('Add Customer')} onPress={safe(goOnCustomerPage)} />
            <GroupButton testID="home-add-service" icon="build" label={t('Add Service Request')} onPress={safe(() => goOnComplaintAdd('Service'))} />
            <GroupButton testID="home-new-arrivals" icon="new_releases" label={t('New Arrivals')} onPress={safe(goToNewArrivals)} />
            <GroupButton testID="home-customer-care" as="a" icon="support_agent" label={t('Customer Care')} end="call" last onPress={callCustomerCare} />
          </View>
          <View testID="home-h50" style={styles.h50} />
        </IonContent>
      </View>
    );
  }

  // NOTE (parity): home.html has no block for Retailer or Sales_Executive (Sales_Executive's tab root is SalesExecHome), so a
  // Retailer gets an empty page. Its constructor / ionViewWillEnter still ran above: the four requests, and the
  // 'Please wait...' loader over the blank page until karigarHome answers.
  return <View testID="home-empty" style={styles.screen} />;
}
