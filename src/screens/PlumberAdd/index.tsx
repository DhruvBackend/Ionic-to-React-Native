// Ported from: src/pages/plumber-add/plumber-add.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Text } from '../../components/ionic/IonText';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonCheckbox } from '../../components/ionic/IonChoice';
import { IonContent, type IonContentHandle } from '../../components/ionic/IonContent';
import { IonDatetime } from '../../components/ionic/IonDatetime';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonItem, IonList } from '../../components/ionic/IonList';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Header } from '../../components/ionic/IonNavbar';
import { IonSelect } from '../../components/ionic/IonSelect';
import { textStyle } from '../../components/ionic/text';
import { takePhoto } from '../../native';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { plumberAddMd as P } from '../../theme/ionicMdPlumberAdd';
import { registrationMd as R } from '../../theme/ionicMdLogin';
import { scssColors } from '../../theme';
import { showActionSheet, showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation: { popTo: (name: string) => void };
  route?: { params?: any };
}

// plumber-add.ts:108-114 / :253-259 keypress filters: a typed character that does not match is dropped (backspace always passes).
// NOTE (parity): Ionic only filters typed keys (paste is not filtered); a RN TextInput cannot tell them apart, so paste is filtered too.
const namecheck = (s: string) => s.replace(/[^A-Z+\-a-z ]/g, '');
const digits = (s: string) => s.replace(/[^0-9]/g, '');
// plumber-add.ts:116-119
const capsAdd = (s: string) => s.replace(/\b\w/g, l => l.toUpperCase());

// Angular validators (Validators.required / minLength / maxLength / pattern) on a control value.
const isEmpty = (v: any) => v === null || v === undefined || v.length === 0;
const lenInvalid = (v: any, n: number) => {
  if (isEmpty(v)) {
    return false; // minlength skips empty values
  }
  return String(v).length !== n;
};
const IFSC = /^[A-Z]{4}[0][A-Z0-9]{6}$/; // pattern="^[A-Z]{4}[0][A-Z0-9]{6}$" (html:208)

interface Block {
  key: string;
  mt: number;
  mb: number;
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

// html:164-166 `<img src=... *ngIf="data.document_image != ''">` in the flex-centred 180px box: natural size, `img { max-width: 100% }`.
function DocImage({ uri, boxW }: { uri: string; boxW: number }) {
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
  if (!natural) {
    return null;
  }
  const w = Math.min(natural.w, Math.max(boxW - 2 * P.upload.borderWidth, 0));
  return <Image testID="document-image" source={{ uri }} style={{ width: w, height: (natural.h * w) / natural.w }} />;
}

export default function PlumberAddScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const loader = useLoader();
  const params = route?.params ?? {};
  const [, setTick] = useState(0);
  const rerender = () => setTick(n => n + 1);
  const alive = useRef(true);
  const content = useRef<IonContentHandle>(null);

  // plumber-add.ts:22-36 fields
  const stateList = useRef<any>([]);
  const districtList = useRef<any>([]);
  const [submitted, setSubmitted] = useState(false); // f.submitted
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const edited = useRef<Record<string, boolean>>({}); // controls whose value was changed by the user
  const [uploadW, setUploadW] = useState(0);
  const dataRef = useRef<any>(null);
  const todayDate = useRef(new Date().toISOString().slice(0, 10)).current; // plumber-add.ts:57 (UTC date)
  const started = useRef(false);

  const set = (name: string, value: any) => {
    dataRef.current[name] = value;
    edited.current[name] = true;
    rerender();
  };

  // plumber-add.ts:82-90 getstatelist()
  function getStateList() {
    db.onGetRequestDataFromApi('app_master/getStates', db.rootUrl).then(
      (r: any) => {
        stateList.current = r?.states; // NOTE (parity): a null body throws inside Ionic's subscribe; nothing else happens
        if (alive.current) {
          rerender();
        }
      },
      () => {},
    );
  }

  // plumber-add.ts:92-101 getDistrictList(state_name)
  function getDistrictList(stateName: any) {
    db.onPostRequestDataFromApi({ state_name: stateName }, 'app_master/getDistrict', db.rootUrl).then(
      (r: any) => {
        districtList.current = r?.districts;
        if (alive.current) {
          rerender();
        }
      },
      () => {},
    );
  }

  // plumber-add.ts:51-69 constructor. NOTE (parity): `navParams.data.data` REPLACES `data` and is mutated in place, as in Ionic.
  if (dataRef.current === null) {
    const data: any = {};
    data.mobile_no = params.mobile_no;
    data.type = 'Plumber';
    data.sales_boy_id = db.userStorageData?.id;
    data.profile = '';
    data.document_image = '';
    data.certificate_image = '';
    data.status = 'Pending';
    dataRef.current = data;
    if (params.data) {
      const d = params.data;
      dataRef.current = d;
      d.type = params.data.type;
      d.status = params.data.status;
      d.karigar_edit_id = d.id;
      d.karigar_edit_id_doc = d.id;
    }
  }

  // plumber-add.ts:51 getstatelist() (constructor) and :72-79 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    if (!started.current) {
      started.current = true;
      getStateList();
      if (dataRef.current.state) {
        getDistrictList(dataRef.current.state);
      }
    }
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = dataRef.current;
  const type = data.type;
  const isPlumber = type == 'Plumber'; // eslint-disable-line eqeqeq
  const plumberOrBoy = type == 'Plumber' || type == 'Sales_Boy'; // eslint-disable-line eqeqeq

  // ---- Angular control validity (ngModel + required / minlength / maxlength / pattern) ----
  const controls: Record<string, boolean> = {};
  controls.first_name = isEmpty(data.first_name);
  controls.mobile_no = isEmpty(data.mobile_no) || lenInvalid(data.mobile_no, 10);
  if (plumberOrBoy) {
    controls.dealer_mobile = lenInvalid(data.dealer_mobile, 10);
  }
  controls.state = isEmpty(data.state);
  controls.district = isEmpty(data.district);
  controls.city = isEmpty(data.city);
  controls.pincode = lenInvalid(data.pincode, 6);
  if (isPlumber) {
    controls.permanent_pincode = lenInvalid(data.permanent_pincode, 6);
  }
  if (plumberOrBoy) {
    if (data.document_type == 'AadhaarCard') { // eslint-disable-line eqeqeq
      controls.document_no = lenInvalid(data.document_no, 12);
    }
    controls.ifsc_code = !isEmpty(data.ifsc_code) && !IFSC.test(data.ifsc_code);
  }
  const invalid = (name: string) => !!controls[name];
  const formValid = Object.values(controls).every(v => !v);
  const err = (name: string) => submitted && invalid(name);
  // NOTE (parity): the ng-valid / ng-invalid classes Ionic puts on a pre-filled item (edit mode, or the mobile number) stay at the state of
  // the still-empty control (ngModel writes the value asynchronously) until the user changes that control (measured on Registration).
  const ngClasses = (name: string) => {
    const stale = !edited.current[name] && !isEmpty(data[name]);
    const bad = stale ? true : invalid(name);
    return { valid: !bad, invalid: bad, touched: !!touched[name] };
  };
  const touch = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

  // plumber-add.ts:347-350 scrollUp()
  function scrollUp() {
    content.current?.scrollTo({ y: 0, animated: true });
  }

  // plumber-add.ts:352-388 submit()
  async function submit() {
    const d = dataRef.current;
    if (d.type == 'Customer') { // eslint-disable-line eqeqeq
      d.status = 'Verified';
    }
    d.karigar_edit_id = '';
    if (params.data) {
      d.karigar_edit_id = d.id;
    }
    d.flag = 1;
    loader.show(); // presentLoading(): "Please wait...", dismissOnPageChange
    let r: any;
    try {
      r = await db.onPostRequestDataFromApi({ karigar: d }, 'app_karigar/addKarigar', db.rootUrl);
    } catch {
      // NOTE (parity): no error callback in Ionic: after an HTTP error the "Please wait..." loader stays up forever.
      return;
    }
    loader.hide(); // before anything is read from the response
    if (!alive.current) {
      return;
    }
    // NOTE (parity): `r['id']` of a null body throws a TypeError in Ionic (nothing else happens).
    if (r === null || r === undefined) {
      return;
    }
    if (r.status == 'SUCCESS') { // eslint-disable-line eqeqeq
      // NOTE (parity): popTo(PlumberListPage): the list is the page below in the stack.
      navigation.popTo('PlumberList');
    } else if (r.status == 'EXIST') { // eslint-disable-line eqeqeq
      showAlert({ title: 'Alert!', cssClass: 'action-close', subTitle: 'Already Registered!', buttons: ['OK'] });
    }
  }

  // html:19 (ngSubmit)="f.form.valid ? submit() : scrollUp()"
  function onSubmit() {
    setSubmitted(true);
    if (formValid) {
      submit();
    } else {
      scrollUp();
    }
  }

  // plumber-add.ts:207-250 onUploadChange() (html:162 `(click)="onUploadChange()"`) + takeDocPhoto / getDocImage
  async function pickDoc(source: 'camera' | 'gallery') {
    const r = await takePhoto(source, source === 'camera' ? { quality: 70, maxWidth: 500, maxHeight: 400 } : { quality: 70 });
    if (!r.ok) {
      return; // the plugin's error callback is empty
    }
    // NOTE (parity): `this.flag = false` is never read.
    dataRef.current.karigar_edit_id_doc = '';
    dataRef.current.document_image = r.value;
    rerender();
  }
  function onUploadChange() {
    showActionSheet({
      title: ' Upload File',
      cssClass: 'cs-actionsheet',
      buttons: [
        { cssClass: 'sheet-m', text: 'Camera', icon: 'camera', handler: () => { pickDoc('camera'); } },
        { cssClass: 'sheet-m1', text: 'Gallery', icon: 'image', handler: () => { pickDoc('gallery'); } },
        {
          cssClass: 'cs-cancel',
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            dataRef.current.karigar_edit_id_doc = dataRef.current.id;
          },
        },
      ],
    });
  }

  // plumber-add.ts:304-322 onCheckShippingAddressSameAsAddressHandler(event)
  function onSameAddress(checked: boolean) {
    const d = dataRef.current;
    if (checked) {
      d.permanent_state = d.state;
      d.permanent_pincode = d.pincode;
      d.permanent_city = d.city;
      d.permanent_address = d.address;
      getDistrictList(d.permanent_state);
      d.parmanent_district = d.district;
    } else {
      d.permanent_state = '';
      d.parmanent_district = '';
      d.permanent_pincode = '';
      d.permanent_city = '';
      d.permanent_address = '';
    }
    rerender();
  }

  // ---- template ----------------------------------------------------------------------------------------------
  const blocks: Block[] = [];
  const add = (key: string, mt: number, mb: number, render: Block['render']) => blocks.push({ key, mt, mb, render });
  const h3 = (key: string, label: string, mt: number) =>
    add(key, mt, R.h3.marginBottom, ({ marginTop }) => <H3 key={key} label={label} marginTop={marginTop} />);
  const eror = (key: string) =>
    add(key, R.eror.marginVertical, R.eror.marginVertical, ({ marginTop, marginBottom }) => (
      <View key={key} testID={key}>
        <Text style={[textStyle(R.eror.fontSize, 400, scssColors.danger, normalLineHeight(R.eror.fontSize)), styles.erorText, { marginTop, marginBottom }]}>
          {t('Enter 10 Digits')}
        </Text>
      </View>
    ));
  const csInput = (
    key: string,
    o: {
      label: string;
      name: string;
      type?: 'text' | 'tel' | 'number';
      maxLength?: number;
      required?: boolean;
      filter?: (s: string) => string;
      onChange?: (s: string) => string;
      last?: boolean;
      mb?: number;
      error?: boolean;
    },
  ) =>
    add(key, 16, o.mb ?? 16, ({ marginTop, marginBottom }) => (
      <IonInputItem
        key={key}
        testID={key}
        variant="csInput"
        floating
        label={o.label}
        requiredMark={o.required}
        type={o.type}
        maxLength={o.maxLength}
        isLast={o.last}
        error={o.error}
        value={data[o.name] ?? ''}
        validation={ngClasses(o.name)}
        onBlur={() => touch(o.name)}
        onChangeText={s => {
          // `[(ngModel)]` writes the filtered text (an untouched field never gets a key in `data`)
          const next = o.onChange ? o.onChange(o.filter ? o.filter(s) : s) : o.filter ? o.filter(s) : s;
          set(o.name, next);
        }}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));
  const csSelect = (
    key: string,
    o: { label: string; name: string; required?: boolean; options: { value: any; label: string }[]; error?: boolean; onChange?: (v: any) => void },
  ) =>
    add(key, 16, 16, ({ marginTop, marginBottom }) => (
      <IonSelect
        key={key}
        testID={key}
        variant="csSelect"
        label={o.label}
        requiredMark={o.required}
        error={o.error}
        value={data[o.name]}
        options={o.options}
        onChange={v => {
          set(o.name, v);
          o.onChange?.(v);
        }}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));
  const stateOptions = (stateList.current ?? []).map((row: any) => ({ value: row.state_name, label: row.state_name }));
  const districtOptions = (districtList.current ?? []).map((row: any) => ({ value: row.district_name, label: row.district_name }));

  // Basic information (html:16-59)
  h3('h3-basic', t('Basic information'), 0);
  csInput('first_name', { label: t('Name'), name: 'first_name', required: true, filter: namecheck, error: err('first_name') });
  // NOTE (parity): type="text" with maxlength 10 and the digit-only keypress filter (html:36).
  csInput('mobile_no', { label: t('Mobile No.'), name: 'mobile_no', required: true, maxLength: 10, filter: digits, error: err('mobile_no'), last: !plumberOrBoy });
  if (plumberOrBoy) {
    add('dob', 0, 0, ({ marginTop, marginBottom }) => (
      <IonDatetime
        key="dob"
        testID="dob"
        variant="csDate"
        label={t('Date of Birth')}
        displayFormat="DD/MM/YYYY"
        max={todayDate}
        value={data.dob}
        onChange={iso => set('dob', iso)}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));
    csInput('dealer_contact_person', { label: t('Dealer Name'), name: 'dealer_contact_person', filter: namecheck });
    // NOTE (parity): the `error` class of the wrapper div (html:51) has no rule: only the "Enter 10 Digits" text shows.
    const bad = submitted && invalid('dealer_mobile');
    csInput('dealer_mobile', {
      label: `${t('Dealer Mobile No')}.`,
      name: 'dealer_mobile',
      type: 'tel',
      maxLength: 10,
      filter: digits,
      mb: 0,
      last: !bad,
    });
    if (bad) {
      eror('dealer_mobile-error');
    }
  }

  // Address information (html:61-96)
  h3('h3-address', t('Address information'), R.helperMargin10);
  // NOTE (parity): never in error (no validator on `address`, and `f.address` is undefined).
  csInput('address', { label: t('Address'), name: 'address', onChange: capsAdd });
  csSelect('state', {
    label: t('State'),
    name: 'state',
    required: true,
    options: stateOptions,
    error: err('state'),
    onChange: () => getDistrictList(dataRef.current.state), // (ngModelChange)
  });
  csSelect('district', { label: t('District'), name: 'district', required: true, options: districtOptions, error: err('district') });
  csInput('city', { label: t('City'), name: 'city', required: true, error: err('city') });
  // html:92 `Pincode <span></span>`: an empty span, no star.
  csInput('pincode', { label: t('Pincode'), name: 'pincode', type: 'tel', maxLength: 6, filter: digits, mb: 32, last: true, error: err('pincode') });

  // Permanent address (html:100-146, Plumber only)
  if (isPlumber) {
    add('same-address', 0, 0, () => (
      <IonItem
        key="same-address"
        testID="same-address-item"
        style={styles.checkItem}
        innerStyle={styles.checkItemInner}
        label={t('Same as Working Address')}
        labelStyle={styles.checkLabel}
      >
        <IonCheckbox testID="same-address" color="dark" onChange={e => onSameAddress(e.checked)} />
      </IonItem>
    ));
    h3('h3-permanent', t('Permanent Address'), 0);
    csInput('permanent_address', { label: t('Address'), name: 'permanent_address' });
    // NOTE (parity): `(ngModelChange)="getDistrictList1(...)"` calls a method the class does not have (a console error in Ionic): only the value is stored.
    csSelect('permanent_state', { label: t('State'), name: 'permanent_state', options: stateOptions });
    // NOTE (parity): the district options are the SAME `district_list` as the working address (it follows the last getDistrictList call).
    csSelect('parmanent_district', { label: t('District'), name: 'parmanent_district', options: districtOptions });
    csInput('permanent_city', { label: t('City'), name: 'permanent_city' });
    csInput('permanent_pincode', { label: t('Pincode'), name: 'permanent_pincode', type: 'tel', maxLength: 6, filter: digits, mb: 32, last: true, error: err('permanent_pincode') });
  }

  // Document information (html:149-191) and bank detail (html:193-224)
  if (plumberOrBoy) {
    h3('h3-document', t('Document Information'), 0);
    const docType = data.document_type;
    csSelect('document_type', {
      label: t('Select Document'),
      name: 'document_type',
      options: [
        { value: 'AadhaarCard', label: t('Aadhaar Card') },
        { value: 'PanCard', label: t('Pan Card') },
        { value: 'VoterCard', label: t('Voter Card') },
        { value: 'DrivingLicense', label: t('Driving License') },
      ],
    });
    add('upload-document', 0, 0, () => (
      <Pressable key="upload-document" testID="upload-document" style={styles.upload} onPress={onUploadChange} onLayout={e => setUploadW(e.nativeEvent.layout.width)}>
        {data.document_image == '' ? ( // eslint-disable-line eqeqeq
          <View testID="upload-document-prompt" style={styles.uploadPrompt}>
            <MaterialIcon name="add_circle" size={P.uploadText.iconSize} color={P.uploadText.color} />
            <Text style={[textStyle(P.uploadText.fontSize, 400, P.uploadText.color, P.uploadText.lineHeight), styles.uploadP]}>{t('Upload Document')}</Text>
          </View>
        ) : null}
        {data.document_image != '' ? ( // eslint-disable-line eqeqeq
          <DocImage uri={data.karigar_edit_id_doc ? db.upload_url3 + data.document_image : data.document_image} boxW={uploadW} />
        ) : null}
      </Pressable>
    ));
    if (docType == 'AadhaarCard') { // eslint-disable-line eqeqeq
      csInput('document_no', { label: t('Aadhaar Number'), name: 'document_no', type: 'tel', maxLength: 12, last: true, error: err('document_no') });
    } else if (docType == 'PanCard') { // eslint-disable-line eqeqeq
      csInput('document_no', { label: t('Pan Card Number'), name: 'document_no', last: true });
    } else if (docType == 'VoterCard') { // eslint-disable-line eqeqeq
      csInput('document_no', { label: t('Voter Card Number'), name: 'document_no', last: true });
    } else if (docType == 'DrivingLicense') { // eslint-disable-line eqeqeq
      csInput('document_no', { label: t('Driving License Number'), name: 'document_no', last: true });
    }

    h3('h3-bank', t('Bank Detail'), R.helperMargin10);
    csInput('bank_name', { label: t('Bank Name'), name: 'bank_name' });
    csInput('account_number', { label: t('Account Number'), name: 'account_number', type: 'number' });
    csInput('ifsc_code', { label: t('IFSC Code'), name: 'ifsc_code', error: err('ifsc_code') });
    csInput('account_holder_name', { label: t('Account Holder Name'), name: 'account_holder_name', last: !!data.id });
    if (!data.id) {
      csInput('referral_by_code', { label: t('Referral Code'), name: 'referral_by_code', last: true });
    }
  }

  const rendered: React.ReactNode[] = [];
  let prevMb = 0;
  blocks.forEach(b => {
    // adjoining vertical margins collapse (CSS) but not in Yoga: only what exceeds the previous sibling's bottom margin is added
    rendered.push(b.render({ marginTop: Math.max(0, b.mt - prevMb), marginBottom: b.mb }));
    prevMb = b.mb;
  });

  return (
    <View style={styles.screen}>
      <Header mainHeader remove color="primary" title="Add New Plumber" />
      <IonContent ref={content}>
        <View style={styles.mainField}>
          <IonList style={styles.list}>
            <View>{rendered}</View>
          </IonList>
          <IonButton testID="plumber-add-submit" csBtn style={styles.button} onPress={onSubmit}>
            {data.id ? t('Update') : t('Submit')}
          </IonButton>
        </View>
      </IonContent>
    </View>
  );
}
