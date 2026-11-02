// Ported from: src/pages/login-section/registration/registration.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { session } from '../../auth/session';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent, type IonContentHandle } from '../../components/ionic/IonContent';
import { IonDatetime } from '../../components/ionic/IonDatetime';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonList } from '../../components/ionic/IonList';
import { Header } from '../../components/ionic/IonNavbar';
import { IonSelect } from '../../components/ionic/IonSelect';
import { IonicSelectable } from '../../components/ionic/IonicSelectable';
import { textStyle } from '../../components/ionic/text';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { registrationMd as R } from '../../theme/ionicMdLogin';
import { scssColors } from '../../theme';
import { showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: any };
}

// registration.ts:253-256 / :446-451 keypress filters: a typed character that does not match is dropped (backspace always passes).
// NOTE (parity): Ionic only filters typed keys (paste is not filtered); a RN TextInput cannot tell them apart, so paste is filtered too.
const namecheck = (s: string) => s.replace(/[^A-Z+\-a-z ]/g, '');
const digits = (s: string) => s.replace(/[^0-9]/g, '');
// registration.ts:259-262
const capsAdd = (s: string) => s.replace(/\b\w/g, l => l.toUpperCase());

// Angular validators (Validators.required / minLength / maxLength) on a control value.
const isEmpty = (v: any) => v === null || v === undefined || v.length === 0;
const lenInvalid = (v: any, n: number) => {
  if (isEmpty(v)) {
    return false; // minlength skips empty values; maxlength of nothing is 0
  }
  const len = String(v).length;
  return len < n || len > n;
};

interface Block {
  key: string;
  mt: number;
  mb: number;
  render: (margins: { marginTop: number; marginBottom: number }) => React.ReactNode;
}

// `.main-field h3 { width: fit-content; position: relative }` + `&:after { width: 107%; bottom: -3px; height: 3px }`.
// NOTE (parity): the underline is 107% of the heading TEXT width. A percentage width on an absolute child of a shrink-wrapped
// View is resolved against the full row on Android, so the text width is measured and the 107% is computed from it.
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

export default function RegistrationScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const loader = useLoader();
  const params = route?.params ?? {};
  const [, setTick] = useState(0);
  const rerender = () => setTick(n => n + 1);
  const alive = useRef(true);
  const content = useRef<IonContentHandle>(null);

  // registration.ts:17-33 fields
  const stateList = useRef<any>([]);
  const districtList = useRef<any>([]);
  const salesExecutives = useRef<any[]>([]);
  const salesUsers = useRef<any>([]);
  const filter = useRef<any>({});
  const [submitted, setSubmitted] = useState(false); // f.submitted
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const edited = useRef<Record<string, boolean>>({}); // controls whose value was changed by the user

  // registration.ts:45-77 constructor. NOTE (parity): `navParams.data.data` (the karigar_detail of Profile / GiftDetail /
  // CancelPolicyModal) REPLACES `data` and is mutated in place, as in Ionic.
  const dataRef = useRef<any>(null);
  const todayDate = useRef(new Date().toISOString().slice(0, 10)).current; // registration.ts:48 (UTC date)
  const started = useRef(false);

  const set = (name: string, value: any) => {
    dataRef.current[name] = value;
    edited.current[name] = true;
    rerender();
  };

  // registration.ts:201-246
  function assignSaleUser(e: any, stName: any) {
    const data = dataRef.current;
    const state = stName === 1 ? data.state : stName; // `st_name == 1`
    filter.current.state = state;
    filter.current.search = e;
    db.post_rqst({ filter: filter.current }, 'app_karigar/seller_list')
      .then((d: any) => {
        // NOTE (parity): `d.seller_list` of null/undefined throws a TypeError inside Ionic's subscribe (nothing else runs).
        const list = d?.seller_list;
        if (!Array.isArray(list)) {
          return;
        }
        salesUsers.current = list;
        for (let i = 0; i < list.length; i++) {
          if (list[i].first_name == null) {
            list[i].first_name = '';
          }
          if (list[i].mobile_no == null) {
            list[i].mobile_no = '';
          }
          if (list[i].first_name !== '' || list[i].mobile_no !== '') {
            list[i].first_name = list[i].first_name + '(' + list[i].mobile_no + ')';
          }
        }
        // eslint-disable-next-line eqeqeq
        const index = list.findIndex((row: any) => row.id == data.sales_boy_id);
        if (index !== -1) {
          data.sales_boy_id = list[index];
        }
        if (d.status === 'send_state') {
          showAlert({ title: 'Alert!', cssClass: 'action-close', subTitle: 'Please select state its mandatory', buttons: ['OK'] });
        }
      })
      .catch(() => {
        // NOTE (parity): Ionic's subscribe has no error callback here; nothing happens.
      });
  }

  // registration.ts:163-172
  function getStateList() {
    db.onGetRequestDataFromApi('app_master/getStates', db.rootUrl).then(
      (r: any) => {
        stateList.current = r?.states;
        if (alive.current) {
          rerender();
        }
      },
      () => {},
    );
  }

  // registration.ts:174-183
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

  // registration.ts:154-161
  function preselectFromId(field: string, list: any[]) {
    const data = dataRef.current;
    const current = data[field];
    if (current === null || current === undefined || current === '') {
      return;
    }
    if (typeof current === 'object' && current.id) {
      return;
    }
    // eslint-disable-next-line eqeqeq
    const found = list.find((item: any) => item.id == current);
    if (found) {
      data[field] = found;
    }
  }

  // registration.ts:131-138 (the dealer list is loaded but the template never shows it)
  function loadDealers(state?: string) {
    const payload: any = state ? { state } : {};
    db.onPostRequestDataFromApi(payload, 'app_karigar/sales_exec/dealer_dropdown', db.rootUrl).then(
      (r: any) => {
        const dealers = r && r.dealers ? r.dealers : [];
        preselectFromId('dealer_id', dealers);
      },
      () => {},
    );
  }

  // registration.ts:140-147
  function loadSalesExecutives(state?: string) {
    const payload: any = state ? { state } : {};
    db.onPostRequestDataFromApi(payload, 'app_karigar/sales_exec/sales_executive_dropdown', db.rootUrl).then(
      (r: any) => {
        salesExecutives.current = r && r.sales_executives ? r.sales_executives : [];
        preselectFromId('sales_executive_id', salesExecutives.current);
        if (alive.current) {
          rerender();
        }
      },
      () => {},
    );
  }

  // registration.ts:123-129
  function onStateChange(state: string) {
    getDistrictList(state);
    assignSaleUser('', state);
    if (dataRef.current.type === 'Plumber') {
      loadDealers(state);
    }
  }

  if (dataRef.current === null) {
    const data: any = {};
    data.mobile_no = params.mobile_no;
    data.type = params.loginType;
    data.sales_boy_id = params.sales_boy_id;
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

  // registration.ts:47 getstatelist() and :70-72 AssignSaleUser (constructor), :79-121 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    if (started.current) {
      return;
    }
    started.current = true;
    const data = dataRef.current;
    getStateList();
    if (params.data && data.state) {
      assignSaleUser('', data.state);
    }
    if (data.state) {
      getDistrictList(data.state);
    }
    if (data.type === 'Plumber') {
      loadSalesExecutives();
      if (data.state) {
        loadDealers(data.state);
      }
    }
    // Edit mode: the currently assigned seller is merged into sales_users (the list is never shown).
    if (data.karigar_edit_id && data.sales_boy_id) {
      db.onPostRequestDataFromApi({}, 'app_karigar/sales_exec/seller_dropdown', db.rootUrl).then(
        (r: any) => {
          const allSellers = r && r.sellers ? r.sellers : [];
          allSellers.forEach((s: any) => {
            // eslint-disable-next-line eqeqeq
            if (!salesUsers.current.find((u: any) => u.id == s.id)) {
              const f = s.first_name || '';
              const m = s.mobile_no || '';
              s.first_name = f || m ? `${f}(${m})` : f;
              salesUsers.current.push(s);
            }
          });
          const current = data.sales_boy_id;
          if (current && typeof current !== 'object') {
            // eslint-disable-next-line eqeqeq
            const found = salesUsers.current.find((u: any) => u.id == current);
            if (found) {
              data.sales_boy_id = found;
            }
          }
        },
        () => {},
      );
    }
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = dataRef.current;
  const type = data.type;
  const edit = !!data.karigar_edit_id; // `*ngIf="data.karigar_edit_id"`
  const isPlumber = type === 'Plumber';
  const hasDob = type === 'Plumber' || type === 'Sales_Boy' || type === 'Dealer';
  const isSeller = hasDob && type !== 'Plumber' && type !== 'Dealer'; // the Dealer Name / Dealer Mobile fields (Sales_Boy only)

  // ---- Angular control validity (ngModel + required / minlength / maxlength); a disabled control is not validated ----
  const controls: Record<string, boolean> = {};
  controls.first_name = isEmpty(data.first_name);
  controls.mobile_no = isEmpty(data.mobile_no);
  if (isSeller) {
    controls.dealer_mobile = lenInvalid(data.dealer_mobile, 10);
  }
  controls.pincode = lenInvalid(data.pincode, 6) || (edit && isEmpty(data.pincode));
  if (edit) {
    controls.address = isEmpty(data.address);
    controls.state = isEmpty(data.state);
    controls.district = isEmpty(data.district);
    controls.city = isEmpty(data.city);
  }
  if (isPlumber && !edit) {
    controls.sales_boy_mobile_no = lenInvalid(data.sales_boy_mobile_no, 10);
    controls.dealer_mobile = lenInvalid(data.dealer_mobile, 10);
  }
  const invalid = (name: string) => !!controls[name];
  const formValid = Object.values(controls).every(v => !v);
  const err = (name: string) => submitted && invalid(name);
  // NOTE (parity): the ng-valid / ng-invalid classes Ionic puts on a pre-filled item (edit mode, or the mobile number) stay at the
  // state of the still-empty control (ngModel writes the value asynchronously) until the user changes that control, so the
  // valid + has-value green underline never shows. Measured in the Ionic DOM on Registration.editExist (after submit): EVERY
  // pre-filled ion-input item is `ng-untouched ng-pristine ng-invalid`, the optional seller/dealer fields included.
  const ngClasses = (name: string) => {
    const stale = !edited.current[name] && !isEmpty(data[name]);
    const bad = stale ? true : invalid(name);
    return { valid: !bad, invalid: bad, touched: !!touched[name] };
  };
  const touch = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

  // registration.ts:575-582
  function scrollUp() {
    content.current?.scrollTo({ y: 0, animated: true });
  }

  // registration.ts:584-707
  async function submit() {
    const d = dataRef.current;
    if (d.type === 'Customer') {
      d.status = 'Verified';
    }
    d.karigar_edit_id = '';
    if (params.data) {
      d.karigar_edit_id = d.id;
    }
    // For a new registration seller/dealer come as text fields; the backend matches them.
    if (!d.karigar_edit_id) {
      d.sales_boy_id = '';
      delete d.dealer_id;
    } else {
      if (d.sales_boy_id && typeof d.sales_boy_id === 'object') {
        d.sales_boy_id = d.sales_boy_id.id;
      }
      if (d.dealer_id && typeof d.dealer_id === 'object') {
        d.dealer_id = d.dealer_id.id;
      }
    }
    if (d.sales_executive_id && typeof d.sales_executive_id === 'object') {
      d.sales_executive_id = d.sales_executive_id.id;
    }

    loader.show(); // presentLoading(): "Please wait...", dismissOnPageChange
    let r: any;
    try {
      r = await db.onPostRequestDataFromApi({ karigar: d }, 'app_karigar/addKarigar', db.rootUrl);
    } catch {
      // NOTE (parity): no error callback in Ionic: after an HTTP error the "Please wait..." loader stays up forever.
      return;
    }
    loader.hide(); // registration.ts:646, before anything is read from the response
    if (!alive.current) {
      return;
    }
    // NOTE (parity): `r['id']` of a null body throws a TypeError in Ionic (nothing else happens).
    if (r === null || r === undefined) {
      return;
    }
    if (r.status === 'SUCCESS') {
      let l: any;
      try {
        l = await db.onPostRequestDataFromApi({ mobile_no: d.mobile_no, mode: 'App' }, 'auth/login', db.rootUrl);
      } catch {
        return; // no error callback in Ionic; this call has no loader
      }
      if (!alive.current) {
        return;
      }
      if (l?.status === 'NOT FOUND') {
        return;
      } else if (l?.status === 'ACCOUNT SUSPENDED') {
        showAlert({ title: 'Alert!', cssClass: 'action-close', subTitle: 'Your account has been suspended', buttons: ['OK'] });
        return;
      } else if (l?.status === 'SUCCESS') {
        const user = l.user;
        if (!user || typeof user !== 'object') {
          return; // NOTE (parity): Ionic throws a TypeError at `r['user']['token'] = ...`: nothing stored, no navigation
        }
        await session.saveLoginResult(l);
        if (!alive.current) {
          return;
        }
        // NOTE (parity): push (not setRoot): the login pages stay below Tabs.
        navigation.push('Tabs');
        if (params.data) {
          return;
        }
        if (user.status !== 'Verified') {
          // NOTE (parity): `this.country` is never set (undefined); the modal call is commented out in Ionic.
          navigation.push('AboutusModal', { country: undefined });
        }
      }
    } else if (r.status === 'EXIST') {
      showAlert({ title: 'Alert!', cssClass: 'action-close', subTitle: 'Already Registered!', buttons: ['OK'] });
    }
  }

  // registration.html:10 (ngSubmit)="f.form.valid ? submit() : scrollUp()"
  function onSubmit() {
    setSubmitted(true);
    if (formValid) {
      submit();
    } else {
      scrollUp();
    }
  }

  // ---- template ----------------------------------------------------------------------------------------------
  const blocks: Block[] = [];
  const add = (key: string, mt: number, mb: number, render: Block['render']) => blocks.push({ key, mt, mb, render });
  const h3 = (key: string, label: string, mt: number) =>
    add(key, mt, R.h3.marginBottom, ({ marginTop }) => (
      <H3 key={key} label={label} marginTop={marginTop} />
    ));
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
      type?: 'text' | 'tel';
      required?: boolean;
      readOnly?: boolean;
      disabled?: boolean;
      filter?: (s: string) => string;
      onChange?: (s: string) => string;
      last?: boolean;
      mb?: number;
      error?: boolean;
      validated?: boolean;
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
        readOnly={o.readOnly}
        // NOTE (parity): `[disabled]="data.karigar_edit_id"` only adds the (unstyled) `item-input-disabled` class to the item; measured on
        // Registration.edit the native <input> is NOT disabled (no .4 opacity, label normal, still editable), so `disabled` is not passed on.
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

  // Basic information
  h3('h3-basic', t('Basic information'), 0);
  csInput('first_name', { label: t('Name'), name: 'first_name', required: true, filter: namecheck, error: err('first_name') });
  csInput('mobile_no', { label: t('Mobile No.'), name: 'mobile_no', required: true, readOnly: true, error: err('mobile_no'), last: !hasDob });
  if (hasDob) {
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
  }
  if (isSeller) {
    csInput('dealer_contact_person', { label: t('Dealer Name'), name: 'dealer_contact_person', filter: namecheck });
    const bad = submitted && invalid('dealer_mobile');
    csInput('dealer_mobile', {
      label: `${t('Dealer Mobile No')}.`,
      name: 'dealer_mobile',
      type: 'tel',
      filter: digits,
      mb: 0,
      last: !bad,
    });
    if (bad) {
      eror('dealer_mobile-error');
    }
  }

  // Address information (registration.html:64-150): the two ng-containers differ only in `required`
  h3('h3-address', t('Address information'), R.helperMargin10);
  csInput('address', { label: t('Address'), name: 'address', onChange: capsAdd, error: err('address') });
  add('state', 16, 16, ({ marginTop, marginBottom }) => (
    <IonSelect
      key="state"
      testID="state"
      variant="csSelect"
      label={t('State')}
      error={err('state')}
      value={data.state}
      options={(stateList.current ?? []).map((row: any) => ({ value: row.state_name, label: row.state_name }))}
      onChange={v => {
        set('state', v);
        onStateChange(data.state);
      }}
      itemStyle={{ marginTop, marginBottom }}
    />
  ));
  add('district', 16, 16, ({ marginTop, marginBottom }) => (
    <IonSelect
      key="district"
      testID="district"
      variant="csSelect"
      label={t('District')}
      error={err('district')}
      value={data.district}
      options={(districtList.current ?? []).map((row: any) => ({ value: row.district_name, label: row.district_name }))}
      onChange={v => set('district', v)}
      itemStyle={{ marginTop, marginBottom }}
    />
  ));
  csInput('city', { label: t('Area'), name: 'city', error: err('city') });
  csInput('pincode', { label: t('Pincode'), name: 'pincode', type: 'tel', filter: digits, mb: 32, last: true, error: err('pincode') });

  // Assign Mapping (Plumber only)
  if (isPlumber) {
    h3('h3-mapping', t('Assign Mapping'), R.helperMargin10);
    csInput('sales_boy_name', { label: `${t('Seller Name')} (${t('Optional')})`, name: 'sales_boy_name', filter: namecheck, disabled: edit });
    const sellerBad = submitted && !!touched.sales_boy_mobile_no && invalid('sales_boy_mobile_no');
    csInput('sales_boy_mobile_no', {
      label: `${t('Seller Mobile No')} (${t('Optional')})`,
      name: 'sales_boy_mobile_no',
      type: 'tel',
      filter: digits,
      disabled: edit,
      mb: 0,
      last: !sellerBad,
    });
    if (sellerBad && !edit) {
      eror('sales_boy_mobile_no-error');
    }
    csInput('dealer_contact_person', { label: `${t('Dealer Name')} (${t('Optional')})`, name: 'dealer_contact_person', filter: namecheck, disabled: edit });
    const dealerBad = submitted && !!touched.dealer_mobile && invalid('dealer_mobile');
    csInput('dealer_mobile', {
      label: `${t('Dealer Mobile No')} (${t('Optional')})`,
      name: 'dealer_mobile',
      type: 'tel',
      filter: digits,
      disabled: edit,
      mb: 0,
      last: !dealerBad,
    });
    if (dealerBad && !edit) {
      eror('dealer_mobile-error');
    }
    add('sales_executive_id', 16, 16, ({ marginTop, marginBottom }) => (
      <IonicSelectable
        key="sales_executive_id"
        testID="sales_executive_id"
        variant="csSelect"
        label={t('Select Sales Executive (optional)')}
        items={salesExecutives.current}
        // NOTE (parity): `[(ngModel)]="data.sales_executive_id"` binds the raw saved id when no list item matched it: ionic-selectable
        // then counts as having a value (no text shown, `id[first_name]` is undefined) and the md ng-valid + has-value rule draws
        // the green underline (measured: edit mode shows it, a new registration does not).
        value={data.sales_executive_id ?? null}
        itemValueField="first_name"
        itemTextField="first_name"
        hasVirtualScroll
        canSearch
        canClear
        isEnabled={!edit}
        onChange={v => set('sales_executive_id', v)}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));
  }

  const rendered: React.ReactNode[] = [];
  let prevMb = 0;
  blocks.forEach(b => {
    // adjoining vertical margins collapse (CSS) but not in Yoga: only what exceeds the previous sibling's bottom margin is added
    rendered.push(b.render({ marginTop: Math.max(0, b.mt - prevMb), marginBottom: b.mb }));
    prevMb = b.mb;
  });

  const submitLabel = data.id ? t('Update') : t('Submit');
  return (
    <View style={styles.screen}>
      <Header mainHeader remove color="primary" title={data.id ? t('Edit Profile') : t('Registration')} />
      <IonContent ref={content}>
        <View style={styles.mainField}>
          <IonList style={styles.list}>
            <View>{rendered}</View>
          </IonList>
        </View>
        <IonButton testID="registration-submit" csBtn style={data.id ? styles.updateButton : undefined} onPress={onSubmit}>
          {submitLabel}
        </IonButton>
      </IonContent>
    </View>
  );
}
