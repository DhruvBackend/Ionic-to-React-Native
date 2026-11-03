// Ported from: src/pages/point-history/point-history.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonItem } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { pointHistoryMd as P } from '../../theme/ionicMdPointHistory';
import { collapseWs, datePipe, interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: any };
}

// `.tr-tags` / `.tr-points` text is `white-space: nowrap` inside `ion-label` (clipped, no ellipsis)
const nowrap = { numberOfLines: 1, ellipsizeMode: 'clip' } as const;
// NOTE (parity): html:118 / :124 a smaller inline <span> inside the item's 16px / line-height normal line box: the box is the strut
// (ascent 15 + descent 4 = 19) and the span sits on its baseline (15 down). A Text's own lineHeight would win over an outer strut Text,
// so the line is a View of the strut height holding the small Text pushed down by (strut ascent - span ascent).
const spanAscent = (fontSize: number) => Math.round((fontSize * 1900) / 2048);
const STRUT_BASELINE = spanAscent(16);
const strutLine = { height: normalLineHeight(16) };

// PointHistoryPage has no `receive_status` property; the template reads `receive_status != ''` at html:118 and :124. Always undefined.
// NOTE (parity): `undefined != ''` is true, so for EVERY redeem row with gift_status 'Reject' the reject reason and the 'Refunded' label
// show, whatever the row's own receive_status is.
const receiveStatusOfPage: any = undefined;

const nbsp = ' ';

export default function PointHistoryScreen({ route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  const { height: windowHeight } = useWindowDimensions();

  // point-history.ts:15-29 fields; :43-46 constructor reads the nav params
  const params = route?.params ?? {};
  const scan = params.scan;
  const service1 = params.service;
  const redeem = params.redeem;
  const referal = params.referal;
  // :40 NOTE (parity): userType is read once in the constructor.
  const userType = useRef<any>(db.userStorageData?.type);
  const filter = useRef<any>({}); // filter:any={} (one object, mutated by every call)

  // Each list keeps its latest raw value in a ref (what `this.x` holds) and the last rendered array in state.
  // NOTE (parity): a null/undefined list (malformed response) makes `x.length` throw in Ionic's template during change detection: the
  // view keeps what it showed before and no error is shown. RN skips the state update the same way instead of crashing; the raw value
  // is still stored, so the paging handlers stop at the same point as `this.x.length` does in Ionic.
  const couponRef = useRef<any>([]);
  const [couponList, setCouponListState] = useState<any>([]);
  const serviceRef = useRef<any>([]);
  const [serviceList, setServiceListState] = useState<any>([]);
  const referalRef = useRef<any>([]);
  const [referalHistroy, setReferalState] = useState<any>([]);
  const transactionRef = useRef<any>([]);
  const [transactionDetail, setTransactionState] = useState<any>([]);
  const [notdata, setNotdata] = useState(false); // :26 notdata:boolean=false
  const [flag, setFlag] = useState<any>(''); // :112 flag:any='' (set to 1 for good by the scan loader, never reset)

  const assign = (ref: React.MutableRefObject<any>, set: (v: any) => void, v: any) => {
    ref.current = v;
    if (alive.current && v != null) {
      set(v);
    }
  };
  const setCoupon = (v: any) => assign(couponRef, setCouponListState, v);
  const setService = (v: any) => assign(serviceRef, setServiceListState, v);
  const setReferal = (v: any) => assign(referalRef, setReferalState, v);
  const setTransaction = (v: any) => assign(transactionRef, setTransactionState, v);

  // :49-68 ionViewDidLoad (fires once)
  // NOTE (parity): the page's point-history.module.ts has its own TranslateModule.forRoot, but app.module.ts:189 imports
  // PointHistoryPageModule eagerly, so it shares the root TranslateService; the page never calls setDefaultLang/use(), so the language is
  // whatever the app has (global in RN too).
  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :50-67 / :76-88 the same four-way branch, in the same order: scan, service, redeem, referal.
  // NOTE (parity): a page pushed with none of the four params loads nothing (the commented `else if()` at :66).
  function load() {
    if (scan === 'scan') {
      getCoupanHistory();
    } else if (service1 === 'service') {
      services();
    } else if (redeem === 'redeem') {
      getTransactionDetail();
    } else if (referal === 'referal') {
      referals();
    }
  }

  // :70-77 presentLoading(): 'Please wait...', dismissOnPageChange: true, enableBackdropDismiss: true
  // NOTE (parity): a refresh while the first request is pending creates a second loader in Ionic and orphans the first (stuck until the
  // page changes); the kit's useLoader dismisses the first one instead.
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: true, enableBackdropDismiss: true });
  }

  // :78-90 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response.
  function doRefresh(refresher: { complete: () => void }) {
    load();
    refresher.complete();
  }

  // :95-112 getCoupanHistory()
  function getCoupanHistory() {
    presentLoading();
    filter.current.limit = 0;
    db.onPostRequestDataFromApi({ filter: filter.current, karigar_id: db.userStorageData?.id }, 'app_karigar/couponHistory', db.rootUrl).then(
      (r: any) => {
        const coupon = r?.coupon; // `r['coupon'].length` throws for a null body or a null `coupon`: nothing happens, the loader stays up
        if (coupon == null) {
          return;
        }
        if (coupon.length) {
          setCoupon(coupon);
          loader.hide();
        } else if (couponRef.current.length == 0) { // eslint-disable-line eqeqeq
          // NOTE (parity): an empty answer shows the "no data" picture but never dismisses the loader: 'Please wait...' stays up (until the
          // user taps its backdrop, enableBackdropDismiss, or the page changes). An empty answer on a refresh over a filled list does nothing.
          if (alive.current) {
            setNotdata(true);
          }
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :113-134 loadDataScan(infiniteScroll)
  function loadDataScan(infiniteScroll: InfiniteScrollHandle) {
    filter.current.limit = couponRef.current.length;
    db.onPostRequestDataFromApi({ filter: filter.current, karigar_id: db.userStorageData?.id }, 'app_karigar/couponHistory', db.rootUrl).then(
      (r: any) => {
        if (!r) {
          return; // TypeError at `r['coupon']` in Ionic: complete() never runs
        }
        if (r.coupon == '') { // eslint-disable-line eqeqeq
          // NOTE (parity): loose == '': an empty array (and '') ends paging for good (flag is never reset, not even by a refresh);
          // complete() is not called, the element is removed by *ngIf="flag!=1".
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            setCoupon(couponRef.current.concat(r.coupon));
            infiniteScroll.complete();
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: the infinite scroll stays in its loading state.
      () => {},
    );
  }

  // :136-150 services()
  function services() {
    presentLoading();
    filter.current.limit = 0;
    db.onPostRequestDataFromApi({ plumber_id: db.userStorageData?.id, filter: filter.current }, 'app_karigar/getPlumberComplaintList', db.rootUrl).then(
      (r: any) => {
        if (r) {
          loader.hide(); // :145 this.loading.dismiss() (before the list is assigned)
          setService(r.plumberComplaintList);
        }
        // NOTE (parity): a null body skips the whole block, loader included: 'Please wait...' stays up.
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :152-172 loadDataService(infiniteScroll)
  function loadDataService(infiniteScroll: InfiniteScrollHandle) {
    // NOTE (parity): `this.service.length` throws when service is null/undefined (malformed first response): the handler dies before the
    // request and before complete(); the infinite scroll stays in its loading state.
    if (serviceRef.current == null) {
      return;
    }
    filter.current.limit = serviceRef.current.length;
    db.onPostRequestDataFromApi({ filter: filter.current, plumber_id: db.userStorageData?.id }, 'app_karigar/getPlumberComplaintList', db.rootUrl).then(
      (r: any) => {
        if (!r) {
          return; // TypeError at `r['coupon']`: complete() never runs
        }
        // NOTE (parity): the check reads `r['coupon']` (a key this endpoint never returns): undefined == '' is false, so the flag is never
        // set here and paging only ends when the server answers with nothing new.
        if (r.coupon == '') { // eslint-disable-line eqeqeq
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            setService(serviceRef.current.concat(r.plumberComplaintList));
            infiniteScroll.complete();
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: the infinite scroll stays in its loading state.
      () => {},
    );
  }

  // :173-186 referals()
  function referals() {
    presentLoading();
    filter.current.limit = 0;
    db.onPostRequestDataFromApi({ karigar_id: db.userStorageData?.id, filter: filter.current }, 'app_karigar/referal_logs', db.rootUrl).then(
      (r: any) => {
        if (r) {
          setReferal(r.referal_logs);
          loader.hide(); // :183 (after the list is assigned)
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :187-207 loadDataReferal(infiniteScroll)
  function loadDataReferal(infiniteScroll: InfiniteScrollHandle) {
    if (referalRef.current == null) {
      return; // `this.referal_histroy.length` throws
    }
    filter.current.limit = referalRef.current.length;
    db.onPostRequestDataFromApi({ filter: filter.current, karigar_id: db.userStorageData?.id }, 'app_karigar/referal_logs', db.rootUrl).then(
      (r: any) => {
        if (!r) {
          return;
        }
        // NOTE (parity): `r['coupon']` is not a key of this endpoint: the flag is never set here (see loadDataService).
        if (r.coupon == '') { // eslint-disable-line eqeqeq
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            setReferal(referalRef.current.concat(r.referal_logs));
            infiniteScroll.complete();
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: the infinite scroll stays in its loading state.
      () => {},
    );
  }

  // :210-228 getTransactionDetail()
  function getTransactionDetail() {
    presentLoading();
    filter.current.limit = 0;
    db.onPostRequestDataFromApi({ karigar_id: db.userStorageData?.id, filter: filter.current }, 'app_karigar/transaction', db.rootUrl).then(
      (r: any) => {
        if (r) {
          setTransaction(r.transaction);
        }
        loader.hide(); // :224 outside the `if(r)`: a null body still dismisses
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :229-245 loadDataRedeem(infiniteScroll)
  function loadDataRedeem(infiniteScroll: InfiniteScrollHandle) {
    if (transactionRef.current == null) {
      return; // `this.transaction_detail.length` throws
    }
    filter.current.limit = transactionRef.current.length;
    db.onPostRequestDataFromApi({ filter: filter.current, karigar_id: db.userStorageData?.id }, 'app_karigar/transaction', db.rootUrl).then(
      (r: any) => {
        // NOTE (parity): the `if(r['coupon'] == '') flag=1` check is commented out here: every answer, an empty list too, is concatenated
        // after 1 s and complete() runs.
        setTimeout(() => {
          if (!r) {
            return; // TypeError at `r['transaction']` inside the timer: complete() never runs
          }
          setTransaction(transactionRef.current.concat(r.transaction));
          infiniteScroll.complete();
        }, 1000);
      },
      // NOTE (parity): no error callback in Ionic: the infinite scroll stays in its loading state.
      () => {},
    );
  }

  // html:46-50, :73-77, :96-100, :184-188 `*ngIf="flag!=1"` infinite scroll
  const infinite = (handler: (s: InfiniteScrollHandle) => void) =>
    flag != 1 ? ( // eslint-disable-line eqeqeq
      <IonInfiniteScroll threshold="100px" onInfinite={handler}>
        <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
      </IonInfiniteScroll>
    ) : null;

  // `.data-not` + `<img src="assets/imgs/no_found.svg">` ([T] 4393-4402 img height 100px; [P] 63-65 height calc(100vh - 140px))
  // NOTE (parity): 100vh is taken as the window height (same as AboutusModal).
  const imgH = 100;
  const dataNot = (testID: string) => (
    <View testID={testID} style={[styles.dataNot, { height: Math.max(windowHeight - 140, 0) }]}>
      <SvgXml xml={noFoundXml} width={(imgH * noFoundSize.width) / noFoundSize.height} height={imgH} />
    </View>
  );

  // `.full_width .part_one { line-height: 20px }` only applies to rows that have the class; the others are plain blocks (14px, normal)
  const liText = (fw: boolean) => textStyle(fw ? 12 : 14, 400, P.ink, fw ? 20 : undefined);
  const strongText = (fw: boolean) => textStyle(fw ? 12 : 14, 700, P.ink, fw ? 20 : undefined);
  const dateText = (fw: boolean) => textStyle(12, 400, P.inkMuted, fw ? 20 : undefined);
  const points = (value: any, testID: string) => (
    <View testID={testID} style={styles.partTwo}>
      <Text style={[textStyle(16, 600, P.ink), styles.center]}>{interp(value)}</Text>
      <Text style={[textStyle(12, 400, P.staticPoint), styles.center]}>{collapseWs(t('Points'))}</Text>
    </View>
  );

  const isPlumber = userType.current == 'Plumber'; // eslint-disable-line eqeqeq
  const isSellerOrDealer = userType.current == 'Sales_Boy' || userType.current == 'Dealer'; // eslint-disable-line eqeqeq
  const asList = (v: any): any[] => (Array.isArray(v) ? v : []);
  const coupons = asList(couponList);
  const services1 = asList(serviceList);
  const referals1 = asList(referalHistroy);
  const transactions = asList(transactionDetail);

  // html:9-12 the four <ion-title>s (exactly one param is ever set)
  const title =
    scan === 'scan'
      ? 'Earn By Scan History'
      : service1 === 'service'
        ? 'Earn By Service History'
        : referal === 'referal'
          ? 'Earn By Referal History'
          : redeem === 'redeem'
            ? 'Redeem History'
            : '';

  return (
    <View style={styles.screen}>
      {/* html:7-14 */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={title ? collapseWs(t(title)) : ''} />
      </IonHeader>

      {/* html:16-191 <ion-content padding> */}
      <IonContent padding>
        {/* html:17-20 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:21-50 scan */}
        {scan === 'scan' ? (
          <View testID="mode-scan">
            {!coupons.length && notdata ? dataNot('scan-empty') : null}
            {coupons.length > 0 ? (
              <View>
                {coupons.map((row: any, i: number) => {
                  // NOTE (parity): a null row (only from a malformed second page, concat(null)) makes Ionic's template throw; RN shows an empty row.
                  const list = row ?? {};
                  return (
                    <View key={i} testID={`scan-row-${i}`} style={[styles.fullWidth, i === coupons.length - 1 ? styles.lastChild : null]}>
                      <View style={styles.partOne}>
                        <View style={styles.ul}>
                          <View style={styles.li}>
                            <Text testID={`scan-code-${i}`} style={liText(true)}>
                              <Text style={strongText(true)}>{`${collapseWs(t('Coupon Code'))}:${nbsp}`}</Text>
                              {interp(list.coupon_code)}
                            </Text>
                          </View>
                          <View style={styles.li}>
                            <Text testID={`scan-group-${i}`} style={liText(true)}>
                              <Text style={strongText(true)}>{`${collapseWs(t('Product Point Group'))}:${nbsp}`}</Text>
                              {interp(list.product_point_group)}
                            </Text>
                          </View>
                          {isPlumber && list.sales_boy_name != '' ? ( // eslint-disable-line eqeqeq
                            <View style={styles.li}>
                              <Text testID={`scan-seller-${i}`} style={liText(true)}>
                                <Text style={strongText(true)}>{`${collapseWs(t('Seller '))}:${nbsp}`}</Text>
                                {`${interp(titlecase(list.sales_boy_name))} (${interp(list.sales_boy_mobile_no)})`}
                              </Text>
                            </View>
                          ) : null}
                          {isSellerOrDealer && list.plumber_name != '' ? ( // eslint-disable-line eqeqeq
                            <View style={styles.li}>
                              <Text testID={`scan-plumber-${i}`} style={liText(true)}>
                                <Text style={strongText(true)}>{`${collapseWs(t('Plumber Detail'))}:${nbsp}`}</Text>
                                {`${interp(titlecase(list.plumber_name))} (${interp(list.plumber_mobile_no)})`}
                              </Text>
                            </View>
                          ) : null}
                          <View style={styles.li}>
                            <Text testID={`scan-date-${i}`} style={dateText(true)}>
                              {interp(datePipe(list.scan_date, 'd-MMM-y, h:mm a'))}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {/* html:36-43 NOTE (parity): a Sales_Executive matches neither branch: no points are shown. */}
                      {isPlumber ? points(list.coupon_value, `scan-points-${i}`) : null}
                      {isSellerOrDealer ? points(list.sales_boy_coupon_value, `scan-points-${i}`) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
            {infinite(loadDataScan)}
          </View>
        ) : null}

        {/* html:51-77 service */}
        {service1 === 'service' ? (
          <View testID="mode-service">
            {!services1.length ? dataNot('service-empty') : null}
            {services1.length > 0 ? (
              <View>
                {services1.map((row: any, i: number) => {
                  const list = row ?? {};
                  // html:56 [ngClass]="{'full_width' : list.plumber_payment != 0}"
                  const fw = list.plumber_payment != 0; // eslint-disable-line eqeqeq
                  return (
                    <View key={i} testID={`service-row-${i}`} style={fw ? [styles.fullWidth, i === services1.length - 1 ? styles.lastChild : null] : undefined}>
                      {/* html:57 NOTE (parity): content needs a truthy plumber_payment; a value like '0.00' is truthy but == 0, so its row is
                          drawn without the full_width class (stacked blocks, 14px, no border). A falsy value leaves an empty div. */}
                      {list.plumber_payment ? (
                        <>
                          <View style={fw ? styles.partOne : undefined}>
                            <View style={styles.ul}>
                              <View style={styles.li}>
                                <Text testID={`service-type-${i}`} style={liText(fw)}>
                                  <Text style={strongText(fw)}>{`${collapseWs(t('Complaint Type'))}:${nbsp}${nbsp}`}</Text>
                                  <Text style={styles.capitalize}>{interp(list.complaint_type)}</Text>
                                </Text>
                              </View>
                              <View style={styles.li}>
                                <Text testID={`service-customer-${i}`} style={liText(fw)}>
                                  {`${interp(list.customerName)}-${interp(list.customerMobileNo)}`}
                                </Text>
                              </View>
                              <View style={styles.li}>
                                {/* html:61-62 <strong>Date</strong> and the span are separated by white space (one space) */}
                                <Text testID={`service-date-${i}`} style={liText(fw)}>
                                  <Text style={strongText(fw)}>{collapseWs(t('Date'))}</Text>
                                  {' '}
                                  <Text style={dateText(fw)}>
                                    {list.plumber_payment_date == '0000-00-00 00:00:00' // eslint-disable-line eqeqeq
                                      ? ''
                                      : interp(datePipe(list.plumber_payment_date, 'd-MMM-y'))}
                                  </Text>
                                </Text>
                              </View>
                            </View>
                          </View>
                          {points(list.plumber_payment, `service-points-${i}`)}
                        </>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
            {infinite(loadDataService)}
          </View>
        ) : null}

        {/* html:78-100 referal */}
        {referal === 'referal' ? (
          <View testID="mode-referal">
            {!referals1.length ? dataNot('referal-empty') : null}
            {referals1.length > 0 ? (
              <View>
                {referals1.map((row: any, i: number) => {
                  const list = row ?? {};
                  return (
                    <View key={i} testID={`referal-row-${i}`} style={[styles.fullWidth, i === referals1.length - 1 ? styles.lastChild : null]}>
                      <View style={styles.partOne}>
                        <View style={styles.ul}>
                          {/* html:87 <li class="bold"> */}
                          <View style={styles.li}>
                            <Text testID={`referal-desc-${i}`} style={strongText(true)}>
                              {interp(list.point_description)}
                            </Text>
                          </View>
                          <View style={styles.li}>
                            <Text testID={`referal-date-${i}`} style={dateText(true)}>
                              {interp(datePipe(list.date_created, 'd-MMM-y'))}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {points(list.points, `referal-points-${i}`)}
                    </View>
                  );
                })}
              </View>
            ) : null}
            {infinite(loadDataReferal)}
          </View>
        ) : null}

        {/* html:101-190 redeem */}
        {redeem === 'redeem' ? (
          <View testID="mode-redeem">
            {transactions.length > 0 ? (
              <View testID="transaction-list">
                {transactions.map((row: any, i: number) => {
                  // NOTE (parity): a null row (only from a malformed second page, concat(null)) makes Ionic's template throw; RN shows an empty row.
                  const list = row ?? {};
                  const gift = list.gift_status;
                  const recv = list.receive_status;
                  const rejectExtras = gift == 'Reject' && receiveStatusOfPage != ''; // eslint-disable-line eqeqeq
                  const created = interp(datePipe(list.date_created, 'd MMM y'));
                  const received = interp(datePipe(list.received_date, 'd MMM y'));
                  const statusRow = (key: string, left: string, color: string, weight: number, text: string) => (
                    <View testID={`redeem-status-${key}-${i}`} style={styles.trStatus}>
                      <View>
                        <Text style={textStyle(12, 500, P.inkMuted, 14.4)}>{left}</Text>
                      </View>
                      <View>
                        <Text style={textStyle(12, weight, color)}>{text}</Text>
                      </View>
                    </View>
                  );
                  return (
                    <View key={i} testID={`redeem-row-${i}`} style={styles.hisListing}>
                      {/* html:107-128 <button ion-item class="main-list"> (no click handler) */}
                      <IonItem button noLines testID={`redeem-item-${i}`} style={styles.mainList} innerStyle={styles.itemInner}>
                        <View style={styles.label}>
                          <View style={styles.trContent}>
                            <View style={styles.inner}>
                              <View style={styles.trCircle}>
                                <MaterialIcon name="call_made" size={22} color={P.white} />
                              </View>
                              <View style={styles.trTags}>
                                <Text {...nowrap} style={textStyle(14, 400, P.ink, 16.8)}>
                                  {collapseWs(t('Request Send'))}
                                </Text>
                                <Text testID={`redeem-type-${i}`} {...nowrap} style={textStyle(14, 400, P.ink, 16.8)}>
                                  {`Type${nbsp}${nbsp}:${interp(list.type)}`}
                                </Text>
                                <Text testID={`redeem-title-${i}`} {...nowrap} style={[textStyle(12, 600, P.ink, 14.4), styles.trTagsH1]}>
                                  {interp(titlecase(list.gift_title))}
                                </Text>
                                <Text testID={`redeem-reqid-${i}`} {...nowrap} style={[textStyle(10, 400, P.inkMuted), styles.trTagsP]}>
                                  {`${collapseWs(t('Req Id'))} : REQ# ${interp(list.id)}`}
                                </Text>
                                {/* html:118 an inline <span> in a line box whose strut is the item's 16px / line-height normal */}
                                {rejectExtras && interp(titlecase(list.reject_reason)) !== '' ? (
                                  <View testID={`redeem-reason-${i}`} style={strutLine}>
                                    <Text {...nowrap} style={{ ...textStyle(11, 400, P.danger, normalLineHeight(11)), marginTop: STRUT_BASELINE - spanAscent(11) }}>
                                      {interp(titlecase(list.reject_reason))}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>
                            <View style={styles.trPoints}>
                              <Text {...nowrap} style={[textStyle(18, 600, P.ink, 21.6), styles.trPointsText]}>
                                {interp(list.coupon_points)}
                              </Text>
                              <Text {...nowrap} style={[textStyle(11, 400, P.inkMuted), styles.trPointsText]}>
                                {collapseWs(t('Points'))}
                              </Text>
                              {/* html:124 span.refund has no rule of its own, but carries style="font-size: 12px!important": 12px black inside the item's 16px / line-height normal line box */}
                              {rejectExtras ? (
                                <View testID={`redeem-refund-${i}`} style={strutLine}>
                                  <Text
                                    testID={`redeem-refund-text-${i}`}
                                    {...nowrap}
                                    style={{ ...textStyle(12, 400, P.ink, normalLineHeight(12)), ...styles.trPointsText, marginTop: STRUT_BASELINE - spanAscent(12) }}
                                  >
                                    {collapseWs(t('Refunded'))}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      </IonItem>

                      {/* html:129-136 */}
                      {gift == 'Pending' && recv == '' ? statusRow('pending', created, P.pending, 400, interp(list.gift_status)) : null /* eslint-disable-line eqeqeq */}
                      {/* html:137-144 */}
                      {gift == 'Reject' && recv == '' ? statusRow('reject', created, P.danger, 400, interp(list.gift_status)) : null /* eslint-disable-line eqeqeq */}
                      {/* html:145-152 */}
                      {gift == 'Approved' && recv == '' ? statusRow('approved', created, P.approved, 600, interp(list.gift_status)) : null /* eslint-disable-line eqeqeq */}
                      {/* html:153-161 NOTE (parity): the Receive button is commented out in the template; only the date text is left. */}
                      {recv == 'Shipped' // eslint-disable-line eqeqeq
                        ? statusRow('shipped', `${collapseWs(t('Shipped on'))}:${received}`, P.shipped, 400, collapseWs(t('Shipped')))
                        : null}
                      {/* html:162-169 */}
                      {recv == 'Received' // eslint-disable-line eqeqeq
                        ? statusRow('received', `${collapseWs(t('Receive on'))} : ${received}`, P.received, 400, collapseWs(t('Receive')))
                        : null}
                      {/* html:170-177 uses the `received` class (same colour) with the text 'Transfer' */}
                      {recv == 'Transfered' // eslint-disable-line eqeqeq
                        ? statusRow('transfered', `${collapseWs(t('Transfer on'))} : ${received}`, P.received, 400, collapseWs(t('Transfer')))
                        : null}
                      {/* NOTE (parity): the status icons (hourglass/reject/approve/checked/delivery/check.svg, variables.scss:12190-12280) point at
                          assets/icons/*.svg, a folder that does not exist in the Ionic app (404): no icon is drawn. */}
                    </View>
                  );
                })}
              </View>
            ) : null}
            {/* html:181-183 NOTE (parity): shown from the start (the list is [] before the response) */}
            {!transactions.length ? dataNot('redeem-empty') : null}
            {infinite(loadDataRedeem)}
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
