// Ported from: src/app/app.html (<ion-menu side="start">) — the frame only.
// In Ionic the menu is only opened by the SFA/DrLogin pages (Dashboard, DealerHome publish an event)
// and swipe is disabled for CMS (loyalty) users. Its item sets belong to the SFA module and are
// added with those screens (plan Phase 7); until then the menu has no content.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface SideMenuApi {
  open(): void;
  close(): void;
  isOpen: boolean;
}

const SideMenuContext = createContext<SideMenuApi>({ open() {}, close() {}, isOpen: false });

// Outside React (Ionic: events.publish('openSideMenu') from Dashboard/DealerHome).
let external: SideMenuApi | null = null;
export function openSideMenu() {
  external?.open();
}
export function closeSideMenu() {
  external?.close();
}

export function useSideMenu() {
  return useContext(SideMenuContext);
}

export function SideMenuProvider({ children, content }: { children: React.ReactNode; content?: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const api = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);
  external = api;

  return (
    <SideMenuContext.Provider value={api}>
      {children}
      <Modal visible={isOpen} transparent animationType="none" onRequestClose={close}>
        <View style={styles.row}>
          <View style={styles.menu}>{content}</View>
          <Pressable style={styles.backdrop} onPress={close} testID="side-menu-backdrop" />
        </View>
      </Modal>
    </SideMenuContext.Provider>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row' },
  menu: { width: '80%', backgroundColor: colors.white }, // Ionic md menu: 304px max; exact width in Phase 7
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
});
