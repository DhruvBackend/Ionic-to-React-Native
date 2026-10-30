// Renders the overlay stack of src/ui/overlays.ts. Mounted once in App.tsx inside AppFrame, so it sits
// under the status band like Ionic's ion-app overlay portals (components/app/app-root.js):
// modal portal (ionic-selectable pages) < default portal (alerts, action sheets, pickers) < loading portal <
// toast portal < click block (components/app/app-root.js template order).
import React, { useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { overlayStore, type OverlayEntry } from '../../ui/overlays';
import { ActionSheetCmp } from './ActionSheet';
import { AlertCmp } from './Alert';
import { LoadingCmp } from './Loading';
import { ModalCmp } from './ModalCmp';
import { PickerCmp } from './Picker';
import { ToastCmp } from './Toast';

function render(entry: OverlayEntry) {
  switch (entry.kind) {
    case 'alert':
      return <AlertCmp key={entry.id} entry={entry} />;
    case 'actionSheet':
      return <ActionSheetCmp key={entry.id} entry={entry} />;
    case 'picker':
      return <PickerCmp key={entry.id} entry={entry} />;
    case 'modal':
      return <ModalCmp key={entry.id} entry={entry} />;
    case 'loading':
      return <LoadingCmp key={entry.id} entry={entry} />;
    case 'toast':
      return <ToastCmp key={entry.id} entry={entry} />;
  }
}

export function OverlayHost() {
  const entries = useSyncExternalStore(overlayStore.subscribe, overlayStore.getEntries);
  const clickBlock = useSyncExternalStore(overlayStore.subscribe, overlayStore.getClickBlock);
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {entries.filter(e => e.kind === 'modal').map(render)}
      {entries.filter(e => e.kind === 'alert' || e.kind === 'actionSheet' || e.kind === 'picker').map(render)}
      {entries.filter(e => e.kind === 'loading').map(render)}
      {entries.filter(e => e.kind === 'toast').map(render)}
      {/* .click-block-active: swallows taps for 400 ms after an overlay was dismissed */}
      {clickBlock && <View testID="click-block" style={StyleSheet.absoluteFill} />}
    </View>
  );
}
