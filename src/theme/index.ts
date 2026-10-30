// Ported from: src/theme/variables.scss + the most-used colours in app.scss / page .scss files.
// Client colours come from clients/<id>/client.json; the neutrals below are part of the Ionic template
// itself (identical across clients until a second client proves otherwise, plan Phase 9).
// Fonts (Roboto, Roboto Condensed, Material Icons, Ionicons v3) are bundled in plan Task 9.
import { client } from '../config/client';

// Ionic `$colors` map: what color="danger" etc. resolve to on Ionic components.
export const ionicColors = { primary: client.colors.primary, ...client.colors.ionic };

// Plain SCSS variables ($primary, $danger, …): what custom page styles use. Values differ from the map.
export const scssColors = { primary: client.colors.primary, ...client.colors.scss };

export const colors = {
  primary: client.colors.primary, // brand colour, used 63× in the Ionic styles
  secondary: scssColors.secondary,
  text: '#1b1b1b',
  textMuted: '#747474',
  textLight: '#949494',
  border: '#dedede',
  borderLight: '#e8e8e8',
  background: '#f8f8f8',
  card: '#ffffff',
  white: scssColors.white,
  danger: scssColors.danger,
  success: '#27ab00',
  warning: scssColors.warning,
  light: ionicColors.light,
  navy: '#000d36',
  yellow: '#f5e100',
  statusBar: client.colors.statusBar,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const radius = { sm: 4, md: 8, lg: 12, pill: 999 };

export const font = {
  regular: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const }, // $semibold in variables.scss
  bold: { fontWeight: '700' as const },
};
