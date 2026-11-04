// Ported from: src/pages/enquiry/enquiry.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../components/ionic/IonText';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonList } from '../../components/ionic/IonList';
import { Header } from '../../components/ionic/IonNavbar';
import { textStyle } from '../../components/ionic/text';
import { inputMd } from '../../theme/ionicMdContent';
import { enquiryMd as E } from '../../theme/ionicMdEnquiry';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { scssColors } from '../../theme';
import { showAlert } from '../../ui/overlays';
import { styles } from './styles';

interface Props {
  navigation: { reset: (state: object) => void };
  route?: { params?: any };
}

// enquiry.ts:73-79 / :88-94 keypress filters: a typed character that does not match is dropped (backspace always passes).
// NOTE (parity): Ionic only filters typed keys (paste is not filtered); a RN TextInput cannot tell them apart, so paste is filtered too.
const namecheck = (s: string) => s.replace(/[^A-Z+\-a-z ]/g, '');
const mobileNumber = (s: string) => s.replace(/[^0-9+\- ]/g, '');

// Angular validators on a control value (required / minlength / maxlength / pattern)
const isEmpty = (v: any) => v === null || v === undefined || v.length === 0;
// html:34 pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$" (Angular anchors it with ^)
const EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/;

export default function EnquiryScreen({ navigation, route }: Props) {
  const params = route?.params ?? {};
  const [, setTick] = useState(0);
  const rerender = () => setTick(n => n + 1);
  const [submitted, setSubmitted] = useState(false); // f.submitted
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const edited = useRef<Record<string, boolean>>({});
  const contactDetails = useRef<any>({}); // enquiry.ts:11
  const productId = useRef<any>(undefined); // enquiry.ts:14

  // enquiry.ts:32-37 ionViewDidLoad
  useEffect(() => {
    productId.current = params.id;
    // NOTE (parity): `userStorageData` undefined throws here in Ionic (the two prefills do not happen).
    if (db.userStorageData) {
      contactDetails.current.customerName = db.userStorageData.first_name;
      contactDetails.current.customerMobileNo = db.userStorageData.mobile_no;
    }
    rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = contactDetails.current;
  const set = (name: string, value: any) => {
    data[name] = value;
    edited.current[name] = true;
    rerender();
  };

  // ---- Angular control validity ----
  const controls: Record<string, boolean> = {
    customerName: isEmpty(data.customerName),
    customerEmail: isEmpty(data.customerEmail) || !EMAIL.test(data.customerEmail),
    customerMobileNo: isEmpty(data.customerMobileNo) || String(data.customerMobileNo).length !== 10,
    customerInformation: isEmpty(data.customerInformation),
  };
  const invalid = (name: string) => !!controls[name];
  const formValid = Object.values(controls).every(v => !v);
  const err = (name: string) => submitted && invalid(name);
  // NOTE (parity): a pre-filled control (name / mobile, written in ionViewDidLoad) keeps the ng-* classes of the still-empty control until
  // the user changes it (see Registration).
  const ngClasses = (name: string) => {
    const stale = !edited.current[name] && !isEmpty(data[name]);
    const bad = stale ? true : invalid(name);
    return { valid: !bad, invalid: bad, touched: !!touched[name] };
  };
  const touch = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));

  // enquiry.ts:39-60 submit()
  // NOTE (parity): no loader and no error callback: after an HTTP error nothing happens. A null body throws on `result['status']`.
  function submit() {
    contactDetails.current.product_id = productId.current;
    db.onPostRequestDataFromApi({ contactDetails: contactDetails.current }, 'app_karigar/enquiryForProduct', db.rootUrl).then(
      (result: any) => {
        if (result === null || result === undefined) {
          return;
        }
        if (result.status == 'Product Enquiry successfully.') { // eslint-disable-line eqeqeq
          showAlert({ title: 'ThankYou!', subTitle: 'Your Enquiry mail has been successfully sent', buttons: ['OK'] });
          navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] }); // setRoot(TabsPage,{index:'0'})
        }
      },
      () => {},
    );
  }

  // html:19 (ngSubmit)="f.form.valid && submit()"
  function onSubmit() {
    setSubmitted(true);
    if (formValid) {
      submit();
    }
  }

  // [T] 2355-2362: height 45, margin 16px 0 30px, box-shadow; each item is the only child of its own ion-list (margin 0), so adjoining
  // margins collapse: 16 above the first item, 30 between items (Yoga does not collapse: the margin-top is only on the first).
  const field = (
    key: string,
    o: { label: string; name: string; type?: 'text' | 'tel'; maxLength?: number; filter?: (s: string) => string; first?: boolean; textarea?: boolean },
  ) => (
    <IonList key={key} style={styles.list}>
      <IonInputItem
        testID={key}
        variant="csInput"
        floating
        label={o.label}
        type={o.type}
        maxLength={o.maxLength}
        textarea={o.textarea}
        isLast
        error={err(o.name)}
        value={data[o.name] ?? ''}
        validation={ngClasses(o.name)}
        onBlur={() => touch(o.name)}
        onChangeText={s => set(o.name, o.filter ? o.filter(s) : s)}
        itemStyle={{
          marginTop: o.first ? E.item.marginTop : 0,
          marginBottom: E.item.marginBottom,
          height: o.textarea ? E.tallItemHeight : E.item.height, // `.h100 { height: 100px !important }`
          boxShadow: E.item.boxShadow,
        }}
        // NOTE (parity): the `.main-field`-scoped csInput rules (13px input font, ion-textarea padding 10px) are absent here: the input keeps the
        // item's 16px and the textarea has no container padding (the 10px of the kit variant is taken back with negative margins).
        inputStyle={
          o.textarea
            ? { marginTop: 8 - 10, marginBottom: 8 - 10, marginLeft: -10, marginRight: 8 - 10 }
            : { fontSize: inputMd.fontSize, height: normalLineHeight(inputMd.fontSize) + E.inputPaddingTop }
        }
      />
    </IonList>
  );

  return (
    <View style={styles.screen}>
      <Header mainHeader remove color="primary" title="enquiry" />
      <IonContent>
        <View style={styles.enquriy}>
          <Text style={[textStyle(E.p.fontSize, 400, scssColors.black, E.p.lineHeight), styles.p]}>
            Please fill In this form below, we will get back to you soon as poosible
          </Text>
        </View>
        <View style={styles.enquriy}>
          <View>
            {field('customerName', { label: 'Name', name: 'customerName', filter: namecheck, first: true })}
            {field('customerEmail', { label: 'Email ID', name: 'customerEmail' })}
            {field('customerMobileNo', { label: 'Mobile No.', name: 'customerMobileNo', type: 'tel', maxLength: 10, filter: mobileNumber })}
            {field('customerInformation', { label: 'Enquiry Message', name: 'customerInformation', textarea: true })}
          </View>
          <IonButton
            testID="enquiry-submit"
            kind="clear"
            color="danger"
            background="transparent"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={onSubmit}
          >
            SUBMIT
          </IonButton>
        </View>
      </IonContent>
    </View>
  );
}
