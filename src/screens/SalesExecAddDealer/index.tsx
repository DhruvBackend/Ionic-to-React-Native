// Ported from: src/pages/sales-exec-add-dealer/sales-exec-add-dealer.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../components/ionic/IonText';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonList } from '../../components/ionic/IonList';
import { Header } from '../../components/ionic/IonNavbar';
import { IonSelect } from '../../components/ionic/IonSelect';
import { textStyle } from '../../components/ionic/text';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { registrationMd as R } from '../../theme/ionicMdLogin';
import { scssColors } from '../../theme';
import { showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation: { goBack: () => void };
  route?: { params?: any };
}

// Angular validators on a control value (required / minlength skip empty values).
const isEmpty = (v: any) => v === null || v === undefined || v.length === 0;
const lenInvalid = (v: any, n: number) => (isEmpty(v) ? false : String(v).length !== n);

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

export default function SalesExecAddDealerScreen({ navigation }: Props) {
  const loader = useLoader();
  const alive = useRef(true);
  const started = useRef(false);

  // sales-exec-add-dealer.ts:12-26 fields
  const user = useRef<any>(db.userStorageData || {}).current;
  const [form, setForm] = useState<any>({
    first_name: '',
    mobile_no: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
  });
  const [stateList, setStateList] = useState<any[]>([]);
  const [districtList, setDistrictList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false); // f.submitted
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = (name: string, value: any) => setForm((prev: any) => ({ ...prev, [name]: value }));

  // .ts:36-39 getStateList()
  function getStateList() {
    db.onGetRequestDataFromApi('app_master/getStates', db.rootUrl).then(
      (r: any) => {
        // NOTE (parity): a null body throws inside Ionic's subscribe; nothing else happens
        if (r === null || r === undefined) {
          return;
        }
        if (alive.current) {
          setStateList(r.states || []);
        }
      },
      () => {},
    );
  }

  // .ts:41-45 getDistrictList(state_name)
  function getDistrictList(stateName: string) {
    if (!stateName) {
      return;
    }
    db.onPostRequestDataFromApi({ state_name: stateName }, 'app_master/getDistrict', db.rootUrl).then(
      (r: any) => {
        if (r === null || r === undefined) {
          return; // NOTE (parity): null body throws in Ionic's subscribe
        }
        if (alive.current) {
          setDistrictList(r.districts || []);
        }
      },
      () => {},
    );
  }

  // .ts:32-34 ionViewDidLoad
  useEffect(() => {
    alive.current = true;
    if (!started.current) {
      started.current = true;
      getStateList();
    }
    return () => {
      alive.current = false;
    };
  }, []);

  // ---- Angular control validity (ngModel + required / minlength) ----
  const controls: Record<string, boolean> = {
    first_name: isEmpty(form.first_name),
    mobile_no: isEmpty(form.mobile_no) || lenInvalid(form.mobile_no, 10),
    city: false,
    // NOTE (parity): minlength="6" on the pincode makes the form invalid without any visible error: the submit does nothing.
    pincode: lenInvalid(form.pincode, 6),
  };
  const invalid = (name: string) => !!controls[name];
  const formValid = Object.values(controls).every(v => !v);
  const err = (name: string) => submitted && invalid(name);
  const ngClasses = (name: string) => ({ valid: !invalid(name), invalid: invalid(name), touched: !!touched[name] });
  const touch = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

  // .ts:47-80 submit()
  function submit() {
    // NOTE (parity): unreachable through the form (minlength/maxlength 10 already make the control invalid), kept as in Ionic.
    if ((form.mobile_no + '').length !== 10) {
      showAlert({ title: 'Invalid', message: 'Enter a valid 10-digit mobile number.', buttons: ['OK'] });
      return;
    }
    const payload = Object.assign({}, form, { sales_executive_id: user.id });
    setSaving(true);
    loader.show();
    db.onPostRequestDataFromApi({ dealer: payload }, 'app_karigar/sales_exec/add_dealer', db.rootUrl).then(
      (r: any) => {
        loader.hide();
        setSaving(false);
        if (r && r.status === 'SUCCESS') {
          showAlert({
            title: 'Added',
            message: 'Dealer has been added successfully.',
            buttons: [{ text: 'OK', handler: () => { navigation.goBack(); } }],
          });
        } else if (r && r.status === 'EXIST') {
          showAlert({ title: 'Exists', message: 'This mobile number is already registered.', buttons: ['OK'] });
        } else {
          showAlert({ title: 'Error', message: r && r.status ? r.status : 'Could not add dealer.', buttons: ['OK'] });
        }
      },
      () => {
        loader.hide();
        setSaving(false);
      },
    );
  }

  // html:8 (ngSubmit)="f.form.valid ? submit() : null"
  function onSubmit() {
    setSubmitted(true);
    if (formValid) {
      submit();
    }
  }

  // ---- template ----------------------------------------------------------------------------------------------
  const blocks: Block[] = [];
  const add = (key: string, mt: number, mb: number, render: Block['render']) => blocks.push({ key, mt, mb, render });
  const h3 = (key: string, label: string, mt: number) =>
    add(key, mt, R.h3.marginBottom, ({ marginTop }) => <H3 key={key} label={label} marginTop={marginTop} />);
  const csInput = (
    key: string,
    o: { label: string; name: string; type?: 'text' | 'tel'; maxLength?: number; required?: boolean; last?: boolean; mb?: number; error?: boolean },
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
        value={form[o.name] ?? ''}
        validation={ngClasses(o.name)}
        onBlur={() => touch(o.name)}
        onChangeText={s => set(o.name, s)}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));
  const csSelect = (key: string, o: { label: string; name: string; options: { value: any; label: string }[]; onChange?: (v: any) => void }) =>
    add(key, 16, 16, ({ marginTop, marginBottom }) => (
      <IonSelect
        key={key}
        testID={key}
        variant="csSelect"
        label={o.label}
        value={form[o.name]}
        options={o.options}
        onChange={v => {
          set(o.name, v);
          o.onChange?.(v);
        }}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));

  // Basic information (html:11-31)
  h3('h3-basic', 'Basic Information', 0);
  csInput('first_name', { label: 'Name', name: 'first_name', required: true, error: err('first_name') });
  const badMobile = err('mobile_no');
  csInput('mobile_no', { label: 'Mobile No.', name: 'mobile_no', type: 'tel', maxLength: 10, required: true, mb: 0, last: !badMobile, error: badMobile });
  if (badMobile) {
    add('mobile_no-error', R.eror.marginVertical, R.eror.marginVertical, ({ marginTop, marginBottom }) => (
      <View key="mobile_no-error" testID="mobile_no-error">
        <Text style={[textStyle(R.eror.fontSize, 400, scssColors.danger, normalLineHeight(R.eror.fontSize)), styles.erorText, { marginTop, marginBottom }]}>
          Enter 10 Digits
        </Text>
      </View>
    ));
  }
  // Address (html:34-62)
  h3('h3-address', 'Address', R.helperMargin10); // class="mt10" (after the .mb10 cs-form)
  csSelect('state', {
    label: 'State',
    name: 'state',
    options: stateList.map((row: any) => ({ value: row.state_name, label: row.state_name })),
    onChange: v => getDistrictList(v), // (ngModelChange)="getDistrictList(form.state)"
  });
  csSelect('district', {
    label: 'District',
    name: 'district',
    options: districtList.map((row: any) => ({ value: row.district_name, label: row.district_name })),
  });
  csInput('city', { label: 'City', name: 'city' });
  csInput('pincode', { label: 'Pincode', name: 'pincode', type: 'tel', maxLength: 6, mb: 32, last: true });


  const rendered: React.ReactNode[] = [];
  let prevMb = 0;
  blocks.forEach(b => {
    // adjoining vertical margins collapse (CSS) but not in Yoga: only what exceeds the previous sibling's bottom margin is added
    rendered.push(b.render({ marginTop: Math.max(0, b.mt - prevMb), marginBottom: b.mb }));
    prevMb = b.mb;
  });

  return (
    <View style={styles.screen}>
      <Header mainHeader remove color="primary" title="Add Dealer" />
      <IonContent>
        <View style={styles.mainField}>
          <IonList style={styles.list}>
            <View>{rendered}</View>
          </IonList>
        </View>
        <IonButton testID="submit" csBtn style={styles.button} disabled={saving} onPress={onSubmit}>
          {saving ? 'Saving…' : 'Submit'}
        </IonButton>
      </IonContent>
    </View>
  );
}
