// Adds the harness-only ParityGalleryPage (parity/reference/gallery/*) to the Ionic work copy. Runs under Node 10 (plain ES5-ish JS).
// Idempotent: the work copy is re-extracted from the Ionic source before every build, and the app.module patch below is guarded.
//   node parity/reference/install-gallery.js <galleryDir> <workDir>
var fs = require('fs');
var path = require('path');

var galleryDir = process.argv[2];
var work = process.argv[3];
if (!galleryDir || !work) {
  throw new Error('usage: install-gallery.js <galleryDir> <workDir>');
}
var dest = path.join(work, 'src', 'pages', 'parity-gallery');
if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest);
}
var sample = fs.readFileSync(path.join(galleryDir, 'sample-image.b64'), 'utf8').trim();
fs.readdirSync(galleryDir).forEach(function (f) {
  if (!/^parity-gallery\.(ts.txt|html|scss)$/.test(f)) {
    return;
  }
  var text = fs.readFileSync(path.join(galleryDir, f), 'utf8').split('@@SAMPLE_IMAGE@@').join(sample);
  fs.writeFileSync(path.join(dest, f.replace(/.txt$/, '')), text); // .ts.txt: stored as text so the RN tsc ignores them (like jwt-decode-shim)
});

var modSrc = fs.readFileSync(path.join(galleryDir, 'parity-gallery.module.ts.txt'), 'utf8');
fs.writeFileSync(path.join(dest, 'parity-gallery.module.ts'), modSrc);

var appModule = path.join(work, 'src', 'app', 'app.module.ts');
var m = fs.readFileSync(appModule, 'utf8');
if (m.indexOf('ParityGalleryPageModule') < 0) {
  var anchor = 'LanguagePageModule,';
  var imp = "import { ParityGalleryPageModule } from '../pages/parity-gallery/parity-gallery.module';\n";
  var idx = m.indexOf(anchor, m.indexOf('imports:'));
  if (idx < 0) {
    throw new Error('install-gallery: anchor "' + anchor + '" not found in app.module.ts');
  }
  m = imp + m.slice(0, idx) + 'ParityGalleryPageModule,\n        ' + m.slice(idx);
  fs.writeFileSync(appModule, m);
}
console.log('OK: parity gallery page installed in ' + dest);
