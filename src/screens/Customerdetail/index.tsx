// Ported from: src/pages/customerdetail/customerdetail.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInfiniteScroll, IonInfiniteScrollContent, type InfiniteScrollHandle } from '../../components/ionic/IonInfiniteScroll';
import { IonHeader, IonNavbar, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { IonSegment, IonSegmentButton } from '../../components/ionic/IonSegment';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { md } from '../../theme/ionicMd';
import { profileMd as P } from '../../theme/ionicMdProfile';
import { collapseWs, datePipe, interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { styles as profileStyles } from '../Profile/styles';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: { id?: any } };
}

// `.Closed { color: green }`, `.Pending { color: #ffc400 }`, `.Reject, .Cancel { color: $danger }` (variables.scss:503-517, all !important)
const statusColor: Record<string, string> = { Closed: P.statusVerified, Pending: P.statusPending, Reject: P.statusReject, Cancel: P.statusReject };

export default function CustomerdetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const karigarId = useRef<any>(route?.params?.id); // :39 this.karigar_id = this.navParams.data.id
  const filter = useRef<any>({}); // :27 filter:any = {} (one object, mutated by every call)
  // the two ion-segment models. Refs mirror them because the page's (click) handlers see the NEW value at once (see IonSegment).
  const alltabRef = useRef('Basic Details'); // :14 alltab
  const statusTypeRef = useRef('Pending'); // :15 statusType
  const [alltab, setAlltab] = useState('Basic Details');
  const [statusType, setStatusType] = useState('Pending');
  const [karigarDetail, setKarigarDetail] = useState<any>({}); // :21 karigar_detail:any={}
  const [complaintList, setComplaintList] = useState<any>([]); // :30 complaint_list:any=[]
  const [flag] = useState<any>(''); // :26 flag:any='' (nothing ever changes it: loadData is dead)
  const alive = useRef(true);

  // :34-42 constructor. NOTE (parity): ionViewDidLoad (:44) only logs: not ported.
  // The page's customerdetail.module.ts has its own TranslateModule.forRoot but never calls use(): the language is global.
  useEffect(() => {
    alive.current = true;
    presentLoading(); // :40
    getKarigarDetail(alltabRef.current); // :41
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :48-56 presentLoading(): content 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show();
  }

  // :57-60 getType(type)
  function getType(type: string) {
    statusTypeRef.current = type; // :58
    getComplaintHistory(undefined); // :59 this.getComplaintHistory(this.comType) (comType is always undefined-like {}, only logged)
  }

  // :62-85 getKarigarDetail(type)
  function getKarigarDetail(type: any) {
    if (type == 'Basic Details') { // eslint-disable-line eqeqeq
      filter.current.status = ''; // :66
    } else {
      filter.current.status = statusTypeRef.current; // :70
    }
    db.onPostRequestDataFromApi({ karigar_id: karigarId.current, filter: filter.current }, 'app_karigar/customerDetail', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :77 this.loading.dismiss() (before the model is assigned)
        // NOTE (parity): a null body throws at r['customer'] after the loader is gone: nothing else happens.
        if (r == null) {
          return;
        }
        // NOTE (parity): `customer: null` makes the template's `karigar_detail.first_name` throw during Ionic's change detection: the view
        // keeps what it showed before and no error is shown. RN skips the update the same way.
        if (r.customer == null) {
          return;
        }
        if (alive.current) {
          setKarigarDetail(r.customer); // :78
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :87-107 getComplaintHistory(type)
  function getComplaintHistory(_type: any) {
    filter.current.limit = 0; // :90
    filter.current.status = statusTypeRef.current; // :91
    db.onPostRequestDataFromApi({ filter: filter.current, karigar_id: karigarId.current }, 'app_karigar/complaintDetail', db.rootUrl).then(
      (response: any) => {
        // NOTE (parity): a null body throws at response.complaint: nothing happens (the loader is not touched either).
        if (response == null) {
          return;
        }
        if (alive.current) {
          setComplaintList(response.complaint); // :95 (a null list renders no cards)
        }
        loader.hide(); // :98 this.loading.dismiss() (after the model is assigned)
      },
      // NOTE (parity): no error callback in Ionic: nothing happens after an HTTP error.
      () => {},
    );
  }

  // :109-112 onComplaintdetail(id)
  function onComplaintdetail(id: any) {
    navigation.push('ComplaintDetail', { id });
  }

  // :115-118 doRefresh(refresher)
  // NOTE (parity): complete() is called right away, without waiting for the response. The Complaint tab holds a second <ion-refresher>
  // (html:124-130) next to the page's own (html:25-31): one pull fires both (ionRefresh), so doRefresh runs twice there. The kit has one
  // refresher slot, so the second one is replayed through this handler (one indicator is drawn, both calls are made).
  function doRefresh(refresher: { complete: () => void }) {
    getKarigarDetail(alltabRef.current);
    refresher.complete();
  }
  function onRefresh(refresher: { complete: () => void }) {
    doRefresh(refresher);
    if (alltabRef.current == 'Complaint') { // eslint-disable-line eqeqeq
      doRefresh(refresher);
    }
  }

  // :120-143 loadData(infiniteScroll)
  // NOTE (parity): `this.complain_detail.length` throws: complain_detail is declared (:20) but never assigned. The handler dies before any
  // request and the infinite scroll (shown while flag != 1, html:113) stays in its loading state. The sales_boy_customer_list call
  // (:125) and the concat (:136) are unreachable.
  function loadData(_infiniteScroll: InfiniteScrollHandle) {}

  const d = karigarDetail ?? {};
  const boxH4 = [textStyle(12, 400, md.textColor, 22), { textTransform: 'capitalize' as const }]; // `.boxs h4`
  const ratingsH3 = [textStyle(11, 400, P.ink, 11 * 1.2), { textTransform: 'capitalize' as const }]; // `.ratings h3`
  const boxP = textStyle(12, 400, P.ink); // `.boxs p`
  const list: any[] = Array.isArray(complaintList) ? complaintList : [];

  return (
    <View style={styles.screen}>
      {/* html:1-21 <ion-header class="main-header remove" no-border> */}
      <IonHeader mainHeader remove noBorder>
        <IonNavbar color="primary" title={alltab} />
        <IonToolbar color="white">
          {/* html:10-19 */}
          <IonSegment
            inTabBtn
            value={alltab}
            onValueChange={v => {
              alltabRef.current = v;
              setAlltab(v);
            }}
          >
            <IonSegmentButton testID="segment-basic" value="Basic Details" onPress={() => getKarigarDetail(alltabRef.current)}>
              {collapseWs(t('Basic Details'))}
            </IonSegmentButton>
            <IonSegmentButton testID="segment-complaint" value="Complaint" onPress={() => getComplaintHistory(statusTypeRef.current)}>
              {collapseWs(t('Complaint'))}
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      {/* html:23 <ion-content> */}
      <IonContent>
        {/* html:25-31 */}
        <IonRefresher onRefresh={onRefresh}>
          <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
        </IonRefresher>

        {/* html:32 [ngSwitch]="alltab" */}
        {alltab == 'Basic Details' ? ( // eslint-disable-line eqeqeq
          // html:33-67 `.profile.pt16` (`.pt16 { padding-top: 16px !important }`)
          <View testID="customerdetail-basic" style={[profileStyles.profile, styles.pt16]}>
            <View style={profileStyles.profileDetail}>
              {/* html:44 `.rating-area.mt16` */}
              <View style={profileStyles.ratingArea}>
                {/* html:45-50 `.boxs` is the only child of its `.border-box`: no right border */}
                <View style={profileStyles.borderBox}>
                  <View style={[profileStyles.boxs, profileStyles.boxsLast]}>
                    <Text style={boxP}>{collapseWs(t('Name'))}</Text>
                    <Text testID="customer-name" style={boxH4}>{interp(d.first_name)}</Text>
                  </View>
                </View>

                <View style={profileStyles.borderBox}>
                  <View style={[profileStyles.boxs, profileStyles.boxsLast]}>
                    <Text style={boxP}>{collapseWs(t('Mobile No.'))}</Text>
                    <Text testID="customer-mobile" style={boxH4}>{`+91${interp(d.mobile_no)}`}</Text>
                  </View>
                </View>

                {/* html:59-64 `.ratings.border-bottom`: h3 11px capitalize, p 12px 500 line-height 20 */}
                <View style={[profileStyles.ratings, profileStyles.borderBottom]}>
                  <Text style={ratingsH3}>{collapseWs(t('Address'))}</Text>
                  <Text testID="customer-address" style={textStyle(12, 500, P.ink, 20)}>
                    {`${interp(titlecase(d.address))} ${interp(titlecase(d.state))} ${interp(titlecase(d.district))} ${interp(titlecase(d.city))} ${interp(d.pincode)}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* html:69-157 */}
        {alltab == 'Complaint' ? ( // eslint-disable-line eqeqeq
          <View testID="customerdetail-complaint">
            {/* html:93-108 <ion-toolbar color="white"> inside the content */}
            <IonToolbar color="white">
              <IonSegment
                inTabBtn
                value={statusType}
                onValueChange={v => {
                  statusTypeRef.current = v;
                  setStatusType(v);
                }}
              >
                <IonSegmentButton testID="status-pending" value="Pending" onPress={() => getType(statusTypeRef.current)}>
                  {collapseWs(t('Pending'))}
                </IonSegmentButton>
                <IonSegmentButton testID="status-closed" value="Closed" onPress={() => getType(statusTypeRef.current)}>
                  {collapseWs(t('Closed'))}
                </IonSegmentButton>
                <IonSegmentButton testID="status-cancel" value="Cancel" onPress={() => getType(statusTypeRef.current)}>
                  {collapseWs(t('Cancel'))}
                </IonSegmentButton>
              </IonSegment>
            </IonToolbar>

            {/* html:122-142 `.main-div` (no rule) > `.main-history` (padding 16) */}
            <View style={styles.mainHistory}>
              {list.map((complaint: any, i: number) => (
                // html:133 (click)="onComplaintdetail(complaint.id)"
                <Pressable key={i} testID={`complaint-item-${i}`} style={styles.csList} onPress={() => onComplaintdetail(complaint.id)}>
                  <Text style={textStyle(14, 400, md.textColor)}>
                    <Text style={textStyle(14, 700, md.textColor)}>{`${collapseWs(t('Date'))}:`}</Text>
                    {datePipe(complaint.date_created, 'd MMMM y')}
                  </Text>
                  <Text style={textStyle(14, 400, md.textColor)}>
                    <Text style={textStyle(14, 700, md.textColor)}>{`${collapseWs(t('Nature Problem'))}:`}</Text>
                    {` ${interp(complaint.nature_problem)}`}
                  </Text>
                  {/* html:138 `<strong>Satus: </strong><span class="{{complaint.status}}">`. NOTE (parity): 'Satus' (sic) is the translate key. */}
                  <Text style={textStyle(14, 400, md.textColor)}>
                    <Text style={textStyle(14, 700, md.textColor)}>{`${collapseWs(t('Satus'))}: `}</Text>
                    <Text testID={`complaint-status-${i}`} style={statusColor[complaint.status] ? { color: statusColor[complaint.status] } : undefined}>
                      {interp(titlecase(complaint.status))}
                    </Text>
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* html:159-165 *ngIf="flag!=1" */}
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
