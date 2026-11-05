// Ported from: src/pages/survey/survey-list/survey-list.scss + the global rules that reach survey-list.html
// Citations: [P] survey-list.scss, [CSS] the shipped main.css (`.data-not`), kit IonCard (card-md).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [P] `ion-card { border-radius: 6px !important }`
  card: { borderRadius: 6 },
  // [P] `ion-card-header { padding-right: 30px !important; font-size: 14px !important; font-weight: 600; position: relative }`
  cardHeader: { paddingRight: 30 },
  // [P] `ion-icon { position: absolute; top: 50%; right: 10px; transform: translateY(-50%); font-size: 22px }` (line box 22 tall: -11)
  // (a percentage `top` on an absolute Text is not applied on Android: a full-height box centres the icon instead = translateY(-50%))
  arrow: { position: 'absolute', top: 0, bottom: 0, right: 10, justifyContent: 'center' },
  // [CSS] `.data-not { width: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column }` (height set in index.tsx)
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
});
