// Ported from: src/pages/complaints/complaint-history/complaint-history.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonIcon } from '../../components/ionic/IonIcon';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonHeader, IonNavbar, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSearchbar } from '../../components/ionic/IonSearchbar';
import { IonSegment, IonSegmentButton } from '../../components/ionic/IonSegment';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { ionicColors } from '../../theme';
import { complaintMd as C } from '../../theme/ionicMdComplaint';
import { collapseWs, datePipe, interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: any };
}

// global `.Closed / .Pending / .Reject, .Cancel { color: ... !important }` ([T] 499-516) for `class="{{complaint.status}}"`
const statusColor = (s: any) => (s == 'Closed' ? C.closed : s == 'Pending' ? C.pending : s == 'Cancel' ? C.cancel : C.ink); // eslint-disable-line eqeqeq

export default function ComplaintHistoryScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  const [viewport, setViewport] = useState(0);

  // complaint-history.ts:33 `this.data.type = this.navParams.data.type`
  // NOTE (parity): complaint-history.module.ts has its own TranslateModule.forRoot, but the page never calls setDefaultLang/use(), so the
  // language is whatever the app has (global in RN too).
  const type = (route?.params ?? {}).type;
  // :22-26 fields. `filter` is ONE object, mutated by every call (a request body is serialised at the call, as Angular does on subscribe).
  const filter = useRef<any>({});
  const statusTypeRef = useRef<string>('Pending'); // :26 statusType = "Pending"
  const [statusType, setStatusType] = useState('Pending');
  const [flag, setFlag] = useState<any>(''); // :19 flag:any=''
  // NOTE (parity): a null/undefined `complaintList` (malformed response) makes `complaint_list.length` throw in Ionic's template during change
  // detection: the view keeps what it showed before. RN skips the state update the same way; the raw value is still stored, so the paging
  // handlers stop at the same point as `this.complaint_list.length` does in Ionic.
  const listRef = useRef<any>([]);
  const [list, setListState] = useState<any>([]);
  const setList = (v: any) => {
    listRef.current = v;
    if (alive.current && v != null) {
      setListState(v);
    }
  };

  // :34-40 constructor: presentLoading(); getComplaintHistory(type, statusType, filter.search); :42-45 ionViewDidLoad: filter.status = ''
  // NOTE (parity): ionViewDidLoad runs after the first request was built, so every later infinite-scroll request (which reuses `filter`
  // without touching `status`) sends status '' until a segment / search / refresh sets it again.
  useEffect(() => {
    alive.current = true;
    presentLoading();
    getComplaintHistory(type, statusTypeRef.current, filter.current.search);
    filter.current.status = '';
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :53-59 presentLoading(): 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: true });
  }

  // :47-50 onComplaintdetail(id)
  function onComplaintdetail(id: any) {
    navigation.push('ComplaintDetail', { id });
  }

  // :61-67 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response.
  function doRefresh(refresher: { complete: () => void }) {
    getComplaintHistory(type, statusTypeRef.current, filter.current.search);
    refresher.complete();
  }

  // :69-87 getComplaintHistory(type, status, search)
  function getComplaintHistory(typ: any, status: any, search: any) {
    setFlag(0);
    filter.current.limit = 0;
    filter.current.status = status;
    filter.current.search = search;
    db.onPostRequestDataFromApi(
      { filter: filter.current, type: { type: typ }, retailer_id: db.userStorageData?.id },
      'app_karigar/getComplaintList',
      db.rootUrl,
    ).then(
      (response: any) => {
        loader.hide(); // :80 this.loading.dismiss() (the loader of the constructor: later calls dismiss nothing)
        if (!response) {
          return; // TypeError at `response['complaintList']`
        }
        setList(response.complaintList);
        // :82 `this.complaint_count = response['complaint_count']` is never read by the template (only by a commented-out block)
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :89-122 loadData(infiniteScroll, type)
  function loadData(infiniteScroll: InfiniteScrollHandle) {
    if (listRef.current == null) {
      return; // `this.complaint_list.length` throws: no request, complete() never runs
    }
    filter.current.limit = listRef.current.length;
    db.onPostRequestDataFromApi({ filter: filter.current, type: { type } }, 'app_karigar/getComplaintList', db.rootUrl).then(
      (r: any) => {
        if (!r) {
          return; // TypeError at `r['complaintList']`: complete() never runs
        }
        if (r.complaintList == '') { // eslint-disable-line eqeqeq
          // NOTE (parity): loose == '': an empty array ends paging until the next getComplaintHistory resets `flag`; complete() is not called.
          if (alive.current) {
            setFlag(1);
          }
        } else {
          setTimeout(() => {
            setList(listRef.current.concat(r.complaintList));
            infiniteScroll.complete();
          }, 1000);
        }
      },
      // NOTE (parity): no error callback in Ionic: the infinite scroll stays in its loading state.
      () => {},
    );
  }

  // NOTE (parity): `keyup.enter` calls `onCancel($event)`, a method the page does not have: Angular throws a TypeError in the handler and nothing happens.
  // NOTE (parity): `showSuccess(text)` (:124-132) is never called (dead code).

  // `<a class="dialer" href="tel:...">`: the cordova webview follows the link and the click also bubbles to the card's (click)
  const dial = (mobile: any, id: any) => {
    Linking.openURL(`tel:${interp(mobile)}`);
    onComplaintdetail(id);
  };

  const rows: any[] = Array.isArray(list) ? list : [];
  const smallText = textStyle(12, 400, C.ink, 18);
  const strong = textStyle(12, 700, C.ink, 18);
  const badgeText = { ...textStyle(10, 600, C.white), letterSpacing: 0.5 }; // `span.cs-badge { letter-spacing: .5px }`
  const callBlock = (mobile: any, id: any, testID: string) => (
    <View style={styles.numberBlock}>
      <Text testID={`${testID}-mobile`} style={textStyle(12, 400, C.ink, 20)}>
        {interp(mobile)}
      </Text>
      <Pressable testID={`${testID}-dial`} onPress={() => dial(mobile, id)} style={styles.dialer}>
        <IonIcon name="md-call" size={20} color={ionicColors.primary} />
      </Pressable>
    </View>
  );

  // `.data-not`: height calc(100% - 50px) of the ion-content scroll area; `<img>` height 100px
  const imgH = 100;

  return (
    <View style={styles.screen}>
      {/* html:7-81 */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(t('Request History'))} />
        <IonToolbar color="primary" toolbarHeight>
          <View style={styles.search}>
            <View style={styles.filter}>
              <View style={styles.fullWidth}>
                <IonSearchbar
                  type="search"
                  placeholder="Search"
                  onChangeText={v => {
                    // [(ngModel)]="filter.search" then (ngModelChange)="getComplaintHistory(data.type, statusType, $event)"
                    filter.current.search = v;
                    getComplaintHistory(type, statusTypeRef.current, v);
                  }}
                />
              </View>
            </View>
          </View>
        </IonToolbar>
        <IonToolbar color="white">
          <IonSegment
            inTabBtn
            value={statusType}
            onValueChange={v => {
              statusTypeRef.current = v;
              setStatusType(v);
            }}
          >
            {['Pending', 'Closed', 'Cancel'].map(s => (
              <IonSegmentButton key={s} value={s} testID={`segment-${s}`} onPress={() => getComplaintHistory(type, statusTypeRef.current, filter.current.search)}>
                {s}
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {/* html:90-94 */}
        {!rows.length ? (
          <View testID="complaint-empty" style={[styles.dataNot, { height: Math.max(viewport - 50, 0) }]}>
            <SvgXml xml={noFoundXml} width={(imgH * noFoundSize.width) / noFoundSize.height} height={imgH} />
          </View>
        ) : null}

        {/* html:97-171 */}
        {rows.length ? (
          <View testID="complaint-list">
            <IonRefresher onRefresh={doRefresh}>
              <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
            </IonRefresher>

            <View style={styles.mainHistory}>
              {rows.map((row: any, i: number) => {
                // NOTE (parity): a null row (only from a malformed second page, concat(null)) makes Ionic's template throw; RN shows an empty row.
                const c = row ?? {};
                return (
                  <Pressable key={i} testID={`complaint-${i}`} onPress={() => onComplaintdetail(c.complaintId)} style={[styles.csList, i === rows.length - 1 ? styles.lastChild : null]}>
                    <View style={styles.topBlock}>
                      <Text testID={`complaint-${i}-name`} style={textStyle(14, 600, C.ink)}>
                        {`${interp(c.customerName)} `}
                        {type == 'Service' ? ( // eslint-disable-line eqeqeq
                          <View style={styles.badge}>
                            <Text style={badgeText}>{`COM#${interp(c.complaintId)}`}</Text>
                          </View>
                        ) : null}
                        {type == 'Installation' ? ( // eslint-disable-line eqeqeq
                          <View style={styles.badge}>
                            <Text style={badgeText}>{`IR#${interp(c.complaintId)}`}</Text>
                          </View>
                        ) : null}
                      </Text>
                      {callBlock(c.customerMobileNo, c.complaintId, `complaint-${i}`)}
                    </View>
                    <View style={styles.middleBlock}>
                      <View style={styles.dateStatus}>
                        <Text testID={`complaint-${i}-date`} style={[smallText, styles.dateCell]}>
                          <Text style={strong}>{`${collapseWs(t('Date'))}:`}</Text>
                          {interp(datePipe(c.compalintDate, 'd MMMM y'))}
                        </Text>
                        <Text testID={`complaint-${i}-otp`} style={[smallText, styles.dateCell]}>
                          <Text style={strong}>{`${collapseWs(t('OTP'))}:`}</Text>
                          {` ${interp(c.otp)}`}
                        </Text>
                        <Text testID={`complaint-${i}-status`} style={[smallText, styles.dateCell]}>
                          <Text style={strong}>{`${collapseWs(t('Satus'))}: `}</Text>
                          <Text style={{ color: statusColor(c.status) }}>{interp(titlecase(c.status))}</Text>
                          {' '}
                        </Text>
                      </View>
                      <Text testID={`complaint-${i}-problem`} style={smallText}>
                        <Text style={strong}>{`${collapseWs(t('Nature Problem'))}:`}</Text>
                        {` ${interp(c.nature_problem)}`}
                      </Text>
                    </View>
                    <View style={[styles.topBlock, styles.footerBlock]}>
                      {c.plumberName == null && c.status == 'Pending' ? ( // eslint-disable-line eqeqeq
                        <Text testID={`complaint-${i}-waiting`} style={textStyle(14, 600, C.ink)}>
                          Waiting For Plumber Assign . . .
                        </Text>
                      ) : null}
                      {c.plumberName != null ? (
                        <>
                          <Text testID={`complaint-${i}-plumber`} style={textStyle(14, 600, C.ink)}>
                            <Text style={textStyle(12, 600, C.ink)}>{`${collapseWs(t('Plumber Name'))}:`}</Text>
                            {` ${interp(c.plumberName)}`}
                          </Text>
                          {callBlock(c.plumberMobileNo, c.complaintId, `complaint-${i}-p`)}
                        </>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* html:174-182 *ngIf="flag!=1" */}
            {flag != 1 ? ( // eslint-disable-line eqeqeq
              <IonInfiniteScroll threshold="100px" onInfinite={loadData}>
                <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
              </IonInfiniteScroll>
            ) : null}
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
