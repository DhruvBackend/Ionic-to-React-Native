// Ported from: src/pages/complaints/add-new-complaint/add-new-complaint.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Text } from '../../components/ionic/IonText';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonList } from '../../components/ionic/IonList';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Header } from '../../components/ionic/IonNavbar';
import { IonSelect } from '../../components/ionic/IonSelect';
import { textStyle } from '../../components/ionic/text';
import { takePhoto } from '../../native';
import { md } from '../../theme/ionicMd';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { addNewComplaintMd as A } from '../../theme/ionicMdAddNewComplaint';
import { registrationMd as R } from '../../theme/ionicMdLogin';
import { showActionSheet, showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void; reset: (state: object) => void };
  route?: { params?: any };
}

// Angular required validator on a control value.
const isEmpty = (v: any) => v === null || v === undefined || v.length === 0;
// Angular minlength: skips empty values.
const tooShort = (v: any, n: number) => !isEmpty(v) && String(v).length < n;

interface Block {
  key: string;
  render: (margins: { marginTop: number; marginBottom: number }) => React.ReactNode;
}

// `.main-field h3` with the 107% underline (see Registration: the text width is measured).
function H3({ label, marginTop }: { label: string; marginTop: number }) {
  const [w, setW] = useState(0);
  return (
    <View style={[styles.h3, { marginTop, marginBottom: R.h3.marginBottom }]} onLayout={e => setW(e.nativeEvent.layout.width)}>
      <Text style={textStyle(R.h3.fontSize, 400, R.h3.ink, R.h3.lineHeight)}>
        <Text style={styles.h3Text}>{label}</Text>
      </Text>
      <View style={[styles.h3Line, { width: (w * R.h3.lineWidthPct) / 100 }]} />
    </View>
  );
}

export default function AddNewComplaintScreen({ navigation, route }: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  const [, setTick] = useState(0);
  const rerender = () => {
    if (alive.current) {
      setTick(n => n + 1);
    }
  };
  const [submitted, setSubmitted] = useState(false); // f.submitted
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // add-new-complaint.ts:23-37 fields
  const complaintData = useRef<any>({}); // complaint_data
  const complaint = useRef<any>({}); // complaint (mobile_no)
  const stateList = useRef<any>([]);
  const districtList = useRef<any>([]);
  const categoryArr = useRef<any>([]);
  const imageData = useRef<any[]>([]); // image_data
  const started = useRef(false);

  // :56 `this.data.type = this.navParams.get('type')`
  const type = route?.params?.type;

  // :67-76 getstatelist()
  function getStateList() {
    db.onGetRequestDataFromApi('app_master/getStates', db.rootUrl).then(
      (r: any) => {
        stateList.current = r?.states; // NOTE (parity): a null body throws inside Ionic's subscribe; nothing else happens
        rerender();
      },
      () => {},
    );
  }

  // :78-87 getDistrictList(state_name)
  function getDistrictList(stateName: any) {
    db.onPostRequestDataFromApi({ state_name: stateName }, 'app_master/getDistrict', db.rootUrl).then(
      (r: any) => {
        districtList.current = r?.districts;
        rerender();
      },
      () => {},
    );
  }

  // :146-156 getcategoryData(). NOTE (parity): categoryArr is never shown (the template has no category select).
  function getCategoryData() {
    db.onPostRequestDataFromApi({}, 'app_karigar/getCategory', db.rootUrl).then(
      (r: any) => {
        categoryArr.current = r?.categoryData;
      },
      () => {},
    );
  }

  // :136-144 showAlert(text)
  function showAlertText(text: string) {
    showAlert({ title: 'Alert!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  }

  // :88-134 getCustomer(), called from (input) of the Mobile field
  function getCustomer() {
    const mobile = complaint.current.mobile_no;
    const d = complaintData.current;
    if (mobile.length >= 10) {
      db.onPostRequestDataFromApi({ mobile_no: mobile }, 'app_karigar/get_customer', db.rootUrl).then(
        (r: any) => {
          if (r?.status == 'EXIST') { // eslint-disable-line eqeqeq
            d.customer_id = r.customer.id;
            d.first_name = r.customer.first_name;
            d.address = r.customer.address;
            d.state = r.customer.state;
            d.district = r.customer.district;
            d.city = r.customer.city;
            d.pincode = r.customer.pincode;
            d.first_name = r.customer.first_name; // NOTE (parity): assigned twice in Ionic (:97 and :103)
            if (d.state) {
              getDistrictList(d.state);
            }
          } else if (r?.status == 'NOTEXIST') { // eslint-disable-line eqeqeq
            if (r.karigar_type == 'Sales_Boy') { // eslint-disable-line eqeqeq
              showAlertText(complaint.current.mobile_no + ' This number is registered as Seller, please use another number to add new complaint');
              complaint.current.mobile_no = r.customer; // NOTE (parity): the number is replaced by `r.customer`, not cleared
            } else if (r.karigar_type == 'Plumber') { // eslint-disable-line eqeqeq
              showAlertText(complaint.current.mobile_no + ' This number is registered as Plumber, please use another number to add new complaint');
              complaint.current.mobile_no = '';
            }
          }
          rerender();
        },
        () => {}, // NOTE (parity): no error callback in Ionic
      );
    } else if (mobile.length < 10) {
      d.first_name = '';
      d.address = '';
      d.state = '';
      d.district = '';
      d.city = '';
      d.pincode = '';
      d.first_name = '';
    }
  }

  // :40-58 constructor
  useEffect(() => {
    alive.current = true;
    if (!started.current) {
      started.current = true;
      getStateList();
      getCategoryData();
    }
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = complaintData.current;
  const mobileValue = complaint.current.mobile_no;

  // ---- Angular control validity (required / minlength / maxlength via the maxLength prop) ----
  const controls: Record<string, boolean> = {
    mobile_no: isEmpty(mobileValue) || tooShort(mobileValue, 10),
    first_name: isEmpty(d.first_name),
    state: isEmpty(d.state),
    district: isEmpty(d.district),
    city: isEmpty(d.city),
    pincode: isEmpty(d.pincode) || tooShort(d.pincode, 6),
    nature_problem: isEmpty(d.nature_problem),
  };
  const invalid = (name: string) => !!controls[name];
  const formValid = Object.values(controls).every(v => !v);
  const err = (name: string) => submitted && invalid(name);
  const ngClasses = (name: string) => ({ valid: !invalid(name), invalid: invalid(name), touched: !!touched[name] });
  const touch = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

  const set = (name: string, value: any) => {
    complaintData.current[name] = value;
    rerender();
  };

  // :395-428 genrateCompliant() (the `videoId` branch of submit() is unreachable: videoId is never set)
  async function genrateCompliant() {
    const c = complaintData.current;
    c.type = type;
    c.mobile_no = complaint.current.mobile_no;
    c.image = imageData.current ? imageData.current : [];
    c.customer_id = db.userStorageData?.id; // NOTE (parity): overwrites the customer_id of get_customer
    c.created_by = '0';
    try {
      await db.onPostRequestDataFromApi({ complaint: c }, 'app_karigar/addComplaint', db.rootUrl);
    } catch {
      // NOTE (parity): no error callback in Ionic: after an HTTP error the "Please wait..." loader stays up forever.
      return;
    }
    loader.hide(); // :411 before anything else; the response is never read
    if (c.type == 'Installation') { // eslint-disable-line eqeqeq
      showAlert({ title: 'Success!', subTitle: 'New Installation request submitted successfully!', buttons: ['OK'] });
    }
    if (c.type == 'Service') { // eslint-disable-line eqeqeq
      showAlert({ title: 'Success!', subTitle: 'New Service request submitted successfully!', buttons: ['OK'] });
    }
    navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] }); // setRoot(TabsPage, {index:'0'})
  }

  // :447-455 submit(): presentLoading() ("Please wait...", dismissOnPageChange)
  function submit() {
    loader.show();
    void genrateCompliant();
  }

  // html:4 `(ngSubmit)="f.form.valid && submit()"`
  function onSubmit() {
    setSubmitted(true);
    if (formValid) {
      submit();
    }
  }

  // :322-363 takePhoto / getImage, :387-391 fileChange
  async function pick(source: 'camera' | 'gallery') {
    const r = await takePhoto(source, source === 'camera' ? { quality: 100, maxWidth: 1000, maxHeight: 1000 } : { quality: 70 });
    if (!r.ok) {
      return; // the plugin's error callback is empty
    }
    imageData.current.push(r.value);
    rerender();
  }

  // :263-317 captureMedia() -> captureImageVideo()
  function captureMedia() {
    showActionSheet({
      title: 'Complaint Media',
      cssClass: 'cs-actionsheet',
      buttons: [
        { cssClass: 'sheet-m', text: 'Camera', icon: 'camera', handler: () => void pick('camera') },
        { cssClass: 'sheet-m1', text: 'Gallery', icon: 'image', handler: () => void pick('gallery') },
        { cssClass: 'cs-cancel', text: 'Cancel', role: 'cancel', icon: 'cancel', handler: () => {} },
      ],
    });
  }

  // :393-396 remove_image(i)
  function removeImage(i: number) {
    imageData.current.splice(i, 1);
    rerender();
  }

  // ---- template ----------------------------------------------------------------------------------------------
  // adjoining vertical margins collapse (CSS) but not in Yoga: only what exceeds the previous sibling's bottom margin is added
  const blocks: Block[] = [];
  const add = (key: string, render: Block['render']) => blocks.push({ key, render });
  const csInput = (
    key: string,
    o: {
      label: string;
      name: string;
      type?: 'text' | 'tel';
      maxLength?: number;
      textarea?: boolean;
      error?: boolean;
      validated?: boolean;
      last?: boolean;
      value: string;
      onChange: (s: string) => void;
    },
  ) =>
    add(key, ({ marginTop, marginBottom }) => (
      <IonInputItem
        key={key}
        testID={key}
        variant="csInput"
        floating
        label={o.label}
        requiredMark={o.validated}
        type={o.type}
        maxLength={o.maxLength}
        textarea={o.textarea}
        isLast={o.last}
        error={o.error}
        value={o.value}
        validation={ngClasses(o.name)}
        onBlur={() => touch(o.name)}
        onChangeText={o.onChange}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));

  // html:13 <h3>Customer Details</h3>
  add('h3-customer', ({ marginTop }) => <H3 key="h3-customer" label="Customer Details" marginTop={marginTop} />);
  // html:19-23. NOTE (parity): the `<span>*</span>` follows the label text with no space in Ionic; the kit's required star adds one.
  csInput('mobile_no', {
    label: 'Mobile',
    name: 'mobile_no',
    type: 'tel',
    maxLength: 10,
    validated: true,
    error: err('mobile_no'),
    value: mobileValue ?? '',
    onChange: s => {
      complaint.current.mobile_no = s;
      getCustomer(); // (input)="getCustomer()"
      rerender();
    },
  });
  // html:28-31
  csInput('first_name', {
    label: 'Customer Name',
    name: 'first_name',
    validated: true,
    error: err('first_name'),
    value: d.first_name ?? '',
    onChange: s => set('first_name', s),
  });
  // html:34-37. NOTE (parity): never in error (no validator, and `f.address` is undefined)
  csInput('address', { label: 'Address', name: 'address', textarea: true, value: d.address ?? '', onChange: s => set('address', s) });
  add('state', ({ marginTop, marginBottom }) => (
    <IonSelect
      key="state"
      testID="state"
      variant="csSelect"
      label="State"
      requiredMark
      error={err('state')}
      value={d.state}
      options={(stateList.current ?? []).map((row: any) => ({ value: row.state_name, label: row.state_name }))}
      onChange={v => {
        set('state', v);
        getDistrictList(complaintData.current.state); // (ngModelChange)
      }}
      itemStyle={{ marginTop, marginBottom }}
    />
  ));
  add('district', ({ marginTop, marginBottom }) => (
    <IonSelect
      key="district"
      testID="district"
      variant="csSelect"
      label="District"
      requiredMark
      error={err('district')}
      value={d.district}
      options={(districtList.current ?? []).map((row: any) => ({ value: row.district_name, label: row.district_name }))}
      onChange={v => set('district', v)}
      itemStyle={{ marginTop, marginBottom }}
    />
  ));
  csInput('city', { label: 'City', name: 'city', validated: true, error: err('city'), value: d.city ?? '', onChange: s => set('city', s) });
  // html:60. NOTE (parity): `(keypress)="MobileNumber($event)"` calls a method the class does not have (a console error in Ionic); typing is not filtered.
  csInput('pincode', {
    label: 'Pincode',
    name: 'pincode',
    type: 'tel',
    maxLength: 6,
    validated: true,
    error: err('pincode'),
    value: d.pincode ?? '',
    onChange: s => set('pincode', s),
  });
  csInput('nature_problem', {
    label: type == 'Service' ? 'Nature Problem' : 'Remark', // eslint-disable-line eqeqeq
    name: 'nature_problem',
    textarea: true,
    validated: true,
    last: true,
    error: err('nature_problem'),
    value: d.nature_problem ?? '',
    onChange: s => set('nature_problem', s),
  });

  const rendered: React.ReactNode[] = [];
  let prevMb = 0;
  blocks.forEach(b => {
    const isH3 = b.key === 'h3-customer';
    const mt = isH3 ? 0 : 16;
    const mb = isH3 ? R.h3.marginBottom : 16;
    rendered.push(b.render({ marginTop: Math.max(0, mt - prevMb), marginBottom: mb }));
    prevMb = mb;
  });

  const isService = type == 'Service'; // eslint-disable-line eqeqeq
  const images = imageData.current;
  const cameraGap = images.length % A.tilesPerRow !== 0 ? A.tileSpace : 0;
  return (
    <View style={styles.screen}>
      {/* html:1-8 `.main-header.remove` */}
      <Header
        mainHeader
        remove
        color="primary"
        title={type == 'Installation' ? 'New Request' : type == 'Service' ? 'New Service Request' : ''} // eslint-disable-line eqeqeq
      />
      <IonContent>
        <View style={styles.mainField}>
          <IonList style={styles.list}>
            <View>{rendered}</View>
          </IonList>
          {/* html:66-68 `.cs-heading1.pl0.pb10` (an empty box for Installation) */}
          <View style={styles.heading}>
            {isService ? (
              <Text style={[textStyle(A.headingFontSize, A.headingWeight, md.textColor, normalLineHeight(A.headingFontSize)), styles.headingText]}>
                Upload Image
              </Text>
            ) : null}
          </View>
          {/* html:71-103 `.add-new.padding0 > .uplode-image`. NOTE (parity): the video tile (`videoId`) never shows: videoId is never set. */}
          {isService ? (
            <View style={styles.tiles}>
              {images.map((pic, i) => (
                <View key={i} testID={`image-${i}`} style={styles.tile}>
                  <Image source={{ uri: pic }} style={styles.tileImage} resizeMode="stretch" />
                  <View style={styles.removeButton}>
                    <Pressable testID={`remove-image-${i}`} onPress={() => removeImage(i)}>
                      <MaterialIcon name="clear" size={A.removeButton.iconSize} color={A.removeButton.icon} />
                    </Pressable>
                  </View>
                </View>
              ))}
              <Pressable testID="capture-media" style={[styles.tile, { marginLeft: A.tile.marginHorizontal + cameraGap }]} onPress={captureMedia}>
                <View style={styles.cameraLabel}>
                  <MaterialIcon name="camera_alt" color={A.cameraIcon} />
                </View>
              </Pressable>
            </View>
          ) : null}
          {/* html:105-111 `.enquiry-btn.add-btns.mt20 > button.h40.green-color` */}
          <View style={styles.submitWrap}>
            <IonButton
              testID="submit"
              block
              background={A.submitBackground}
              style={styles.submit}
              labelStyle={styles.submitLabel}
              onPress={onSubmit}
            >
              Submit
            </IonButton>
          </View>
        </View>
      </IonContent>
    </View>
  );
}
