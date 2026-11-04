import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text, View } from 'react-native';
import { IonContent } from '../src/components/ionic/IonContent';

test('stickyChildIndices map to the ScrollView stickyHeaderIndices (no refresher: same indices)', () => {
  let r!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    r = ReactTestRenderer.create(
      <IonContent stickyChildIndices={[0]}>
        <View><Text>fix</Text></View>
        <View><Text>list</Text></View>
      </IonContent>,
    );
  });
  const sv = r.root.find((n: any) => n.props.testID === 'ion-content-scrollview');
  expect(sv.props.stickyHeaderIndices).toEqual([0]);
});
