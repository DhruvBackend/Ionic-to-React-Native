// Ported from: src/pages/scane-pages/coupan-code/coupan-code.html + .ts + .scss
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { db } from '../../api/client';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { scanQr } from '../../native';
import { colors } from '../../theme';
import { coupanCodeMd } from '../../theme/ionicMdCoupanCode';
import { showAlert } from '../../ui/overlays';
import { styles } from './styles';

interface Props {
  navigation: { push?: (name: string, params?: object) => void; reset: (state: object) => void };
  // NOTE (parity): Home pushes with no params or {mode:'home'}; coupan-code.ts never reads navParams.
  route?: { params?: { mode?: any } };
}

// NOTE (parity): coupan-code.module.ts imports only IonicPageModule (no TranslateModule) and the page never calls translate or use():
// every text is a literal, nothing is translated, whatever language is selected.
export default function CoupanCodeScreen({ navigation }: Props) {
  // coupan-code.ts:13-15 fields. `data.code` is the ngModel of the input (undefined until the user types), `flag` is '' until Submit.
  const [code, setCode] = useState<any>(undefined);
  const [flag, setFlag] = useState<any>('');

  // :107-115 / :117-125
  const showAlertMsg = (text: string) => showAlert({ title: 'Alert!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  const showSuccess = (text: string) => showAlert({ title: 'Success!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  // :63 / :96 this.navCtrl.setRoot(TabsPage, {index:'0'}) (the success alert is presented first and stays up over Tabs)
  const goTabs = () => navigation.reset({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });

  // :29-70 submit(data)
  const submit = (data: any) => {
    setFlag(1); // :31
    // NOTE (parity): `data` is undefined when nothing was typed (the key is then dropped from the JSON body); an emptied box sends ''.
    const qrCode = data; // :33
    db.onPostRequestDataFromApi({ karigar_id: db.userStorageData.id, qr_code: qrCode }, 'app_karigar/karigarCoupon', db.rootUrl)
      .then((r: any) => {
        // A subscribe callback that throws (null body) only logs in Ionic; no error callback either (a failed request is silent).
        try {
          if (r.status == 'BLANK') { // eslint-disable-line eqeqeq
            showAlertMsg("This Coupon Code doesn't contain any Value");
            return;
          } else if (r.status == 'INVALID') { // eslint-disable-line eqeqeq
            showAlertMsg('Invalid Coupon Code');
            return;
          } else if (r.status == 'REQUIRED') { // eslint-disable-line eqeqeq
            showAlertMsg('Please Enter Coupon Code');
            return;
          } else if (r.status == 'POINTS NOT EXIST') { // eslint-disable-line eqeqeq
            // NOTE (parity): "Exit" (sic).
            showAlertMsg('No Points Exit This Product');
            return;
          } else if (r.status == 'USED') { // eslint-disable-line eqeqeq
            // NOTE (parity): unlike home.ts, this page does not name who used the coupon.
            showAlertMsg('Coupon Already Used');
            return;
          } else if (r.status == 'UNASSIGNED OFFER') { // eslint-disable-line eqeqeq
            showAlertMsg('This Coupon Code is not applicable in your Area');
            return;
          }
          // NOTE (parity): any other status (also an empty / malformed body) is a success: "undefined points has been added ..."
          showSuccess(r.coupon_value + ' points has been added into your wallet');
          goTabs();
        } catch (e) {
          console.log(e);
        }
      })
      .catch(() => {});
  };

  // :71-105 scan()
  const scan = () => {
    // NOTE (parity): the plugin resolves { text: '' } when the user backs out (scanQr gives ok('')); a denied permission / plugin
    // error has no catch in Ionic and does nothing.
    scanQr().then(res => {
      if (!res.ok) {
        return;
      }
      const qrCode = res.value; // :74
      if (qrCode != '') { // eslint-disable-line eqeqeq
        db.onPostRequestDataFromApi({ karigar_id: db.userStorageData.id, qr_code: qrCode }, 'app_karigar/karigarCoupon', db.rootUrl)
          .then((r: any) => {
            try {
              // NOTE (parity): a shorter branch list than submit(): no BLANK / POINTS NOT EXIST (they fall through to the success
              // alert with "undefined points"), UNASSIGNED OFFER says "Invalid Coupon Code", REQUIRED has a trailing space.
              if (r.status == 'INVALID') { // eslint-disable-line eqeqeq
                showAlertMsg('Invalid Coupon Code');
                return;
              } else if (r.status == 'USED') { // eslint-disable-line eqeqeq
                showAlertMsg('Coupon Already Used');
                return;
              } else if (r.status == 'UNASSIGNED OFFER') { // eslint-disable-line eqeqeq
                showAlertMsg('Invalid Coupon Code');
                return;
              } else if (r.status == 'REQUIRED') { // eslint-disable-line eqeqeq
                showAlertMsg('Please Enter the coupon code ');
                return;
              }
              showSuccess(r.coupon_value + ' points has been added into your wallet');
              goTabs();
            } catch (e) {
              console.log(e);
            }
          })
          .catch(() => {});
      } else {
        console.log('not scanned anything'); // :101
      }
    });
  };

  return (
    <View style={styles.screen}>
      {/* html:1-5 `main-header remove`: the back button shows; the title is capitalised by the header */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title="Enter Coupon Code" />
      </IonHeader>

      {/* html:7-26 */}
      <IonContent>
        <View style={styles.bgMargin}>
          <View testID="coupon-paragraph" style={styles.paragraph}>
            <Text style={textStyle(14, 400, coupanCodeMd.ink, 24)}>Please enter coupon code here, to get your points</Text>
          </View>
          <View style={styles.nrmlInput}>
            {/* NOTE (parity): a bare <input type="text"> (not ion-input): no maxlength, no validation, no keyboard type. */}
            <TextInput
              testID="coupon-input"
              value={code ?? ''}
              onChangeText={setCode}
              placeholder="Coupon Code"
              placeholderTextColor={coupanCodeMd.placeholder}
              underlineColorAndroid="transparent"
              style={[styles.input, textStyle(14, 400, coupanCodeMd.ink, 16)]}
            />
          </View>
          {/* html:16-18 */}
          {!code && flag == 1 ? ( // eslint-disable-line eqeqeq
            <View testID="coupon-error">
              <Text style={textStyle(14, 400, coupanCodeMd.ink)}>Required</Text>
            </View>
          ) : null}
          {/* html:19: always enabled (no disabled logic), a click with an empty box still posts */}
          <Pressable testID="coupon-submit" accessibilityRole="button" onPress={() => submit(code)} style={styles.csBtn}>
            <Text style={[textStyle(12, 400, colors.white, 22), styles.csBtnText]}>Submit</Text>
          </Pressable>
          {/* html:22-25 */}
          <View style={styles.scaneImg}>
            <Pressable testID="coupon-scan" accessibilityRole="button" onPress={scan}>
              <MaterialIcon name="qr_code_2" size={32} color={coupanCodeMd.ink} />
            </Pressable>
            <Text style={[textStyle(14, 400, coupanCodeMd.ink), styles.scaneText]}>Tap on scan icon to scan your coupon</Text>
          </View>
        </View>
      </IonContent>
    </View>
  );
}
