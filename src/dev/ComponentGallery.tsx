// DEVELOPMENT ONLY (registered in RootNavigator for debug builds, see src/config/buildInfo.ts): shows the Ionic replica parts so they
// can be checked on a device and captured for the parity report (plan Task 9 step 6).
// Open with: adb shell am start -a android.intent.action.VIEW -d "topbathrn://open?screen=_ComponentGallery"
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IonIcon } from '../components/ionic/IonIcon';
import { IonDatetime } from '../components/ionic/IonDatetime';
import { IonicSelectable } from '../components/ionic/IonicSelectable';
import { IonSelect } from '../components/ionic/IonSelect';
import { MaterialIcon } from '../components/ionic/MaterialIcon';
import { SelectSearchable } from '../components/ionic/SelectSearchable';
import { fontFor } from '../theme/typography';
import {
  showActionSheet,
  showAlert,
  showLoading,
  showToast,
} from '../ui/overlays';

// Every name used in the Ionic templates (grep of src/**/*.html).
const ION_ICONS = [
  'add',
  'arrow-back',
  'arrow-forward',
  'call',
  'clock',
  'ios-arrow-forward-outline',
  'log-out',
  'md-add-circle',
  'md-create',
  'md-more',
  'md-share',
  'navigate',
  'notifications',
  'qr-scanner',
  'share',
  'trash',
];
const MATERIAL_ICONS = [
  'star',
  'phone',
  'keyboard_arrow_right',
  'cancel',
  'delete_sweep',
  'call',
  'date_range',
  'camera_alt',
  'save',
  'perm_media',
  'clear',
  'info',
  'hourglass_full',
  'create',
  'check_circle',
  'arrow_right_alt',
  'person_add',
  'edit',
  'chevron_right',
  'add_circle',
  'add',
  'place',
  'picture_as_pdf',
  'person',
  'power_settings_new',
  'keyboard_arrow_left',
  'insert_invitation',
  'delete',
  'call_made',
  'apartment',
  'work',
  'verified_user',
  'trending_flat',
  'store',
  'room',
  'public',
  'note_add',
  'my_location',
  'menu',
  'location_on',
  'local_shipping',
  'local_phone',
  'list',
  'keyboard_backspace',
  'import_contacts',
  'how_to_reg',
  'fact_check',
  'engineering',
  'emoji_transportation',
  'email',
  'collections',
  'close',
  'business',
  'arrow_forward',
  'arrow_back',
  'add_shopping_cart',
  'account_balance_wallet',
];

// Each button opens one replica variant (plan Task 9 step 6). Texts are the real Ionic call sites.
const POPUPS: [string, () => void][] = [
  ['Alert plain', () => showAlert({ title: 'Alert!', buttons: ['OK'] })],
  [
    'Alert title+subTitle+message',
    () =>
      showAlert({
        title: 'Are You Sure?',
        subTitle: 'Your Order Data Will Be Discarded ',
        message: 'This is a longer message line to show the 15px grey text.',
        buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Confirm' }],
      }),
  ],
  [
    'Alert radio', // home.ts:318-345
    () =>
      showAlert({
        title: 'Coupon',
        inputs: [
          { type: 'radio', label: 'Coupon Scan', value: 'scan', checked: true },
          { type: 'radio', label: 'Enter Coupon Code', value: 'code' },
        ],
        buttons: [
          'Cancel',
          { text: 'OK', handler: d => console.log('radio', d) },
        ],
      }),
  ],
  [
    'Alert checkbox',
    () =>
      showAlert({
        title: 'Pick',
        inputs: [
          { type: 'checkbox', label: 'One', value: '1', checked: true },
          { type: 'checkbox', label: 'Two', value: '2' },
          { type: 'checkbox', label: 'Three', value: '3' },
        ],
        buttons: [
          'Cancel',
          { text: 'OK', handler: d => console.log('checkbox', d) },
        ],
      }),
  ],
  [
    'Alert text input',
    () =>
      showAlert({
        title: 'Login',
        inputs: [
          { name: 'username', placeholder: 'Username' },
          { name: 'password', placeholder: 'Password', type: 'password' },
        ],
        buttons: [
          'Cancel',
          { text: 'Login', handler: d => console.log('inputs', d) },
        ],
      }),
  ],
  [
    'Alert version update', // versionCheck.ts presentVersionAlert
    () =>
      showAlert({
        title: 'Update Available',
        message:
          'A newer version of this app is available for download. Please update it from PlayStore !',
        buttons: [{ text: 'Cancel' }, { text: 'Update Now' }],
      }),
  ],
  [
    'Alert Message! (action-close)', // dbservice.ts:190 onShowMessageAlertHandler
    () =>
      showAlert({
        title: 'Message!',
        cssClass: 'action-close',
        subTitle: 'Order placed successfully',
        buttons: ['OK'],
      }),
  ],
  [
    'Alert alert-modal (Stop Time)', // dashboard.ts:190
    () =>
      showAlert({
        title: 'Stop Time',
        message: 'Do you want to stop work time?',
        cssClass: 'alert-modal',
        buttons: [{ text: 'Yes' }, { text: 'No', role: 'cancel' }],
      }),
  ],
  [
    'Alert 3 buttons',
    () =>
      showAlert({
        title: 'Three',
        message: 'Vertical buttons',
        buttons: ['One', 'Two', 'Three'],
      }),
  ],
  [
    'Loading Please wait',
    () => showLoading({ content: 'Please wait...', duration: 4000 }),
  ], // dbservice.ts:203
  [
    'Loading gif',
    () =>
      showLoading({
        spinner: 'hide',
        content: '<img src="./assets/imgs/gif.svg" class="h55" />',
        duration: 4000,
      }),
  ],
  [
    'Toast bottom',
    () => showToast('Your Data Is Safe', { position: 'bottom' }),
  ],
  [
    'Toast top',
    () => showToast('Please Allow Location !!', { position: 'top' }),
  ],
  ['Toast middle', () => showToast('Middle toast', { position: 'middle' })],
  [
    'Toast close button',
    () =>
      showToast('With close button', { duration: 0, showCloseButton: true }),
  ],
  [
    'ActionSheet icons', // customeradd.ts:142
    () =>
      showActionSheet({
        title: 'Profile photo',
        buttons: [
          { text: 'Camera', icon: 'camera' },
          { text: 'Gallery', icon: 'image' },
          { text: 'Cancel', role: 'cancel' },
        ],
      }),
  ],
  [
    'ActionSheet no icons',
    () =>
      showActionSheet({
        title: 'Choose',
        buttons: [
          { text: 'First' },
          { text: 'Second' },
          { text: 'Cancel', role: 'cancel' },
        ],
      }),
  ],
];

const SAMPLE = 'Wallet Balance ₹ 1,250 – Topsan';

// Sample data for the pickers section (shapes of the Topbath API rows: state_name, first_name, product_name ...)
const STATES = ['Delhi', 'Haryana', 'Punjab', 'Rajasthan', 'Uttar Pradesh', 'Uttarakhand'].map(n => ({ label: n, value: n }));
const EXECUTIVES = ['Ramesh Kumar', 'Suresh Verma', 'Anita Sharma', 'Mohit Gupta', 'Pooja Singh', 'Rahul Jain'].map((n, i) => ({ id: i + 1, first_name: n }));
const PRODUCTS = ['Basin Mixer Chrome', 'Angle Cock Long', 'Health Faucet Set', 'Bib Cock Wall', 'Overhead Shower 8 inch'].map((n, i) => ({ id: i + 1, product_name: n, price: 100 + i }));

// registration.html:35 (DOB), :81 (state select), :243 (sales executive), quotation (search), SFA select-searchable
function PickersSection() {
  const [dob, setDob] = useState('');
  const [leave, setLeave] = useState('');
  const [state, setState] = useState<string | undefined>(undefined);
  const [multi, setMulti] = useState<string[]>([]);
  const [exec, setExec] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [sfa, setSfa] = useState<any>(null);
  const [plain, setPlain] = useState<string | undefined>('Haryana');
  const [editDate, setEditDate] = useState('');
  const [editType, setEditType] = useState<string | undefined>(undefined);
  const [editProduct, setEditProduct] = useState<any>(PRODUCTS[1]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <View testID="gallery-pickers">
      <Text style={styles.h}>Pickers: .edit pages (add-leave, travel-add, quotation)</Text>
      <View style={styles.edit}>
        <IonDatetime testID="pk-edit-date" variant="edit" floating label="Leave Start Date *" displayFormat="MMM DD, YYYY" placeholder="Select Leave Start Date" min={today} value={editDate} onChange={setEditDate} />
        <IonSelect testID="pk-edit-type" variant="editCsNormalSelect" label="Select type" placeholder="Select Type" options={[{ label: 'Full Day', value: 'Full Day' }, { label: 'Half Day', value: 'Half Day' }]} value={editType} onChange={v => setEditType(v as string)} />
        <IonSelect testID="pk-edit-state" variant="editCsSelect" label="State" labelText="State *" requiredMark options={STATES} value={state} onChange={v => setState(v as string)} />
        <IonicSelectable testID="pk-edit-product" variant="editCsSelectable" label="Select Product" items={PRODUCTS} itemValueField="product_name" itemTextField="product_name" canSearch value={editProduct} onChange={v => setEditProduct(v)} />
        <IonicSelectable testID="pk-edit-state-sel" variant="editCsSelectable" label="State" labelText="State *" items={STATES} itemValueField="value" itemTextField="label" canSearch value={STATES[1]} onChange={() => undefined} />
      </View>
      <Text style={styles.h}>Pickers</Text>
      <IonDatetime testID="pk-dob" variant="csDate" label="Date of Birth" displayFormat="DD/MM/YYYY" max={today} value={dob} onChange={setDob} />
      <IonSelect testID="pk-state" variant="csSelect" label="State" options={STATES} value={state} onChange={v => setState(v as string)} />
      <IonSelect testID="pk-state-disabled" variant="csSelect" label="District" options={STATES} value={state} disabled />
      <IonicSelectable
        testID="pk-exec"
        variant="csSelect"
        label="Select Sales Executive (optional)"
        items={EXECUTIVES}
        itemValueField="first_name"
        itemTextField="first_name"
        canSearch
        canClear
        hasVirtualScroll
        value={exec}
        onChange={v => setExec(v)}
      />
      <IonicSelectable
        testID="pk-quote"
        variant="plain"
        label="Select Product"
        items={PRODUCTS}
        itemValueField="product_name"
        itemTextField="product_name"
        canSearch
        value={product}
        onChange={v => setProduct(v)}
        onSearch={e => console.log('onSearch', e.text)}
      />
      <SelectSearchable
        testID="pk-sfa"
        variant="plain"
        label="Category"
        items={PRODUCTS}
        itemValueField="id"
        itemTextField="product_name"
        canSearch
        hasVirtualScroll
        value={sfa}
        onChange={v => setSfa(v)}
      />
      <IonSelect testID="pk-plain" label="Plain select" placeholder="Select Type" options={STATES} value={plain} onChange={v => setPlain(v as string)} />
      <IonSelect testID="pk-multi" label="Multiple" multiple options={STATES} value={multi} onChange={v => setMulti(v as string[])} />
      <IonDatetime testID="pk-leave" label="Leave" displayFormat="MMM DD, YYYY" placeholder="Select Leave Start Date" min={today} value={leave} onChange={setLeave} />
    </View>
  );
}

export function ComponentGallery() {
  return (
    <ScrollView contentContainerStyle={styles.page} testID="component-gallery">
      <PickersSection />

      <Text style={styles.h}>Popups</Text>
      {POPUPS.map(([label, open]) => (
        <Pressable
          key={label}
          onPress={open}
          style={styles.btn}
          testID={`gallery-popup-${label}`}
        >
          <Text style={styles.btnText}>{label}</Text>
        </Pressable>
      ))}

      <Text style={styles.h}>Fonts (CSS weight → bundled face)</Text>
      {([300, 400, 500, 600, 700] as const).map(w => (
        <Text key={w} style={[styles.sample, fontFor(w)]}>
          {w}: {SAMPLE}
        </Text>
      ))}
      <Text style={[styles.sample, fontFor(400, { italic: true })]}>
        400i: {SAMPLE}
      </Text>
      <Text style={[styles.sample, fontFor(500, { italic: true })]}>
        500i: {SAMPLE}
      </Text>
      <Text
        style={[styles.sample, fontFor(400, { family: 'Roboto Condensed' })]}
      >
        Condensed: {SAMPLE}
      </Text>
      <Text style={[styles.sample, fontFor(400)]}>
        हिंदी: वॉलेट बैलेंस (system fallback)
      </Text>

      <Text style={styles.h}>Ionicons 3 ({ION_ICONS.length})</Text>
      <View style={styles.grid}>
        {ION_ICONS.map(n => (
          <View key={n} style={styles.cell}>
            <IonIcon name={n} size={26} />
            <Text style={styles.label}>{n}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.h}>Material Icons ({MATERIAL_ICONS.length})</Text>
      <View style={styles.grid}>
        {MATERIAL_ICONS.map(n => (
          <View key={n} style={styles.cell}>
            <MaterialIcon name={n} size={26} />
            <Text style={styles.label}>{n}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 12, backgroundColor: 'white' },
  h: { ...fontFor(700), fontSize: 16, marginTop: 14, marginBottom: 6 },
  sample: { fontSize: 15, marginVertical: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '25%', alignItems: 'center', paddingVertical: 6 },
  label: { fontSize: 8, marginTop: 2 },
  btn: { padding: 8, marginVertical: 2, backgroundColor: '#e8e8e8' },
  btnText: { fontSize: 13 },
  edit: { marginHorizontal: 0 },
});
