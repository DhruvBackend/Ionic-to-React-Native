// Ionic 3.9.5 Material Design ("md") mode default values, copied from the ionic-angular@3.9.5 SCSS
// (file:line cited per value). Topbath's variables.scss overrides none of these (it only sets
// $colors, $font-path and $app-direction), so the defaults are what the app rendered.
// Each replica part of plan Task 9 adds the values it needs, with citations.
import { ionicColors } from './index';

export const md = {
  // themes/ionic.theme.default.scss
  textColor: '#000', // :18 $text-color
  backgroundColor: '#fff', // :20 $background-color
  linkColor: ionicColors.primary, // :19 $link-color: color($colors, primary)

  // components/app/app.scss:26 $font-size-root: 62.5% makes 1rem = 10px
  fontSizeBase: 14, // themes/ionic.theme.default.scss:24 $font-size-base: 1.4rem

  // themes/ionic.globals.md.scss
  // :13 $font-family-md-base: "Roboto", "Helvetica Neue", sans-serif → bundled Roboto (src/theme/typography.ts)
  toolbarHeight: 56, // :23 $toolbar-md-height
  toolbarPadding: 4, // :24 $toolbar-md-padding
  toolbarTextColor: '#424242', // :27 $toolbar-md-text-color
  tabsTabColorInactive: '#3c3c3c', // :36 $tabs-md-tab-color-inactive
  listBorderColor: '#dedede', // :44 $list-md-border-color
  listActivatedBackgroundColor: '#f1f1f1', // :46 $list-md-activated-background-color
  itemPaddingTop: 13, // :52 $item-md-padding-top
  itemPaddingRight: 16, // :54 $item-md-padding-right
  itemPaddingBottom: 13, // :56 $item-md-padding-bottom
  itemPaddingLeft: 16, // :58 $item-md-padding-left
  itemPaddingMediaTop: 9, // :60
  itemPaddingMediaBottom: 9, // :61
  itemPaddingIconTop: 11, // :62
  itemPaddingIconBottom: 10, // :63
} as const;
