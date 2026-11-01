// Tiny PNG helpers (crop, bilinear resize) on top of pngjs.
import { PNG } from 'pngjs';

export function crop(png, top, bottom) {
  const h = png.height - top - bottom;
  const out = new PNG({ width: png.width, height: h });
  png.data.copy(out.data, 0, top * png.width * 4, (top + h) * png.width * 4);
  return out;
}

export function resize(png, width, height) {
  if (png.width === width && png.height === height) {
    return png;
  }
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    const sy = Math.min(png.height - 1, ((y + 0.5) * png.height) / height - 0.5);
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(png.height - 1, y0 + 1);
    const fy = Math.max(0, sy - y0);
    for (let x = 0; x < width; x++) {
      const sx = Math.min(png.width - 1, ((x + 0.5) * png.width) / width - 0.5);
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(png.width - 1, x0 + 1);
      const fx = Math.max(0, sx - x0);
      for (let c = 0; c < 4; c++) {
        const p = (xx, yy) => png.data[(yy * png.width + xx) * 4 + c];
        const top = p(x0, y0) * (1 - fx) + p(x1, y0) * fx;
        const bot = p(x0, y1) * (1 - fx) + p(x1, y1) * fx;
        out.data[(y * width + x) * 4 + c] = Math.round(top * (1 - fy) + bot * fy);
      }
    }
  }
  return out;
}
