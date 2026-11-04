// Ported from: src/pages/sales-exec-plumber-detail/sales-exec-plumber-detail.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { scssColors } from '../../theme';
import { profileMd as P } from '../../theme/ionicMdProfile';
import { salesExecPlumberDetailMd as M } from '../../theme/ionicMdSalesExecPlumberDetail';
import { collapseWs, interp, titlecase } from '../../ui/angularPipes';
import { styles } from './styles';

// html:14 `src="assets/imgs/profile.jpg"`
const defaultPhoto = require('./assets/profile.jpg');

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: { plumber_id?: any } };
}

// `{{ x | titlecase }}` (null prints as an empty string); HTML collapses runs of white space and a block drops them at its edges.
const tc = (v: any): string => interp(titlecase(v));
const ws = (v: string): string => collapseWs(v).replace(/^ | $/g, '');

// `class="{{ plumber.status }}"`: .Verified / .Pending / .Suspect / .Reject set the colour (!important), any other status keeps the `.name a` green
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

// :45-52 formatDate(d)
// NOTE (parity): Chrome's Date parses 'YYYY-MM-DD HH:mm:ss' as local time; where the engine returns NaN for that shape it is retried with a 'T'.
function formatDate(d: any): string {
  if (!d) {
    return '—'; // :46
  }
  try {
    let dt = new Date(d);
    if (isNaN(dt.getTime()) && typeof d === 'string' && /^\d{4}-\d\d-\d\d \d\d:\d\d/.test(d)) {
      dt = new Date(d.replace(' ', 'T'));
    }
    if (isNaN(dt.getTime())) {
      return d; // :49
    }
    return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // :50
  } catch {
    return d;
  }
}

export default function SalesExecPlumberDetailScreen({ route }: Props) {
  const user = useRef<any>(db.userStorageData || {}); // :21
  const plumberId = useRef<any>(route?.params?.plumber_id); // :22
  const [plumber, setPlumber] = useState<any>(null); // :14
  // NOTE (parity): `recent_scans` (:15, :38) is stored but no template element reads it (the `.scan-list` SCSS is unused): not shown.
  const [loading, setLoading] = useState(false); // :16
  const alive = useRef(true);

  // :25-27 ionViewDidLoad: first entry only (not on every return to the page)
  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, []);

  // :29-43 load()
  function load() {
    if (!user.current || !user.current.id || !plumberId.current) {
      return; // :30
    }
    setLoading(true); // :31
    db.onPostRequestDataFromApi(
      { sales_executive_id: user.current.id, plumber_id: plumberId.current },
      'app_karigar/sales_exec/plumber_detail',
      db.rootUrl,
    ).then(
      (r: any) => {
        if (!alive.current) {
          return;
        }
        setLoading(false); // :37
        if (r && r.status === 'SUCCESS') {
          setPlumber(r.plumber); // :39
        }
      },
      () => {
        if (alive.current) {
          setLoading(false); // :42
        }
      },
    );
  }

  const d = plumber ?? {};
  const color = statusColor(d.status);
  const icon =
    d.status === 'Verified' ? 'check_circle' : d.status === 'Pending' ? 'hourglass_full' : d.status === 'Suspect' ? 'info' : d.status === 'Reject' ? 'cancel' : null;
  const dotColor = d.is_active ? M.active : M.inactive;
  const boxP = textStyle(12, 400, P.ink); // `.boxs p`
  const boxH4 = [textStyle(12, 400, scssColors.black, 22), styles.capitalize]; // `.boxs h4`
  const rLabel = (text: string) => <Text style={[textStyle(11, 400, P.ink, 11 * 1.2), styles.capitalize]}>{text}</Text>; // `.ratings h3`
  const rValue = textStyle(12, 500, P.ink, 20); // `.ratings p`
  const small = textStyle(12 * 0.75, 500, P.ink, 20); // global `small { font-size: 75% }` inside the 12px p

  return (
    <View style={styles.screen}>
      {/* html:1-5 */}
      <IonHeader>
        <IonNavbar color="primary" title="Plumber Detail" />
      </IonHeader>

      {/* html:7 <ion-content class="profile-bg plumber-detail"> */}
      <IonContent style={styles.content}>
        {loading ? (
          <View testID="saepdetail-loading" style={styles.loader}>
            <Text style={[textStyle(14, 400, M.loaderInk), styles.centred]}>Loading…</Text>
          </View>
        ) : null}

        {/* html:11 *ngIf="plumber" */}
        {plumber ? (
          <View testID="saepdetail-profile" style={styles.profile}>
            <View style={styles.profileDetail}>
              <View style={styles.firstLine}>
                <View style={styles.profilePic}>
                  <Image style={styles.picImage} source={defaultPhoto} />
                </View>

                <View style={styles.name}>
                  <Text testID="saepdetail-name" style={textStyle(16, 600, P.nameInk)}>{ws(`${tc(d.first_name)} ${tc(d.last_name)}`)}</Text>
                  <View style={styles.nameLink}>
                    {icon ? (
                      <View style={styles.statusIcon}>
                        <MaterialIcon name={icon} size={14} color={color} style={styles.statusIconGlyph} />
                      </View>
                    ) : null}
                    <Text testID="saepdetail-status" style={textStyle(12, 400, color)}>{ws(interp(d.status))}</Text>
                    {/* NOTE (parity): the global `span { margin: 0 !important }` beats `.dot { margin-left: 6px }`: no gap before the dot */}
                    <Text testID="saepdetail-dot" style={textStyle(12, 500, dotColor)}>{d.is_active ? '· Active' : '· Inactive'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.ratingArea}>
                <View style={styles.borderBox}>
                  <View style={styles.boxs}>
                    <Text style={boxP}>Mobile No.</Text>
                    {/* NOTE (parity): '+91' is hard-coded in sales-exec-plumber-detail.html:35 */}
                    <Text testID="saepdetail-mobile" style={boxH4}>{`+91${interp(d.mobile_no)}`}</Text>
                  </View>
                  <View style={[styles.boxs, styles.boxsLast]}>
                    <Text style={boxP}>Balance Points</Text>
                    <Text testID="saepdetail-points" style={boxH4}>{interp(d.balance_point || 0)}</Text>
                  </View>
                </View>

                <View style={styles.borderBox}>
                  <View style={styles.boxs}>
                    <Text style={boxP}>Last Active</Text>
                    <Text testID="saepdetail-active" style={boxH4}>{formatDate(d.last_login_at)}</Text>
                  </View>
                  <View style={[styles.boxs, styles.boxsLast]}>
                    <Text style={boxP}>Last Scan</Text>
                    <Text testID="saepdetail-scan" style={boxH4}>{formatDate(d.last_scan_at)}</Text>
                  </View>
                </View>

                {/* NOTE (parity): html:54 tests only `city || state` (the list tests district too) */}
                {d.city || d.state ? (
                  <View testID="saepdetail-address" style={[styles.ratings, styles.borderBottom]}>
                    {rLabel('Address')}
                    <Text style={rValue}>{ws(`${tc(d.city)} ${tc(d.district)} ${tc(d.state)}`)}</Text>
                  </View>
                ) : null}

                {d.seller_name ? (
                  <View testID="saepdetail-seller" style={[styles.ratings, styles.borderBottom]}>
                    {rLabel('Seller Information')}
                    <Text style={rValue}>
                      {tc(d.seller_name)}
                      {d.seller_mobile ? <Text style={small}>{` (${interp(d.seller_mobile)})`}</Text> : null}
                    </Text>
                  </View>
                ) : null}

                {d.dealer_name ? (
                  <View testID="saepdetail-dealer" style={[styles.ratings, styles.borderBottom]}>
                    {rLabel('Dealer Information')}
                    <Text style={rValue}>
                      {tc(d.dealer_name)}
                      {d.dealer_mobile ? <Text style={small}>{` (${interp(d.dealer_mobile)})`}</Text> : null}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
