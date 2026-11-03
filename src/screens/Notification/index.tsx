// Ported from: src/pages/notification/notification.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { notificationMd as N } from '../../theme/ionicMdNotification';
import { datePipe, interp } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { styles } from './styles';

interface Props {
  navigation?: object;
}

export default function NotificationScreen(_props: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  // notification.ts:11-12 fields: data:any = []
  const data = useRef<any>([]); // the latest value (loadData reads `this.data`)
  const [rows, setRows] = useState<any>([]);
  const [flag, setFlag] = useState<any>(''); // :79 flag:any='' (set to 1 for good by loadData, never reset)
  const [viewport, setViewport] = useState(0); // ion-content height, for `.data-not { height: calc(100% - 50px) }`

  const setData = (v: any) => {
    data.current = v;
    if (alive.current) {
      setRows(v);
    }
  };

  // :15-18 constructor: presentLoading() then getNotification(). There is no ionViewWillEnter: returning to the page does not reload it.
  // NOTE (parity): i18n: notification.module.ts imports only IonicPageModule.forChild and the template has no `| translate`:
  // every string is hardcoded English and the page never calls use().
  useEffect(() => {
    alive.current = true;
    presentLoading();
    getNotification();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :45-51 presentLoading(): 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show();
  }

  // :55-71 getNotification()
  // NOTE (parity): `this.loading.present` (no call) is a no-op.
  function getNotification() {
    db.onPostRequestDataFromApi(
      { karigar_id: db.userStorageData?.id, limit: data.current.length },
      'app_karigar/get_notification',
      db.rootUrl,
    ).then(
      (r: any) => {
        // NOTE (parity): a null body throws at `r.notification` before the dismiss: 'Please wait...' stays up.
        if (r == null) {
          return;
        }
        setData(r.notification); // :64
        loader.hide(); // :67
      },
      () => {
        loader.hide(); // :69 the error callback also dismisses
      },
    );
  }

  // :73-77 doRefresh(refresher): dead code, the <ion-refresher> in notification.html:9-13 is commented out. Not ported.

  // :80-102 loadData(infiniteScroll)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    // NOTE (parity): `this.data.length` throws when data is null/undefined (malformed first answer): the handler dies before
    // complete(), the infinite scroll stays in its loading state. RN returns at the same point.
    if (data.current == null) {
      return;
    }
    db.post_rqst({ karigar_id: db.userStorageData?.id, limit: data.current.length }, 'app_karigar/get_notification').then(
      (resp: any) => {
        // :89 `resp==''` (loose): only an empty-string body ends paging for good (an object never equals ''). flag is never reset;
        // complete() is not called, the element is removed by *ngIf="flag!=1".
        if (resp == '') { // eslint-disable-line eqeqeq
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            // NOTE (parity): a null body (or null data) throws inside the timer in Ionic: complete() never runs.
            if (resp == null || data.current == null) {
              return;
            }
            // NOTE (parity): concat of a missing/null `notification` appends one undefined/null row; an empty page appends nothing and
            // complete() runs: the next scroll asks again with the same limit (the scroll never ends by itself).
            setData(data.current.concat(resp.notification));
            infiniteScroll.complete();
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the infinite scroll stays in its loading state.
      () => {},
    );
  }

  // html:19 `*ngIf="!data.length"` (null/undefined data throws in Ionic's change detection: the empty-state image stays, no error is shown)
  const list: any[] = Array.isArray(rows) ? rows : [];
  const empty = rows == null || !rows.length;
  const imgH = 100; // `.data-not img { height: 100px }`

  return (
    <View style={styles.screen}>
      {/* html:1-5 <ion-header class="main-header remove"> */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title="Notification" />
      </IonHeader>

      {/* html:7 <ion-content class="main-backgroung"> (no rule defines main-backgroung) */}
      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:10-16 <ion-refresher> is commented out in the source */}

        {/* html:19-22 */}
        {list.map((row: any, i: number) => {
          // NOTE (parity): a null row (only from a malformed second page, concat(null)) makes Ionic's template throw; RN shows an empty row.
          const r = row ?? {};
          // `last-child { border-bottom: 0 }`: the row is the last element of the scroll content only once the infinite scroll is gone (flag == 1)
          const last = i === list.length - 1 && flag == 1; // eslint-disable-line eqeqeq
          return (
            <View
              key={i}
              testID={`notification-row-${i}`}
              style={[styles.row, last ? styles.rowLast : null, r.read ? styles.rowNew : null]} // [ngClass]="{'new': row.read}" (JS truthiness)
            >
              <Text testID={`notification-text-${i}`} style={textStyle(15, 400, N.ink, 24)}>
                {interp(r.notification)}
              </Text>
              <Text testID={`notification-date-${i}`} style={[textStyle(12, 400, N.dateText), styles.date]}>
                {interp(datePipe(r.date_created, 'd MMMM y'))}
              </Text>
            </View>
          );
        })}

        {/* html:24-26 */}
        {empty ? (
          <View testID="notification-empty" style={[styles.dataNot, { height: Math.max(viewport - 50, 0) }]}>
            <SvgXml xml={noFoundXml} width={(imgH * noFoundSize.width) / noFoundSize.height} height={imgH} />
          </View>
        ) : null}

        {/* html:29-32 *ngIf="flag!=1" */}
        {flag != 1 ? ( // eslint-disable-line eqeqeq
          <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
          </IonInfiniteScroll>
        ) : null}
      </IonContent>
    </View>
  );
}
