// Development stand-in for a route whose Ionic page is not ported yet. It shows the route name so a
// tester can see where navigation went. Removed from use as each real screen lands.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function placeholderFor(routeName: string) {
  function Placeholder() {
    return (
      <View style={styles.box} testID={`placeholder-${routeName}`}>
        <Text style={styles.name}>{routeName}</Text>
        <Text style={styles.note}>not ported yet</Text>
      </View>
    );
  }
  Placeholder.displayName = `Placeholder(${routeName})`;
  return Placeholder;
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  name: { fontSize: 22, color: colors.primary },
  note: { marginTop: 8, color: colors.textMuted },
});
