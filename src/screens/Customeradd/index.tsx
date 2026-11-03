// Ported from: src/pages/customeradd/customeradd.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../components/ionic/IonText';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent, type IonContentHandle } from '../../components/ionic/IonContent';
import { IonDatetime } from '../../components/ionic/IonDatetime';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonList } from '../../components/ionic/IonList';
import { Header } from '../../components/ionic/IonNavbar';
import { IonSelect } from '../../components/ionic/IonSelect';
import { textStyle } from '../../components/ionic/text';
import { md } from '../../theme/ionicMd';
import { customeraddMd as C } from '../../theme/ionicMdCustomeradd';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { registrationMd as R } from '../../theme/ionicMdLogin';
import { colors, scssColors } from '../../theme';
import { showAlert } from '../../ui/overlays';
import { useLoader } from '../../ui/useLoader';
import { styles } from './styles';

interface Props {
  navigation: { popTo: (name: string) => void };
  route?: { params?: any };
}

// customeradd.ts:108-114 / :430-436 keypress filters: a typed character that does not match is dropped (backspace always passes).
// NOTE (parity): Ionic only filters typed keys (paste is not filtered); a RN TextInput cannot tell them apart, so paste is filtered too.
const namecheck = (s: string) => s.replace(/[^A-Z+\-a-z ]/g, '');
const digits = (s: string) => s.replace(/[^0-9]/g, '');
// customeradd.ts:116-119
const capsAdd = (s: string) => s.replace(/\b\w/g, l => l.toUpperCase());

// Angular validators (Validators.required / minLength / maxLength) on a control value.
const isEmpty = (v: any) => v === null || v === undefined || v.length === 0;
const lenInvalid = (v: any, n: number) => {
  if (isEmpty(v)) {
    return false; // minlength skips empty values
  }
  return String(v).length !== n;
};

// dbservice.ts:190-200 onShowMessageAlertHandler
function messageAlert(subTitle: string) {
  showAlert({ title: 'Message!', cssClass: 'action-close', subTitle, buttons: ['OK'] });
}

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

export default function CustomeraddScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const loader = useLoader();
  const params = route?.params ?? {};
  const [, setTick] = useState(0);
  const rerender = () => setTick(n => n + 1);
  const alive = useRef(true);
  const content = useRef<IonContentHandle>(null);

  // customeradd.ts:22-47 fields
  const stateList = useRef<any>([]);
  const districtList = useRef<any>([]);
  const smsOTP = useRef<any>(undefined);
  const isOtpValid = useRef<any>(undefined);
  const [nextFormValue, setNextFormValue] = useState(true);
  const [resendActiveClass, setResendActiveClass] = useState(false);
  const [submitted, setSubmitted] = useState(false); // f.submitted
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const edited = useRef<Record<string, boolean>>({}); // controls whose value was changed by the user (reset when the step's controls are re-created)
  const dataRef = useRef<any>(null);
  const todayDate = useRef(new Date().toISOString().slice(0, 10)).current; // customeradd.ts:61 (UTC date)
  const started = useRef(false);

  // customeradd.ts:57-65 constructor.
  // NOTE (parity): `this.data.mobileNo = navParams.get('mobile_no')` (a typo of mobile_no): the Mobile No. field starts empty and `mobileNo` is
  // sent in the request bodies (CustomerList pushes the page without params, so it is undefined and dropped by JSON).
  if (dataRef.current === null) {
    const data: any = {};
    data.mobileNo = params.mobile_no;
    data.type = 'Customer';
    data.sales_boy_id = db.userStorageData?.id;
    data.status = 'Verified';
    dataRef.current = data;
  }

  const set = (name: string, value: any) => {
    dataRef.current[name] = value;
    edited.current[name] = true;
    rerender();
  };

  // customeradd.ts:86-95 getstatelist()
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

  // customeradd.ts:97-106 getDistrictList(state_name)
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

  // customeradd.ts:57 getstatelist() (constructor) and :67-73 ionViewDidLoad (`data.state` is never set at that point)
  useEffect(() => {
    alive.current = true;
    if (!started.current) {
      started.current = true;
      getStateList();
    }
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // customeradd.ts:217-239 onResendOtpHandler(): post_rqst {login_data: data}
  async function onResendOtpHandler() {
    let r: any;
    try {
      r = await db.post_rqst({ login_data: dataRef.current }, 'app_karigar/karigarLoginOtp');
    } catch {
      // NOTE (parity): onDismissLoadingHandler() is `this.loading.dismiss()` on the provider's last loading object: no loader is open here, so it is
      // a no-op (it would throw only if the provider never created one). Then the "Error..!!!" alert.
      messageAlert('Error..!!!');
      return;
    }
    if (!alive.current) {
      return;
    }
    // NOTE (parity): `r['status']` of a null body throws a TypeError in Ionic (nothing else happens).
    if (r === null || r === undefined) {
      return;
    }
    if (r.status == 'SUCCESS') { // eslint-disable-line eqeqeq
      smsOTP.current = r.otp;
      messageAlert('OTP has been sent.');
    }
    rerender();
  }

  // customeradd.ts:75-83 next() / back()
  function next() {
    edited.current = {};
    setTouched({});
    setNextFormValue(false);
    onResendOtpHandler();
  }
  function back() {
    edited.current = {};
    setTouched({});
    setNextFormValue(true);
  }

  // customeradd.ts:206-215 resend()
  function resend() {
    setResendActiveClass(true);
    onResendOtpHandler();
  }

  // customeradd.ts:192-204 onValidateUserOtpHandler()
  function onValidateUserOtpHandler() {
    isOtpValid.current = dataRef.current.otp == smsOTP.current; // eslint-disable-line eqeqeq
  }

  const data = dataRef.current;

  // ---- Angular control validity (ngModel + required / minlength / maxlength); only the visible step's controls exist ----
  const controls: Record<string, boolean> = {};
  if (nextFormValue) {
    controls.first_name = isEmpty(data.first_name);
    controls.mobile_no = isEmpty(data.mobile_no) || lenInvalid(data.mobile_no, 10);
    controls.state = isEmpty(data.state);
    controls.district = isEmpty(data.district);
    controls.city = isEmpty(data.city);
    controls.pincode = isEmpty(data.pincode) || lenInvalid(data.pincode, 6);
  } else {
    controls.otp = isEmpty(data.otp) || lenInvalid(data.otp, 6);
  }
  const invalid = (name: string) => !!controls[name];
  const formValid = Object.values(controls).every(v => !v);
  const err = (name: string) => submitted && invalid(name);
  // NOTE (parity): see PlumberAdd / Registration: a control re-created with a value (after Back) starts ng-invalid until it is changed.
  const ngClasses = (name: string) => {
    const stale = !edited.current[name] && !isEmpty(data[name]);
    const bad = stale ? true : invalid(name);
    return { valid: !bad, invalid: bad, touched: !!touched[name] };
  };
  const touch = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

  // customeradd.ts:578-581 scrollUp()
  function scrollUp() {
    content.current?.scrollTo({ y: 0, animated: true });
  }

  // customeradd.ts:583-613 submit()
  async function submit() {
    const d = dataRef.current;
    if (d.type == 'Customer') { // eslint-disable-line eqeqeq
      d.status = 'Verified';
    }
    d.karigar_edit_id = '';
    if (params.data) {
      d.karigar_edit_id = d.id;
    }
    // NOTE (parity): a wrong code does nothing at all (no alert, no request).
    if (d.otp == smsOTP.current) { // eslint-disable-line eqeqeq
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
        // NOTE (parity): popTo(CustomerlistPage): the list is the page below in the stack.
        navigation.popTo('Customerlist');
      } else if (r.status == 'EXIST') { // eslint-disable-line eqeqeq
        showAlert({ title: 'Alert!', cssClass: 'action-close', subTitle: 'Already Registered!', buttons: ['OK'] });
      }
    }
  }

  // html:11 (ngSubmit)="f.form.valid ? submit() : scrollUp()" (only the step 2 Submit button submits: Next is type="text")
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
    add(key, mt, R.h3.marginBottom, ({ marginTop }) => <H3 key={key} label={label} marginTop={marginTop} />);
  const csInput = (
    key: string,
    o: {
      label: string;
      name: string;
      type?: 'text' | 'tel';
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
          const nextValue = o.onChange ? o.onChange(o.filter ? o.filter(s) : s) : o.filter ? o.filter(s) : s;
          set(o.name, nextValue);
        }}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));

  const rendered: React.ReactNode[] = [];
  const bodyText = textStyle(md.fontSizeBase, 400, md.textColor, normalLineHeight(md.fontSizeBase));

  if (nextFormValue) {
    // Basic information (html:17-45)
    h3('h3-basic', t('Basic information'), 0);
    csInput('first_name', { label: t('Name'), name: 'first_name', required: true, filter: namecheck, error: err('first_name') });
    // NOTE (parity): type="text", maxlength 10, NO digit filter (html:35 has no keypress handler).
    csInput('mobile_no', { label: t('Mobile No.'), name: 'mobile_no', required: true, maxLength: 10, error: err('mobile_no') });
    add('dob', 0, 0, ({ marginTop, marginBottom }) => (
      <IonDatetime
        key="dob"
        testID="dob"
        variant="csDate"
        label={t('Date of Purchase')}
        displayFormat="DD/MM/YYYY"
        max={todayDate}
        value={data.dob}
        onChange={iso => set('dob', iso)}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));
    // Address information (html:47-85)
    h3('h3-address', t('Address information'), R.helperMargin10);
    // NOTE (parity): never in error (no validator on `address`, and `f.address` is undefined).
    csInput('address', { label: t('Address'), name: 'address', onChange: capsAdd });
    add('state', 16, 16, ({ marginTop, marginBottom }) => (
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
          getDistrictList(dataRef.current.state); // (ngModelChange)
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
        requiredMark
        error={err('district')}
        value={data.district}
        options={(districtList.current ?? []).map((row: any) => ({ value: row.district_name, label: row.district_name }))}
        onChange={v => set('district', v)}
        itemStyle={{ marginTop, marginBottom }}
      />
    ));
    csInput('city', { label: t('Area'), name: 'city', required: true, error: err('city') });
    csInput('pincode', { label: t('Pincode'), name: 'pincode', required: true, type: 'tel', maxLength: 6, filter: digits, mb: 32, last: true, error: err('pincode') });

    let prevMb = 0;
    blocks.forEach(b => {
      // adjoining vertical margins collapse (CSS) but not in Yoga: only what exceeds the previous sibling's bottom margin is added
      rendered.push(b.render({ marginTop: Math.max(0, b.mt - prevMb), marginBottom: b.mb }));
      prevMb = b.mb;
    });
  }

  const nextEnabled = !!(data.first_name && data.state && data.district && data.city && data.pincode && data.mobile_no);
  const otpInvalid = submitted && invalid('otp');
  const wrongOtp = !isOtpValid.current && !!touched.otp;
  const otpTime = 30; // customeradd.ts:268 otpInputMaxTime (the timer that would count it down is never started)

  return (
    <View style={styles.screen}>
      <Header mainHeader remove color="primary" title={t('Add New Customer')} />
      <IonContent ref={content}>
        <View style={styles.mainField}>
          {nextFormValue ? (
            <>
              <IonList style={styles.list}>
                <View>{rendered}</View>
              </IonList>
              {/* html:87-89 `<button type="text" ion-button class="cs-btn mb50" [disabled]=...>` */}
              <IonButton testID="next" csBtn disabled={!nextEnabled} style={styles.button} onPress={next}>
                {t('Next')}
              </IonButton>
            </>
          ) : (
            <>
              {/* html:95 `<a ion-button color="primary" clear small icon-start style="margin-top: 10px; text-transform: capitalize; padding: 0px">` */}
              <View style={styles.back}>
                <IonButton
                  testID="back"
                  as="a"
                  kind="clear"
                  color="primary"
                  small
                  iconStart="arrow-back"
                  textTransform="capitalize"
                  style={styles.backButton}
                  onPress={back}
                >
                  Back
                </IonButton>
              </View>
              <View>
                <Text style={bodyText}>
                  {t('Enter your 6 digit number that sent to')} {data.mobile_no}
                </Text>
                <IonList style={styles.list}>
                  <View>
                    <IonInputItem
                      testID="otp"
                      variant="csInput"
                      floating
                      label={`${t('Enter OTP')} *`}
                      type="tel"
                      maxLength={6}
                      error={err('otp')}
                      value={data.otp ?? ''}
                      validation={ngClasses('otp')}
                      onBlur={() => touch('otp')}
                      onChangeText={s => {
                        set('otp', s);
                        onValidateUserOtpHandler(); // (ngModelChange)
                      }}
                      itemStyle={styles.otpItem}
                    />
                    {/* html:103 `<p class="eror">`: the class is on the p itself, so `.eror p` does not match: plain text */}
                    {otpInvalid ? (
                      <Text testID="otp-required" style={bodyText}>
                        required
                      </Text>
                    ) : null}
                    {wrongOtp ? (
                      <View testID="otp-wrong">
                        <Text
                          style={[
                            textStyle(R.eror.fontSize, 400, scssColors.danger, normalLineHeight(R.eror.fontSize)),
                            styles.erorText,
                            { marginTop: Math.max(0, R.eror.marginVertical - (otpInvalid ? 0 : 16)), marginBottom: R.eror.marginVertical },
                          ]}
                        >
                          {t('Wrong OTP value')}
                        </Text>
                      </View>
                    ) : null}
                    {resendActiveClass === true ? (
                      <View testID="resend-wait" style={[styles.resend, styles.resendDim]}>
                        <View style={styles.resendA}>
                          <Text style={textStyle(C.resend.fontSize, 400, colors.white, normalLineHeight(C.resend.fontSize))}>
                            {t('New OTP resent to be available in seconds')} {otpTime}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.resend}>
                        <Pressable testID="resend" onPress={resend} style={styles.resendA}>
                          <Text style={textStyle(C.resend.fontSize, 400, colors.white, normalLineHeight(C.resend.fontSize))}>{t('Resend')}</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </IonList>
              </View>
              <IonButton testID="customeradd-submit" csBtn style={styles.button} onPress={onSubmit}>
                {t('Submit')}
              </IonButton>
            </>
          )}
        </View>
      </IonContent>
    </View>
  );
}
