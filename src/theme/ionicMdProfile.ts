// Values of the Profile page (Ionic ProfilePage) that come from Topbath's global src/theme/variables.scss rules reaching
// profile.html. Citations: [T] = variables.scss line. Colours that are the client's brand colour use `colors.primary`
// in the screen instead of the literal #002d25. NEW FILE added by the Profile port (shared theme dir: the lead may move it).
import { scssColors } from './index';

export const profileMd = {
  bg: '#F8FFFC', // [T] 3051-3053 .profile-bg { background: #F8FFFC !important } and 3059-3066 .profile { background: #F8FFFC }
  ink: '#1b1b1b', // [T] 2960-3000 .rating-area p / h3 / h4 colour
  nameInk: '#001731', // [T] 3115 .profile-detail .name p
  line: '#DEDEDE', // [T] 2949-2957 .rating-area border + .border-box border-bottom
  lineStrong: '#ccc', // [T] 451 .border-bottom { border-bottom: solid 1px #ccc !important }, 2958 .boxs border-right
  newClLine: '#dedede', // [T] 2998-3003 .rating-area.new-cl .ratings
  statusDefault: '#359C38', // [T] 3125-3139 .name a
  statusVerified: 'green', // [T] 499 .Verified { color: green !important }
  statusPending: '#ffc400', // [T] 507
  statusSuspect: 'skyblue', // [T] 511
  statusReject: scssColors.danger, // [T] 515 .Reject, .Cancel { color: $danger !important }
  docBg: '#ccc', // [T] 3152-3180 .document-img border + img background
  shareText: '#fefbd6', // [T] 1462-1490 .share-code p span / button colour
  black: scssColors.black, // [T] 261 $black-clr
} as const;
