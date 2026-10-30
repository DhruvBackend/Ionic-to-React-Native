// Which bundled font file the Ionic WebView would have drawn for a CSS font-family/weight/style.
// The faces are android/app/src/main/assets/fonts (see its README). Matching follows the CSS Fonts
// spec, so e.g. font-weight 600 (110 uses in the app) draws Roboto Bold, as it did in the WebView.
import type { TextStyle } from 'react-native';

type Weight = number | 'normal' | 'bold';

const ROBOTO_UPRIGHT: Record<number, string> = {
  300: 'Roboto-Light',
  400: 'Roboto-Regular',
  500: 'Roboto-Medium',
  700: 'Roboto-Bold',
};
const ROBOTO_ITALIC: Record<number, string> = {
  400: 'Roboto-Italic',
  500: 'Roboto-MediumItalic',
};

function numeric(w: Weight): number {
  return w === 'normal' ? 400 : w === 'bold' ? 700 : w;
}

// CSS Fonts Level 3 §5.2 weight matching over the available weights.
function closest(desired: number, available: number[]): number {
  const sorted = [...available].sort((a, b) => a - b);
  if (sorted.includes(desired)) {
    return desired;
  }
  const below = sorted.filter(w => w < desired).reverse();
  const above = sorted.filter(w => w > desired);
  if (desired >= 400 && desired <= 500) {
    const upTo500 = above.filter(w => w <= 500);
    return upTo500[0] ?? below[0] ?? above[0];
  }
  return desired < 400 ? below[0] ?? above[0] : above[0] ?? below[0];
}

export function fontFor(weight: Weight = 400, opts: { italic?: boolean; family?: string } = {}): TextStyle {
  const w = numeric(weight);

  if (opts.family === 'Roboto Condensed') {
    // Only the 400 face is loaded; browsers synthesise bold for weights of 600 and up.
    return w >= 600 ? { fontFamily: 'RobotoCondensed-Regular', fontWeight: 'bold' } : { fontFamily: 'RobotoCondensed-Regular' };
  }

  // Every other family named in the app (Roboto, Open Sans, Colfax, DS-Digital, sans-serif) ends up
  // as Roboto: the others were never loaded.
  if (opts.italic) {
    // CSS matches font-style before weight: any italic request uses the italic faces (400, 500).
    // Heavier requests get bold synthesised on top, as the browser does.
    const italic = ROBOTO_ITALIC[closest(w, [400, 500])];
    return w >= 600 ? { fontFamily: italic, fontWeight: 'bold' } : { fontFamily: italic };
  }
  return { fontFamily: ROBOTO_UPRIGHT[closest(w, [300, 400, 500, 700])] };
}
