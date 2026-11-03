// Values of the Super30 page (Ionic Super30Page) that src/theme/variables.scss spells as hex colours (`.super-plumber`, lines 4829-5010).
// Citations: [T] = src/theme/variables.scss line (Ionic source). super30.scss itself is empty.
export const super30Md = {
  line: '#ccc', // [T] 4852 .point border, 4863 .detail border, 4918 :after arrow, 4959/4967 dashed connector, 4911 .photo background
  ink: '#000', // [T] 4881 .info h4 { color: #000 }
  starOn: '#ffbf00', // [T] 4900 li.active i
  starOff: '#ccc', // [T] 4890 i { color }
  activePointBorder: '#558b2f', // [T] 4941 .list.active .point border
  activePointBg: '#11998d', // [T] 4942 .list.active .point background
  gradientFrom: '#11998e', // [T] 4948 .list.active .detail linear-gradient(to right, #11998e, #38ef7d); also the :after arrow colour (4957)
  gradientTo: '#38ef7d',
} as const;
