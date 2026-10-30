// DEVELOPMENT ONLY (registered in RootNavigator for debug builds, see src/config/buildInfo.ts): shows the Ionic replica parts so they
// can be checked on a device and captured for the parity report (plan Task 9 step 6).
// Open with: adb shell am start -a android.intent.action.VIEW -d "topbathrn://open?screen=_ComponentGallery"
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { IonIcon } from '../components/ionic/IonIcon';
import { MaterialIcon } from '../components/ionic/MaterialIcon';
import { fontFor } from '../theme/typography';

// Every name used in the Ionic templates (grep of src/**/*.html).
const ION_ICONS = [
  'add', 'arrow-back', 'arrow-forward', 'call', 'clock', 'ios-arrow-forward-outline', 'log-out', 'md-add-circle',
  'md-create', 'md-more', 'md-share', 'navigate', 'notifications', 'qr-scanner', 'share', 'trash',
];
const MATERIAL_ICONS = [
  'star', 'phone', 'keyboard_arrow_right', 'cancel', 'delete_sweep', 'call', 'date_range', 'camera_alt', 'save',
  'perm_media', 'clear', 'info', 'hourglass_full', 'create', 'check_circle', 'arrow_right_alt', 'person_add', 'edit',
  'chevron_right', 'add_circle', 'add', 'place', 'picture_as_pdf', 'person', 'power_settings_new',
  'keyboard_arrow_left', 'insert_invitation', 'delete', 'call_made', 'apartment', 'work', 'verified_user',
  'trending_flat', 'store', 'room', 'public', 'note_add', 'my_location', 'menu', 'location_on', 'local_shipping',
  'local_phone', 'list', 'keyboard_backspace', 'import_contacts', 'how_to_reg', 'fact_check', 'engineering',
  'emoji_transportation', 'email', 'collections', 'close', 'business', 'arrow_forward', 'arrow_back',
  'add_shopping_cart', 'account_balance_wallet',
];

const SAMPLE = 'Wallet Balance ₹ 1,250 – Topsan';

export function ComponentGallery() {
  return (
    <ScrollView contentContainerStyle={styles.page} testID="component-gallery">
      <Text style={styles.h}>Fonts (CSS weight → bundled face)</Text>
      {([300, 400, 500, 600, 700] as const).map(w => (
        <Text key={w} style={[styles.sample, fontFor(w)]}>
          {w}: {SAMPLE}
        </Text>
      ))}
      <Text style={[styles.sample, fontFor(400, { italic: true })]}>400i: {SAMPLE}</Text>
      <Text style={[styles.sample, fontFor(500, { italic: true })]}>500i: {SAMPLE}</Text>
      <Text style={[styles.sample, fontFor(400, { family: 'Roboto Condensed' })]}>Condensed: {SAMPLE}</Text>
      <Text style={[styles.sample, fontFor(400)]}>हिंदी: वॉलेट बैलेंस (system fallback)</Text>

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
});
