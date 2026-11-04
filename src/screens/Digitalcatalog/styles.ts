// Ported from: src/pages/digitalcatalog/digitalcatalog.scss + the global rules of src/theme/variables.scss that reach the template
// Citations: [S] digitalcatalog.scss line, [T] variables.scss line (Ionic source).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { digitalcatalogMd as D } from '../../theme/ionicMdDigitalcatalog';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 4393-4408 `.data-not { display: flex; align-items: center; justify-content: center; flex-direction: column }`: its
  // `height: calc(100% - 50px)` has no definite parent height (.container is auto), so the box is as tall as the 100px image
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  // [S] 2-5 `.main { margin-bottom: 21px }`
  main: { marginBottom: 21 },
  // [S] 11-23 `.part1`: grid `1fr 289px`, centred, min-height 50, shadow, padding 10, radius 11, tinted background, 6px left border
  part1: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    boxShadow: D.cardShadow,
    padding: 10,
    borderRadius: 11,
    backgroundColor: D.cardBackground,
    borderLeftWidth: 6,
    borderLeftColor: D.cardBorder,
  },
  // `1fr`: takes what the 289px column leaves, never less than its content (the 36px picture)
  col1: { flex: 1, minWidth: 36 },
  // `289px`
  col2: { width: 289, flexShrink: 0 },
  // [S] 6-9 `.main img { width: 36px }`: height auto from the natural 1200 x 1474
  pdfIcon: { width: 36, height: (36 * 1474) / 1200 },
});
