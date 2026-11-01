// The md header/footer shadow strip drawn as per-device-pixel alpha rows (src/components/ionic/ShadowStrip.tsx).
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { PixelRatio, StyleSheet, View } from 'react-native';
import zlib from 'zlib';
import { headerShadowPng } from '../src/theme/ionicMdPickers';
import { STRIP_ROW_ALPHA, ShadowStripRows, stripRows } from '../src/components/ionic/ShadowStrip';
import { IonFooter, IonHeader } from '../src/components/ionic/IonNavbar';

function decodePngRowAlpha(uri: string): number[] {
  const b = Buffer.from(uri.split(',')[1], 'base64');
  let o = 8;
  let trns: number[] = [];
  const idat: Buffer[] = [];
  let width = 0;
  let height = 0;
  while (o < b.length) {
    const len = b.readUInt32BE(o);
    const type = b.toString('ascii', o + 4, o + 8);
    const data = b.subarray(o + 8, o + 8 + len);
    o += 12 + len;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      expect([data[8], data[9]]).toEqual([4, 3]); // 4-bit palette
    }
    if (type === 'tRNS') {
      trns = [...data];
    }
    if (type === 'IDAT') {
      idat.push(data);
    }
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = 1 + Math.ceil((width * 4) / 8);
  const out: number[] = [];
  for (let y = 0; y < height; y++) {
    expect(raw[y * stride]).toBe(0); // filter none
    out.push(trns[raw[y * stride + 1] >> 4]); // every pixel of a row has the same index
  }
  return out;
}

test('STRIP_ROW_ALPHA is the per-row alpha decoded from the main.css PNG data URI', () => {
  expect(decodePngRowAlpha(headerShadowPng)).toEqual([...STRIP_ROW_ALPHA]);
  expect(STRIP_ROW_ALPHA.map(a => a.toString(16).padStart(2, '0'))).toEqual(['09', '14', '2d', '20', '14', '09', '04']);
});

describe('stripRows (bilinear 3x of the PNG rows, like Chrome at DPR 3)', () => {
  const a = (rows: ReturnType<typeof stripRows>) => rows.map(r => Math.round(r.alpha * 255));
  test('header: 5 css px = 15 device rows, soft falling gradient from row 2 down to row 6', () => {
    const rows = stripRows(2, 5, 3);
    expect(rows).toHaveLength(15);
    expect(rows[0].height).toBeCloseTo(1 / 3);
    const alphas = a(rows);
    // first device row: v = 2 + (.5/3) - .5 = 1.667 -> between row 1 (0x14) and row 2 (0x2d)
    expect(alphas[0]).toBe(Math.round(0x14 + (0x2d - 0x14) * (2 / 3)));
    // device row 1: v = 2.0 -> exactly row 2
    expect(alphas[1]).toBe(0x2d);
    // never a hard 3 px band: consecutive rows differ and the strip never rises after its peak
    const peak = alphas.indexOf(Math.max(...alphas));
    for (let i = peak + 1; i < alphas.length; i++) {
      expect(alphas[i]).toBeLessThanOrEqual(alphas[i - 1]);
    }
    expect(new Set(alphas.slice(peak)).size).toBeGreaterThanOrEqual(12); // nearly every row differs (only the clamped tail ties) = smooth
    // last device row: v = 2 + 14.5/3 - .5 = 6.33 -> clamped past the last row
    expect(alphas[14]).toBe(0x04);
  });
  test('footer: 2 css px = 6 device rows from row 0, clamped above row 0', () => {
    const alphas = a(stripRows(0, 2, 3));
    expect(alphas).toHaveLength(6);
    expect(alphas[0]).toBe(0x09); // v < 0: clamped to row 0
    expect(alphas[5]).toBe(Math.round(0x14 + (0x2d - 0x14) * (1 / 3))); // v = 1.333
  });
  test('works at fractional densities', () => {
    expect(stripRows(2, 5, 2.625)).toHaveLength(Math.round(5 * 2.625));
  });
});

describe('strips are Views, never an <Image>', () => {
  test('ShadowStripRows renders one View per device row with rgba(0,0,0,a)', () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
    let t!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      t = ReactTestRenderer.create(<ShadowStripRows startRow={2} cssHeight={5} testID="s" />);
    });
    const rows = t.root.findAll(n => typeof n.type === 'string' && String(n.props.testID ?? '').startsWith('s-row-'));
    expect(rows).toHaveLength(15);
    expect(StyleSheet.flatten(rows[1].props.style).backgroundColor).toBe(`rgba(0,0,0,${0x2d / 255})`);
  });
  test('IonHeader and IonFooter strips contain rows and no Image', () => {
    let t!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      t = ReactTestRenderer.create(
        <View>
          <IonHeader testID="h" />
          <IonFooter testID="f" />
        </View>,
      );
    });
    const names = t.root.findAll(n => typeof n.type === 'string').map(n => n.type);
    expect(names).not.toContain('Image');
    const hs = t.root.findAll(n => n.props.testID === 'ion-header-strip')[0];
    expect(hs.findAll(n => typeof n.type === 'string' && String(n.type) === 'View').length).toBeGreaterThan(5);
  });
});
