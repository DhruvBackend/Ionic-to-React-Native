// Ported from: src/pages/contact/contact.scss (empty) + the global rules of src/theme/variables.scss that reach contact.html
// Citations: [T] variables.scss line (Ionic source).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 2137-2145 `.map-add { position: absolute; bottom: 0; background: #fff; margin: 16px; padding: 16px; box-shadow: 2px 0 7px 0 rgba(0,0,0,.2); border-radius: 6px }`
  // (no left/right: shrink-to-fit, at the static left edge + 16)
  mapAdd: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    margin: 16,
    padding: 16,
    backgroundColor: colors.white,
    boxShadow: '2px 0px 7px 0px rgba(0, 0, 0, 0.2)',
    borderRadius: 6,
  },
  // [T] 2146-2166 `.map-add .contact ul li { display: flex; align-items: flex-start; margin-bottom: 16px; &:last-child { margin-bottom: 0 } }`
  li: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  liLast: { marginBottom: 0 },
  // `a { display: flex; align-items: center; text-decoration: none }`
  anchor: { flexDirection: 'row', alignItems: 'center' },
  // `i { padding-right: 10px }`
  icon: { paddingRight: 10 },
});
