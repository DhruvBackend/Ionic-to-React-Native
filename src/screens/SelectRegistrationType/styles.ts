// Ported from: src/pages/select-registration-type/select-registration-type.scss (+ the global rules of src/theme/variables.scss that reach the template)
// Citations: [P] page scss line, [T] variables.scss line.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { listMd } from '../../theme/ionicMdContent';

export const logoHeight = 45; // [T] 1215 `.header-logo img { height: 45px }`

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },

  // [T] 1201-1213 `.header-logo`: absolute over the whole navbar box, flex centre, padding 0 10px, z-index -1, border-bottom 2px solid $primary.
  headerLogo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerLogoImg: { height: logoHeight },

  // [P] 12-18 ion-list { border-radius: 10px; border: 1px solid #dedede; overflow: hidden; margin: 20px !important; margin-top: 25px !important }
  list: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: listMd.borderColor,
    overflow: 'hidden',
    margin: 20,
    marginTop: 25,
  },
  // [P] 20-33 ion-item { padding: 0 !important; min-height: 55px !important; .item-inner { padding-left: 16px; ion-label { margin: 0 } } }
  item: { paddingLeft: 0, minHeight: 55 },
  itemInner: { paddingLeft: 16, minHeight: 55 },
  itemLabel: { margin: 0 },

  // [P] 35-50 .signup-btn { position: absolute; bottom: 16px; right: -3px; height: 45px; border-radius: 50px 0 0 50px; font-size: 16px; letter-spacing: 2px }
  signupBtn: {
    position: 'absolute',
    bottom: 16,
    right: -3,
    height: 45,
    borderRadius: 0,
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
  },
  signupLabel: { fontSize: 16, letterSpacing: 2 },
  // [P] 46-48 .signup-btn .material-icons { padding-left: 20px }; letter-spacing is inherited from the button
  signupIcon: { paddingLeft: 20, letterSpacing: 2 },
});
