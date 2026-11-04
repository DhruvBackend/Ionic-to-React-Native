// Ported from: src/pages/login-section/login-screen/login-screen.html + .ts + .scss (+ .module.ts)
import React from 'react';
import { View } from 'react-native';
import { IonContent } from '../../components/ionic/IonContent';
import { IonHeader, IonNavbar } from '../../components/ionic/IonNavbar';
import { styles } from './styles';

// NOTE (parity): login-screen.ts is the empty Ionic page template: no endpoints, storage, loaders or nav calls (navCtrl/navParams are injected but
// unused). The template is a primary navbar titled 'login-screen' (as typed) over an empty padded content.
export default function LoginScreenScreen() {
  return (
    <View style={styles.screen}>
      {/* html:2-6 */}
      <IonHeader>
        <IonNavbar color="primary" title="login-screen" />
      </IonHeader>

      {/* html:8-11 <ion-content padding> (empty) */}
      <IonContent padding />
    </View>
  );
}
