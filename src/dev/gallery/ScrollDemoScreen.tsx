// DEVELOPMENT ONLY: a full-screen ion-content with a refresher and infinite scroll, for swiping with `adb shell input swipe`.
// Open it with:  adb shell am start -a android.intent.action.VIEW -d "topbathrn://open?screen=_ScrollDemo"   (debug build)
// The header shows the refresher state and the pull progress live (`ionPull`), and how many refreshes ran.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IonContent } from '../../components/ionic/IonContent';
import { IonFab, IonFabButton } from '../../components/ionic/IonFab';
import { IonInfiniteScroll, IonInfiniteScrollContent } from '../../components/ionic/IonInfiniteScroll';
import { IonRefresher, IonRefresherContent } from '../../components/ionic/IonRefresher';
import { colors } from '../../theme';
import { fontFor } from '../../theme/typography';

export function ScrollDemoScreen() {
  const [rows, setRows] = useState(30);
  const [log, setLog] = useState('idle');
  const [refreshes, setRefreshes] = useState(0);
  return (
    <View style={styles.page} testID="scroll-demo">
      <View style={styles.header}>
        <Text style={styles.headerText} testID="scroll-demo-log">
          {log} | refreshes: {refreshes} | rows: {rows}
        </Text>
      </View>
      <IonContent
        testID="scroll-demo-content"
        fixedContent={
          <IonFab horizontal="right" vertical="bottom">
            <IonFabButton color="primary" icon="add" />
          </IonFab>
        }
      >
        <IonRefresher
          onStart={() => setLog('ionStart')}
          onPull={r => setLog(`ionPull progress ${r.progress.toFixed(2)} (${r.state})`)}
          onRefresh={r => {
            setLog('ionRefresh (refreshing for 2 s)');
            setTimeout(() => {
              setRows(30);
              setRefreshes(n => n + 1);
              r.complete();
              setLog('complete()');
            }, 2000);
          }}
        >
          <IonRefresherContent
            pullingIcon="arrow-dropdown"
            pullingText="Pull to refresh"
            refreshingSpinner="circles"
            refreshingText="Refreshing..."
          />
        </IonRefresher>
        {Array.from({ length: rows }, (_, i) => (
          <Text key={i} style={[fontFor(400), styles.row]}>
            Row {i + 1}
          </Text>
        ))}
        {rows < 90 ? (
          <IonInfiniteScroll
            threshold="100px"
            onInfinite={inf => {
              setLog('ionInfinite');
              setTimeout(() => {
                setRows(n => n + 15);
                inf.complete();
              }, 1500);
            }}
          >
            <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Loading more data..." />
          </IonInfiniteScroll>
        ) : null}
      </IonContent>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: colors.primary, paddingTop: 36, paddingBottom: 10, paddingHorizontal: 16, zIndex: 1 },
  headerText: { ...fontFor(500), color: '#fff', fontSize: 14 },
  row: { fontSize: 14, padding: 18, borderBottomWidth: 1, borderBottomColor: '#eee', color: '#000' },
});
