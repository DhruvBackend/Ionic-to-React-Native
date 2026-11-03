// Ported from: src/pages/plumber-list/plumber-list.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonFab, IonFabButton } from '../../components/ionic/IonFab';
import { IonIcon } from '../../components/ionic/IonIcon';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonHeader, IonNavbar, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSearchbar } from '../../components/ionic/IonSearchbar';
import { IonSegment, IonSegmentButton } from '../../components/ionic/IonSegment';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { md } from '../../theme/ionicMd';
import { plumberMd } from '../../theme/ionicMdPlumber';
import { profileMd as P } from '../../theme/ionicMdProfile';
import { scssColors } from '../../theme';
import { datePipe, interp } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { styles as gridStyles } from '../ProductDetail/styles';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
}

const black = scssColors.black;

// `class="{{row.status}}"`: `.Verified { green }`, `.Pending { #ffc400 }`, `.Suspect { skyblue }`, `.Reject, .Cancel { $danger }` (all !important,
// variables.scss:499-516). Any other status keeps the paragraph colour.
const statusColor: Record<string, string> = {
  Verified: P.statusVerified,
  Pending: P.statusPending,
  Suspect: P.statusSuspect,
  Reject: P.statusReject,
  Cancel: P.statusReject,
};

export default function PlumberListScreen({ navigation }: Props) {
  const loader = useLoader();
  const filter = useRef<any>({}); // :19 filter:any = {} (one object, mutated by every call)
  const statusTypeRef = useRef('Pending'); // :20 statusType = "Pending" (ion-segment model; the page's (click) sees the NEW value)
  const [statusType, setStatusType] = useState('Pending');
  const plumberRef = useRef<any>([]); // :27 plumber:any = []
  const [plumber, setPlumber] = useState<any>([]);
  const [flag, setFlag] = useState<any>(''); // :22 flag:any=''
  const [pending, setPending] = useState<any>(undefined); // :25 karigar_pending (undefined until the first answer)
  const [verified, setVerified] = useState<any>(undefined); // :23 karigar_verified
  const [reject, setReject] = useState<any>(undefined); // :24 karigar_reject
  const [search, setSearch] = useState(''); // html:15 [(ngModel)]="filter.search"
  const alive = useRef(true);

  // :29-38 constructor. NOTE (parity): ionViewDidLoad (:40) only logs: not ported.
  useEffect(() => {
    alive.current = true;
    filter.current.sales_boy_id = db.userStorageData?.id; // :35
    presentLoading(); // :36
    getPlumber(statusTypeRef.current, ''); // :37
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :55-62 presentLoading(): content 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show();
  }

  // :64-67 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response; getPlumber resets flag so the infinite scroll returns.
  function doRefresh(refresher: { complete: () => void }) {
    getPlumber(statusTypeRef.current, '');
    refresher.complete();
  }

  // :49-52 onCancel(event): only console.log (bound to keyup.enter, html:13)
  function onCancel() {}

  // :70-90 getPlumber(type, search)
  function getPlumber(type: any, searchText?: any) {
    setFlag(0); // :72
    filter.current.limit = 0; // :73
    filter.current.status = type; // :74
    filter.current.search = searchText; // :75 (undefined from a segment tap: dropped from the body, and the ngModel clears the search box)
    setSearch(searchText ?? '');
    db.onPostRequestDataFromApi({ filter: filter.current }, 'app_karigar/sales_boy_plumber_list', db.rootUrl).then(
      (response: any) => {
        loader.hide(); // :82 this.loading.dismiss() (before the model is assigned)
        // NOTE (parity): a null body throws at response.karigar_pending after the loader is gone: nothing else happens.
        if (response == null) {
          return;
        }
        if (alive.current) {
          setPending(response.karigar_pending); // :83
          setReject(response.karigar_reject); // :84
          setVerified(response.karigar_verified); // :85
        }
        // NOTE (parity): `karigars: null` throws at response.karigars.data after the three counts were assigned: the list keeps what it had.
        if (response.karigars == null) {
          return;
        }
        plumberRef.current = response.karigars.data; // :86
        if (alive.current) {
          setPlumber(response.karigars.data);
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :92-115 loadData(infiniteScroll, type)
  // NOTE (parity): the next pages come from 'app_karigar/getComplaintList' (copy-paste in Ionic), read as `karigars` like the first list.
  function loadData(infiniteScroll: InfiniteScrollHandle, type: any) {
    // NOTE (parity): `this.plumber.length` throws while plumber is undefined/null (after a malformed `karigars.data`): the handler dies
    // before the request and the infinite scroll stays in its loading state.
    if (plumberRef.current == null) {
      return;
    }
    filter.current.limit = plumberRef.current.length; // :95 the next offset
    filter.current.status = type; // :96
    db.onPostRequestDataFromApi({ filter: filter.current }, 'app_karigar/getComplaintList', db.rootUrl).then(
      (r: any) => {
        // NOTE (parity): a null body throws at r.karigars: nothing happens (the infinite scroll stays loading).
        if (r == null) {
          return;
        }
        const resData = r.karigars; // :99
        // :101 `resData == ''` (loose): '' and [] both equal '' in JS, so an empty page ends paging until the next search/refresh.
        if (resData == '') { // eslint-disable-line eqeqeq
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            // NOTE (parity): `this.plumber.concat(...)` on a null list throws inside the timer: complete() never runs.
            if (plumberRef.current == null) {
              return;
            }
            const next = plumberRef.current.concat(resData); // :108
            plumberRef.current = next;
            if (alive.current) {
              setPlumber(next);
            }
            infiniteScroll.complete();
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: the infinite scroll stays in its loading state after an HTTP error.
      () => {},
    );
  }

  // :43-45 goOnPlumberAdd()
  function goOnPlumberAdd() {
    navigation.push('PlumberAdd');
  }

  // :117-119 goToDetail(id)
  function goToDetail(id: any) {
    navigation.push('PlumberDetail', { id });
  }

  const rows: any[] = Array.isArray(plumber) ? plumber : [];
  const small = textStyle(12, 400, md.textColor, 18); // `.middle-block p { font-size: 12px; line-height: 18px }`
  const smallBold = textStyle(12, 700, md.textColor, 18);

  return (
    <View style={styles.screen}>
      {/* html:8-35 <ion-header class="main-header remove" no-border> */}
      <IonHeader mainHeader remove noBorder>
        <IonNavbar color="primary" title="Plumber" />
        {/* html:11 <ion-toolbar class="toolbarHeight" color="primary"> */}
        <IonToolbar color="primary" toolbarHeight>
          <View style={gridStyles.addSearch}>
            <View style={gridStyles.filter}>
              {/* html:14-15 (ngModelChange) searches on EVERY keystroke, no debounce; (keyup.enter) only logs */}
              <IonSearchbar
                type="search"
                placeholder="Search"
                value={search}
                onChangeText={(v: string) => {
                  filter.current.search = v;
                  setSearch(v);
                  getPlumber(statusTypeRef.current, v);
                }}
                onSubmit={onCancel}
              />
            </View>
          </View>
        </IonToolbar>
        {/* html:19-34 <ion-toolbar color="white"> */}
        <IonToolbar color="white">
          <IonSegment
            inTabBtn
            value={statusType}
            onValueChange={v => {
              statusTypeRef.current = v;
              setStatusType(v);
            }}
          >
            <IonSegmentButton testID="segment-Pending" value="Pending" onPress={() => getPlumber(statusTypeRef.current)}>
              {`Pending (${interp(pending)})`}
            </IonSegmentButton>
            <IonSegmentButton testID="segment-Verified" value="Verified" onPress={() => getPlumber(statusTypeRef.current)}>
              {`Verified (${interp(verified)})`}
            </IonSegmentButton>
            <IonSegmentButton testID="segment-Reject" value="Reject" onPress={() => getPlumber(statusTypeRef.current)}>
              {`Reject (${interp(reject)})`}
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      {/* html:37 <ion-content padding>; the <ion-fab> is Ionic's fixed content */}
      <IonContent
        padding
        fixedContent={
          // html:84-86 (click) is on the <ion-fab> element
          <IonFab horizontal="right" vertical="bottom">
            <IonFabButton color="primary" icon="add" onPress={goOnPlumberAdd} />
          </IonFab>
        }
      >
        {/* html:38-45 */}
        <IonRefresher onRefresh={doRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:48-82 <div class="main-history padding0"> */}
        <View style={styles.mainHistory}>
          {rows.map((rowOrNull: any, i: number) => {
            // NOTE (parity): `concat(undefined)` (a page answer without `karigars`) adds an undefined row; Ionic's template throws on it and the view
            // freezes. RN shows an empty card instead.
            const row = rowOrNull ?? {};
            return (
            // html:49 (click)="goToDetail(row.id)"
            <Pressable
              key={i}
              testID={`plumber-item-${i}`}
              style={[styles.csList, i === rows.length - 1 ? styles.csListLast : null]}
              onPress={() => goToDetail(row.id)}
            >
              <View style={styles.middleBlock}>
                <View style={styles.dateStatus}>
                  <Text testID={`plumber-date-${i}`} style={[small, styles.dateCell]}>
                    <Text style={smallBold}>Date Created:</Text>
                    {datePipe(row.date_created, 'd MMMM y')}
                  </Text>
                  {/* NOTE (parity): 'Satus' (sic) is hard-coded in plumber-list.html:52 */}
                  <Text style={[small, styles.dateCell]}>
                    <Text style={smallBold}>{'Satus: '}</Text>
                    <Text testID={`plumber-status-${i}`} style={statusColor[row.status] ? { color: statusColor[row.status] } : undefined}>
                      {interp(row.status)}
                    </Text>
                  </Text>
                </View>
              </View>

              <View style={styles.topBlock}>
                {/* `.cs-list .top-block p { font-size: 14px; color: #000; font-weight: 600 }`; no titlecase pipe here */}
                <Text testID={`plumber-name-${i}`} style={textStyle(14, 600, black)}>
                  {interp(row.first_name)}
                </Text>
                <View style={styles.numberBlock}>
                  <Text testID={`plumber-mobile-${i}`} style={textStyle(12, 400, md.textColor, 20)}>
                    {interp(row.mobile_no)}
                  </Text>
                  {/* html:44 <a class="dialer" href="tel:{{row.mobile_no}}">. NOTE (parity): the click also bubbles to the card's goToDetail. */}
                  <Pressable
                    testID={`plumber-dialer-${i}`}
                    style={styles.dialer}
                    onPress={() => {
                      goToDetail(row.id);
                      Linking.openURL(`tel:${interp(row.mobile_no)}`);
                    }}
                  >
                    <IonIcon name="md-call" size={20} color={md.linkColor} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.middleBlockFoot}>
                <View style={styles.dateStatus}>
                  <Text testID={`plumber-active-${i}`} style={[small, styles.dateCell]}>
                    <Text style={smallBold}>Last Active:</Text>
                    {` ${row.last_login_at ? datePipe(row.last_login_at, 'd MMM y, h:mm a') : '—'}`}
                  </Text>
                  <Text testID={`plumber-scan-${i}`} style={[small, styles.dateCell]}>
                    <Text style={smallBold}>Last Scan:</Text>
                    {` ${row.last_scan_at ? datePipe(row.last_scan_at, 'd MMM y, h:mm a') : '—'}`}
                  </Text>
                </View>
                <Text testID={`plumber-points-${i}`} style={small}>
                  <Text style={smallBold}>Points:</Text>
                  {' '}
                  <Text style={textStyle(12, 600, plumberMd.points, 18)}>{interp(row.balance_point || 0)}</Text>
                </Text>
              </View>
            </Pressable>
            );
          })}

          {/* html:78-80 *ngIf="!plumber.length" */}
          {!rows.length ? (
            <View testID="plumber-empty" style={styles.dataNot}>
              <SvgXml xml={noFoundXml} width={(100 * noFoundSize.width) / noFoundSize.height} height={100} />
            </View>
          ) : null}
        </View>

        {/* html:87-93 *ngIf="flag!=1" */}
        {flag != 1 ? ( // eslint-disable-line eqeqeq
          <IonInfiniteScroll threshold="100px" onInfinite={(h: InfiniteScrollHandle) => loadData(h, statusTypeRef.current)}>
            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
          </IonInfiniteScroll>
        ) : null}
      </IonContent>
    </View>
  );
}
