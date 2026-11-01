// DEVELOPMENT ONLY: one button per native wrapper (src/native) showing the NativeResult, to trigger the real permission
// prompts and system screens on a device or emulator. Open it with:
//   adb shell am start -a android.intent.action.VIEW -d "topbathrn://open?screen=_NativeDemo"   (debug build)
// Each button calls the wrapper exactly like the Ionic pages do (options copied from the call sites cited in src/native/*).
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  getInstalledVersion,
  getNetworkState,
  getPosition,
  openExternal,
  scanQr,
  shareText,
  takePhoto,
  type NativeResult,
} from '../native';

type Action = { id: string; label: string; run: () => Promise<unknown> };

const ACTIONS: Action[] = [
  { id: 'scan', label: 'Scan QR (no options, like home.ts)', run: () => scanQr() },
  { id: 'scan-prompt', label: "Scan QR ({ prompt: '' }, like scan-point.ts)", run: () => scanQr({ prompt: '' }) },
  {
    id: 'camera',
    label: 'Camera (quality 70, 500 x 400)',
    run: () => takePhoto('camera', { quality: 70, maxWidth: 500, maxHeight: 400 }),
  },
  { id: 'gallery', label: 'Gallery (quality 70)', run: () => takePhoto('gallery', { quality: 70 }) },
  {
    id: 'location',
    label: 'Location (accuracy dialog, 15 s, high accuracy)',
    run: () => getPosition({ highAccuracy: true, timeoutMs: 15000, maximumAgeMs: 10000 }),
  },
  { id: 'location-plain', label: 'Location (no options, no accuracy dialog)', run: () => getPosition({ requestAccuracy: false }) },
  {
    id: 'share',
    label: 'Share text (profile.ts message)',
    run: () =>
      shareText(
        'Hey There ! here is an awesome app from Topsan  ..Give it a try https://play.google.com/store/apps/details?id=com.topsan.app',
      ),
  },
  {
    id: 'browser',
    label: "Open browser (market:// link, '_system')",
    run: () => openExternal('market://details?id=com.topsan.app&hl=en', '_system'),
  },
  { id: 'version', label: 'App version', run: () => getInstalledVersion() },
  { id: 'network', label: 'Network status', run: () => getNetworkState() },
];

// Keep a long data URL readable.
const show = (v: unknown): string => {
  const text = JSON.stringify(
    v,
    (_k, val) => (typeof val === 'string' && val.length > 80 ? `${val.slice(0, 60)}... (${val.length} chars)` : val),
    2,
  );
  return text ?? 'undefined';
};

export function NativeDemoScreen() {
  const [last, setLast] = useState<{ label: string; result: unknown } | null>(null);
  const [busy, setBusy] = useState(false);

  const press = async (a: Action) => {
    setBusy(true);
    setLast({ label: a.label, result: '...' });
    const result: NativeResult<unknown> | unknown = await a.run();
    setLast({ label: a.label, result });
    setBusy(false);
  };

  return (
    <View style={styles.page} testID="native-demo">
      <View style={styles.header}>
        <Text style={styles.title}>Native wrappers (debug)</Text>
        <Text style={styles.result} testID="native-demo-result">
          {last ? `${last.label}\n${show(last.result)}` : 'Press a button'}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {ACTIONS.map(a => (
          <Pressable
            key={a.id}
            testID={`native-demo-${a.id}`}
            disabled={busy}
            onPress={() => press(a)}
            style={[styles.button, busy && styles.disabled]}
          >
            <Text style={styles.buttonText}>{a.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff', paddingTop: 36 },
  header: { padding: 12, backgroundColor: '#eee', minHeight: 150 },
  title: { fontWeight: 'bold', marginBottom: 6, color: '#000' },
  result: { fontSize: 12, color: '#000' },
  list: { padding: 12 },
  button: { backgroundColor: '#488aff', padding: 12, borderRadius: 4, marginBottom: 8 },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#fff' },
});
