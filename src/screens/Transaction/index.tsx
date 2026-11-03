// Ported from: src/pages/transaction/transaction.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonItem } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import { activeNavNames } from '../../navigation/navigationRef';
import { useIonViewWillEnter } from '../../navigation/useIonViewWillEnter';
import { transactionMd as T } from '../../theme/ionicMdTransaction';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { datePipe, interp, titlecase } from '../../ui/angularPipes';
import { showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';
import { surpriseSvg } from './surpriseSvg';

// app.getActiveNav() page names that transaction.ts:151 looks for, without the 'Page' suffix.
// NOTE (parity): unlike the other pages' copy of this check, 'MainHomePage' is NOT in this list (transaction.ts:151).
const ROOT_PAGES = ['Home', 'GiftList', 'Transaction', 'Profile'];

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'blur', cb: () => void) => () => void;
    getState?: () => any;
    popToTop?: () => void;
  };
}

// TransactionPage has no `receive_status` property; the template reads `receive_status != ''` at html:25 and :44. Always undefined.
// NOTE (parity): `undefined != ''` is true, so for EVERY row with gift_status 'Reject' the reject reason and the 'Refunded' label show,
// whatever the row's own receive_status is.
const receiveStatusOfPage: any = undefined;

// `.tr-tags` / `.tr-points` text is `white-space: nowrap` inside `ion-label` (clipped, no ellipsis)
const nowrap = { numberOfLines: 1, ellipsizeMode: 'clip' } as const;

export default function TransactionScreen({ navigation }: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  // transaction.ts:13-16 fields
  const detail = useRef<any>([]); // transaction_detail:any=[] (the latest value, read by loadData like `this.transaction_detail`)
  const [transactionDetail, setTransactionDetail] = useState<any>([]);
  const [balancePoint, setBalancePoint] = useState<any>(''); // balance_point:any=''
  const filter = useRef<any>({}); // filter:any={}
  const [flag, setFlag] = useState<any>(''); // :113 flag:any='' (set to 1 for good by loadData, never reset)

  const setDetail = (v: any) => {
    detail.current = v;
    if (alive.current) {
      setTransactionDetail(v);
    }
  };

  // :23-25 constructor -> presentLoading() (:66-72): 'Please wait...', dismissOnPageChange: true
  useEffect(() => {
    alive.current = true;
    loader.show();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :27-31 ionViewWillEnter: first entry and every return from ShippingDetail.
  useIonViewWillEnter(() => {
    getTransactionDetail();
  });

  // :143-166 ionViewDidLeave. React Navigation's 'blur' fires on a push over this screen, like Ionic's didLeave.
  // NOTE (parity): when the nav that is active after leaving shows one of the root pages (and its previous page is not one of them),
  // this.navCtrl.popToRoot() runs. Transaction is a pushed page, so after ShippingDetail is pushed the active page is ShippingDetail and
  // nothing happens; the one case is a tab switch to Home/Profile/Wallet while Transaction sits in the Home tab's stack.
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

  // :33-38 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response.
  function doRefresh(refresher: { complete: () => void }) {
    getTransactionDetail();
    refresher.complete();
  }

  // :40-44 goOnShippingPage(id)
  function goOnShippingPage(id: any) {
    navigation.push('ShippingDetail', { id });
  }

  // :49-65 getTransactionDetail()
  function getTransactionDetail() {
    filter.current.limit = 0;
    db.onPostRequestDataFromApi(
      { karigar_id: db.userStorageData?.id, filter: filter.current },
      'app_karigar/transaction',
      db.rootUrl,
    ).then(
      (r: any) => {
        if (r) {
          loader.hide(); // :58 this.loading.dismiss()
          setDetail(r.transaction); // :59
          // :60 this.balance_point = parseInt(r.karigar.balance_point) + parseInt(r.karigar.reg_points)
          // NOTE (parity): `karigar: null` throws a TypeError AFTER the list was assigned: the list shows, balance_point keeps its old
          // value ('' on first load) and the error only reaches the console. Same here (no red box).
          try {
            const next = parseInt(String(r.karigar.balance_point)) + parseInt(String(r.karigar.reg_points)); // eslint-disable-line radix
            if (alive.current) {
              setBalancePoint(next);
            }
          } catch {
            // TypeError: Cannot read property 'balance_point' of null
          }
        }
        // NOTE (parity): a null body skips the whole block, loader included: 'Please wait...' stays up.
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :74-105 recvConfirmation(gift_id)
  function recvConfirmation(giftId: any) {
    showAlert({
      title: 'Confirmation!',
      subTitle: 'Did you receive this gift?',
      cssClass: 'action-close',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => {},
        },
        {
          text: 'Yes',
          cssClass: 'close-action-sheet',
          handler: () => {
            db.onPostRequestDataFromApi(
              { id: giftId, karigar_id: db.userStorageData?.id },
              'app_karigar/redeemReceiveStatus',
              db.rootUrl,
            ).then(
              () => {
                // NOTE (parity): the response is not looked at: any answer shows 'Success!' (the text has the typo 'receive').
                showSuccess('You have receive gift successfully');
                getTransactionDetail();
              },
              // NOTE (parity): no error callback in Ionic: after an HTTP error nothing happens (no alert, no reload).
              () => {},
            );
          },
        },
      ],
    });
  }

  // :106-113 showSuccess(text)
  function showSuccess(text: string) {
    showAlert({ title: 'Success!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  }

  // :115-141 loadData(infiniteScroll)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    // NOTE (parity): `this.transaction_detail.length` throws when transaction_detail is null/undefined (malformed first response): the
    // handler dies before complete(), the infinite scroll stays in its loading state. RN returns at the same point.
    if (detail.current == null) {
      return;
    }
    filter.current.limit = detail.current.length;
    db.onPostRequestDataFromApi(
      { karigar_id: db.userStorageData?.id, filter: filter.current },
      'app_karigar/transaction',
      db.rootUrl,
    ).then(
      (r: any) => {
        if (!r) {
          return; // TypeError at `r.transaction` in Ionic: complete() never runs
        }
        if (r.transaction == '') { // eslint-disable-line eqeqeq
          // NOTE (parity): loose == '': an empty array (and '') ends paging for good (flag is never reset, not even by a refresh);
          // complete() is not called, the element is removed by *ngIf="flag!=1".
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            setDetail(detail.current.concat(r.transaction));
            infiniteScroll.complete();
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: the infinite scroll stays in its loading state.
      () => {},
    );
  }

  return (
    <View style={styles.screen}>
      {/* html:1-5 */}
      <IonHeader>
        <IonNavbar title="Transaction" />
      </IonHeader>

      {/* html:7-93 <ion-content padding> */}
      <IonContent padding>
        {/* html:9-16 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:18-21 */}
        <View testID="top-nav" style={styles.topNav}>
          <Text style={[textStyle(14, 400, T.ink), styles.topNavP]}>Balance Points</Text>
          <Text testID="balance-point" style={[textStyle(24, 600, T.ink, 28.8), styles.topNavH1]}>
            {interp(balancePoint)}
          </Text>
          {/* `.top-nav:after` surprise.svg */}
          <View pointerEvents="none" style={styles.surpriseBox}>
            <SvgXml xml={surpriseSvg} width={97} height={97} style={styles.surprise} />
          </View>
        </View>

        {/* html:22-90 */}
        <View testID="transaction-list">
          {(Array.isArray(transactionDetail) ? transactionDetail : []).map((row: any, i: number) => {
            // NOTE (parity): a null row (only from a malformed second page, concat(null)) makes Ionic's template throw; RN shows an empty row.
            const list = row ?? {};
            const gift = list.gift_status;
            const recv = list.receive_status;
            const rejectExtras = gift == 'Reject' && receiveStatusOfPage != ''; // eslint-disable-line eqeqeq
            const date = interp(datePipe(list.date_created, 'd MMMM y'));
            return (
              // html:23 <div class="his-listing" (click)="goOnShippingPage(list.id)">: the whole block is tappable
              <Pressable key={i} testID={`transaction-row-${i}`} onPress={() => goOnShippingPage(list.id)} style={styles.hisListing}>
                {/* html:24-49 <button ion-item class="main-list"> */}
                <IonItem button noLines testID={`transaction-item-${i}`} style={styles.mainList} innerStyle={styles.itemInner} onPress={() => goOnShippingPage(list.id)}>
                  <View style={styles.label}>
                    <View style={styles.trContent}>
                      <View style={styles.inner}>
                        <View style={styles.trCircle}>
                          <MaterialIcon name="call_made" size={22} color={T.white} />
                        </View>
                        <View style={styles.trTags}>
                          <Text {...nowrap} style={textStyle(14, 400, T.ink, 16.8)}>
                            Request Send
                          </Text>
                          <Text testID={`transaction-title-${i}`} {...nowrap} style={[textStyle(12, 600, T.ink, 14.4), styles.trTagsH1]}>
                            {interp(titlecase(list.gift_title))}
                          </Text>
                          <Text testID={`transaction-reqid-${i}`} {...nowrap} style={[textStyle(10, 400, T.inkMuted), styles.trTagsP]}>
                            {`Req Id : REQ# ${interp(list.id)}`}
                          </Text>
                          {/* html:36 an inline <span> in a line box whose strut is the item's 16px / line-height normal */}
                          {rejectExtras && interp(titlecase(list.reject_reason)) !== '' ? (
                            <Text testID={`transaction-reason-${i}`} {...nowrap} style={textStyle(16, 400, T.ink, normalLineHeight(16))}>
                              <Text style={textStyle(11, 400, T.danger, normalLineHeight(11))}>{interp(titlecase(list.reject_reason))}</Text>
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={styles.trPoints}>
                        <Text {...nowrap} style={[textStyle(18, 600, T.ink, 21.6), styles.trPointsText]}>
                          {interp(list.coupon_points)}
                        </Text>
                        <Text {...nowrap} style={[textStyle(11, 400, T.inkMuted), styles.trPointsText]}>
                          Points
                        </Text>
                        {/* html:44 span.refund has no rule of its own: 16px black like the item text */}
                        {rejectExtras ? (
                          <Text testID={`transaction-refund-${i}`} {...nowrap} style={[textStyle(16, 400, T.ink, normalLineHeight(16)), styles.trPointsText]}>
                            Refunded
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </IonItem>

                {/* html:52-58 */}
                {gift == 'Pending' && recv == '' ? ( // eslint-disable-line eqeqeq
                  <View testID={`transaction-status-pending-${i}`} style={styles.trStatus}>
                    <View>
                      <Text style={textStyle(12, 500, T.inkMuted, 14.4)}>{date}</Text>
                    </View>
                    <View>
                      <Text style={textStyle(12, 400, T.pending)}>{interp(list.gift_status)}</Text>
                    </View>
                  </View>
                ) : null}
                {/* html:59-65 */}
                {gift == 'Reject' && recv == '' ? ( // eslint-disable-line eqeqeq
                  <View testID={`transaction-status-reject-${i}`} style={styles.trStatus}>
                    <View>
                      <Text style={textStyle(12, 500, T.inkMuted, 14.4)}>{date}</Text>
                    </View>
                    <View>
                      <Text style={textStyle(12, 400, T.danger)}>{interp(list.gift_status)}</Text>
                    </View>
                  </View>
                ) : null}
                {/* html:66-72 */}
                {gift == 'Approved' && recv == '' ? ( // eslint-disable-line eqeqeq
                  <View testID={`transaction-status-approved-${i}`} style={styles.trStatus}>
                    <View>
                      <Text style={textStyle(12, 500, T.inkMuted, 14.4)}>{date}</Text>
                    </View>
                    <View>
                      <Text style={textStyle(12, 600, T.approved)}>{interp(list.gift_status)}</Text>
                    </View>
                  </View>
                ) : null}
                {/* html:73-80 */}
                {recv == 'Shipped' ? ( // eslint-disable-line eqeqeq
                  <View testID={`transaction-status-shipped-${i}`} style={styles.trStatus}>
                    <View>
                      {/* html:75 <button (click)="recvConfirmation(list.id)">. NOTE (parity): the click also bubbles to the .his-listing
                          div, so ShippingDetail is pushed right after the alert is shown. A plain <button>: no ripple, 13.333px UA font size,
                          line-height 1 ([CSS] `button { line-height: 1 }`). */}
                      <Pressable
                        testID={`transaction-receive-${i}`}
                        onPress={() => {
                          recvConfirmation(list.id);
                          goOnShippingPage(list.id);
                        }}
                        style={styles.receiveButton}
                      >
                        <Text style={textStyle(13.3333, 400, T.white, 13.3333)}>Receive</Text>
                      </Pressable>
                    </View>
                    <View>
                      <Text style={textStyle(12, 400, T.shipped)}>Shipped</Text>
                    </View>
                  </View>
                ) : null}
                {/* html:81-88 */}
                {recv == 'Received' ? ( // eslint-disable-line eqeqeq
                  <View testID={`transaction-status-received-${i}`} style={styles.trStatus}>
                    <View>
                      <Text style={textStyle(12, 500, T.inkMuted, 14.4)}>{`Receive on : ${interp(datePipe(list.received_date, 'd MMMM y'))}`}</Text>
                    </View>
                    <View>
                      <Text style={textStyle(12, 400, T.received)}>Receive</Text>
                    </View>
                  </View>
                ) : null}
                {/* NOTE (parity): the status icons (hourglass/reject/approve/checked/delivery/check.svg, variables.scss:12190-12280) point at
                    assets/icons/*.svg, a folder that does not exist in the Ionic app (404): no icon is drawn. */}
              </Pressable>
            );
          })}

          {/* html:91-96 *ngIf="flag!=1" */}
          {flag != 1 ? ( // eslint-disable-line eqeqeq
            <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
              <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
            </IonInfiniteScroll>
          ) : null}
          {/* html:97 <div class="h100"> */}
          <View style={styles.h100} />
        </View>
      </IonContent>
    </View>
  );
}
