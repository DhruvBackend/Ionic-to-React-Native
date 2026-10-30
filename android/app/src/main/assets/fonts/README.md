# Bundled fonts (plan Task 9, spec §2a)

The exact fonts the Ionic app rendered with. Android looks up `fontFamily` by file name, e.g. `fontFamily: 'Roboto-Medium'`. Use `fontFor()` from `src/theme/typography.ts` instead of naming files in screens.

| File | Source | Why |
|---|---|---|
| `Roboto-Light/Regular/Italic/Medium/MediumItalic/Bold.ttf` | Google Fonts `css?family=Roboto:300,400,400i,500,500i,700&subset=latin,latin-ext` (TrueType via a legacy Android user agent), Roboto v51 | `variables.scss:11-12` imports exactly these weights. `latin-ext` carries ₹ (U+20B9), used 37× in the templates. |
| `RobotoCondensed-Regular.ttf` | Google Fonts `css?family=Roboto+Condensed&subset=latin,latin-ext`, v31 | `variables.scss:11` (weight 400 only) |
| `MaterialIcons-Regular.ttf` | Google Fonts `icon?family=Material+Icons`, v145 | `index.html:18`; used as `<i class="material-icons">name</i>` (ligatures) |
| `ionicons.ttf` | npm `ionicons@3.0.0` `dist/fonts/ionicons.ttf` | The shipped app's `assets/fonts/ionicons.woff`/`.woff2` are byte-identical to the npm 3.0.0 files, so this is the same font. The glyph map is `src/components/ionic/ionicons3.json`. |

Not bundled, because the Ionic app never loaded them (each falls back to Roboto there too): Open Sans (`$family`), Colfax-Regular/Medium, DS-Digital.

Devanagari (Hindi/Nepali) is not in Roboto. Both the WebView and React Native fall back to the system font for those characters.
