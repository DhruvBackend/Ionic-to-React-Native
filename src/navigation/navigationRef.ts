// Navigation from outside screens (start-up logic, push notifications, debug links).
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

// Ionic app.getRootNav().setRoot(Page, params): replace everything with one page.
export function resetTo(name: string, params?: object): void {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name, params }] });
  }
}
