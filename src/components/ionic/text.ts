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

// Android clips glyph parts that stick out of a Text line box (Devanagari matras/anusvara above the ascent), where Chrome
// does not (`button { line-height: 1 }` etc.). The Text therefore gets a taller box (1.5 x font size, never below
// "normal") and a negative vertical margin that gives the same layout height back, so the visual centre/baseline
// stays exactly where the CSS line box put it (half-leading is symmetric). Single-line labels only (used by IonButton; the
// other fixed line-heights in the kit sit in fixed-height boxes whose tests assert the CSS value; alert buttons are 20px).
export const CLIP_SAFE_LINE_RATIO = 1.5;

export function clipSafeLineBox(fontSize: number, cssLineHeight: number): { lineHeight: number; marginVertical: number } {
  const lineHeight = Math.max(cssLineHeight, normalLineHeight(fontSize), Math.round(fontSize * CLIP_SAFE_LINE_RATIO));
  return { lineHeight, marginVertical: (cssLineHeight - lineHeight) / 2 };
}
