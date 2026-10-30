// Draws the Ionic status-bar look around every page (see ./frame.ts for the rules and sources).
import React, { useEffect, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { ANDROID_15_DELAY_MS, frameFor } from './frame';

export function AppFrame({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : 0;
  const [android15Applied, setApplied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setApplied(true), ANDROID_15_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const f = frameFor(Platform.OS, apiLevel, insets, android15Applied);

  return (
    <View style={styles.outer}>
      {/* cordova-plugin-statusbar default style is light content; the colour is the band below */}
      <StatusBar barStyle="light-content" />
      {f.statusBand && <View style={{ height: f.statusBand.height, backgroundColor: f.statusBand.color }} />}
      <View style={f.frame}>{children}</View>
      {f.navBand && <View style={{ height: f.navBand.height, backgroundColor: f.navBand.color }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.white },
});
