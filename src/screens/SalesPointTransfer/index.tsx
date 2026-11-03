// Ported from: src/pages/sales-point-transfer/sales-point-transfer.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { IonicSelectable } from '../../components/ionic/IonicSelectable';
import { textStyle } from '../../components/ionic/text';
import { salesPointTransferMd } from '../../theme/ionicMdSalesPointTransfer';
import { collapseWs } from '../../ui/angularPipes';
import { showAlert } from '../../ui/overlays';
import { styles } from './styles';

interface Props {
  navigation: { goBack: () => void };
  // NOTE (parity): Home pushes {totalPoint: total_balence} (home.ts:662) but this page reads `sales_boy_id` (:29), which is never passed,
  // so data.sales_boy_id starts undefined (and submit() overwrites it anyway). totalPoint is never read.
  route?: { params?: { sales_boy_id?: any; totalPoint?: any } };
}

// NOTE (parity): sales-point-transfer.module.ts has its own TranslateModule.forRoot, but the module is imported eagerly by AppModule
// (app.module.ts:220), so the root TranslateService (language chosen at Otp / Language) applies; the page never calls use().
// RN's global i18n gives the same result.
export default function SalesPointTransferScreen({ navigation, route }: Props) {
  const { t } = useTranslation(); // re-renders on i18n.changeLanguage, like the `| translate` pipe
  // :20 `data:any = {}` (ngModel target) with :29 `data.sales_boy_id = navParams.get('sales_boy_id')` set first: the key comes first in the body
  const data = useRef<any>({ sales_boy_id: route?.params?.sales_boy_id });
  const [plumber, setPlumber] = useState<any>(undefined); // data.plumber_id: the ionic-selectable ngModel
  const [points, setPoints] = useState<string | undefined>(undefined); // data.points
  const [istrue, setIstrue] = useState(false); // :22 `istrue` (button [disabled]); set only after SUCCESS
  const [plumberList, setPlumberList] = useState<any>([]); // :40 `PlumberList:any = []`

  // :140-146 / :147-153 showSuccess(text) / showAlert(text): the button text is 'OK' here (Pointtranfer uses 'ok')
  function showSuccess(text: string) {
    showAlert({ title: 'Success!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  }
  function showAlertMsg(text: string) {
    showAlert({ title: 'Alert!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
  }

  // :46-76 ListOfPlumber() from the constructor (:30): no loader, no error callback
  useEffect(() => {
    const filter: any = {}; // :43 `filter:any = {}`
    filter.limit = 20; // :49
    db.post_rqst({ filter }, 'app_karigar/list_of_plumber')
      .then((d: any) => {
        // NOTE (parity): a subscribe callback that throws only logs in Ionic. A null body throws at `d.karigars` (list stays []); a body with
        // no `karigars` leaves PlumberList undefined and throws at `.length` (no item is changed); a null list entry throws mid-loop.
        const list = d.karigars;
        setPlumberList(list); // :48 `this.PlumberList = d.karigars` (mutated below before the next render)
        for (let i = 0; i < list.length; i++) {
          if (list[i].first_name == null) {
            list[i].first_name = '';
          }
          if (list[i].mobile_no == null) {
            list[i].mobile_no = '';
          }
          // NOTE (parity): loose compares, so a numeric 0 also counts as ''. The label is the picker's text AND its search key: "Name(mobile)".
          if (list[i].first_name != '' || list[i].mobile_no != '') { // eslint-disable-line eqeqeq
            list[i].first_name = list[i].first_name + '(' + list[i].mobile_no + ')';
          }
          // :60-62 `if (first_name == "" && mobile_no == "") first_name = first_name` is a no-op
        }
      })
      .catch(() => {});
  }, []);

  // :95-124 submit(), reached from `(click)="f.form.valid && submit()"`. No loader anywhere.
  function submit() {
    // NOTE (parity): after one attempt data.plumber_id is already the bare id (below), so a second attempt reads
    // `.karigar_id` of a primitive: undefined, and no plumber_id is sent (the picker then shows the id with no text).
    if (data.current.plumber_id) {
      data.current.plumber_id = data.current.plumber_id.karigar_id;
      setPlumber(data.current.plumber_id); // ngModel writes the new model value back into the picker
    }
    data.current.sales_boy_id = db.userStorageData.id; // :103
    db.post_rqst(data.current, 'app_karigar/bonus_points')
      .then((r: any) => {
        const status = r.status; // :107 (a null body throws: nothing happens)
        if (status == 'SUCCESS') { // eslint-disable-line eqeqeq
          showSuccess('Point Transfer Successfully');
          setIstrue(true);
          navigation.goBack(); // :116 navCtrl.pop(): the alert stays up over the previous page
        } else {
          // NOTE (parity): "show went wrong" (sic). Any other status, including a missing one, shows this alert.
          showAlertMsg('show went wrong');
        }
      })
      // NOTE (parity): no error callback in Ionic: a failed request does nothing (and no loader was shown).
      .catch(() => {});
  }

  // html:56 `(click)="f.form.valid && submit()"` on a submit button. Only `points` has `required` (the plumber picker has none), so the
  // form is invalid exactly while points is empty; then the click does nothing at all (no alert).
  // NOTE (parity): ngForm's (submit) also sets `f.submitted`, which only toggles `error` classes that have no style on this page.
  function onPressTransfer() {
    const valid = !(points === undefined || points.length === 0);
    if (valid) {
      submit();
    }
  }

  return (
    <View style={styles.screen}>
      {/* html:14-18 `main-header remove`: the back button shows */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title={collapseWs(t('Point Transfer'))} />
      </IonHeader>

      {/* html:20-59 */}
      <IonContent>
        <View style={styles.padding16}>
          <View>
            <View>
              {/* html:27-43. NOTE (parity): `[ngClass]="{'error': f.submitted && plumber_id?.invalid}"` and the "Field is Required" block never show:
                  the picker has no `required`, so plumber_id is never invalid. */}
              <IonicSelectable
                testID="plumber-select"
                label={collapseWs(t('Select plumber')) + '*'}
                items={plumberList}
                value={plumber ?? null}
                itemValueField="first_name"
                itemTextField="first_name"
                hasVirtualScroll
                canSearch
                onChange={v => {
                  data.current.plumber_id = v;
                  setPlumber(v);
                }}
                itemStyle={styles.selectItem}
              />
            </View>
            <View style={styles.inputSectionPad}>
              <View style={styles.inputAdjust}>
                {/* html:49-52. NOTE (parity): `onkeypress="return event.charCode>=48 && event.charCode<=57"` drops typed non-digits (a RN
                    TextInput cannot tell typing from paste, so paste is filtered too). */}
                <TextInput
                  testID="points-input"
                  value={points ?? ''}
                  onChangeText={text => {
                    const v = text.replace(/[^0-9]/g, '');
                    data.current.points = v;
                    setPoints(v);
                  }}
                  keyboardType="phone-pad"
                  placeholder={collapseWs(t('Transfer Amount'))}
                  placeholderTextColor={salesPointTransferMd.placeholder}
                  underlineColorAndroid="transparent"
                  style={[styles.input, textStyle(14, 400, salesPointTransferMd.ink, 16)]}
                />
              </View>
            </View>
          </View>
          {/* html:56 */}
          <IonButton full color="primary" disabled={istrue} onPress={onPressTransfer} testID="transfer-submit">
            {collapseWs(t('Transfer Point'))}
          </IonButton>
        </View>
      </IonContent>
    </View>
  );
}
