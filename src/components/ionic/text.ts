// Text style helper for the popup replicas: Roboto face for the CSS weight plus the CSS
// "line-height: normal" that Chrome computed (src/theme/ionicMdOverlays.ts normalLineHeight).
import type { TextStyle } from 'react-native';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { fontFor } from '../../theme/typography';

export function textStyle(fontSize: number, weight: number, color: string, lineHeight?: number): TextStyle {
  return {
    ...fontFor(weight),
    fontSize,
    lineHeight: lineHeight ?? normalLineHeight(fontSize),
    color,
    includeFontPadding: false,
  };
}
