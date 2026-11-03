// Ported from: src/pages/point-location/point-location.scss (empty) + the global rules of src/theme/variables.scss that reach point-location.html
// Citations: [T] variables.scss line.
import { StyleSheet } from 'react-native';
import { pointLocationMd as P } from '../../theme/ionicMdPointLocation';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.white },
  // the scroll-content is the containing block of the absolute `.map-location` (it is `position: absolute` itself)
  mapArea: { width: '100%' },
  // [T] 1172-1183 `.location-map .map-location`: 27 x 27 (border-box), centred glyph
  mapLocation: {
    position: 'absolute',
    top: 40,
    right: 13,
    zIndex: 999,
    backgroundColor: P.white,
    width: 27,
    height: 27,
    borderWidth: 1,
    borderColor: P.mapBtnBorder,
    boxShadow: P.mapBtnShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // [T] 2493-2502 `.enquiry-btn.loction-btn button { width: 100%; height: 45px; border-radius: 0 }` (`.h35` is defined nowhere)
  locationButton: { height: 45 },
  // [T] 2419-2431 `.enquiry-btn button span p { font-size: 14px; letter-spacing: 2px; color: $white; font-weight: normal }`
  locationLabel: { fontSize: 14, letterSpacing: 2 },
  gap: { height: 4 },
});
