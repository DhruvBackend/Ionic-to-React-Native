// DEVELOPMENT ONLY: plan Task 9 part 5A (content controls: forms & lists) for the gallery / parity capture. Every control is the
// Ionic 3 md replica in src/components/ionic, set up the way a Topbath page uses it (cited page in each label).
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IonButton } from '../../components/ionic/IonButton';
import { IonCard, IonCardContent, IonCardHeader } from '../../components/ionic/IonCard';
import { IonCheckbox, IonRadio, IonRadioGroup } from '../../components/ionic/IonChoice';
import { IonCol, IonGrid, IonRow } from '../../components/ionic/IonContent';
import { IonInputItem } from '../../components/ionic/IonInput';
import { IonItem, IonList, IonListHeader } from '../../components/ionic/IonList';
import { buttonMd } from '../../theme/ionicMdContent';
import { fontFor } from '../../theme/typography';

export function ContentSection() {
  const [reg, setReg] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [remark, setRemark] = useState('');
  const [editName, setEditName] = useState('');
  const [presses, setPresses] = useState(0);
  const [log, setLog] = useState('');
  const noop = () => undefined;
  return (
    <View testID="gallery-content">
      <Text style={styles.h}>Content controls: buttons (button ion-button)</Text>
      <Text style={styles.label}>block round primary (login, 47 pages)</Text>
      <IonButton color="primary" block round onPress={() => setPresses(p => p + 1)} testID="ct-btn-block">
        Submit
      </IonButton>
      <Text style={styles.label}>presses: {presses}</Text>
      <Text style={styles.label}>default / full / disabled / icon-only / icon-start / small clear / outline</Text>
      <IonButton>Default</IonButton>
      <IonButton full color="primary">
        Full
      </IonButton>
      <IonButton color="primary" block round disabled>
        Disabled
      </IonButton>
      <View style={styles.row}>
        <IonButton iconOnly="add" color="light" />
        <IonButton color="danger" iconStart="add" background={buttonMd.greenColorBackground}>
          Scan
        </IonButton>
        <IonButton kind="clear" small>
          Small
        </IonButton>
        <IonButton kind="outline">Out</IonButton>
        <IonButton as="a">Link</IonButton>
      </View>
      <Text style={styles.label}>cs-btn (40) / cs-btn re-btn</Text>
      <IonButton csBtn>Save</IonButton>
      <IonButton reBtn>Register</IonButton>

      <Text style={styles.h}>Lists: radio-group (select-registration-type)</Text>
      <IonList>
        <IonRadioGroup value={reg} onChange={v => setLog(`ionChange ${String(v)}`)}>
          <IonListHeader borderHeading>Select Registration Type</IonListHeader>
          {['Plumber', 'Sales_Boy', 'Dealer'].map(v => (
            <IonItem key={v} label={v}>
              <IonRadio color="primary" value={v} testID={`ct-radio-${v}`} onPress={x => setReg(x as string)} />
            </IonItem>
          ))}
        </IonRadioGroup>
      </IonList>
      <Text style={styles.label}>{log}</Text>
      <Text style={styles.label}>checkbox (plumber-add) / plain list header</Text>
      <IonList>
        <IonListHeader>Scan History</IonListHeader>
        <IonItem label="Same as Working Address">
          <IonCheckbox color="dark" onChange={c => setLog(`checkbox ${c.checked}`)} testID="ct-checkbox" />
        </IonItem>
        <IonItem>
          <IonCheckbox color="secondary" checked />
        </IonItem>
        <IonItem button label="button ion-item (ripple)" onPress={noop} testID="ct-item-button" />
      </IonList>

      <Text style={styles.h}>Inputs: cs-input registration form (registration.html)</Text>
      <IonList>
        <IonInputItem variant="csInput" floating label="Name" requiredMark value={name} onChangeText={setName} />
        <IonInputItem variant="csInput" floating label="Mobile" value={mobile} onChangeText={setMobile} type="tel" maxLength={10} error={mobile.length > 0 && mobile.length < 10} />
        <IonInputItem variant="csInput" floating label="Remark" textarea value={remark} onChangeText={setRemark} />
      </IonList>
      <Text style={styles.label}>plain floating item-input (underline on focus) / .edit page / cs-textarea1</Text>
      <IonList>
        <IonInputItem floating label="Mobile" type="tel" value={mobile} onChangeText={setMobile} />
        <IonInputItem placeholder="Search" value="" onChangeText={noop} />
      </IonList>
      <View style={styles.edit}>
        <IonList>
          <IonInputItem variant="edit" floating label="Name" value={editName} onChangeText={setEditName} />
          <IonInputItem variant="editTextarea" floating label="Description" textarea value="" onChangeText={noop} />
        </IonList>
      </View>

      <Text style={styles.h}>Card (survey-list) and grid (attendence col-1 calendar)</Text>
      <IonCard>
        <IonCardHeader>Customer survey</IonCardHeader>
        <IonCardContent afterHeader>Card content text</IonCardContent>
      </IonCard>
      <IonGrid>
        <IonRow>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'].map(d => (
            <IonCol key={d} col={1}>
              <Text style={styles.label}>{d}</Text>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>
    </View>
  );
}

const styles = StyleSheet.create({
  h: { ...fontFor(700), fontSize: 16, marginTop: 14, marginBottom: 6 },
  label: { fontSize: 8, marginTop: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  edit: { marginHorizontal: 0 },
});
