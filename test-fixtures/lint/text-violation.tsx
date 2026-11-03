// @ts-nocheck
// Deliberately imports react-native Text; __tests__/textBreak.test.tsx lints this file and expects one
// no-restricted-imports error on line 4. Never import it.
import { Text, View } from 'react-native';

export const bad = [Text, View];
