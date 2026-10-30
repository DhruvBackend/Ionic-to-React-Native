// Ionic overlay API (AlertController) used by app-level code.
// TEMPORARY implementation: React Native's native Alert, so wording and buttons already match Ionic
// but the look does not. Plan Task 9 replaces the body of these functions with the Ionic md-mode
// alert replica; callers keep this interface.
import { Alert } from 'react-native';

export interface AlertButton {
  text: string;
  role?: 'cancel';
  // Ionic: returning false keeps the alert open.
  handler?: (data?: unknown) => boolean | void;
}

export interface AlertOptions {
  title?: string;
  subTitle?: string;
  message?: string;
  buttons: (string | AlertButton)[];
  enableBackdropDismiss?: boolean;
  onDidDismiss?: () => void;
}

let openCount = 0;

export function showAlert(opts: AlertOptions): { dismiss(): void } {
  openCount++;
  const closed = () => {
    openCount = Math.max(0, openCount - 1);
    opts.onDidDismiss?.();
  };
  const buttons = opts.buttons.map(b => (typeof b === 'string' ? { text: b } : b));
  Alert.alert(
    opts.title ?? '',
    [opts.subTitle, opts.message].filter(Boolean).join('\n\n'),
    buttons.map(b => ({
      text: b.text,
      onPress: () => {
        b.handler?.();
        closed();
      },
    })),
    { cancelable: opts.enableBackdropDismiss !== false, onDismiss: closed },
  );
  return { dismiss() {} }; // native alerts can't be closed from code; the replica (Task 9) can
}

export function isOverlayOpen(): boolean {
  return openCount > 0;
}

// The native alert handles the back button itself; the replica (Task 9) implements this.
export function dismissTopOverlay(): void {}
