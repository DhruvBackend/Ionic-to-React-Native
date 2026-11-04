// Ported from: src/pages/plumber-checkin/plumber-checkin.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonList } from '../../components/ionic/IonList';
import { Header } from '../../components/ionic/IonNavbar';
import { IonSelect } from '../../components/ionic/IonSelect';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { getNetworkState, getPosition } from '../../native';
import { checkinMd as C } from '../../theme/ionicMdCheckin';
import { collapseWs, interp } from '../../ui/angularPipes';
import { showAlert, showToast } from '../../ui/overlays';
import { webAlert } from '../../ui/webAlert';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: object };
}

export default function PlumberCheckinScreen({ navigation }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const alive = useRef(true);
  const started = useRef(false);

  // plumber-checkin.ts:24-39 fields
  // NOTE (parity): plumber-checkin.module.ts has its own TranslateModule.forRoot, but the page never calls setDefaultLang/use(), so the
  // language is whatever the app has (global in RN too).
  const [complaintList, setComplaintList] = useState<any>([]); // complaint_list
  const lastRendered = useRef<any[]>([]); // the list of the last render Angular completed (see the NOTE above `broken`)
  const listRef = useRef<any>([]);
  const complaintDetail = useRef<any>({}); // complaint_detail (stored, shown nowhere: the template block that used it is commented out)
  const filter = useRef<any>({});
  const dataComplaint = useRef<any>(undefined); // data.complaint
  const [selected, setSelected] = useState<any>(undefined); // the ngModel value of the select
  const comType = useRef<any>('');
  const newLat = useRef<any>(undefined);
  const newLong = useRef<any>(undefined);
  const [viewport, setViewport] = useState(0); // ion-content height, for `.data-not { height: calc(100% - 50px) }`

  // :43-50 ionViewDidLoad (once)
  // NOTE (parity): getComplaintDetail(this.complaint_detail.complaintId) passes undefined (unused by the method); its response only fills
  // `complaint_detail`, which the template no longer shows (block commented out, html:23-58): the call still goes out.
  useEffect(() => {
    alive.current = true;
    if (!started.current) {
      started.current = true;
      getComplaintList();
      getComplaintDetail();
      loadMap();
    }
    return () => {
      alive.current = false;
    };
  }, []);

  // :64-105 loadMap(): locationAccuracy.request(HIGH_ACCURACY) then geolocation.getCurrentPosition() (the `options` at :67-69 are commented out).
  // The wrapper does both steps; a failure of the first step has a message starting with 'accuracy:'.
  // NOTE (parity): the rest of the success callback (:71-87) builds a google.maps map in `this.mapElement`, which is never set (the template has no
  // #map): that throws and is swallowed by the `.catch`. getGeoencoder(:84) only stores `geoAddress`, which nothing shows, and addMarker (:89)
  // is never reached: neither is ported. Ionic's index.html loads the Google Maps script from the network: offline, `new google.maps.LatLng`
  // (:71) throws before new_lat / new_long are stored (approximated with getNetworkState).
  async function loadMap() {
    const r = await getPosition();
    if (!r.ok) {
      if (r.message?.startsWith('accuracy:')) {
        // :95-103 accuracy request rejected
        showToast('Allow Location Permissions', { duration: 3000, position: 'bottom' });
      }
      // :90-93 getCurrentPosition rejected: swallowed (the toast line is commented out)
      return;
    }
    const net = await getNetworkState();
    if (net.ok && !net.value.online) {
      return;
    }
    newLat.current = r.value.lat; // :79
    newLong.current = r.value.lng; // :80
  }

  // :161-184 getComplaintList(type)
  function getComplaintList() {
    if (dataComplaint.current) {
      comType.current = dataComplaint.current;
    } else {
      comType.current = '';
    }
    filter.current.limit = 0;
    db.onPostRequestDataFromApi(
      { filter: filter.current, plumber_id: db.userStorageData?.id, type: comType.current },
      'app_karigar/checkinComplaintList',
      db.rootUrl,
    ).then(
      (response: any) => {
        if (!response) {
          return; // TypeError at `response['complaintList']`
        }
        // NOTE (parity): loose `!= ''`: an empty array equals '' (the list is kept), null / undefined replace the list (the template then throws).
        if (response.complaintList != '') { // eslint-disable-line eqeqeq
          listRef.current = response.complaintList;
          if (alive.current) {
            setComplaintList(response.complaintList);
          }
        }
        // NOTE (parity): the `else { showAlert(); return }` (:178-181) is commented out, so `showAlert()` (:55-60) is dead code.
      },
      // NOTE (parity): no error callback in Ionic.
      () => {},
    );
  }

  // :185-203 goDetailPage()
  function goDetailPage() {
    const list = listRef.current;
    for (let i = 0; i < list.length; i++) {
      if (list[i].complaintId == dataComplaint.current) { // eslint-disable-line eqeqeq
        if (list[i].complaint_type == 'service') { // eslint-disable-line eqeqeq
          navigation.push('PulmberCustomerDetail', { type: 'service', id: list[i].complaintId, close_com: true });
          checkin(list[i].complaintId);
        } else {
          navigation.push('PulmberCustomerDetail', { type: 'installation', id: list[i].complaintId, close_com: true });
          checkin(list[i].complaintId);
        }
      }
    }
  }

  // :205-219 getComplaintDetail(id)
  function getComplaintDetail() {
    filter.current.limit = 0;
    db.onPostRequestDataFromApi(
      { filter: filter.current, plumber_id: db.userStorageData?.id, complaint_id: comType.current },
      'app_karigar/checkinComplaintDetail',
      db.rootUrl,
    ).then(
      (response: any) => {
        if (!response) {
          return; // TypeError at `response['complaintDetail']`
        }
        complaintDetail.current = response.complaintDetail;
      },
      // NOTE (parity): no error callback in Ionic.
      () => {},
    );
  }

  // :221-252 checkin(complain_id)
  // NOTE (parity): `this.checkin_time = false` (:230) only feeds the commented-out template block, so it is not kept.
  function checkin(complainId: any) {
    db.onPostRequestDataFromApi(
      { plumber_id: db.userStorageData?.id, complaint_id: complainId, cust_lat: newLat.current, cust_long: newLong.current },
      'app_karigar/plumberCheckIn',
      db.rootUrl,
    ).then(
      (result: any) => {
        if (!result) {
          return; // TypeError at `result['msg']`
        }
        if (result.msg == 'CheckinSuccess') { // eslint-disable-line eqeqeq
          showSuccess('Geo Location updated Successfully!');
        } else {
          webAlert('Geo Location not found! Try Again');
        }
      },
      // NOTE (parity): no error callback in Ionic.
      () => {},
    );
  }

  // :255-262 showSuccess(text)
  function showSuccess(text: string) {
    showAlert({ title: 'Success!', subTitle: text, buttons: ['OK'] });
  }

  // html:15 `(ngModelChange)="getComplaintList(); goDetailPage()"` (the [(ngModel)] assignment runs first)
  function onSelect(value: any) {
    dataComplaint.current = value;
    setSelected(value);
    getComplaintList();
    goDetailPage();
  }

  // html:13 `*ngIf="complaint_list.length"`, html:68 `*ngIf="!complaint_list.length"`
  // NOTE (parity): a null / undefined list (malformed response; `null != ''` lets it through, ts:175-176) makes both bindings
  // throw in Angular's change detection, which leaves the DOM of the LAST successful render on screen: the initial `[]`
  // (empty state) or the previous list. The Ionic reference of PlumberCheckin.malformed shows the empty state (phone pass 2026-11-04).
  const broken = complaintList === null || complaintList === undefined;
  if (!broken) {
    lastRendered.current = complaintList;
  }
  const shown: any[] = broken ? lastRendered.current : complaintList;
  const has = shown.length > 0;
  const empty = !has;

  return (
    <View style={styles.screen}>
      {/* html:7-12 `.main-header` */}
      <Header mainHeader color="primary" title={t('Checkin')} />

      {/* html:14-78 */}
      <IonContent onLayout={e => setViewport(e.nativeEvent.layout.height)}>
        {has ? (
          <IonList style={styles.list}>
            <View>
              {/* html:15-21: the option text is the template's `{{customerName}}  COM# {{id}} ({{type}})` (the double space collapses like HTML). `.bodr-botm ion-item { font-size: 14px }`; the select item is the list's only child (`.list-md > .item-block:last-child .item-inner { border-bottom: 0 }`). */}
              <IonSelect
                testID="complaint-select"
                fontSize={14}
                isLast
                label={t('Complaint')}
                value={selected}
                options={shown.map((row: any) => ({
                  value: interp(row.complaintId),
                  label: collapseWs(`${interp(row.customerName)}  ${t('COM')}# ${interp(row.complaintId)} (${interp(row.complaint_type)})`),
                }))}
                onChange={onSelect}
              />
            </View>
          </IonList>
        ) : null}

        {/* html:68-71 */}
        {empty ? (
          <View testID="checkin-empty" style={[styles.dataNot, { height: Math.max(viewport - C.dataNot.viewportOffset, 0) }]}>
            <SvgXml
              xml={noFoundXml}
              width={(C.dataNot.imageHeight * noFoundSize.width) / noFoundSize.height}
              height={C.dataNot.imageHeight}
            />
            <Text
              testID="checkin-empty-text"
              style={[textStyle(C.dataNot.fontSize, 400, C.dataNot.ink, C.dataNot.lineHeight), styles.dataNotText]}>
              {t('No complaints exists')}
            </Text>
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
