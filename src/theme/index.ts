// Ported from: src/theme/variables.scss + the most-used colours in app.scss / page .scss files.
// Ionic used Roboto from Google Fonts; Android's system font is Roboto, so no font files are bundled.
export const colors = {
  primary: '#002d25', // brand green, used 63× in the Ionic styles
  secondary: '#000000',
  text: '#1b1b1b',
  textMuted: '#747474',
  textLight: '#949494',
  border: '#dedede',
  borderLight: '#e8e8e8',
  background: '#f8f8f8',
  card: '#ffffff',
  white: '#ffffff',
  danger: '#ff0000',
  success: '#27ab00',
  warning: '#FFBB00',
  light: '#f4f4f4',
  navy: '#000d36',
  yellow: '#f5e100',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const radius = { sm: 4, md: 8, lg: 12, pill: 999 };

export const font = {
  regular: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const }, // $semibold in variables.scss
  bold: { fontWeight: '700' as const },
};
