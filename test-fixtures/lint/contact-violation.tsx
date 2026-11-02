// Lint fixture: contact details typed into a screen must be reported.
import { Linking, Text } from 'react-native';
export const A = () => <Text onPress={() => Linking.openURL('tel:8655050950')}>care@example.com</Text>;
export const B = `mailto:care@example.com`;
export const OK = (phone: string) => `tel:${phone}`; // allowed: the value comes from client config
