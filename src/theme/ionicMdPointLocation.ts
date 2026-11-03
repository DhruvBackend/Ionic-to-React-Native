// Values of the PointLocation page (point-location.html) that come from global rules of src/theme/variables.scss. Screens cannot spell
// hex colours (lint rule). Citations: [T] variables.scss line (Ionic source). NOTE: added for the PointLocation screen.
import { scssColors } from './index';

export const pointLocationMd = {
  white: scssColors.white, // [T] $white (page background, the my_location box)
  // [T] 1172-1183 / 1186-1197 `.map-location { position: absolute; top: 40px; right: 13px; z-index: 999; background: $white;
  //   width: 27px; height: 27px; text-align: center; border: solid 1px #f8f8f8; box-shadow: 0px 3px 6px 0px #ccc }`
  mapBtnBorder: '#f8f8f8',
  mapBtnShadow: '0px 3px 6px 0px #ccc',
} as const;
