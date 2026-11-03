// Ported from: src/pages/plumber-camplaints/pulmber-customer-detail/pulmber-customer-detail.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { WebEmbed } from '../../components/WebEmbed';
import { getPosition } from '../../native';
import { ionicColors } from '../../theme';
import { buttonMd } from '../../theme/ionicMdContent';
import { pulmberDetailMd as C } from '../../theme/ionicMdPulmberCustomerDetail';
import { collapseWs, datePipe, interp, titlecase } from '../../ui/angularPipes';
import { showToast } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { webAlert } from '../../ui/webAlert';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: { id?: any; close_com?: any } };
}

export default function PulmberCustomerDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  const loader = useLoader();
  const alive = useRef(true);
  const win = useWindowDimensions();

  // pulmber-customer-detail.ts:31-47 fields
  // NOTE (parity): pulmber-customer-detail.module.ts has its own TranslateModule.forRoot, but the page never calls setDefaultLang/use(), so the
  // language is whatever the app has (global in RN too).
  const [complaintId, setComplaintId] = useState<any>(''); // complaint_id:any=''
  // `plumber_detail` as the template parts above the gallery see it, and as the parts from the gallery on see it. In Ionic a missing `image`
  // makes the template throw at `complaint_media.length` (the gallery node): Angular has updated the bindings before it and not the ones after.
  const [detail, setDetail] = useState<any>({}); // plumber_detail:any={}
  const [lowerDetail, setLowerDetail] = useState<any>({});
  const [media, setMedia] = useState<any[]>([]); // complaint_media:any=[]
  const [remarkCount, setRemarkCount] = useState<any>(undefined); // remark_count:any
  const [mode, setMode] = useState(1); // mode=1
  const detailRef = useRef<any>({});
  const newLat = useRef<any>(undefined); // new_lat:any
  const newLong = useRef<any>(undefined); // new_long:any

  // :73-80 ionViewDidLoad: presentLoading(); complaint_id = navParams.get('id'); getPlumberDetail(complaint_id)
  // (:62 the constructor reads `close_com` and stores it: nothing in the template reads it)
  useEffect(() => {
    alive.current = true;
    presentLoading();
    const id = route?.params?.id;
    setComplaintId(id);
    getPlumberDetail(id);
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :84-91 presentLoading(): 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: true });
  }

  // :141-171 getPlumberDetail(id)
  function getPlumberDetail(id: any) {
    db.onPostRequestDataFromApi({ complaints_id: id }, 'app_karigar/getComplaintbyId', db.rootUrl).then(
      (response: any) => {
        loader.hide(); // :147 this.loading.dismiss(), before anything is read
        if (!response) {
          return; // TypeError at `response['complaintDetails']`
        }
        const details = response.complaintDetails;
        // NOTE (parity): a null `complaintDetails` makes `response['complaintDetails']['image']` throw (:149) after plumber_detail was set to null:
        // the template then throws on `plumber_detail.sales_boy_name` and the view keeps what it showed.
        if (details == null) {
          return;
        }
        detailRef.current = details;
        if (alive.current) {
          setDetail(details);
        }
        const image = details.image;
        // :151 remark_count is assigned before the loop below can throw
        if (alive.current) {
          setRemarkCount(response.complaintHistoryCount);
        }
        // NOTE (parity): a missing `image` throws at `this.complaint_media.length` (:152): the parts of the template from the gallery on keep what they showed.
        if (image == null) {
          return;
        }
        // :152-163 the loop turns a video / image file name into its full URL (a sanitised URL in Ionic)
        const mapped = image.map((m: any) =>
          m?.type == 'video' // eslint-disable-line eqeqeq
            ? { ...m, file_name: db.video_url + m.file_name }
            : m?.type == 'image' // eslint-disable-line eqeqeq
              ? { ...m, file_name: db.upload_url3 + m.file_name }
              : m,
        );
        if (alive.current) {
          setLowerDetail(details);
          setMedia(mapped);
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :173-176 viewComplaintImage(i)
  // NOTE (parity): Ionic passes the sanitised URL object as `Image`; ViewProfile only reads it in its 'profile' / 'product_img' modes, which this
  // caller never sets (an empty dark modal). The full URL string is passed here.
  function viewComplaintImage(i: number) {
    navigation.push('ViewProfile', { Image: media[i].file_name });
  }

  // :178-181 goToTaskPage(lable)
  function goToTaskPage(lable: string) {
    const d = detailRef.current;
    navigation.push('TaskClose', { id: d.complaintId, mobile: d.customerMobileNo, name: d.customerName, lable });
  }

  // :208-211 goToRemarkHistory()
  function goToRemarkHistory() {
    navigation.push('ComplaintRemarks', { id: detailRef.current.complaintId });
  }

  // :212-215 openimage(img_url)
  function openimage(imgUrl: any) {
    navigation.push('ViewProfile', { Image: imgUrl, mode: 'profile' });
  }

  // :217-257 loadMap(): locationAccuracy.request(HIGH_ACCURACY) then geolocation.getCurrentPosition() (the `options` at :219 are never passed).
  // The wrapper does both steps; a failure of the first step has a message starting with 'accuracy:'.
  // NOTE (parity): the rest of the success callback (:226-245) builds a google.maps map in `this.mapElement`, which is never set (the template has
  // no #map): that throws after checkinPass() and is swallowed by the `.catch`. getGeoencoder(:239) only stores `geoAddress`, which nothing shows,
  // and addMarker (:241) is never reached: neither is ported. Ionic's index.html loads the Google Maps script from the network: offline,
  // `new google.maps.LatLng` (:227) throws first and no check-in is posted (not reproduced).
  async function loadMap() {
    const r = await getPosition();
    if (!r.ok) {
      if (r.message?.startsWith('accuracy:')) {
        // :246-256 accuracy request rejected
        showToast('Allow Location Permissions', { duration: 3000, position: 'bottom' });
      }
      // :243-245 getCurrentPosition rejected: swallowed (the toast line is commented out)
      return;
    }
    newLat.current = r.value.lat; // :233
    newLong.current = r.value.lng; // :234
    checkinPass();
  }

  // :259-269 checkin()
  // NOTE (parity): `this.mode==0` (:262) is a comparison, not an assignment: the template's `(click)="checkin();mode=0"` sets it.
  function checkin() {
    loadMap();
  }

  // :290-312 checkinPass()
  // NOTE (parity): `showAlert(text)` (:276-285) is never called (dead code).
  function checkinPass() {
    db.onPostRequestDataFromApi(
      { plumber_id: db.userStorageData?.id, complaint_id: detailRef.current.complaintId, cust_lat: newLat.current, cust_long: newLong.current },
      'app_karigar/plumberCheckIn',
      db.rootUrl,
    ).then(
      (result: any) => {
        if (!result) {
          return; // TypeError at `result['msg']`
        }
        if (result.msg == 'CheckinSuccess') { // eslint-disable-line eqeqeq
          return; // :299 only a console.log
        }
        webAlert('Geo Location not found! Try Again');
      },
      // NOTE (parity): no error callback in Ionic.
      () => {},
    );
  }
  // NOTE (parity): `photoURL` (:50-52), `addInfoWindow` (:97-106), `getGeoencoder` (:109-117 only from the dead map code), `generateAddress`,
  // `getDirection` (:183-206, its template link is commented out) and `addMarker` (:314-324) are never reached by the template or a lifecycle.

  // `<a class="phone-call" href="tel:...">`: the cordova webview follows the link
  const dial = (mobile: any) => {
    Linking.openURL(`tel:${interp(mobile)}`);
  };

  // ---- template ----
  const d = detail ?? {};
  const low = lowerDetail ?? {};
  const ink = C.inkSoft;
  const mediaList: any[] = Array.isArray(media) ? media : [];
  const ulWidth = win.width - 32; // gallery: the screen minus its 2 x 16 padding
  const imageIndexes = mediaList.map((m, i) => (m?.type == 'image' ? i : -1)).filter(i => i >= 0); // eslint-disable-line eqeqeq
  // `star > '0'` / `star >= 'n'`: JS comparison of the model value with a string, as Angular evaluates it
  const starOn = (n: number) => low.star >= String(n);
  const starPositive = low.star > '0';

  const h4Style = textStyle(14, 400, C.nameColor);
  const pBlue = textStyle(13, 400, C.phoneBlue);
  const liLabel = textStyle(13, 600, ink);
  const liBold = textStyle(13, 700, ink);
  const liText = textStyle(13, 400, ink);
  const linkStyle = { ...textStyle(14, 400, ionicColors.primary), textTransform: 'capitalize' as const }; // `a { color: $link-color }`

  const letter = (name: any) => (name ? name[0].toUpperCase() : '');
  // html:12-22 / html:25-33 `.pumber-name`
  const person = (testID: string, name: any, mobile: any, suffix: string, pb0: boolean) => (
    <View style={[styles.pumberName, pb0 ? styles.pb0 : null]}>
      <View style={[styles.alphabetSlot, pb0 ? styles.slotNoPad : styles.slotPad]}>
        <View style={styles.alphabet}>
          <Text testID={`${testID}-letter`} style={textStyle(14, 600, C.white)}>
            {letter(name)}
          </Text>
        </View>
      </View>
      <View style={styles.name}>
        <Text testID={`${testID}-name`} style={[h4Style, styles.nameH4]}>
          {interp(titlecase(name))}
        </Text>
        <Text testID={`${testID}-mobile`} style={pBlue}>
          {`${interp(mobile)}${suffix}`}
        </Text>
        <Pressable testID={`${testID}-dial`} onPress={() => dial(mobile)} style={styles.phoneCall}>
          <MaterialIcon name="call" size={22} color={C.callGreen} />
        </Pressable>
      </View>
    </View>
  );

  // `<li><h4>label</h4><p><span>:</span>value</p></li>`
  const row = (key: string, label: string, value: string, extra?: React.ReactNode) => (
    <View key={key} testID={`row-${key}`} style={styles.li}>
      <View style={styles.liH4}>
        <Text style={liLabel}>{label}</Text>
      </View>
      <View style={styles.liP}>
        <Text style={[liBold, styles.colon]}>:</Text>
        <Text testID={`value-${key}`} style={[liText, styles.grow]}>
          {value}
        </Text>
      </View>
      {extra}
    </View>
  );

  // the three `*ngIf` blocks of html:213-239 (all draw the same button)
  const showCheckin =
    (low.complaintStatus == 'Pending' && mode == 1 && low.plumberStatus != 'Pending') || // eslint-disable-line eqeqeq
    (low.complaintStatus == 'Part_Pending' && mode == 1 && low.plumberStatus != 'Part_Pending') || // eslint-disable-line eqeqeq
    (low.complaintStatus == 'Unit_Replacement' && mode == 1 && low.plumberStatus != 'Unit_Replacement'); // eslint-disable-line eqeqeq

  const checkinButton = (
    <View testID="checkin-block" style={styles.checkinBlock}>
      {/* `class="mb16"` / `ml10` are defined nowhere: no margins */}
      <IonButton testID="checkin-button" color="primary" block round textTransform="capitalize" iconEnd="arrow-forward" onPress={() => { checkin(); setMode(0); }}>
        {`${collapseWs(t('Start Checkin'))} `}
      </IonButton>
    </View>
  );

  return (
    <View style={styles.screen}>
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(t('Customer Detail'))} />
      </IonHeader>

      <IonContent>
        {/* html:11-23 */}
        <View style={styles.lists}>{person('seller', d.sales_boy_name, d.sales_boy_mobile_no, ' (Seller)', true)}</View>

        {/* html:24-122 */}
        <View style={styles.lists}>
          {person('customer', d.customerName, d.customerMobileNo, '', false)}

          <View>
            {/* html:34-38 `.add p.pb0` */}
            <Text testID="address" style={[textStyle(13, 400, ink, 18), styles.addP]}>
              {`${interp(titlecase(d.address))} ${interp(titlecase(d.city))}${interp(titlecase(d.district))}${interp(titlecase(d.state))}${interp(d.pincode)}`}
            </Text>
          </View>

          <View>
            {row('id', collapseWs(t('Complaint ID')), `COM#${interp(complaintId)}`)}
            {row('problem', collapseWs(t('Nature Problem')), interp(d.nature_problem))}
            {/* html:55-66 the status value sits in `<span class="normal">` that `.lists ul li p span` also pads (10px) and colours #1b1b1b */}
            <View key="status" testID="row-status" style={styles.li}>
              <View style={styles.liH4}>
                <Text style={liLabel}>{collapseWs(t('Status'))}</Text>
              </View>
              <View style={styles.liP}>
                {d.complaintStatus == 'Pending' || d.complaintStatus == 'Cancel' || d.complaintStatus == 'Closed' ? ( // eslint-disable-line eqeqeq
                  <>
                    <Text style={[liBold, styles.colon]}>:</Text>
                    <Text testID="value-status" style={[liText, styles.colon, styles.grow]}>
                      {d.complaintStatus}
                    </Text>
                  </>
                ) : null}
              </View>
            </View>
            {d.complaintStatus == 'Part_Pending' ? ( // eslint-disable-line eqeqeq
              <View testID="row-part-image" style={styles.li}>
                <View style={styles.liH4}>
                  <Text style={liLabel}>{collapseWs(t('Image'))}</Text>
                </View>
                <Text style={textStyle(14, 400, C.ink)}>:</Text>
                <Pressable testID="part-image" onPress={() => openimage(d.part_pending_image)} style={styles.partImg}>
                  <Image testID="part-image-src" source={{ uri: db.upload_url3 + d.part_pending_image }} style={styles.partImgInner} resizeMode="stretch" />
                </Pressable>
              </View>
            ) : null}
            {d.complaintStatus == 'Unit_Replacement' ? ( // eslint-disable-line eqeqeq
              <View testID="row-unit-image" style={styles.li}>
                <View style={styles.liH4}>
                  <Text style={liLabel}>{collapseWs(t('Image'))}</Text>
                </View>
                <Text style={textStyle(14, 400, C.ink)}>:</Text>
                <Pressable testID="unit-image" onPress={() => openimage(d.unit_pending_image)} style={styles.partImg}>
                  <Image testID="unit-image-src" source={{ uri: db.upload_url3 + d.unit_pending_image }} style={styles.partImgInner} resizeMode="stretch" />
                </Pressable>
              </View>
            ) : null}
            {d.complaintStatus == 'Closed' ? ( // eslint-disable-line eqeqeq
              <>
                {row('closedBy', collapseWs(t('Closed By')), interp(d.cancelled_by))}
                {row('closeDate', collapseWs(t('Closing Date')), interp(datePipe(d.cancel_date, 'd MMMM y')))}
                {row('closeRemark', collapseWs(t('Closing Remark')), interp(d.reason_cancel))}
              </>
            ) : null}
            {d.complaintStatus == 'Cancel' ? ( // eslint-disable-line eqeqeq
              <>
                {row('cancelBy', collapseWs(t('Cancel By')), interp(d.cancelled_by))}
                {row('cancelDate', collapseWs(t('Cancel Date')), interp(datePipe(d.cancel_date, 'd MMMM y')))}
                {row(
                  'cancelRemark',
                  collapseWs(t('Cancel Remark')),
                  interp(d.reason_cancel),
                  remarkCount > 0 ? (
                    <Pressable testID="cancel-view-all" onPress={goToRemarkHistory} style={styles.liLink}>
                      <Text style={linkStyle}>View all</Text>
                    </Pressable>
                  ) : null,
                )}
              </>
            ) : null}
          </View>
        </View>

        {/* html:124-137 `plumber_detail.reason_cancel!==''` is strict: an undefined reason shows the block */}
        {d.complaintStatus == 'Pending' && d.reason_cancel !== '' ? ( // eslint-disable-line eqeqeq
          <View testID="new-remark" style={styles.newRemark}>
            <View style={styles.timing}>
              <View style={styles.date}>
                <Text testID="new-remark-date" style={[textStyle(14, 600, C.ink), styles.dateH4]}>
                  {interp(datePipe(d.cancel_date, 'd MMMM y'))}
                </Text>
              </View>
              <Pressable testID="new-remark-view-all" onPress={goToRemarkHistory}>
                <Text style={linkStyle}>{collapseWs(t('View All'))}</Text>
              </Pressable>
            </View>
            <View style={styles.content}>
              <Text testID="new-remark-text" style={textStyle(14, 400, C.ink, 19)}>
                <Text style={textStyle(14, 600, C.ink, 19)}>Remark : </Text>
                {interp(d.reason_cancel)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* html:150-... `.gallery` holds the media, the rating and the task buttons */}
        <View style={styles.gallery}>
          {mediaList.length ? (
            <View testID="select-img">
              <Text style={[textStyle(18, 600, C.ink, 22), styles.pb10]}>{collapseWs(t('Product Gallery'))}</Text>
              <View>
                <View style={styles.ul}>
                  {mediaList.map((m: any, i: number) =>
                    m?.type == 'video' ? ( // eslint-disable-line eqeqeq
                      <View key={i} testID={`video-${i}`} style={[styles.galleryLi, styles.videoLi, { width: ulWidth - 6 }]}>
                        {/* NOTE (parity): `rameborder="0"` (typo) keeps the default inset iframe border (see WebEmbed) */}
                        <WebEmbed testID={`video-embed-${i}`} uri={m.file_name} height={180} border="inset" iframe />
                        <View style={styles.gap} />
                      </View>
                    ) : null,
                  )}
                </View>
              </View>
              <View style={styles.ul}>
                {mediaList.map((m: any, i: number) =>
                  m?.type == 'image' ? ( // eslint-disable-line eqeqeq
                    <Pressable
                      key={i}
                      testID={`image-${i}`}
                      onPress={() => viewComplaintImage(i)}
                      style={[styles.galleryLi, { width: 0.35 * ulWidth - 18 }, i === imageIndexes[imageIndexes.length - 1] ? styles.liLast : null]}
                    >
                      <Image testID={`image-src-${i}`} source={{ uri: m.file_name }} style={styles.img} resizeMode="stretch" />
                      <View style={styles.gap} />
                    </Pressable>
                  ) : null,
                )}
              </View>
            </View>
          ) : null}

          {starPositive ? (
            <View testID="customer-ratings" style={styles.customerRatings}>
              <Text style={[textStyle(13, 400, ink), styles.pb10]}>{collapseWs(t('Rating'))}</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map(n => (
                  <View key={n} testID={`rating-star-${n}`} style={styles.star}>
                    <MaterialIcon name="star" color={starOn(n) ? C.starOn : C.starOff} />
                  </View>
                ))}
                <View style={styles.star}>
                  <Text testID="rating-votes" style={[textStyle(12, 400, C.votes, 20), styles.votes]}>
                    {`${interp(low.star)} Star `}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {mode === 0 ? (
            <View testID="task-btn" style={styles.taskBtn}>
              <IonButton
                testID="close-complaint-button"
                color="danger"
                background={buttonMd.greenColorBackground}
                textTransform="capitalize"
                style={styles.taskButton}
                labelStyle={styles.taskLabel}
                onPress={() => goToTaskPage('Closed')}
              >
                {collapseWs(t('Close Complaint'))}
              </IonButton>
              <IonButton
                testID="in-process-button"
                background={buttonMd.reenColorBackground}
                textTransform="capitalize"
                style={styles.taskButton}
                labelStyle={styles.taskLabel}
                onPress={() => goToTaskPage('Pending')}
              >
                {collapseWs(t('In process'))}
              </IonButton>
            </View>
          ) : null}
        </View>

        {/* html:213-239 */}
        {showCheckin ? checkinButton : null}
      </IonContent>
    </View>
  );
}
