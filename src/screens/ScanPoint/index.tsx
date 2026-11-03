// Ported from: src/pages/scan-point/scan-point.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Image, PixelRatio, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonItem, IonLabel, IonList, IonListHeader } from '../../components/ionic/IonList';
import { Header } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { textStyle } from '../../components/ionic/text';
import { scanQr } from '../../native';
import { androidLineHeight, normalLineHeight } from '../../theme/ionicMdOverlays';
import { contentMd } from '../../theme/ionicMdContent';
import { scanPointMd as S } from '../../theme/ionicMdScanPoint';
import { interp, momentFormat } from '../../ui/angularPipes';
import { showAlert, showToast } from '../../ui/overlays';
import { styles } from './styles';

// Ionic assets/imgs/qrcode.png: the client's file, copied by scripts/use-client.mjs.
const qrImg = require('../../assets/client/qrcode.png');
const qrSize = Image.resolveAssetSource?.(qrImg);
const qrRatio = qrSize?.width && qrSize?.height ? qrSize.width / qrSize.height : 1;

interface Props {
  navigation: { push: (name: string, params?: object) => void };
  route?: { params?: any };
}

// Angular validators on an ngModel control.
const isEmpty = (v: any) => v === null || v === undefined || v.length === 0;
const lenInvalid = (v: any, n: number) => {
  if (isEmpty(v)) {
    return false; // minlength skips empty values; maxlength of nothing is 0
  }
  const len = String(v).length;
  return len < n || len > n;
};

// scan-point.scss:158-163 `ion-input input { padding-top: 12px; font-size: 13px }` (the kit's csInput variant has padding-top 15 for the registration form)
const csInputLine = () => (Platform.OS === 'android' ? androidLineHeight(13, PixelRatio.get()) : normalLineHeight(13));

export default function ScanPointScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const [, setTick] = useState(0);
  const alive = useRef(true);
  const rerender = () => {
    if (alive.current) {
      setTick(n => n + 1);
    }
  };

  // scan-point.ts:38 `this.pageType = navParams.data.type` (the `mode` param is never read). Any other value renders the header with no title and no content.
  const pageType = route?.params?.type;

  // scan-point.ts:23-36 fields
  const qrCodeData = useRef<any[]>([]); // :176
  const totalPoint = useRef<any>(0); // :36
  const data = useRef<any>({}); // :26
  const saveFlag = useRef<any>(true); // :309
  const [submitted, setSubmitted] = useState(false); // f.submitted of the form inside `*ngIf="qrCodeData.length"`
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // ---- overlays (scan-point.ts:54-168) ----------------------------------------------------------------------------------------
  // :54-73 showSuccessPoint1 (couponAddList success)
  function showSuccessPoint1(text: any) {
    showAlert({ title: 'Success!', cssClass: 'action-close', subTitle: text, buttons: [{ text: 'Okay', handler: () => {} }] });
  }
  // :74-98 showSuccessPoint (scan success): 'Scan More' scans again
  function showSuccessPoint(text: any) {
    showAlert({
      title: 'Success!',
      cssClass: 'action-close',
      subTitle: text,
      buttons: [{ text: 'Scan More', handler: () => scan_tips() }, { text: 'Okay', handler: () => {} }],
    });
  }
  // :99-120 showAlert: 'Scan again' scans again
  function showAlertScan(text: any) {
    showAlert({
      title: 'Alert!',
      cssClass: 'action-close',
      subTitle: text,
      buttons: [{ text: 'Scan again', handler: () => scan_tips() }, { text: 'Okay', handler: () => {} }],
    });
  }
  // :121-130 showSuccess (saveCoupon)
  function showSuccess(text: any) {
    showAlert({ title: 'Success!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  }
  // :131-147 showAlert1
  function showAlert1(text: any) {
    showAlert({ title: 'Alert!', cssClass: 'action-close', subTitle: text, buttons: [{ text: 'Okay', handler: () => {} }] });
  }
  // :148-168 formAlert
  // NOTE (parity): the first button has a handler but NO text, so Ionic draws an empty button that starts a scan when tapped; copied.
  function formAlert(text: any) {
    showAlert({
      title: 'Alert!',
      cssClass: 'action-close',
      subTitle: text,
      buttons: [{ text: '', handler: () => scan_tips() }, { text: 'Okay', handler: () => {} }],
    });
  }

  // :171-174
  function scan_tips() {
    scan();
  }

  // :177-233 scan()
  // NOTE (parity): `barcodeScanner.scan(options).then(...)` has no catch in Ionic: a denied permission or plugin error does nothing. A cancelled scan
  // resolves with text '' (see src/native/scanner.ts) and `this.qr_code = resp.text` still runs.
  function scan() {
    scanQr({ prompt: '' }).then(res => {
      if (!res.ok) {
        return;
      }
      const qrCode = res.value; // :182 this.qr_code = resp.text
      if (qrCode != '') { // eslint-disable-line eqeqeq
        db.post_rqst({ karigar_id: db.userStorageData.id, qr_code: qrCode }, 'app_karigar/checkCoupon').then(
          (r: any) => {
            try {
              // NOTE (parity): a null body makes `r.status` throw a TypeError inside Ionic's subscribe callback: nothing else happens.
              if (r.status == 'INVALID') { // eslint-disable-line eqeqeq
                showAlertScan('Invalid Coupon Code');
                return;
              } else if (r.status == 'USED') { // eslint-disable-line eqeqeq
                // :197-200 alertMsg.* are copied from the response; the date goes through moment(...).format("D-M-Y")
                const scanDate = momentFormat(r.scan_date, 'D-M-Y');
                showAlertScan('Coupon Already Used By ' + r.first_name + ' ( ' + r.mobile_no + ' ) on ' + scanDate);
                return;
              } else if (r.status == 'POINTS NOT EXIST') { // eslint-disable-line eqeqeq
                // NOTE (parity): "Exit" typo copied
                showAlertScan('No Points Exit This Product');
                return;
              } else if (r.status == 'UNASSIGNED OFFER') { // eslint-disable-line eqeqeq
                showAlertScan('This Coupon Code is not applicable in your Area');
                return;
              }
              // eslint-disable-next-line eqeqeq
              if (qrCodeData.current.findIndex((q: any) => q.qr_code == qrCode) == -1) {
                qrCodeData.current.push({ qr_code: qrCode, coupon_value: r.coupon_value, product_name: r.product_name });
                // NOTE (parity): `+=` as in Ionic: a string coupon_value concatenates, a missing one makes the total NaN.
                totalPoint.current += r.coupon_value;
                rerender();
              } else {
                showAlertScan('Coupon Already Scanned');
                return;
              }
              showSuccessPoint(r.coupon_value + ' points has been scanned');
            } catch (e) {
              console.log(e);
            }
          },
          () => {
            // NOTE (parity): no error callback in Ionic: after an HTTP error nothing happens (no loader was shown).
          },
        );
      }
    });
  }

  // :236-242 presentToast (this page's own, duration 3000)
  function presentToast(text: string) {
    showToast(text);
  }

  // :245-294 couponAddList() (enter_coupon page: "Add To list")
  function couponAddList() {
    if (!data.current.code) {
      presentToast('Please Enter Coupon Code');
      return;
    }
    db.post_rqst({ karigar_id: db.userStorageData.id, qr_code: data.current.code }, 'app_karigar/checkCoupon').then(
      (r: any) => {
        try {
          if (r.status == 'INVALID') { // eslint-disable-line eqeqeq
            showAlertScan('Invalid Coupon Code');
            return;
          } else if (r.status == 'USED') { // eslint-disable-line eqeqeq
            const scanDate = momentFormat(r.scan_date, 'D-M-Y');
            showAlertScan('Coupon Already Used By ' + r.first_name + ' ( ' + r.mobile_no + ' ) on ' + scanDate);
            return;
          } else if (r.status == 'POINTS NOT EXIST') { // eslint-disable-line eqeqeq
            showAlert1('No Points Exit This Product');
            return;
          } else if (r.status == 'UNASSIGNED OFFER') { // eslint-disable-line eqeqeq
            showAlert1('This Coupon Code is not applicable in your Area');
            return;
          }
          // NOTE (parity): `data.code` is re-read here (the user may have typed since the request was sent), as in Ionic.
          // eslint-disable-next-line eqeqeq
          if (qrCodeData.current.findIndex((q: any) => q.qr_code == data.current.code) == -1) {
            // NOTE (parity): product_name comes from `product_point_group` on this page
            qrCodeData.current.push({ qr_code: data.current.code, coupon_value: r.coupon_value, product_name: r.product_point_group });
            totalPoint.current += r.coupon_value;
          } else {
            showAlert1('Coupon Already Used');
            return;
          }
          showSuccessPoint1(r.coupon_value + ' points has been added');
          data.current.code = '';
          rerender();
        } catch (e) {
          console.log(e);
        }
      },
      () => {
        // NOTE (parity): no error callback in Ionic
      },
    );
  }

  // :301-306 delete(i, value)
  function deleteRow(i: number, value: any) {
    qrCodeData.current.splice(i, 1);
    totalPoint.current = totalPoint.current - value;
    if (qrCodeData.current.length === 0) {
      // the `<ng-container *ngIf="qrCodeData.length">` form is destroyed: its submitted / touched state goes with it
      setSubmitted(false);
      setTouched({});
    }
    rerender();
  }

  // :311-377 checkNumber(mobile) from (ngModelChange) of the plumber mobile input
  function checkNumber(mobile: any) {
    if (mobile.length == 10) { // eslint-disable-line eqeqeq
      db.post_rqst({ mobile_no: mobile, karigar_id: db.userStorageData.id }, 'app_karigar/checkNumber').then(
        (r: any) => {
          try {
            if (r.status == 'OWNEXIST') { // eslint-disable-line eqeqeq
              const role = db.userStorageData.type === 'Dealer' ? 'Dealer' : 'Seller';
              formAlert('This number is registered as ' + role + ', please use Plumber number to proceed request');
              saveFlag.current = false;
              return;
            } else if (r.status == 'EXIST' && r.type != 'Plumber') { // eslint-disable-line eqeqeq
              // NOTE (parity): a registered non-Plumber number gets the "does not Exists" text (typo copied) and the input is cleared
              formAlert(mobile + ' this mobile number does not Exists');
              data.current.plumber_mobile_no = '';
              saveFlag.current = false;
              rerender();
              return;
            } else if (r.status == 'EXIST') { // eslint-disable-line eqeqeq
              getContractor(mobile);
              onResendOtpHandler(mobile);
              saveFlag.current = true;
            } else if (r.status == 'NOTEXIST') { // eslint-disable-line eqeqeq
              formAlert(mobile + ' this mobile number is not Exists');
              data.current.plumber_mobile_no = '';
              saveFlag.current = false;
              rerender();
              return;
            }
          } catch (e) {
            console.log(e);
          }
        },
        () => {
          // NOTE (parity): no error callback in Ionic
        },
      );
    }
  }

  // :379-404 getContractor(mobile)
  function getContractor(mobile: any) {
    if (mobile.length == 10) { // eslint-disable-line eqeqeq
      db.post_rqst({ search: mobile }, 'app_karigar/get_plumber').then(
        (r: any) => {
          try {
            if (r.plumber == null) {
              data.current.plumber_id = 0;
            } else {
              data.current.plumber_name = r.plumber.first_name;
              data.current.plumber_id = r.plumber.id;
            }
            rerender();
          } catch (e) {
            console.log(e);
          }
        },
        () => {
          // NOTE (parity): no error callback in Ionic
        },
      );
    } else {
      data.current.plumber_name = '';
    }
  }

  // :408-422 onResendOtpHandler(mobile)
  // NOTE (parity): the OTP is only SENT. The "Enter OTP" input is commented out in the template (html:85-91), nothing ever reads or checks it, and the response is ignored.
  function onResendOtpHandler(mobile: any) {
    if (mobile.length == 10) { // eslint-disable-line eqeqeq
      db.post_rqst({ mobile_no: mobile }, 'app_karigar/couponScanOtp').then(
        () => {},
        () => {
          // NOTE (parity): no error callback in Ionic
        },
      );
    }
  }

  // :425-448 submit()
  function submit() {
    if (saveFlag.current == false) { // eslint-disable-line eqeqeq
      const role = db.userStorageData.type === 'Dealer' ? 'Dealer' : 'Seller';
      formAlert('This number is registered as ' + role + ', please use Plumber number to proceed request');
      return;
    }
    // :434-436 the scanner's role goes to the backend (Sales_Boy -> retailer_point, Dealer -> dealer_point)
    data.current.sales_boy_id = db.userStorageData.id;
    data.current.scanner_id = db.userStorageData.id;
    data.current.scanner_type = db.userStorageData.type;

    db.post_rqst({ data: data.current, qr_code: qrCodeData.current }, 'app_karigar/saveCoupon').then(
      () => {
        // NOTE (parity): any response (even a failure status) shows "Wallet update successfully" and pushes Home; there is no loader, so a second tap sends it again.
        showSuccess('Wallet update successfully');
        navigation.push('Home');
      },
      () => {
        // NOTE (parity): no error callback in Ionic: after an HTTP error nothing happens
      },
    );
  }

  // ---- Angular form validity (ngModel: required / minlength / maxlength) -------------------------------------------------------
  const d = data.current;
  const invalidMobile = isEmpty(d.plumber_mobile_no) || lenInvalid(d.plumber_mobile_no, 10);
  const invalidName = isEmpty(d.plumber_name);
  const formValid = !invalidMobile && !invalidName;
  const touch = (name: string) => setTouched(prev => ({ ...prev, [name]: true }));
  const errMobile = submitted && invalidMobile;
  const errName = submitted && invalidName;

  // html:42-82 / :129-170 `<form (ngSubmit)="f.form.valid && submit();">`
  function onSubmit() {
    setSubmitted(true);
    if (formValid) {
      submit();
    }
  }

  const ink = contentMd.textColor;
  const line = csInputLine();
  // NOTE (parity): the kit's csInput variant is the registration form's (min-height 45, margin 16px 0, label 14px at -15, input padding-top 15);
  // scan-point.scss:142-163 differs (height 40, margin-bottom 10, label 13px at -17, input padding-top 12). Item box and input are overridden here,
  // the label size / offset is the kit's (reported to the lead).
  const inputStyle = { paddingTop: 12, height: line + 12 };

  // html:42-82 and :129-170: the form shared by both page types
  function renderForm() {
    return (
      <View testID="scanpoint-form" style={styles.fields}>
        <View style={styles.heading}>
          <Text style={textStyle(14, 400, ink)}>{t('Basic Information')}</Text>
        </View>
        <IonList style={styles.formList}>
          <View>
            <IonInputItem
              testID="plumber_mobile_no"
              variant="csInput"
              floating
              // `{{'Plumber Mobile No' | translate}} *`: the star is plain label text here, not a coloured span
              label={`${t('Plumber Mobile No')} *`}
              type="tel"
              // NOTE (parity): `maxlength="10"` on <ion-input> is only an Angular validator (no native limit), so an 11th digit can be typed
              error={errMobile}
              value={d.plumber_mobile_no ?? ''}
              validation={{ valid: !invalidMobile, invalid: invalidMobile, touched: !!touched.plumber_mobile_no }}
              onBlur={() => touch('plumber_mobile_no')}
              onChangeText={s => {
                // [(ngModel)] writes the model, then (ngModelChange)="checkNumber(data.plumber_mobile_no)" runs
                d.plumber_mobile_no = s;
                rerender();
                checkNumber(d.plumber_mobile_no);
              }}
              itemStyle={styles.csItem}
              inputStyle={inputStyle}
            />
            {errMobile ? (
              // NOTE (parity): one message "required" for every invalid state (empty or not 10 characters)
              <Text testID="plumber_mobile_no-error" style={[textStyle(14, 400, S.errorMsg), styles.errorMsg]}>
                required
              </Text>
            ) : null}
            <IonInputItem
              testID="plumber_name"
              variant="csInput"
              floating
              label={`${t('Plumber Name')} *`}
              isLast={!errName}
              error={errName}
              value={d.plumber_name ?? ''}
              validation={{ valid: !invalidName, invalid: invalidName, touched: !!touched.plumber_name }}
              onBlur={() => touch('plumber_name')}
              onChangeText={s => {
                d.plumber_name = s;
                rerender();
              }}
              itemStyle={styles.csItem}
              inputStyle={inputStyle}
            />
            {errName ? (
              <Text testID="plumber_name-error" style={[textStyle(14, 400, S.errorMsg), styles.errorMsg]}>
                required
              </Text>
            ) : null}
            {/* html:77-82 the "Enter OTP" input is commented out */}
          </View>
        </IonList>
        {/* html:84 `<button ion-button full color="primary" round>Save</button>` */}
        <IonButton testID="scanpoint-save" full round color="primary" onPress={onSubmit}>
          Save
        </IonButton>
      </View>
    );
  }

  // html:19-44 / :115-135 the history list (scan: with the product name; enter_coupon: without)
  function renderList(headerKey: string, totalKey: string, withProduct: boolean) {
    const rows = qrCodeData.current;
    return (
      <IonList>
        <IonListHeader color="secondary" style={styles.listHeader} labelStyle={textStyle(16, 400, ink, 18)}>
          {t(headerKey)}
        </IonListHeader>
        {rows.map((list: any, i: number) => (
          <IonItem key={i} testID={`scanpoint-item-${i}`}>
            <IonLabel>
              <View style={styles.grid}>
                <View style={styles.leftBlock}>
                  <Text style={textStyle(12, 400, ink, 18)}>
                    {t('Coupon Code')}
                    <Text style={textStyle(12, 400, S.strongColor, 18)}>{` : ${interp(list.qr_code)}`}</Text>
                  </Text>
                  {withProduct && interp(list.product_name) !== '' ? <Text style={textStyle(12, 400, ink, 18)}>{interp(list.product_name)}</Text> : null}
                </View>
                <View style={styles.rightBlock}>
                  <View style={styles.rightH2}>
                    <Text numberOfLines={1} style={textStyle(16, 700, ink, 19.2)}>
                      {interp(list.coupon_value)}
                    </Text>
                    <Text numberOfLines={1} style={textStyle(12, 400, S.ptColor, 18)}>
                      PT
                    </Text>
                  </View>
                  <Pressable testID={`scanpoint-delete-${i}`} onPress={() => deleteRow(i, list.coupon_value)}>
                    <MaterialIcon name="delete" size={24} color={S.deleteIcon} />
                  </Pressable>
                </View>
              </View>
            </IonLabel>
          </IonItem>
        ))}
        {/* html:41-43 / :128-130 `.total-points`: label + floated `<span>{{totalPoint}} <span> &nbsp; PT</span></span>` */}
        <IonListHeader testID="scanpoint-total" style={styles.totalHeader} labelStyle={textStyle(16, 400, S.totalLabel, 18)}>
          {t(totalKey)}
          <View style={styles.totalValueRow}>
            <Text testID="scanpoint-total-value" style={textStyle(18, 600, S.totalValue, 21)}>
              {interp(totalPoint.current)}
            </Text>
            <Text style={[textStyle(18, 600, S.totalUnit, 21), styles.totalUnit]}>{'  PT'}</Text>
          </View>
        </IonListHeader>
      </IonList>
    );
  }

  const title = pageType == 'scan' ? t('Scan Qr Code') : pageType == 'enter_coupon' ? t('Enter Coupom Number') : undefined; // eslint-disable-line eqeqeq
  const hasRows = qrCodeData.current.length > 0;

  return (
    <View style={styles.screen}>
      {/* html:7-13 */}
      <Header mainHeader remove color="primary" title={title} />
      {pageType == 'scan' ? ( // eslint-disable-line eqeqeq
        // html:15-88
        <IonContent padding>
          {!hasRows ? (
            // html:19-22 `.qr-code-data { height: 70vh }`
            <View testID="scanpoint-qr-code-data" style={[styles.qrCodeData, { height: windowHeight * 0.7 }]}>
              <Image source={qrImg} style={[styles.qrImage, { width: 170 * qrRatio }]} />
              <Text style={[textStyle(16, 400, ink), styles.qrText]}>
                {t('Start Scanning, click a')}
                {'\n'}
                <Text style={{ color: S.qrTextSpan }}>{`${t('Scan Qr Code')} `}</Text>
                {t('button')}
              </Text>
            </View>
          ) : null}
          {hasRows ? renderList('Scan History', 'Total Scan Point', true) : null}
          {hasRows ? renderForm() : null}
          {/* html:84-91 */}
          <View style={styles.mt16}>
            <IonButton testID="scanpoint-scan" full round color="success" iconOnly="qr-scanner" onPress={scan}>
              Scan QR Code
            </IonButton>
          </View>
        </IonContent>
      ) : null}
      {pageType == 'enter_coupon' ? ( // eslint-disable-line eqeqeq
        // html:97-171
        <IonContent padding>
          <View style={styles.fields}>
            <IonList style={styles.formList}>
              <IonInputItem
                testID="code"
                variant="csInput"
                floating
                label={t('Coupon Code')}
                isLast
                value={d.code ?? ''}
                onChangeText={s => {
                  d.code = s;
                  rerender();
                }}
                itemStyle={styles.csItem}
                inputStyle={inputStyle}
              />
            </IonList>
            {/* html:111 `<a ion-button full color="primary" (click)="couponAddList()" round> Add To list</a>` */}
            <IonButton testID="scanpoint-add" as="a" full round color="primary" onPress={couponAddList}>
              Add To list
            </IonButton>
          </View>
          {hasRows ? renderList('Coupon Code History', 'Total Point', false) : null}
          {hasRows ? renderForm() : null}
        </IonContent>
      ) : null}
    </View>
  );
}

