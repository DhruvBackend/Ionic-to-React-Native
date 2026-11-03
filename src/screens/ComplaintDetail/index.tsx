// Ported from: src/pages/complaints/complaint-detail/complaint-detail.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonList } from '../../components/ionic/IonList';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { WebEmbed } from '../../components/WebEmbed';
import { buttonMd } from '../../theme/ionicMdContent';
import { complaintMd as C } from '../../theme/ionicMdComplaint';
import { collapseWs, datePipe, interp } from '../../ui/angularPipes';
import { showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation: {
    push: (name: string, params?: object) => void;
    addListener?: (type: 'blur' | 'focus', cb: () => void) => () => void;
  };
  route?: { params?: { id?: any } };
}

// global `.Closed / .Pending / .Reject, .Cancel { color: ... !important }` ([T] 499-516) for `class="{{complaint_detail.complaintStatus}}"`
const statusColor = (s: any) => (s == 'Closed' ? C.closed : s == 'Pending' ? C.pending : s == 'Cancel' ? C.cancel : C.ink); // eslint-disable-line eqeqeq

export default function ComplaintDetailScreen({ navigation, route }: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  const win = useWindowDimensions();

  // complaint-detail.ts:20-25 fields
  const complaintId = useRef<any>('');
  const [detail, setDetail] = useState<any>({}); // complaint_detail:any={}
  const [media, setMedia] = useState<any[]>([]); // complaint_media:any=[]
  const [star, setStar] = useState<any>(''); // star:any=''
  const [payment, setPayment] = useState<string | undefined>(undefined); // amount.payment
  const cancelOpen = useRef(false); // set while the CancelComplaint modal is open (modalCtrl.create(...).onDidDismiss)
  const detailRef = useRef<any>({});

  // :41-47 ionViewDidLoad: presentLoading(); complaint_id = navParams.get('id'); getComplaintDetail(complaint_id)
  useEffect(() => {
    alive.current = true;
    presentLoading();
    complaintId.current = route?.params?.id;
    getComplaintDetail(complaintId.current);
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :108-117 complaintModal.onDidDismiss(data => getComplaintDetail(...)): the modal dismissed (its button, the hardware back key) shows this page
  // again. React Navigation's 'focus' also fires after the ViewProfile modal, which has no onDidDismiss: only the CancelComplaint one counts.
  useEffect(() => {
    return navigation.addListener?.('focus', () => {
      if (cancelOpen.current) {
        cancelOpen.current = false;
        getComplaintDetail(detailRef.current?.complaintId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  // :50-56 presentLoading(): 'Please wait...', dismissOnPageChange: true
  function presentLoading() {
    loader.show('Please wait...', { dismissOnPageChange: true });
  }

  // :58-88 getComplaintDetail(id)
  function getComplaintDetail(id: any) {
    db.onPostRequestDataFromApi({ complaints_id: id }, 'app_karigar/getComplaintbyId', db.rootUrl).then(
      (response: any) => {
        loader.hide(); // :63 this.loading.dismiss(), before anything is read
        if (!response) {
          return; // TypeError at `response['complaintDetails']`
        }
        const details = response.complaintDetails;
        // NOTE (parity): a null/undefined `complaintDetails` makes the template read `complaint_detail.complaint_type` of null and throw
        // (and `response['complaintDetails']['image']` throws too): the view keeps what it showed.
        if (details == null) {
          return;
        }
        detailRef.current = details;
        if (alive.current) {
          setDetail(details);
          setStar(details.star); // :67 (assigned before the console.log / loop below can throw)
        }
        const image = details.image;
        // NOTE (parity): a missing `image` throws at `this.complaint_media[0]` (:68) and in the template's `complaint_media.length`: the gallery keeps what it showed.
        if (image == null) {
          return;
        }
        // :71-84 the loop turns a video / image file name into its full URL (a sanitised URL in Ionic)
        const mapped = image.map((m: any) =>
          m?.type == 'video' // eslint-disable-line eqeqeq
            ? { ...m, file_name: db.video_url + m.file_name }
            : m?.type == 'image' // eslint-disable-line eqeqeq
              ? { ...m, file_name: db.upload_url3 + m.file_name }
              : m,
        );
        if (alive.current) {
          setMedia(mapped);
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up (until the page changes).
      () => {},
    );
  }

  // :90-100 rating(star)
  function rating(s: string) {
    presentLoading();
    db.onPostRequestDataFromApi(
      { star: s, customer_id: db.userStorageData?.id, plumber_id: detail.plumberId, complaint_id: detail.complaintId },
      'app_karigar/plumberRatingByCustomer',
      db.rootUrl,
    ).then(
      () => {
        getComplaintDetail(detail.complaintId);
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the 'Please wait...' loader stays up.
      () => {},
    );
  }

  // :102-105 viewComplaintImage(i)
  // NOTE (parity): Ionic passes the sanitised URL object as `Image`; ViewProfile only reads it in its 'profile' / 'product_img' modes, which this
  // caller never sets (an empty dark modal). The full URL string is passed here.
  function viewComplaintImage(i: number) {
    navigation.push('ViewProfile', { Image: media[i].file_name });
  }

  // :107-118 cancelComplaint(label)
  function cancelComplaint(label: string) {
    cancelOpen.current = true;
    navigation.push('CancelComplaint', { id: detail.complaintId, label });
  }

  // :120-136 saveAmount()
  function saveAmount() {
    db.onPostRequestDataFromApi({ complaints_id: complaintId.current, amount: payment }, 'app_karigar/customerPaidAmount', db.rootUrl).then(
      (result: any) => {
        if (!result) {
          return; // TypeError at `result['status']`: no refresh
        }
        if (result.status == 'success') { // eslint-disable-line eqeqeq
          showSuccess('Amount Added Successfully!');
        }
        getComplaintDetail(detail.complaintId);
      },
      // NOTE (parity): no error callback in Ionic.
      () => {},
    );
  }

  // :138-148 showSuccess(text)
  function showSuccess(text: string) {
    showAlert({ title: 'Success!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  }
  // NOTE (parity): `photoURL(url)` (:29-31) is never called (dead code); `rating_star` (:23, :66) is never read by the template.

  // ---- template ----
  const d = detail ?? {};
  const cell = textStyle(12, 400, C.ink);
  // html:21-85 the table rows, in order (an *ngIf row that is false is not in the DOM, so `:last-child` moves)
  const rows: { key: string; label: string; value: string; color?: string }[] = [
    { key: 'no', label: 'Complaint No.', value: `${d.complaint_type == 'Service' ? 'COM# ' : d.complaint_type == 'Installation' ? 'IR# ' : ''}${interp(d.complaintId)}` }, // eslint-disable-line eqeqeq
    { key: 'date', label: 'Date', value: interp(datePipe(d.compalintDate, 'd MMMM y')) },
    { key: 'name', label: 'Name', value: interp(d.customerName) },
    { key: 'otp', label: 'OTP', value: interp(d.otp) },
    { key: 'problem', label: d.nature_problem != 'Installation' ? 'Nature Problem' : 'Remark', value: interp(d.nature_problem) }, // eslint-disable-line eqeqeq
    { key: 'status', label: 'Status', value: interp(d.complaintStatus), color: statusColor(d.complaintStatus) },
    { key: 'type', label: 'Type', value: interp(d.complaint_type), color: statusColor(d.complaintStatus) },
    { key: 'address', label: 'Address', value: collapseWs(`${interp(d.address)} ${interp(d.city)} ${interp(d.district)} ${interp(d.state)} ${interp(d.pincode)}`).trim() },
  ];
  if (d.complaintStatus == 'Closed') { // eslint-disable-line eqeqeq
    rows.push({ key: 'closedBy', label: 'Closed By', value: interp(d.cancelled_by) });
    rows.push({ key: 'closeDate', label: 'Close Date', value: interp(datePipe(d.cancel_date, 'd MMMM y')), color: statusColor(d.complaintStatus) });
  }
  if (d.complaintStatus == 'Cancel') { // eslint-disable-line eqeqeq
    rows.push({ key: 'cancelBy', label: 'Cancel By', value: interp(d.cancelled_by) });
    rows.push({ key: 'cancelDate', label: 'Cancel Date', value: interp(datePipe(d.cancel_date, 'd MMMM y')) });
  }
  if (d.reason_cancel) {
    rows.push({ key: 'remark', label: 'Remark', value: interp(d.reason_cancel) });
  }
  if (d.amount != '0') { // eslint-disable-line eqeqeq
    rows.push({ key: 'amount', label: 'Amount Paid', value: `₹ ${interp(d.amount)}` });
  }

  // gallery: `.select-img ul li` width calc(35% - 18px) of the ul (the screen minus the gallery's 2 x 16 padding)
  const ulWidth = win.width - 32;
  const imageIndexes = media.map((m, i) => (m?.type == 'image' ? i : -1)).filter(i => i >= 0); // eslint-disable-line eqeqeq
  const mediaList: any[] = Array.isArray(media) ? media : [];

  // `star > '0'` / `star >= '1'`: JS comparison of the model value with a string, as Angular evaluates it
  const starOn = (n: number) => star >= String(n);
  const starPositive = star > '0';

  return (
    <View style={styles.screen}>
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(` ${interp(d.complaint_type)} Request Detail`).trim()} />
      </IonHeader>

      <IonContent>
        {/* html:15-91 */}
        <View style={styles.padding10}>
          <View testID="basic-table" style={styles.basicTable}>
            {rows.map((r, i) => (
              <View key={r.key} testID={`row-${r.key}`} style={[styles.tr, i === rows.length - 1 ? styles.trLast : null]}>
                <View style={styles.td}>
                  <Text style={cell}>{r.label}</Text>
                </View>
                <View style={styles.td}>
                  <Text testID={`value-${r.key}`} style={[cell, r.color ? { color: r.color } : null]}>
                    {r.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* html:93-149 */}
        <View style={styles.gallery}>
          {mediaList.length ? (
            <View testID="select-img">
              <Text style={[textStyle(18, 600, C.ink, 22), styles.pb10]}>Product Gallery</Text>
              <View>
                <View style={styles.ul}>
                  {mediaList.map((m: any, i: number) =>
                    m?.type == 'video' ? ( // eslint-disable-line eqeqeq
                      <View key={i} testID={`video-${i}`} style={[styles.li, styles.videoLi, { width: ulWidth - 6 }]}>
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
                      style={[styles.li, { width: 0.35 * ulWidth - 18 }, i === imageIndexes[imageIndexes.length - 1] ? styles.liLast : null]}
                    >
                      <Image testID={`image-src-${i}`} source={{ uri: m.file_name }} style={styles.img} resizeMode="stretch" />
                      <View style={styles.gap} />
                    </Pressable>
                  ) : null,
                )}
              </View>
            </View>
          ) : null}

          <Text style={[textStyle(16, 500, C.ink, 19), styles.mv10]}>Plumber Information</Text>

          <View style={styles.ratingArea}>
            <View style={styles.borderBox}>
              <View style={styles.boxs}>
                <Text style={textStyle(12, 400, C.inkSoft)}>Name</Text>
                <Text testID="plumber-name" style={[textStyle(13, 400, C.inkSoft, 20), styles.capitalize]}>
                  {d.plumberName ? interp(d.plumberName) : 'NA'}
                </Text>
              </View>
              <View style={[styles.boxs, styles.boxsLast]}>
                <Text style={textStyle(12, 400, C.inkSoft)}>Mobile No.</Text>
                <Text testID="plumber-mobile" style={[textStyle(13, 400, C.inkSoft, 20), styles.capitalize]}>
                  {d.plumberMobileNo ? interp(d.plumberMobileNo) : 'NA'}
                </Text>
              </View>
            </View>

            {starPositive ? (
              <View testID="ratings" style={styles.ratings}>
                <Text style={[textStyle(13, 500, C.inkSoft, 20), styles.pb10]}>Rating</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <View key={n} testID={`rating-star-${n}`} style={styles.star}>
                      <MaterialIcon name="star" color={starOn(n) ? C.starOn : C.starOff} />
                    </View>
                  ))}
                  <View style={styles.star}>
                    <Text testID="rating-votes" style={[textStyle(12, 500, C.votes, 20), styles.votes]}>
                      {`${interp(star)} Star ${interp(d.total_votes)} Complaints`}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* html:150-168 */}
        {d.complaintStatus == 'Closed' && d.amount == '0' ? ( // eslint-disable-line eqeqeq
          <View testID="amount-form" style={styles.mainField}>
            <Text style={[textStyle(16, 500, C.ink, 19), styles.amountHeading]}>Enter Amount If Paid</Text>
            <IonList style={styles.list}>
              <IonInputItem
                testID="amount-payment"
                variant="csInput"
                type="tel"
                // NOTE (parity): `maxlength="5"` on <ion-input> is only an Angular validator (no native limit); `required` / `minlength` never gate saveAmount()
                value={payment ?? ''}
                onChangeText={setPayment}
                itemStyle={styles.amountItem}
                // `.remove-padding ... .input-wrapper { padding-left: 32px !important }` + `input { padding-top: 0 !important }`
                inputStyle={styles.amountInput}
              />
            </IonList>
            {/* NOTE (parity, not 1:1): the 20 x 20 rupee.svg drawn at left 12 (`.input-wrapper:after`) is a client picture not in clients/<id>/assets (STOP item) */}
            <View style={styles.rupeeBtn}>
              {/* `[disabled]="amount.payment==0"`: loose, so '' / '0' / '00' disable it and an untouched (undefined) model does not */}
              <IonButton
                testID="amount-submit"
                background={C.green}
                style={styles.rupeeButton}
                disabled={(payment as any) == 0} // eslint-disable-line eqeqeq
                onPress={saveAmount}
              >
                Submit
              </IonButton>
            </View>
          </View>
        ) : null}

        {/* html:171-181 */}
        {d.plumberName && d.complaintStatus == 'Closed' ? ( // eslint-disable-line eqeqeq
          <View testID="plumber-rating" style={styles.plumberRating}>
            <Text style={[textStyle(13, 400, C.ratingInk), styles.pb5]}>Rate a Plumber</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map(n => (
                <Pressable key={n} testID={`rate-${n}`} onPress={() => rating(String(n))} style={styles.rateStar}>
                  <MaterialIcon name="star_border" color={starOn(n) ? C.starOn : C.ink} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* html:183-188 */}
        {d.complaintStatus == 'Pending' ? ( // eslint-disable-line eqeqeq
          <View testID="cancel-block" style={styles.taskBtn}>
            <IonButton
              testID="cancel-complaint-button"
              color="danger"
              background={buttonMd.redColorBackground}
              textTransform="capitalize"
              style={styles.taskButton}
              labelStyle={styles.taskLabel}
              onPress={() => cancelComplaint('cancel')}
            >
              Cancel Complaint
            </IonButton>
          </View>
        ) : null}
      </IonContent>
    </View>
  );
}
