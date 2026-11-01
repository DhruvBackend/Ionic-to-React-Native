// The md header-md::after / footer-md::before shadow strip: a 16x7 px PNG (ionicMdPickers.ts headerShadowPng) repeated along x,
// `background-position: top -2px` for the header (rows 2..6 visible) or `top 0` for the footer (rows 0..1).
//
// The PNG is 4-bit palette, every pixel black; only the tRNS alpha differs per row. Decoded from the data URI (and asserted in
// __tests__/shadowStrip.test.tsx) the palette alphas (tRNS) are 14 09 2d 20 04 and rows 0..6 use palette entries 1,0,2,3,0,1,4,
// i.e. alpha 09 14 2d 20 14 09 04 (the visible header rows 2..6 are 2d 20 14 09 04: a falling gradient).
//
// Why not <Image resizeMode="repeat">: Chrome draws the image at 1 css px per image px, i.e. upscaled 3x on a DPR 3 screen with
// BILINEAR filtering, so the strip is a soft gradient. Android tiles without smoothing, so every PNG row became a hard 3 px band.
// Here each DEVICE pixel row of the strip is a View whose alpha is what Chrome's bilinear sample gives at that pixel:
//   device row k (0-based inside the strip) has its centre at css y = (k + .5) / dpr inside the box, which is image y
//   = startRow + that; image row r is centred at r + .5, so the sample position in row units is v = startRow + (k+.5)/dpr - .5;
//   alpha = lerp(rowAlpha[floor v], rowAlpha[ceil v], frac v), neighbours clamped to the image (rows 0..6; the neighbour rows
//   outside the visible window still count, as the box only crops the texture). The colour is black, so no colour blending.
import React from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';

// alpha (0..255) of image rows 0..6, from the tRNS chunk of the data URI
export const STRIP_ROW_ALPHA = [0x09, 0x14, 0x2d, 0x20, 0x14, 0x09, 0x04] as const;

export interface StripRow {
  height: number; // css px (1 / dpr)
  alpha: number; // 0..1
}

export function stripRows(startRow: number, cssHeight: number, dpr: number): StripRow[] {
  const n = Math.round(cssHeight * dpr);
  const last = STRIP_ROW_ALPHA.length - 1;
  const rows: StripRow[] = [];
  for (let k = 0; k < n; k++) {
    const v = startRow + (k + 0.5) / dpr - 0.5;
    const lo = Math.min(last, Math.max(0, Math.floor(v)));
    const hi = Math.min(last, Math.max(0, lo + 1));
    const t = Math.min(1, Math.max(0, v - Math.floor(v)));
    const a = v <= 0 ? STRIP_ROW_ALPHA[0] : STRIP_ROW_ALPHA[lo] + (STRIP_ROW_ALPHA[hi] - STRIP_ROW_ALPHA[lo]) * t;
    rows.push({ height: 1 / dpr, alpha: Math.round(a) / 255 });
  }
  return rows;
}

// Fills its (absolutely positioned, overflow hidden) parent strip box with the rows.
export function ShadowStripRows({ startRow, cssHeight, testID }: { startRow: number; cssHeight: number; testID?: string }) {
  const dpr = PixelRatio.get();
  return (
    <>
      {stripRows(startRow, cssHeight, dpr).map((r, i) => (
        <View key={i} testID={testID ? `${testID}-row-${i}` : undefined} style={[styles.row, { height: r.height, backgroundColor: `rgba(0,0,0,${r.alpha})` }]} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%' },
});
