import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { IonLabel } from '../src/components/ionic/IonList';
import { normalLineHeight } from '../src/theme/ionicMdOverlays';

const render = (label: string) => {
  let r!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    r = ReactTestRenderer.create(<IonLabel>{label}</IonLabel>);
  });
  const t = r.root.findAll((n: any) => n.type === 'Text' || n.props.numberOfLines === 1)[0];
  return StyleSheet.flatten(t.props.style);
};

// Android clips Devanagari marks above a Roboto-sized line box (Language screen 'हिंदी (Hindi)', phone 2026-11-05).
test('a Hindi label gets a taller Text box with the same layout height', () => {
  const s = render('हिंदी (Hindi)');
  const css = normalLineHeight(16);
  expect(s.lineHeight).toBeGreaterThan(css);
  expect(s.lineHeight! + 2 * (s.marginVertical as number)).toBeCloseTo(css);
});

test('an English label is unchanged', () => {
  const s = render('English');
  expect(s.lineHeight).toBe(normalLineHeight(16));
  expect(s.marginVertical).toBeUndefined();
});

test('a Hindi IonParagraph (list header text) gets the same clip-safe box', () => {
  const { IonParagraph } = require('../src/components/ionic/IonList');
  let r!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    r = ReactTestRenderer.create(<IonParagraph>भाषा चुनिए / Choose Your Language</IonParagraph>);
  });
  const s = StyleSheet.flatten(r.root.findByProps({ testID: 'ion-paragraph' }).props.style);
  expect(s.marginVertical).toBeLessThan(0);
  expect(s.lineHeight! + 2 * (s.marginVertical as number)).toBeCloseTo(normalLineHeight(14));
});
