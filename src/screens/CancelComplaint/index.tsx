// Ported from: src/pages/cancel-complaint/cancel-complaint.html + .ts + .scss
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { db } from '../../api/client';
import { IonButton } from '../../components/ionic/IonButton';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonList } from '../../components/ionic/IonList';
import { MaterialIcon } from '../../components/ionic/MaterialIcon';
import { imageViewerMd } from '../../theme/ionicMdScroll';
import { complaintMd as C } from '../../theme/ionicMdComplaint';
import { styles } from './styles';

interface Props {
  navigation: { goBack: () => void };
  route?: { params?: { id?: any; label?: any } };
}

export default function CancelComplaintScreen({ navigation, route }: Props) {
  // :29-35 ionViewDidLoad: complaint_id = navParams.get('id')
  // NOTE (parity): `label` is passed by ComplaintDetail but its read (:32) is commented out.
  const complaintId = useRef<any>(undefined);
  const [remark, setRemark] = useState<string | undefined>(undefined); // complaint.remark
  const [pageHeight, setPageHeight] = useState(0); // `.my-module .scroll-content` starts at 25% of this (see styles.page)
  useEffect(() => {
    complaintId.current = route?.params?.id;
  }, [route]);

  // :37-39 closeModal(): viewCtrl.dismiss()
  function closeModal() {
    navigation.goBack();
  }

  // html:10 `(ngSubmit)="f.form.valid && submit()"`: the textarea is `required`
  // NOTE (parity): `required` only rejects an empty / missing value (spaces are valid). The `error` class set on submit has no style for
  // `.cs-textarea` (the `&.error` rules of variables.scss sit under `.cs-input`), so nothing shows when the form is invalid.
  function onSubmit() {
    if (remark === undefined || remark === null || remark === '') {
      return;
    }
    submit();
  }

  // :44-52 submit()
  function submit() {
    // NOTE (parity): complaint_id is read in ionViewDidLoad; a missing 'id' is sent as undefined (dropped from the JSON).
    db.onPostRequestDataFromApi(
      { id: complaintId.current ?? route?.params?.id, reason_cancel: remark, customer_id: db.userStorageData?.id },
      'app_karigar/cancelComplaintByCustomer',
      db.rootUrl,
    ).then(
      () => {
        closeModal();
      },
      // NOTE (parity): no error callback in Ionic: after an HTTP error the modal simply stays open.
      () => {},
    );
  }

  return (
    <View testID="cancel-complaint" style={[styles.page, { paddingTop: pageHeight / 4 }]} onLayout={e => setPageHeight(e.nativeEvent.layout.height)}>
      <View testID="pop-imge" style={styles.pop}>
        {/* html:11-35 form > .main-field > .cs-form > ion-list > ion-item.cs-textarea */}
        <View style={styles.mainField}>
          <IonList style={styles.list}>
            <IonInputItem
              testID="cancel-remark"
              textarea
              variant="plain"
              floating
              label="Cancel Reason"
              value={remark ?? ''}
              onChangeText={setRemark}
              itemStyle={styles.item}
              // global `.cs-textarea` floating label: 15px / #949494 !important / padding-left 14
              labelStyle={styles.floatLabel}
              innerStyle={styles.inner} // `.cs-textarea .item-inner { padding-right: 0 }`
            />
          </IonList>
          {/* html:23-28 .enquiry-btn.my-btn > button[color=danger] > p */}
          <IonButton testID="cancel-submit" color="danger" block background={C.submit} style={styles.button} labelStyle={styles.buttonLabel} onPress={onSubmit}>
            Submit
          </IonButton>
        </View>
        {/* html:32-34 */}
        <Pressable testID="cancel-close" onPress={closeModal} style={styles.close}>
          <MaterialIcon name="clear" size={imageViewerMd.closeIconSize} color={imageViewerMd.closeIconColor} />
        </Pressable>
      </View>
    </View>
  );
}
