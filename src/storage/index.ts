// Replacement for @ionic/storage. Same keys as the Ionic app (see docs/INVENTORY.md "Storage keys").
// Ionic Storage stored any JS value; AsyncStorage only stores strings, so values are JSON-encoded here.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get(key: string): Promise<any> {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  },
  set(key: string, value: any): Promise<void> {
    return AsyncStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  },
  clear(): Promise<void> {
    return AsyncStorage.clear();
  },
};
