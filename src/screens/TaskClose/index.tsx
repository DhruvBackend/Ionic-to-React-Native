// Ported from: src/pages/task-close/task-close.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInputItem } from '../../components/ionic/IonInput';
import { Header } from '../../components/ionic/IonNavbar';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { getNetworkState, getPosition, takePhoto } from '../../native';
import { buttonMd } from '../../theme/ionicMdContent';
import { checkinMd as C } from '../../theme/ionicMdCheckin';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { showActionSheet, showAlert, showToast } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation: { reset: (state: object) => void };
  route?: { params?: { id?: any; mobile?: any; name?: any; lable?: any } };
}

// html:23-24 `<img src="{{status.image}}">` with `height: 100%; object-fit: contain`: the width follows the natural ratio of the picture
function UploadImage({ uri }: { uri: string }) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    let live = true;
    setNatural(null);
    Image.getSize?.(
      uri,
      (w, h) => live && setNatural({ w, h }),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [uri]);
  const width = natural && natural.h > 0 ? (natural.w * C.upload.size) / natural.h : C.upload.size;
  return <Image testID="upload-image" source={{ uri }} style={[styles.uploadImage, { width }]} resizeMode="contain" />;
}

export default function TaskCloseScreen({ navigation, route }: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  const [, setTick] = useState(0);
  const rerender = () => {
    if (alive.current) {
      setTick(n => n + 1);
    }
  };
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // task-close.ts:24-34 fields, :44-53 constructor
  // NOTE (parity): `today_date` (:41), `complaint_id`, `comType` and `storage` are never read.
  const status = useRef<any>({
    complaints_id: route?.params?.id, // :45
    name: route?.params?.name, // :47
    image: '', // :49
  });
  const customerMobileNo = route?.params?.mobile; // :46
  const lable = route?.params?.lable; // :48
  const newLat = useRef<any>(undefined);
  const newLong = useRef<any>(undefined);
  const started = useRef(false);

  // :55-58 ionViewDidLoad (once)
  useEffect(() => {
    alive.current = true;
    if (!started.current) {
      started.current = true;
      loadMap();
    }
    return () => {
      alive.current = false;
    };
  }, []);

  // :135-171 loadMap(): locationAccuracy.request(HIGH_ACCURACY) then geolocation.getCurrentPosition() (the `options` at :137-139 are never passed).
  // The wrapper does both steps; a failure of the first step has a message starting with 'accuracy:'.
  // NOTE (parity): the success callback builds a google.maps LatLng (:142) and stores the fix (:150-151); the map code is commented out. Offline
  // `google` is undefined, `new google.maps.LatLng` throws before the fix is stored and the `.catch` swallows it (approximated with getNetworkState).
  async function loadMap() {
    const r = await getPosition();
    if (!r.ok) {
      if (r.message?.startsWith('accuracy:')) {
        // :164-170 accuracy request rejected
        showToast('Allow Location Permissions', { duration: 3000, position: 'bottom' });
      }
      // :161-164 getCurrentPosition rejected: swallowed (the toast line is commented out)
      return;
    }
    const net = await getNetworkState();
    if (net.ok && !net.value.online) {
      return;
    }
    newLat.current = r.value.lat; // :150
    newLong.current = r.value.lng; // :151
  }

  // :60-96 onUploadChange()
  function onUploadChange() {
    showActionSheet({
      title: ' Upload File',
      cssClass: 'cs-actionsheet',
      buttons: [
        { cssClass: 'sheet-m', text: 'Camera', icon: 'camera', handler: () => { takeDocPhoto(); } },
        { cssClass: 'sheet-m1', text: 'Gallery', icon: 'image', handler: () => { getDocImage(); } },
        { cssClass: 'cs-cancel', text: 'Cancel', role: 'cancel', handler: () => {} },
      ],
    });
  }

  // :98-117 takeDocPhoto()
  async function takeDocPhoto() {
    const r = await takePhoto('camera', { quality: 70, maxWidth: 500, maxHeight: 400 });
    if (!r.ok) {
      return; // the plugin's error callback is empty
    }
    status.current.image = r.value; // 'data:image/jpeg;base64,' + imageData
    rerender();
  }

  // :118-134 getDocImage()
  async function getDocImage() {
    const r = await takePhoto('gallery', { quality: 70 });
    if (!r.ok) {
      return;
    }
    status.current.image = r.value;
    rerender();
  }

  // :180-212 submit()
  function submit() {
    loader.show(); // presentLoading(): "Please wait...", dismissOnPageChange
    status.current.closed_by = db.userStorageData?.id;
    status.current.status = lable;
    db.onPostRequestDataFromApi({ status: status.current }, 'app_karigar/complaintTaskCloseByPlumber', db.rootUrl).then(
      (r: any) => {
        loader.hide(); // :186 first
        if (!r) {
          return; // TypeError at `r['status']`
        }
        if (r.status == 'success') { // eslint-disable-line eqeqeq
          if (lable == 'Closed') { // eslint-disable-line eqeqeq
            showSuccess('Complaint Closed Successfully ');
          } else {
            showSuccess('Remark Added Successfully ');
          }
          navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] }); // setRoot(TabsPage, {index:'0'})
          checkOut(status.current.complaints_id, lable, status.current.remark);
        } else if (r.status == 'Otp not matched.') { // eslint-disable-line eqeqeq
          showAlertText('Wrong Otp');
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the "Please wait..." loader stays up forever.
      () => {},
    );
  }

  // :214-223 showAlert(text)
  function showAlertText(text: string) {
    showAlert({ title: 'Alert!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  }

  // :225-233 showSuccess(text)
  function showSuccess(text: string) {
    showAlert({ title: 'ThankYou!', subTitle: text, buttons: ['OK'] });
  }

  // :235-241 MobileNumber(event): `(keypress)` drops every character that is not in [0-9+\- ] (Backspace passes)
  function mobileNumber(text: string): string {
    return text.replace(/[^0-9+\- ]/g, '');
  }

  // :253-276 checkOut(complain_id, status, remark)
  // NOTE (parity): the response handling (:262-273) only returns: `else(result['msg']=='failed'){ return; }` is an `else` followed by a block, so
  // nothing visible happens for any msg (a null body throws inside Ionic's subscribe and is swallowed).
  function checkOut(complainId: any, st: any, remark: any) {
    db.onPostRequestDataFromApi(
      { plumber_id: db.userStorageData?.id, status: st, remark, complaint_id: complainId, cust_lat: newLat.current, cust_long: newLong.current },
      'app_karigar/plumberCheckOut',
      db.rootUrl,
    ).then(
      () => {},
      () => {},
    );
  }

  // ---- Angular control validity: remark `required`; otp `required minlength=6 maxlength=6` (only exists when lable == 'Closed') ----
  const s = status.current;
  const isEmpty = (v: any) => v === null || v === undefined || v.length === 0;
  const closed = lable == 'Closed'; // eslint-disable-line eqeqeq
  const controls: Record<string, boolean> = {
    remark: isEmpty(s.remark),
    ...(closed ? { otp: isEmpty(s.otp) || String(s.otp).length < 6 } : null),
  };
  const noImage = s.image == ''; // eslint-disable-line eqeqeq
  const touch = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));
  const ngClasses = (name: string) => ({ valid: !controls[name], invalid: !!controls[name], touched: !!touched[name] });

  // html:10 `(ngSubmit)="f.form.valid && submit()"`
  // NOTE (parity): the `[ngClass]="{'error': f.submitted && remark?.invalid}"` of both items has no style outside `.main-field` / `.enquriy`
  // (the `&.error` rules of variables.scss sit under `.cs-input`), so an invalid form shows nothing.
  function onSubmit() {
    if (Object.values(controls).every(v => !v)) {
      submit();
    }
  }

  return (
    <View style={styles.screen}>
      {/* html:7-12 `.main-header.remove` */}
      <Header mainHeader remove color="primary" title="Complaint Status" />

      {/* html:15-40 */}
      <IonContent>
        <View style={styles.formBlock}>
          {/* html:17-20 */}
          <IonInputItem
            testID="remark"
            textarea
            floating
            label="Remark"
            value={s.remark ?? ''}
            validation={ngClasses('remark')}
            onBlur={() => touch('remark')}
            onChangeText={v => {
              status.current.remark = v;
              rerender();
            }}
            itemStyle={styles.item}
            labelStyle={styles.label} // task-close.scss `.form-block ion-item ion-label { font-size: 14px }`
          />
          {/* html:21-27 */}
          <View>
            <Pressable testID="upload-document" style={styles.upload} onPress={onUploadChange}>
              {noImage ? (
                <View testID="upload-prompt" style={styles.uploadPrompt}>
                  <MaterialIcon name="add_circle" color={C.upload.ink} />
                  <Text style={[textStyle(14, 400, C.upload.ink, normalLineHeight(14)), styles.uploadP]}>Upload Image</Text>
                </View>
              ) : null}
              {!noImage ? <UploadImage uri={s.image} /> : null}
            </Pressable>
          </View>
          {/* html:28-31 */}
          {closed ? (
            <IonInputItem
              testID="otp"
              floating
              label={`Enter OTP Sent to ${customerMobileNo ?? ''}`}
              type="tel"
              maxLength={6}
              value={s.otp ?? ''}
              validation={ngClasses('otp')}
              onBlur={() => touch('otp')}
              onChangeText={v => {
                status.current.otp = mobileNumber(v);
                rerender();
              }}
              itemStyle={styles.item}
              labelStyle={styles.label}
              // task-close.scss `.form-block ion-item ion-input { min-height: 35px }`: the native input stays at the top of the 35px box
              inputStyle={styles.otpInput}
            />
          ) : null}
        </View>

        {/* html:34-40 `.enquiry-btn.task-btn` (inline padding 16) */}
        <View testID="task-btn" style={styles.taskBtn}>
          <IonButton
            testID="submit"
            color="danger"
            background={buttonMd.greenColorBackground}
            textTransform="capitalize"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={onSubmit}
          >
            Submit
          </IonButton>
        </View>
      </IonContent>
    </View>
  );
}
