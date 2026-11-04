// Ported from: src/pages/scane-pages/scan/scan.html + .ts + .scss (+ .module.ts)
import React from 'react';
import { Pressable, View } from 'react-native';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { styles } from './styles';

interface Props {
  navigation: { push: (name: string, params?: object) => void };
}

// NOTE (parity): scan.ts has no module language code, endpoints, storage or loaders; navParams is never read. `.scan-bg` has no rule in any
// stylesheet: the content is a plain white page. The 'scan' title is lower case in the template; `.main-header.remove` capitalises it.
export default function ScanScreen({ navigation }: Props) {
  // :26-28 goOnCoupanCodePage(): push(CoupanCodePage), no params
  function goOnCoupanCodePage() {
    navigation.push('CoupanCode');
  }

  return (
    <View style={styles.screen}>
      {/* html:7-11 <ion-header class="main-header remove"> + <ion-navbar color="primary"> */}
      <IonHeader mainHeader remove>
        <IonNavbar color="primary" title="scan" />
      </IonHeader>

      {/* html:13-15 <ion-content class="scan-bg" (click)="goOnCoupanCodePage()">: a click anywhere on the (empty) content */}
      <Pressable testID="scan-content" style={styles.content} onPress={goOnCoupanCodePage}>
        <IonContent />
      </Pressable>
    </View>
  );
}
