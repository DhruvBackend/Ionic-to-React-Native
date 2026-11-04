// Ported from: src/pages/plumber-detail/plumber-detail.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { md } from '../../theme/ionicMd';
import { profileMd as P } from '../../theme/ionicMdProfile';
import { scssColors } from '../../theme';
import { collapseWs, datePipe, interp, titlecase } from '../../ui/angularPipes';
import { useLoader } from '../../ui/useLoader';
import { styles as profileStyles } from '../Profile/styles';
import { styles } from './styles';

// html:19 `src="assets/imgs/profile.jpg"`: the same default picture the Profile screen ships.
const defaultPhoto = require('../Profile/assets/profile.jpg');

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: { id?: any } };
}

// Angular template helpers (src/ui/angularPipes): `{{ x }}` and `{{ x | titlecase }}` (null prints as an empty string).
const s = interp;
const tc = (v: any): string => interp(titlecase(v));
// HTML collapses runs of white space (not &nbsp;) and a block drops the white space at its edges.
const ws = (v: string): string => v.replace(/[ \t\n\r\f]+/g, ' ').replace(/^ | $/g, '');

// `class="{{status}}"`: .Verified / .Pending / .Suspect / .Reject set the colour, any other status keeps the `.name a` green
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

export default function PlumberDetailScreen({ route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const karigarId = useRef<any>(route?.params?.id); // :28 this.karigar_id = this.navParams.data.id
  const [karigarDetail, setKarigarDetail] = useState<any>({}); // :20 karigar_detail:any={}
  const url = db.upload_url3; // :27 this.url = dbService.upload_url3
  const alive = useRef(true);

  // :24-31 constructor. NOTE (parity): ionViewDidLoad (:33) only logs: not ported.
  // The page's plumber-detail.module.ts has its own TranslateModule.forRoot but never calls use(): the language is global.
  useEffect(() => {
    alive.current = true;
    presentLoading(); // :30
    getKarigarDetail(); // :31
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :38-45 presentLoading(): content 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show();
  }

  // :48-58 getKarigarDetail()
  // NOTE (parity): `karigar_detail.totalpoints = parseInt(...) + parseInt(...)` (:55) is never read by the template: not ported.
  function getKarigarDetail() {
    db.onPostRequestDataFromApi({ karigar_id: karigarId.current }, 'app_karigar/profile', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :53 this.loading.dismiss() (before the model is assigned)
        // NOTE (parity): a null body throws at r.karigar after the loader is gone: nothing else happens.
        if (r == null) {
          return;
        }
        // NOTE (parity): `karigar: null` makes `karigar_detail.totalpoints = ...` (:55) and the template throw: the view keeps what it showed before.
        if (r.karigar == null) {
          return;
        }
        if (alive.current) {
          setKarigarDetail(r.karigar); // :54
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  const d = karigarDetail ?? {};
  const viewerType = db.userStorageData?.type; // html:27 / :37 / :63 dbService.userStorageData.type
  const boxP = textStyle(12, 400, P.ink); // `.boxs p`
  const boxH4 = [textStyle(12, 400, scssColors.black, 22), { textTransform: 'capitalize' as const }]; // `.boxs h4`
  const rLabel = (key: string) => (
    <Text style={[textStyle(11, 400, P.ink, 11 * 1.2), styles.capitalize]}>{collapseWs(t(key))}</Text>
  );
  const rValue = (value: string) => <Text style={textStyle(12, 500, P.ink, 20)}>{ws(value)}</Text>;
  const cell = textStyle(12, 400, md.textColor); // `th, td { font-size: 12px }`
  const bank: { key: string; value: any }[] = [
    { key: 'Account Holder Name', value: d.account_holder_name },
    { key: 'Bank Name', value: d.bank_name },
    { key: 'Bank Account Number', value: d.account_number },
    { key: 'Bank IFSC Code', value: d.ifsc_code },
  ];

  /* eslint-disable eqeqeq */
  const icon =
    d.status == 'Verified'
      ? 'check_circle'
      : d.status == 'Pending'
        ? 'hourglass_full'
        : d.status == 'Suspect'
          ? 'info'
          : d.status == 'Reject'
            ? 'cancel'
            : null;
  return (
    <View style={styles.screen}>
      {/* html:8-12 <ion-header class="main-header remove" no-border> */}
      <IonHeader mainHeader remove noBorder>
        <IonNavbar color="primary" title="Plumber Detail" />
      </IonHeader>

      {/* html:14 <ion-content> */}
      <IonContent>
        {/* html:15 `.profile.pt16` */}
        <View testID="plumberdetail-profile" style={[profileStyles.profile, styles.pt16]}>
          {/* html:16 */}
          <View style={profileStyles.profileDetail}>
            {/* the first flex line of `.profile-detail` (pic + name), see Profile/styles.ts firstLine */}
            <View testID="plumberdetail-first-line" style={profileStyles.firstLine}>
            {/* html:17-28 NOTE (parity): the picture's (click)="viewProfiePic()" has no such method in plumber-detail.ts: a tap does nothing. */}
            <View style={profileStyles.profilePic}>
              {d.profile != '' ? (
                <Image testID="plumberdetail-image" style={profileStyles.picImage} source={{ uri: url + d.profile }} />
              ) : (
                <Image testID="plumberdetail-image-default" style={profileStyles.picImage} source={defaultPhoto} />
              )}
            </View>

            {/* html:30-45 */}
            <View style={profileStyles.name}>
              <Text testID="plumberdetail-name" style={textStyle(14, 500, P.nameInk)}>{tc(d.first_name)}</Text>
              {viewerType == 'Plumber' ? (
                <View testID="plumberdetail-status" style={profileStyles.nameLink}>
                  {icon ? (
                    <View style={profileStyles.statusIcon}>
                      <MaterialIcon name={icon} size={18} color={statusColor(d.status)} style={profileStyles.statusIconGlyph} />
                    </View>
                  ) : null}
                  {/* NOTE (parity): `{{status}} {{reason}}&nbsp;({{type}})`: a no-break space before the bracket */}
                  <Text style={textStyle(12, 400, statusColor(d.status))}>{`${s(d.status)} ${s(d.reason)} (${s(d.type)})`}</Text>
                </View>
              ) : null}
              {viewerType != 'Plumber' ? (
                <View style={profileStyles.nameLink}>
                  <Text testID="plumberdetail-type" style={textStyle(12, 400, P.statusDefault)}>{s(d.type)}</Text>
                </View>
              ) : null}
            </View>
            </View>

            {/* html:54-92 `.rating-area.mt16` */}
            <View style={profileStyles.ratingArea}>
              <View style={profileStyles.borderBox}>
                <View style={profileStyles.boxs}>
                  <Text style={boxP}>{collapseWs(t('Mobile No.'))}</Text>
                  {/* NOTE (parity): '+91' is hard-coded in plumber-detail.html:45 */}
                  <Text testID="plumberdetail-mobile" style={boxH4}>{`+91${s(d.mobile_no)}`}</Text>
                </View>
                <View style={[profileStyles.boxs, profileStyles.boxsLast]}>
                  <Text style={boxP}>{collapseWs(t('Date of Birth'))}</Text>
                  <Text testID="plumberdetail-dob" style={boxH4}>{d.dob != '' ? datePipe(d.dob, 'd MMM,y') : '----'}</Text>
                </View>
              </View>

              <View style={[profileStyles.ratings, profileStyles.borderBottom]}>
                {rLabel('Working Address')}
                <Text testID="plumberdetail-address" style={textStyle(12, 500, P.ink, 20)}>
                  {ws(`${tc(d.address)} ${tc(d.state)} ${tc(d.district)} ${tc(d.city)} ${s(d.pincode)}`)}
                </Text>
              </View>
              {d.permanent_address ? (
                <View testID="plumberdetail-permanent" style={profileStyles.ratings}>
                  {rLabel('Permanent Address')}
                  {/* NOTE (parity): `parmanent_district` is spelled like that in Ionic and in the server response. */}
                  {rValue(`${tc(d.permanent_address)} ${tc(d.permanent_state)} ${tc(d.parmanent_district)}  ${tc(d.permanent_city)} ${s(d.permanent_pincode)}`)}
                </View>
              ) : null}
              {viewerType == 'Plumber' ? (
                <View testID="plumberdetail-dealer" style={profileStyles.ratings}>
                  {rLabel('Dealer Information')}
                  {rValue(` ${tc(d.dealer_contact_person)} (${s(d.dealer_mobile)})`)}
                </View>
              ) : null}
            </View>
          </View>

          {/* html:96-98 `.heading.line.mt18.mb10` */}
          <View style={styles.heading}>
            <Text style={textStyle(14, 400, md.textColor)}>{collapseWs(t('Bank Information'))}</Text>
          </View>
          {/* html:99-118 `.adhar` > table */}
          <View testID="plumberdetail-bank" style={styles.adhar}>
            {bank.map((row, i) => (
              <View key={row.key} style={[styles.tr, i === bank.length - 1 ? styles.trLast : null]}>
                <View style={styles.th}>
                  <Text style={cell}>{collapseWs(t(row.key))}</Text>
                </View>
                <View style={styles.td}>
                  <Text testID={`plumberdetail-bank-${i}`} style={cell}>{row.value ? s(row.value) : 'N/A'}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* html:122-135 `.document-section.pb10.pt10` */}
          {d.type == 'Plumber' ? (
            <View testID="plumberdetail-document" style={profileStyles.documentSection}>
              {/* NOTE (parity): global `h1..h6{font-weight:500}` (`.document-section h4` sets only size/colour/padding) */}
              <Text style={[textStyle(14, 500, P.black, 14 * 1.2), styles.pb10]}>{collapseWs(t('Document Information'))}</Text>
              <View style={profileStyles.documentImg}>
                <Image style={profileStyles.documentImage} source={{ uri: url + d.document_image }} />
                <View style={profileStyles.documentGap} />
                <View style={profileStyles.documentInfo}>
                  <Text style={[textStyle(13, 400, scssColors.black, 13 * 1.2), styles.pb2]}>{s(d.document_type)}</Text>
                  <Text style={textStyle(14, 400, scssColors.black)}>{s(d.document_no)}</Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </IonContent>
    </View>
  );
  /* eslint-enable eqeqeq */
}

