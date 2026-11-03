// Ported from: src/pages/pointtranfer/pointtranfer.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { textStyle } from '../../components/ionic/text';
import { pointtranferMd } from '../../theme/ionicMdPointtranfer';
import { collapseWs } from '../../ui/angularPipes';
import { showAlert } from '../../ui/overlays';
import { styles } from './styles';

interface Props {
  navigation: { goBack: () => void };
  // Home pushes {totalPoint: this.total_balence} (home.ts:658); undefined if the params are missing.
  route?: { params?: { totalPoint?: any } };
}

// NOTE (parity): pointtranfer.module.ts has its own TranslateModule.forRoot, but the module is imported eagerly by AppModule (app.module.ts:219),
// so the root TranslateService (language chosen at Otp / Language) applies; the page never calls use(). RN's global i18n gives the same result.
export default function PointtranferScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  // :19-20 `data:any = {}` (ngModel target; keys appear in typing order) and :21 total_point from navParams (:25)
  const data = useRef<any>({});
  const totalPoint = useRef<any>(route?.params?.totalPoint);
  const limit = useRef<any>(0); // :94 `limit:number = 0`, replaced by r.limit
  const [mobileNo, setMobileNo] = useState<string | undefined>(undefined); // data.mobile_no
  const [points, setPoints] = useState<string | undefined>(undefined); // data.points
  const [istrue, setIstrue] = useState(false); // :22 `istrue` (button [disabled]); set only after SUCCESS

  // :35-45 showSuccess(text): translate.get('Alert') -> alertCtrl.create({title: resp+'!', subTitle: text, buttons: ['ok']})
  // NOTE (parity): the button text is the lowercase 'ok' (the md alert upper-cases it); the message is not translated. The kit alert collapses the
  // double spaces of "Please  Enter Transfer Amount" / "You Can  Transfer Only ..." like innerHTML.
  function showSuccess(text: string) {
    showAlert({ title: t('Alert') + '!', subTitle: text, buttons: ['ok'] });
  }

  // :46-53 PointList() from ionViewDidLoad (:29-32), no loader, no error callback
  useEffect(() => {
    db.post_rqst({}, 'app_karigar/plumber_limit')
      .then((r: any) => {
        limit.current = r.limit; // NOTE (parity): a null body throws inside the subscribe callback (only logged in Ionic); `limit` stays 0
      })
      .catch(() => {});
  }, []);

  // :54-90 submit(). No loader anywhere.
  function submit() {
    if (!data.current.mobile_no) {
      showSuccess('Please Enter a Mobile Number');
      return;
    }
    if (!data.current.points) {
      showSuccess('Please  Enter Transfer Amount');
      return;
    }
    // NOTE (parity): `limit < points` compares a number (or whatever the server sent) with the typed STRING: JS coerces to a number when
    // `limit` is a number, but compares as strings when the server sends it as a string ("500" < "60" is true). Copied as is. While the
    // limit request is pending or failed `limit` is 0, so any amount is refused with "You Can  Transfer Only 0 Point ".
    if (limit.current < data.current.points) {
      showSuccess('You Can  Transfer Only ' + limit.current + ' Point ');
      return;
    }
    // NOTE (parity): same loose compare of total_point (the Home balance) with the typed string.
    if (totalPoint.current < data.current.points) {
      showSuccess('You Have Insufficient Balence');
      return;
    }
    data.current.karigar_id = db.userStorageData.id; // :77
    db.post_rqst(data.current, 'app_karigar/plumber_transfer_points')
      .then((r: any) => {
        const status = r.status; // :80 (a null body throws: nothing happens)
        if (status == 'karigar_not_exist') { // eslint-disable-line eqeqeq
          showSuccess('Plumber not Exist');
        } else if (status == 'SUCCESS') { // eslint-disable-line eqeqeq
          showSuccess('Point Transfer Successfully');
          setIstrue(true);
          navigation.goBack(); // :90 navCtrl.pop(): the alert stays up over the previous page
        }
        // any other status: nothing
      })
      // NOTE (parity): no error callback in Ionic: a failed request does nothing (and no loader was shown).
      .catch(() => {});
  }

  return (
    <View style={styles.screen}>
      {/* html:1-5 `main-header remove`: the back button shows */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(t('Point Transfer'))} />
      </IonHeader>

      {/* html:7-47 */}
      <IonContent>
        <View style={styles.padding16}>
          <View>
            {/* html:16-34 the commented-out select leaves an empty .input-adjust */}
            <View style={styles.inputAdjust} />
            <View style={styles.inputAdjust}>
              {/* NOTE (parity): bare <input type="tel" maxlength="10" minlength="10" required>; `required`/`minlength` only mark the
                  ngForm invalid, which nothing reads: submit() checks only that the field is not empty (a 3-digit number is sent). */}
              <TextInput
                testID="mobile-input"
                value={mobileNo ?? ''}
                onChangeText={text => {
                  data.current.mobile_no = text;
                  setMobileNo(text);
                }}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder={collapseWs(t('Mobile No'))}
                placeholderTextColor={pointtranferMd.placeholder}
                underlineColorAndroid="transparent"
                style={[styles.input, textStyle(14, 400, pointtranferMd.ink, 16)]}
              />
            </View>
          </View>
          <View style={styles.inputSectionPad}>
            <View style={styles.inputAdjust}>
              {/* NOTE (parity): type="tel" without maxlength: any text; compared loosely with the limit and the balance. */}
              <TextInput
                testID="points-input"
                value={points ?? ''}
                onChangeText={text => {
                  data.current.points = text;
                  setPoints(text);
                }}
                keyboardType="phone-pad"
                placeholder={collapseWs(t('Transfer Amount'))}
                placeholderTextColor={pointtranferMd.placeholder}
                underlineColorAndroid="transparent"
                style={[styles.input, textStyle(14, 400, pointtranferMd.ink, 16)]}
              />
            </View>
          </View>
          {/* html:44 */}
          <IonButton full color="primary" disabled={istrue} onPress={submit} testID="transfer-submit">
            {collapseWs(t('Transfer Point'))}
          </IonButton>
        </View>
      </IonContent>
    </View>
  );
}
