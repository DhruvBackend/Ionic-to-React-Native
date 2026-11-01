// Phase 0 component-parity fixes (see the commit message): pure helpers behind the tab widths and margin collapsing.
import { flexTabWidths } from '../src/components/ionic/IonTabs';
import { itemVerticalMargins } from '../src/components/ionic/IonField';

describe('flexTabWidths (flex: 1 with min-width: auto)', () => {
  test('equal share when every label fits', () => {
    expect(flexTabWidths(360, [60, 70, 72, 60, 60])).toEqual([72, 72, 72, 72, 72]);
  });
  test('a wide label keeps its width, the others share the rest', () => {
    const w = flexTabWidths(360, [60, 90, 60, 60, 60]);
    expect(w[1]).toBe(90);
    expect(w[0]).toBe(67.5);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(360);
  });
});

describe('itemVerticalMargins', () => {
  test('cs-input / cs-select have 16px top and bottom, edit selects only a bottom margin, others none', () => {
    expect(itemVerticalMargins('csInput')).toEqual({ top: 16, bottom: 16 });
    expect(itemVerticalMargins('csSelect')).toEqual({ top: 16, bottom: 16 });
    expect(itemVerticalMargins('editCsNormalSelect').top).toBe(0);
    expect(itemVerticalMargins('editCsNormalSelect').bottom).toBeGreaterThan(0);
    expect(itemVerticalMargins('plain')).toEqual({ top: 0, bottom: 0 });
  });
});
