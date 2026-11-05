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

// RN's ScrollViewStickyHeader clones the sticky child with `style: {flex: 1}` and moves the child's own style to its
// wrapper, so a row (flexDirection) on the child was lost (SurveyDetail's 3 count boxes stacked). IonContent wraps each
// sticky child in a plain View so the screen's View keeps its own style.
test('a sticky child keeps its own style (wrapped in a plain View)', () => {
  let r!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    r = ReactTestRenderer.create(
      <IonContent stickyChildIndices={[0]}>
        <View testID="fix" style={{ flexDirection: 'row' }}><Text>a</Text><Text>b</Text></View>
        <View><Text>list</Text></View>
      </IonContent>,
    );
  });
  const sv = r.root.find((n: any) => n.props.testID === 'ion-content-scrollview');
  const kids = React.Children.toArray(sv.props.children) as React.ReactElement<any>[];
  // the element RN clones (and whose style it moves) is the wrapper, not the screen's View
  expect(kids[0].props.style).toBeUndefined();
  expect(kids[0].props.collapsable).toBe(false);
  expect((kids[0].props.children as React.ReactElement<any>).props.style).toEqual({ flexDirection: 'row' });
});
