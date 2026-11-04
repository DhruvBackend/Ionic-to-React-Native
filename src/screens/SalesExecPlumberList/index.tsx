// Ported from: src/pages/sales-exec-plumber-list/sales-exec-plumber-list.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar, IonToolbar } from '../../components/ionic/IonNavbar';
import { IonSegment, IonSegmentButton } from '../../components/ionic/IonSegment';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { useIonViewWillEnter } from '../../navigation/useIonViewWillEnter';
import { scssColors } from '../../theme';
import { profileMd as P } from '../../theme/ionicMdProfile';
import { salesExecPlumberListMd as M } from '../../theme/ionicMdSalesExecPlumberList';
import { collapseWs, interp, titlecase } from '../../ui/angularPipes';
import { noFoundSize, noFoundXml } from '../OfferList/noFound';
import { strutDescent, styles } from './styles';

// html:28 `src="assets/imgs/profile.jpg"`
const defaultPhoto = require('./assets/profile.jpg');

interface Props {
  navigation: { push: (name: string, params?: object) => void; addListener?: (ev: 'focus' | 'blur', fn: () => void) => () => void };
  route?: { params?: { list_type?: string } };
}

// `{{ x | titlecase }}` (null prints as an empty string); HTML collapses runs of white space and a block drops them at its edges.
const tc = (v: any): string => interp(titlecase(v));
const ws = (v: string): string => collapseWs(v).replace(/^ | $/g, '');

// `class="{{p.status}}"`: .Verified / .Pending / .Suspect / .Reject set the colour (!important), any other status keeps the `.name a` green
const statusColor = (status: any) =>
  status === 'Verified'
    ? P.statusVerified
    : status === 'Pending'
      ? P.statusPending
      : status === 'Suspect'
        ? P.statusSuspect
        : status === 'Reject'
          ? P.statusReject
          : P.statusDefault;

// :57-64 formatDate(d)
// NOTE (parity): Chrome's Date parses 'YYYY-MM-DD HH:mm:ss' as local time; where the engine returns NaN for that shape it is retried with a 'T'.
function formatDate(d: any): string {
  if (!d) {
    return '—'; // :58
  }
  try {
    let dt = new Date(d);
    if (isNaN(dt.getTime()) && typeof d === 'string' && /^\d{4}-\d\d-\d\d \d\d:\d\d/.test(d)) {
      dt = new Date(d.replace(' ', 'T'));
    }
    if (isNaN(dt.getTime())) {
      return d; // :61
    }
    return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // :62
  } catch {
    return d;
  }
}

export default function SalesExecPlumberListScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const user = useRef<any>(db.userStorageData || {}); // :20
  const listType: string = route?.params?.list_type || 'Plumber'; // :21
  const pageTitle = listType === 'Sales_Boy' ? 'Sellers' : listType === 'Dealer' ? 'Dealers' : 'Plumbers'; // :22-26
  const statusRef = useRef('Verified'); // :13 activeStatus (the ion-segment model; (ionChange) sees the NEW value)
  const [activeStatus, setActiveStatus] = useState('Verified');
  const [plumbers, setPlumbers] = useState<any[]>([]); // :14
  const [loading, setLoading] = useState(false); // :15
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // :29-31 ionViewWillEnter: loads on every entry, also when coming back from the detail page
  useIonViewWillEnter(load, { navigation: navigation.addListener ? (navigation as any) : undefined });

  // :33-46 load()
  function load() {
    if (!user.current || !user.current.id) {
      return; // :34
    }
    setLoading(true); // :35
    db.onPostRequestDataFromApi(
      { sales_executive_id: user.current.id, status: statusRef.current, list_type: listType },
      'app_karigar/sales_exec/plumber_list',
      db.rootUrl,
    ).then(
      (r: any) => {
        if (!alive.current) {
          return;
        }
        setLoading(false); // :41
        setPlumbers(r && r.plumbers ? r.plumbers : []); // :42
      },
      () => {
        if (alive.current) {
          setLoading(false); // :44
        }
      },
    );
  }

  // :48-51 onTabChange(status)
  function onTabChange(status: string) {
    statusRef.current = status;
    setActiveStatus(status);
    load();
  }

  // :53-55 openDetail(p)
  function openDetail(p: any) {
    navigation.push('SalesExecPlumberDetail', { plumber_id: p.id });
  }

  const emptyImgW = Math.min(130, (width - 48) * 0.45); // .empty img { max-width: 130px; width: 45% } inside the 24px side padding
  const emptyImgH = (emptyImgW * noFoundSize.height) / noFoundSize.width;

  return (
    <View style={styles.screen}>
      {/* html:1-16 */}
      <IonHeader>
        <IonNavbar color="primary" title={pageTitle} />
        {/* html:6 <ion-toolbar color="light" class="tab-bar"> */}
        <IonToolbar color="light" style={styles.tabBar}>
          <IonSegment
            value={activeStatus}
            onValueChange={v => {
              statusRef.current = v;
              setActiveStatus(v);
            }}
            onIonChange={() => onTabChange(statusRef.current)}
          >
            <IonSegmentButton testID="segment-Verified" value="Verified">Verified</IonSegmentButton>
            <IonSegmentButton testID="segment-Pending" value="Pending">Pending</IonSegmentButton>
            <IonSegmentButton testID="segment-Suspect" value="Suspect">Suspect</IonSegmentButton>
            <IonSegmentButton testID="segment-Reject" value="Reject">Reject</IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      {/* html:18 <ion-content class="plumber-list profile-bg"> */}
      <IonContent style={styles.content}>
        {loading ? (
          <View testID="saeplist-loading" style={styles.loader}>
            <Text style={[textStyle(14, 400, M.loaderInk), styles.centred]}>Loading…</Text>
          </View>
        ) : null}

        {!loading && plumbers.length === 0 ? (
          <View testID="saeplist-empty" style={styles.empty}>
            <View style={styles.emptyImgRow}>
              <View style={styles.emptyImg}>
                <SvgXml xml={noFoundXml} width={emptyImgW} height={emptyImgH} />
              </View>
            </View>
            <View style={{ height: strutDescent }} />
            <Text style={[textStyle(13, 400, M.emptyP), styles.centred]}>{`No ${pageTitle.toLowerCase()} in ${activeStatus} list`}</Text>
          </View>
        ) : null}

        {plumbers.map((rowOrNull: any, i: number) => {
          // NOTE (parity): a null row throws in Ionic's template and freezes the view; RN shows an empty card instead.
          const p = rowOrNull ?? {};
          const color = statusColor(p.status);
          const icon =
            p.status === 'Verified' ? 'check_circle' : p.status === 'Pending' ? 'hourglass_full' : p.status === 'Suspect' ? 'info' : p.status === 'Reject' ? 'cancel' : null;
          const dotColor = p.is_active ? M.active : M.inactive;
          const boxP = textStyle(12, 400, P.ink); // `.boxs p`
          const boxH4 = [textStyle(12, 400, scssColors.black, 22), styles.capitalize]; // `.boxs h4`
          return (
            // html:25 <div class="profile" (click)="openDetail(p)">
            <Pressable key={i} testID={`saeplist-item-${i}`} style={styles.profile} onPress={() => openDetail(p)}>
              {({ pressed }) => (
                <View style={[styles.profileDetail, pressed ? styles.cardPressed : null]}>
                  <View style={styles.firstLine}>
                    <View style={styles.profilePic}>
                      <Image style={styles.picImage} source={defaultPhoto} />
                    </View>

                    <View style={styles.name}>
                      <Text testID={`saeplist-name-${i}`} style={textStyle(14, 500, P.nameInk)}>{ws(`${tc(p.first_name)} ${tc(p.last_name)}`)}</Text>
                      <View style={styles.nameLink}>
                        {icon ? (
                          <View style={styles.statusIcon}>
                            <MaterialIcon name={icon} size={18} color={color} style={styles.statusIconGlyph} />
                          </View>
                        ) : null}
                        <Text testID={`saeplist-status-${i}`} style={textStyle(12, 400, color)}>{ws(interp(p.status))}</Text>
                        {/* NOTE (parity): the global `span { margin: 0 !important }` beats `.dot { margin-left: 6px }`: no gap before the dot */}
                        <Text testID={`saeplist-dot-${i}`} style={textStyle(12, 500, dotColor)}>{p.is_active ? '· Active' : '· Inactive'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.ratingArea}>
                    <View style={styles.borderBox}>
                      <View style={styles.boxs}>
                        <Text style={boxP}>Mobile No.</Text>
                        {/* NOTE (parity): '+91' is hard-coded in sales-exec-plumber-list.html:49 */}
                        <Text testID={`saeplist-mobile-${i}`} style={boxH4}>{`+91${interp(p.mobile_no)}`}</Text>
                      </View>
                      <View style={[styles.boxs, styles.boxsLast]}>
                        <Text style={boxP}>Points</Text>
                        <Text testID={`saeplist-points-${i}`} style={boxH4}>{interp(p.balance_point || 0)}</Text>
                      </View>
                    </View>

                    <View style={styles.borderBox}>
                      <View style={styles.boxs}>
                        <Text style={boxP}>Last Active</Text>
                        <Text testID={`saeplist-active-${i}`} style={boxH4}>{formatDate(p.last_login_at)}</Text>
                      </View>
                      <View style={[styles.boxs, styles.boxsLast]}>
                        <Text style={boxP}>Last Scan</Text>
                        <Text testID={`saeplist-scan-${i}`} style={boxH4}>{formatDate(p.last_scan_at)}</Text>
                      </View>
                    </View>

                    {listType !== 'Plumber' && p.linked_plumber_count ? (
                      <View testID={`saeplist-linked-${i}`} style={styles.borderBox}>
                        <View style={[styles.boxs, styles.boxsLast]}>
                          <Text style={boxP}>Linked Plumbers</Text>
                          <Text style={boxH4}>{interp(p.linked_plumber_count)}</Text>
                        </View>
                      </View>
                    ) : null}

                    {p.city || p.district || p.state ? (
                      <View testID={`saeplist-address-${i}`} style={styles.ratings}>
                        <Text style={[textStyle(11, 400, P.ink, 11 * 1.2), styles.capitalize]}>Address</Text>
                        <Text style={textStyle(12, 500, P.ink, 20)}>{ws(`${tc(p.city)} ${tc(p.district)} ${tc(p.state)}`)}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}
            </Pressable>
          );
        })}
      </IonContent>
    </View>
  );
}
