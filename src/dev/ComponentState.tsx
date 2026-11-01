// DEVELOPMENT ONLY (registered in RootNavigator for debug builds, see src/config/buildInfo.ts): renders ONE replica state, the RN side of
// the `_components.*` parity states (plan Task 9 step 6). The id comes from the deep link params, the root `ion-card-_ComponentState` is
// drawn by IonStack, which is what capture-rn.mjs waits for:
//   adb shell am start -a android.intent.action.VIEW -d 'topbathrn://open?screen=_ComponentState&params={"id":"alert-plain"}'
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { renderComponentState } from './componentStates';

export function ComponentState({ route }: { route?: { params?: { id?: string } } }) {
  const id = route?.params?.id ?? '';
  const state = renderComponentState(id);
  return (
    <View style={styles.page} testID={`component-state-${id}`}>
      {state ?? <Text style={styles.unknown}>{`Unknown component state "${id}"`}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  unknown: { padding: 16, color: '#b00020' },
});
