// Ported from: src/pages/edit-profile/edit-profile.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Text } from '../../components/ionic/IonText';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonCheckbox } from '../../components/ionic/IonChoice';
import { IonContent } from '../../components/ionic/IonContent';
import { IonDatetime } from '../../components/ionic/IonDatetime';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonItem, IonList } from '../../components/ionic/IonList';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Header } from '../../components/ionic/IonNavbar';
import { IonSelect } from '../../components/ionic/IonSelect';
import { textStyle } from '../../components/ionic/text';
import { plumberAddMd as P } from '../../theme/ionicMdPlumberAdd';
import { registrationMd as R } from '../../theme/ionicMdLogin';
import { takePhoto } from '../../native';
import { showActionSheet, showAlert } from '../../ui/overlays';
import { styles } from './styles';

interface Props {
  navigation: { reset: (state: object) => void; goBack: () => void };
  route?: { params?: any };
}

// edit-profile.ts:238-245 / :228-235 keypress filters: a typed character that does not match is dropped (backspace always passes).
// NOTE (parity): Ionic only filters typed keys (paste is not filtered); a RN TextInput cannot tell them apart, so paste is filtered too.
const namecheck = (s: string) => s.replace(/[^A-Z+\-a-z ]/g, '');
const digits = (s: string) => s.replace(/[^0-9]/g, '');
// edit-profile.ts:222-225
const capsAdd = (s: string) => s.replace(/\b\w/g, l => l.toUpperCase());

// Angular validators (Validators.required / minLength / maxLength) on a control value.
const isEmpty = (v: any) => v === null || v === undefined || v.length === 0;
const lenInvalid = (v: any, n: number) => {
  if (isEmpty(v)) {
    return false; // minlength skips empty values
  }
  return String(v).length !== n;
};

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

// html:85 `<img [src]=data.document_image alt="">` in the flex-centred 180px box: natural size, `img { max-width: 100% }`.
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

export default function EditProfileScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const params = route?.params ?? {};
  const [, setTick] = useState(0);
  const rerender = () => setTick(n => n + 1);
  const alive = useRef(true);

  // edit-profile.ts:22-29 fields
  const stateList = useRef<any>(undefined);
  const districtList = useRef<any>(undefined);
  const districtList1 = useRef<any>(undefined);
  const [submitted, setSubmitted] = useState(false); // f.submitted
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const edited = useRef<Record<string, boolean>>({}); // controls whose value was changed by the user
  const [uploadW, setUploadW] = useState(0);
  const dataRef = useRef<any>(null);
  const started = useRef(false);
  const locked = db.userStorageData?.type === 'Sales_Executive'; // edit-profile.ts:41

  const set = (name: string, value: any) => {
    dataRef.current[name] = value;
    edited.current[name] = true;
    rerender();
  };

  // edit-profile.ts:67-75 getstatelist()
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

  // edit-profile.ts:78-87 getDistrictList(state_name)
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

  // edit-profile.ts:89-98 getDistrictList1(state_name)
  function getDistrictList1(stateName: any) {
    db.onPostRequestDataFromApi({ state_name: stateName }, 'app_master/getDistrict', db.rootUrl).then(
      (r: any) => {
        districtList1.current = r?.districts;
        if (alive.current) {
          rerender();
        }
      },
      () => {},
    );
  }

  // edit-profile.ts:38 `this.data = this.navParams.get('detail')`; :49 the SafeResourceUrl wrapper.
  // NOTE (parity): `detail` is edited in place (as in Ionic); without it the constructor throws on `this.data.document_image`: nothing renders.
  if (dataRef.current === null && params.detail) {
    dataRef.current = params.detail;
    if (!locked) {
      // NOTE (parity): bypassSecurityTrustResourceUrl() returns an object, so `data.document_image == ''` is never true (the "Upload Document"
      // prompt never shows, even when there is no picture) and JSON.stringify sends {changingThisBreaksApplicationSecurity: <value>}.
      dataRef.current.document_image = { changingThisBreaksApplicationSecurity: dataRef.current.document_image };
    }
  }

  // edit-profile.ts:41-60 constructor
  useEffect(() => {
    alive.current = true;
    if (!started.current && dataRef.current) {
      started.current = true;
      if (locked) {
        // NOTE (parity): `return` after the alert: no requests, no today_date, document_image stays a plain string.
        showAlert({
          title: 'Profile Locked',
          message: 'Your profile can only be updated from the admin panel.',
          buttons: [{ text: 'OK', handler: () => navigation.goBack() }],
        });
      } else {
        getStateList();
        getDistrictList(dataRef.current.state);
        getDistrictList1(dataRef.current.permanent_state);
      }
    }
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayDate = useRef(new Date().toISOString().slice(0, 10)).current; // edit-profile.ts:56 (UTC date)

  if (dataRef.current === null) {
    return <View style={styles.screen} />;
  }
  const data = dataRef.current;
  const type = data.type;
  const isPlumber = type == 'Plumber'; // eslint-disable-line eqeqeq
  const india = data.country == 'India'; // eslint-disable-line eqeqeq

  // ---- Angular control validity (ngModel + required / minlength / maxlength); a disabled control is not validated ----
  const controls: Record<string, boolean> = {};
  controls.first_name = isEmpty(data.first_name);
  if (!isPlumber) {
    // html:28 `[disabled]="data.type == 'Plumber' ? true : falses"`
    controls.mobile_no = isEmpty(data.mobile_no) || lenInvalid(data.mobile_no, 10);
  }
  if (isPlumber) {
    if (india && data.document_type == 'Adharcard') { // eslint-disable-line eqeqeq
      controls.document_no = isEmpty(data.document_no) || lenInvalid(data.document_no, 12);
    } else if (india && data.document_type == 'PanCard') { // eslint-disable-line eqeqeq
      controls.document_no = isEmpty(data.document_no);
    } else if (data.document_type == 'VoterCard') { // eslint-disable-line eqeqeq
      controls.document_no = isEmpty(data.document_no);
    }
  }
  controls.address = isEmpty(data.address);
  controls.state = isEmpty(data.state);
  controls.district = isEmpty(data.district);
  controls.pincode = isEmpty(data.pincode) || lenInvalid(data.pincode, 6);
  if (isPlumber) {
    controls.permanent_address = isEmpty(data.permanent_address);
    controls.permanent_state = isEmpty(data.permanent_state);
    controls.parmanent_district = isEmpty(data.parmanent_district);
    controls.permanent_pincode = isEmpty(data.permanent_pincode) || lenInvalid(data.permanent_pincode, 6);
  }
  const invalid = (name: string) => !!controls[name];
  const formValid = Object.values(controls).every(v => !v);
  const err = (name: string) => submitted && invalid(name);
  // NOTE (parity): the ng-valid / ng-invalid classes Ionic puts on a pre-filled item stay at the state of the still-empty control (ngModel
  // writes the value asynchronously) until the user changes that control (measured on Registration).
  const ngClasses = (name: string) => {
    const stale = !edited.current[name] && !isEmpty(data[name]);
    const bad = stale ? true : invalid(name);
    return { valid: !bad, invalid: bad, touched: !!touched[name] };
  };
  const touch = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

  // edit-profile.ts:174-197 submit()
  // NOTE (parity): no loader. The success callback ignores the answer (any 200 body, even null, shows "Success!"); an HTTP error shows the
  // same alert and opens Tabs on index '4'.
  function submit() {
    const d = dataRef.current;
    d.karigar_edit_id = d.id;
    db.onPostRequestDataFromApi({ karigar: d }, 'app_karigar/addKarigar', db.rootUrl).then(
      () => {
        showAlert({ title: 'Success!', cssClass: 'action-close', subTitle: 'Profile Updated Successfully!', buttons: ['OK'] });
        navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] }); // setRoot(TabsPage,{index:'0'})
      },
      () => {
        showAlert({ title: 'Success!', cssClass: 'action-close', subTitle: 'Profile Updated Successfully!', buttons: ['OK'] });
        navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { index: '4' } }] }); // setRoot(TabsPage,{index:'4'})
      },
    );
  }

  // html:8 (ngSubmit)="f.form.valid && submit()"
  function onSubmit() {
    setSubmitted(true);
    if (formValid) {
      submit();
    }
  }

  // edit-profile.ts:99-155 onUploadChange() (html:80 `(click)="onUploadChange()"`) + takeDocPhoto / getDocImage
  async function pickDoc(source: 'camera' | 'gallery') {
    const r = await takePhoto(source, source === 'camera' ? { quality: 70, maxWidth: 500, maxHeight: 400 } : { quality: 70 });
    if (!r.ok) {
      return; // the plugin's error callback is empty
    }
    // NOTE (parity): `this.flag = false` only feeds `[ngClass]="{'error': f.submitted && flag}"` on .upload-document, a class no rule styles here.
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
        { cssClass: 'cs-cancel', text: 'Cancel', role: 'cancel', handler: () => {} },
      ],
    });
  }

  // edit-profile.ts:199-220 onCheckShippingAddressSameAsAddressHandler(event)
  function onSameAddress(checked: boolean) {
    const d = dataRef.current;
    if (checked) {
      d.permanent_state = d.state;
      d.parmanent_district = d.district;
      d.permanent_pincode = d.pincode;
      d.permanent_city = d.city;
      d.permanent_address = d.address;
      getDistrictList1(d.permanent_state);
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
  const csInput = (
    key: string,
    o: {
      label: string;
      name: string;
      type?: 'text' | 'tel';
      maxLength?: number;
      filter?: (s: string) => string;
      onChange?: (s: string) => string;
      last?: boolean;
      mb?: number;
      error?: boolean;
      disabled?: boolean;
    },
  ) =>
    add(key, 16, o.mb ?? 16, ({ marginTop, marginBottom }) => (
      <IonInputItem
        key={key}
        testID={key}
        variant="csInput"
        floating
        label={o.label}
        type={o.type}
        maxLength={o.maxLength}
        isLast={o.last}
        error={o.error}
        disabled={o.disabled}
        value={data[o.name] ?? ''}
        // a disabled control has neither ng-valid nor ng-invalid
        validation={o.disabled ? {} : ngClasses(o.name)}
        onBlur={() => touch(o.name)}
        onChangeText={s => {
          // `[(ngModel)]` writes the filtered text
          const next = o.onChange ? o.onChange(o.filter ? o.filter(s) : s) : o.filter ? o.filter(s) : s;
          set(o.name, next);
        }}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));
  const csSelect = (
    key: string,
    o: { label: string; name: string; options: { value: any; label: string }[]; error?: boolean; onChange?: (v: any) => void },
  ) =>
    add(key, 16, 16, ({ marginTop, marginBottom }) => (
      <IonSelect
        key={key}
        testID={key}
        variant="csSelect"
        label={o.label}
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
  const stateOptions = (Array.isArray(stateList.current) ? stateList.current : []).map((row: any) => ({ value: `${row.state_name}`, label: row.state_name }));
  const districtOptions = (Array.isArray(districtList.current) ? districtList.current : []).map((row: any) => ({ value: `${row.district_name}`, label: row.district_name }));
  const districtOptions1 = (Array.isArray(districtList1.current) ? districtList1.current : []).map((row: any) => ({ value: row.district_name, label: row.district_name }));

  // Basic information (html:9-60)
  h3('h3-basic', t('Basic information'), 0);
  csInput('first_name', { label: t('Name'), name: 'first_name', filter: namecheck, error: err('first_name') });
  csInput('mobile_no', {
    label: t('Mobile No.'),
    name: 'mobile_no',
    type: 'tel',
    maxLength: 10,
    filter: digits,
    error: err('mobile_no'),
    disabled: isPlumber,
    last: !isPlumber,
  });
  if (isPlumber) {
    add('dob', 0, 0, ({ marginTop, marginBottom }) => (
      <IonDatetime
        key="dob"
        testID="dob"
        variant="csDate"
        label={t('Date of Birth')}
        displayFormat="DD/MM/YYYY"
        max={locked ? undefined : todayDate}
        value={data.dob}
        onChange={iso => set('dob', iso)}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));
    // html:38-57: `[readonly]="true" disabled` (a static `disabled` attribute is true for ion-input)
    csInput('sales_boy_name', { label: t('Seller Name'), name: 'sales_boy_name', disabled: true });
    csInput('sales_boy_mobile_no', { label: t('Seller Mobile No'), name: 'sales_boy_mobile_no', type: 'tel', maxLength: 10, disabled: true });
    csInput('dealer_contact_person', { label: t('Dealer Name'), name: 'dealer_contact_person', disabled: true });
    csInput('dealer_mobile', { label: t('Dealer Mobile No'), name: 'dealer_mobile', type: 'tel', maxLength: 10, disabled: true, last: true });
  }

  // Document information (html:62-117, Plumber only)
  if (isPlumber) {
    h3('h3-document', t('Document Information'), R.helperMargin10);
    // NOTE (parity): the select is not required and Ionic's own `name="document_type\t"` (a tab) is harmless.
    const docOptions: { value: any; label: string }[] = [];
    if (india) {
      docOptions.push({ value: 'Adharcard', label: t('Aadhaar Card') }, { value: 'PanCard', label: t('Pan Card') });
    }
    docOptions.push({ value: 'VoterCard', label: t('Voter Card') });
    if (data.country == 'Nepal') { // eslint-disable-line eqeqeq
      docOptions.push({ value: 'CitizenshipCard', label: t('Citizenship Card') });
    }
    docOptions.push({ value: 'DrivingLicense', label: t('Driving License') });
    csSelect('document_type', { label: t('Select Document*'), name: 'document_type', options: docOptions });
    const di = data.document_image;
    const diUri = typeof di === 'string' ? di : di?.changingThisBreaksApplicationSecurity;
    const showImage = di != '' && typeof diUri === 'string' && diUri !== ''; // eslint-disable-line eqeqeq
    add('upload-document', 0, 0, () => (
      <Pressable key="upload-document" testID="upload-document" style={styles.upload} onPress={onUploadChange} onLayout={e => setUploadW(e.nativeEvent.layout.width)}>
        {di == '' ? ( // eslint-disable-line eqeqeq
          <View testID="upload-document-prompt" style={styles.uploadPrompt}>
            <MaterialIcon name="add_circle" size={P.uploadText.iconSize} color={P.uploadText.color} />
            <Text style={[textStyle(P.uploadText.fontSize, 400, P.uploadText.color, P.uploadText.lineHeight), styles.uploadP]}>{t('Upload Document')}</Text>
          </View>
        ) : null}
        {showImage ? <DocImage uri={diUri} boxW={uploadW} /> : null}
      </Pressable>
    ));
    if (india && data.document_type == 'Adharcard') { // eslint-disable-line eqeqeq
      csInput('document_no', { label: t('Aadhaar Number*'), name: 'document_no', type: 'tel', maxLength: 12, last: true, error: err('document_no') });
    } else if (india && data.document_type == 'PanCard') { // eslint-disable-line eqeqeq
      csInput('document_no', { label: t('Pan Card Number'), name: 'document_no', last: true, error: err('document_no') });
    } else if (data.document_type == 'VoterCard') { // eslint-disable-line eqeqeq
      csInput('document_no', { label: t('Voter Card Number'), name: 'document_no', last: true, error: err('document_no') });
    } else if (data.document_type == 'CitizenshipCard') { // eslint-disable-line eqeqeq
      csInput('document_no', { label: t('Citizenship Card Number'), name: 'document_no', last: true });
    } else if (data.document_type == 'DrivingLicense') { // eslint-disable-line eqeqeq
      csInput('document_no', { label: t('Driving License Number'), name: 'document_no', last: true });
    }
  }

  // Address (html:119-155)
  if (type == 'Customer') { // eslint-disable-line eqeqeq
    h3('h3-address', t('Address information'), R.helperMargin10);
  }
  if (isPlumber) {
    h3('h3-working', t('Working Address'), R.helperMargin10);
  }
  csInput('address', { label: t('Street'), name: 'address', onChange: capsAdd, error: err('address') });
  csSelect('state', {
    label: t('State'),
    name: 'state',
    options: stateOptions,
    error: err('state'),
    onChange: () => getDistrictList(dataRef.current.state), // (ngModelChange)
  });
  // NOTE (parity): html:139 the district item's error class reads `state?.invalid` (not the district's own validity).
  csSelect('district', { label: t('District'), name: 'district', options: districtOptions, error: err('state') });
  csInput('city', { label: t('City'), name: 'city' });
  csInput('pincode', { label: t('Pincode'), name: 'pincode', type: 'tel', maxLength: 6, filter: digits, mb: 32, last: true, error: err('pincode') });

  // Permanent address (html:157-206, Plumber only)
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
    // NOTE (parity): `(ngModelChange)="data.permanent_address"` is an expression with no effect.
    csInput('permanent_address', { label: t('Street'), name: 'permanent_address', error: err('permanent_address') });
    csSelect('permanent_state', {
      label: t('State'),
      name: 'permanent_state',
      options: stateOptions,
      error: err('permanent_state'),
      onChange: () => getDistrictList1(dataRef.current.permanent_state),
    });
    // NOTE (parity): html:187 the district item's error class reads `permanent_state?.invalid`.
    csSelect('parmanent_district', { label: t('District'), name: 'parmanent_district', options: districtOptions1, error: err('permanent_state') });
    csInput('permanent_city', { label: t('City'), name: 'permanent_city' });
    csInput('permanent_pincode', { label: t('Pincode'), name: 'permanent_pincode', type: 'tel', maxLength: 6, filter: digits, mb: 32, last: true, error: err('permanent_pincode') });
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
      <Header mainHeader remove title={t('Edit Profile')} />
      <IonContent>
        <View style={styles.mainField}>
          <IonList style={styles.list}>
            <View>{rendered}</View>
          </IonList>
          <IonButton testID="edit-profile-submit" reBtn onPress={onSubmit}>
            {t('Update')}
          </IonButton>
        </View>
      </IonContent>
    </View>
  );
}
