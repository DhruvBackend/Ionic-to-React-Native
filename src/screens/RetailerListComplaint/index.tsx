// Ported from: src/pages/retailer-list-complaint/retailer-list-complaint.html + .ts + .scss (+ .module.ts)
import React from 'react';
import { View } from 'react-native';
import { IonContent } from '../../components/ionic/IonContent';
import { IonIcon } from '../../components/ionic/IonIcon';
import { Header } from '../../components/ionic/IonNavbar';
import { Text } from '../../components/ionic/IonText';
import { textStyle } from '../../components/ionic/text';
import { ionicColors } from '../../theme';
import { complaintMd as C } from '../../theme/ionicMdComplaint';
import { retailerListComplaintMd as L } from '../../theme/ionicMdRetailerListComplaint';
import { styles } from './styles';

// NOTE (parity): the whole page is static markup (a mock card); the class has no data, no endpoint and no navigation. `a.dialer` has no href.
export default function RetailerListComplaintScreen() {
  const smallText = textStyle(12, 400, C.ink, 18);
  const strong = textStyle(12, 700, C.ink, 18);
  const badgeText = { ...textStyle(10, 600, C.white), letterSpacing: 0.5 }; // `span.cs-badge { letter-spacing: .5px }`

  return (
    <View style={styles.screen}>
      {/* html:7-12 */}
      <Header mainHeader color="primary" title="Complaint" />
      <IonContent padding>
        {/* html:14-34 */}
        <View style={styles.csList}>
          <View style={styles.topBlock}>
            <Text style={textStyle(14, 600, C.ink)}>
              {'Sunil '}
              <View style={styles.badge}>
                <Text style={badgeText}>#2345</Text>
              </View>
            </Text>
            <View style={styles.numberBlock}>
              <Text style={textStyle(12, 400, C.ink, 20)}>{L.mockNumber}</Text>
              <View style={styles.dialer}>
                <IonIcon name="md-call" size={20} color={ionicColors.primary} />
              </View>
            </View>
          </View>
          <View style={styles.middleBlock}>
            <View style={styles.dateStatus}>
              <Text style={[smallText, styles.dateCell]}>
                <Text style={strong}>Date:</Text>
                12 April 2021
              </Text>
              <Text style={[smallText, styles.dateCell]}>
                <Text style={strong}>{'Satus: '}</Text>
                <Text style={{ color: C.pending }}>Pending</Text>
                {' '}
              </Text>
            </View>
            <Text style={smallText}>
              <Text style={strong}>Nature Problem:</Text>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </Text>
          </View>
          <View style={styles.botmBlock}>
            <Text style={smallText}>
              <View style={styles.navigateIcon}>
                <IonIcon name="navigate" size={22} color={C.ink} />
              </View>
              {' 5E/7, B.P., Railway Road, Near Neelam Chowk, NIT Faridabad – 121001, Haryana ( INDIA)'}
            </Text>
          </View>
        </View>
      </IonContent>
    </View>
  );
}
