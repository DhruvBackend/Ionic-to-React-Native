// @ts-nocheck
// Deliberately breaks the screens-only bans of .eslintrc.js; __tests__/theme-i18n.test.ts lints this file
// and expects one error per line below. Never import it.
import { Alert, ToastAndroid } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';

export const bad = [DateTimePicker, Icon];
export function misuse() {
  Alert.alert('x');
  ToastAndroid.show('x', 1);
}
