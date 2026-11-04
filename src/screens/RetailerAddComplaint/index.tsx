// Ported from: src/pages/retailer-add-complaint/retailer-add-complaint.html + .ts + .scss (+ .module.ts)
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../components/ionic/IonText';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonList } from '../../components/ionic/IonList';
import { Header } from '../../components/ionic/IonNavbar';
import { IonSelect } from '../../components/ionic/IonSelect';
import { textStyle } from '../../components/ionic/text';
import { registrationMd as R } from '../../theme/ionicMdLogin';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: any };
}

// Angular required validator on a control value.
const isEmpty = (v: any) => v === null || v === undefined || v.length === 0;
// Angular minlength: skips empty values.
const tooShort = (v: any, n: number) => !isEmpty(v) && String(v).length < n;
// retailer-add-complaint.ts:93-99 MobileNumber(): a typed character that is not a digit is dropped (backspace always passes).
// NOTE (parity): Ionic only filters typed keys (paste is not filtered); a RN TextInput cannot tell them apart, so paste is filtered too.
const digits = (s: string) => s.replace(/[^0-9]/g, '');

interface Block {
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

export default function RetailerAddComplaintScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
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

  // retailer-add-complaint.ts:19-33 fields. The `data` object is the request body's `complaint`.
  const dataRef = useRef<any>({});
  const stateList = useRef<any>([]);
  const districtList = useRef<any>([]);
  // NOTE (parity): the template gives BOTH the State select and the Type select `name="state"` (html:36 and :61). Angular's NgForm then hands
  // the second NgModel the FIRST control: one FormControl is shared by both selects. Its value is whatever was last written by either select
  // (or by the model, `data.type = loginType` of ionViewDidLoad); `state?.invalid` and `type?.invalid` both read it, so choosing only one of the
  // two satisfies `required` for both. The two models (`data.state`, `data.type`) stay separate.
  const sharedState = useRef<any>(null);
  const started = useRef(false);
  const data = dataRef.current;

  // retailer-add-complaint.ts:36-39 constructor: getstatelist()
  // retailer-add-complaint.ts:41-46 ionViewDidLoad: `this.data.type = this.navParams.get('loginType')`
  // (the model write also reaches the shared control, html:61 `[(ngModel)]="data.type"`).
  useEffect(() => {
    alive.current = true;
    if (!started.current) {
      started.current = true;
      getStateList();
      const loginType = route?.params?.loginType;
      dataRef.current.type = loginType;
      if (loginType !== undefined) {
        sharedState.current = loginType;
      }
      rerender();
    }
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // :49-57 getstatelist()
  function getStateList() {
    db.onGetRequestDataFromApi('app_master/getStates', db.rootUrl).then(
      (r: any) => {
        stateList.current = r?.states; // NOTE (parity): a null body throws inside Ionic's subscribe; nothing else happens
        rerender();
      },
      () => {},
    );
  }

  // :59-68 getDistrictList(state_name)
  function getDistrictList(stateName: any) {
    db.onPostRequestDataFromApi({ state_name: stateName }, 'app_master/getDistrict', db.rootUrl).then(
      (r: any) => {
        districtList.current = r?.districts;
        rerender();
      },
      () => {},
    );
  }

  // :71-88 submit() (html:12 `(ngSubmit)="f.form.valid && submit()"`)
  function submit() {
    dataRef.current.customer_id = db.userStorageData?.id;
    loader.show(); // presentLoading(): "Please wait...", dismissOnPageChange
    db.onPostRequestDataFromApi({ complaint: dataRef.current }, 'app_karigar/addComplaint', db.rootUrl).then(
      (r: any) => {
        // NOTE (parity): `r['status']` of a null body throws a TypeError in Ionic (nothing else happens).
        if (r === null || r === undefined) {
          return;
        }
        // NOTE (parity): lower-case 'success', and the loader is dismissed only by the page change: any other status leaves "Please wait..." up.
        if (r.status == 'success') { // eslint-disable-line eqeqeq
          navigation.push('ComplaintHistory');
        }
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the "Please wait..." loader stays up forever.
      () => {},
    );
  }

  // ---- Angular control validity (required / minlength; maxlength via the maxLength prop) ----
  const controls: Record<string, boolean> = {
    first_name: isEmpty(data.first_name),
    mobile_no: isEmpty(data.mobile_no) || tooShort(data.mobile_no, 10),
    address: isEmpty(data.address),
    state: isEmpty(sharedState.current), // shared with `type`
    district: isEmpty(data.district),
    city: isEmpty(data.city),
    pincode: isEmpty(data.pincode) || tooShort(data.pincode, 6),
    type: isEmpty(sharedState.current), // shared with `state`
    nature_problem: isEmpty(data.nature_problem),
  };
  const invalid = (name: string) => !!controls[name];
  const formValid = Object.values(controls).every(v => !v);
  const err = (name: string) => submitted && invalid(name);
  const ngClasses = (name: string) => ({ valid: !invalid(name), invalid: invalid(name), touched: !!touched[name] });
  const touch = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

  const set = (name: string, value: any) => {
    dataRef.current[name] = value;
    rerender();
  };

  // html:12 `(ngSubmit)="f.form.valid && submit()"`
  function onSubmit() {
    setSubmitted(true);
    if (formValid) {
      submit();
    }
  }

  // ---- template ----------------------------------------------------------------------------------------------
  // adjoining vertical margins collapse (CSS) but not in Yoga: only what exceeds the previous sibling's bottom margin is added
  const blocks: Block[] = [];
  const add = (mt: number, mb: number, render: Block['render']) => blocks.push({ mt, mb, render });
  const csInput = (
    key: string,
    o: { label: string; type?: 'text' | 'tel'; maxLength?: number; filter?: (s: string) => string; mb?: number; last?: boolean },
  ) =>
    add(16, o.mb ?? 16, ({ marginTop, marginBottom }) => (
      <IonInputItem
        key={key}
        testID={key}
        variant="csInput"
        floating
        label={o.label}
        requiredMark
        type={o.type}
        maxLength={o.maxLength}
        isLast={o.last}
        error={err(key)}
        value={data[key] ?? ''}
        validation={ngClasses(key)}
        onBlur={() => touch(key)}
        onChangeText={s => set(key, o.filter ? o.filter(s) : s)}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));

  // html:16 <h3>
  add(0, R.h3.marginBottom, ({ marginTop }) => <H3 key="h3-basic" label={t('Basic information')} marginTop={marginTop} />);
  csInput('first_name', { label: t('Name') });
  csInput('mobile_no', { label: t('Mobile No.'), type: 'tel', maxLength: 10, filter: digits });
  // NOTE (parity): the error class is `(f.address && address?.invalid) || (f.submitted && !address.valid)`: after a submit it follows `required`.
  csInput('address', { label: t('Street') });
  add(16, 16, ({ marginTop, marginBottom }) => (
    <IonSelect
      key="state"
      testID="state"
      variant="csSelect"
      label={t('State')}
      requiredMark
      error={err('state')}
      value={data.state}
      options={(stateList.current ?? []).map((row: any) => ({ value: row.state_name, label: row.state_name }))}
      onChange={v => {
        set('state', v);
        sharedState.current = v;
        getDistrictList(dataRef.current.state); // (ngModelChange)
      }}
      itemStyle={{ marginTop, marginBottom }}
    />
  ));
  add(16, 16, ({ marginTop, marginBottom }) => (
    <IonSelect
      key="district"
      testID="district"
      variant="csSelect"
      label={t('District')}
      requiredMark
      error={err('district')}
      value={data.district}
      options={(districtList.current ?? []).map((row: any) => ({ value: row.district_name, label: row.district_name }))}
      onChange={v => set('district', v)}
      itemStyle={{ marginTop, marginBottom }}
    />
  ));
  csInput('city', { label: t('City') });
  csInput('pincode', { label: t('Pincode'), type: 'tel', maxLength: 6, filter: digits, mb: 32 });
  // html:60 `class="cs-select mt0"` (margin-top 0 !important)
  add(0, 16, ({ marginTop, marginBottom }) => (
    <IonSelect
      key="type"
      testID="type"
      variant="csSelect"
      label={t('Type')}
      requiredMark
      error={err('type')}
      value={data.type}
      options={[
        { value: 'Service', label: 'Service' },
        { value: 'Installation', label: 'Installations' },
      ]}
      onChange={v => {
        set('type', v);
        sharedState.current = v;
      }}
      itemStyle={{ marginTop, marginBottom }}
    />
  ));
  csInput('nature_problem', { label: t('Nature Problem'), last: true });

  const rendered: React.ReactNode[] = [];
  let prevMb = 0;
  blocks.forEach(b => {
    rendered.push(b.render({ marginTop: Math.max(0, b.mt - prevMb), marginBottom: b.mb }));
    prevMb = b.mb;
  });

  return (
    <View style={styles.screen}>
      <Header mainHeader color="primary" title={t('Add New Complaint')} />
      <IonContent>
        <View style={styles.mainField}>
          <IonList style={styles.list}>
            <View>{rendered}</View>
          </IonList>
          <IonButton testID="submit" csBtn onPress={onSubmit}>
            {t('Submit')}
          </IonButton>
        </View>
        {/* html:81 `<div class="h100">&nbsp;</div>` */}
        <View style={styles.h100} />
      </IonContent>
    </View>
  );
}
