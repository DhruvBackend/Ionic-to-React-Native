// Values of the ShippingDetail page (Ionic ShippingDetailPage) that come from Topbath's global src/theme/variables.scss rules reaching
// shipping-detail.html. Citations: [T] = variables.scss line. NEW FILE added by the ShippingDetail port.
import { scssColors } from './index';

export const shippingDetailMd = {
  white: scssColors.white, // [T] $white (img-box border, page background)
  // [T] 12462-12466 `.conatiner .content-box p span { font-weight: 600; font-size: 18px; color: #002d25 }`
  pointsColor: '#002d25',
  // [T] 12452-12455 `.conatiner .img-box { box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.2) }`, [T] 12494 `.cs-card` the same
  shadow: '0px 3px 6px 0px rgba(0, 0, 0, 0.2)',
} as const;
