// Imperative overlay API (Ionic AlertController / LoadingController / ToastController /
// ActionSheetController) backed by a module-level stack that <OverlayHost/> renders
// (src/components/ionic/OverlayHost.tsx). Plan Task 9 part 2.
//
// Ionic keeps three portals in ion-app (components/app/app-root.js:74-82): the default overlay portal
// (alerts, action sheets), the loading portal and the toast portal. Hardware back only looks at the
// default portal (Topbath app.component.ts:167 `_overlayPortal._views[0]`), so loading and toast never
// count as an open overlay.

export interface AlertInput {
  type?: string; // 'radio' | 'checkbox' | 'text' | 'number' | 'tel' | 'email' | 'password' ...
  name?: string;
  placeholder?: string;
  value?: unknown;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  id?: string;
  handler?: (input: AlertInput) => void;
  min?: number | string;
  max?: number | string;
}

export interface AlertButton {
  text: string;
  role?: 'cancel' | string;
  cssClass?: string;
  // Ionic: returning false keeps the alert open. Receives the radio value, the checkbox value array or
  // the {name: value} map of text inputs (alert-component.js getValues).
  handler?: (data?: any) => boolean | void;
}

export interface AlertOptions {
  title?: string;
  subTitle?: string;
  message?: string;
  cssClass?: string;
  inputs?: AlertInput[];
  buttons: (string | AlertButton)[];
  enableBackdropDismiss?: boolean; // default true (alert.js:25)
  onDidDismiss?: (data?: unknown, role?: string) => void;
}

export interface LoadingOptions {
  content?: string; // innerHTML in Ionic; only plain text and the Topbath gif.svg <img> are drawn
  spinner?: string; // default 'crescent' in md; 'hide' draws none
  cssClass?: string;
  showBackdrop?: boolean; // default true (loading.js:24)
  enableBackdropDismiss?: boolean; // default false (loading.js:25)
  dismissOnPageChange?: boolean; // default false (loading.js:26)
  duration?: number;
  onDidDismiss?: (data?: unknown, role?: string) => void;
}

export interface ToastOptions {
  message?: string;
  duration?: number; // Topbath's presentToast passes 3000 (dbservice.ts:232-236); this helper defaults to it
  position?: 'top' | 'middle' | 'bottom';
  showCloseButton?: boolean;
  closeButtonText?: string;
  cssClass?: string;
  dismissOnPageChange?: boolean; // default false (toast.js:24)
  onDidDismiss?: (data?: unknown, role?: string) => void;
}

export interface ActionSheetButton {
  text: string;
  role?: 'cancel' | 'destructive' | 'selected' | string;
  icon?: string;
  cssClass?: string;
  handler?: () => boolean | void;
}

export interface ActionSheetOptions {
  title?: string;
  subTitle?: string;
  cssClass?: string;
  buttons: (string | ActionSheetButton)[];
  enableBackdropDismiss?: boolean; // default true (action-sheet.js:23)
  onDidDismiss?: (data?: unknown, role?: string) => void;
}

export type OverlayKind = 'alert' | 'loading' | 'toast' | 'actionSheet';

export interface OverlayEntry {
  id: number;
  kind: OverlayKind;
  options: any;
  dismissOnPageChange: boolean;
  leaving: boolean;
  data?: unknown;
  role?: string;
}

// Click block (components/app/click-block.js, app.js:98-113, navigation/nav-controller-base.js:587-590):
// every present/dismiss except toast (toast.js:96 disableApp=false) blocks the whole app for the
// transition + 64 ms (CLICK_BLOCK_BUFFER_IN_MILLIS), and a dismiss keeps it for at least 400 ms from its
// start (view-controller.js:130-134 minClickBlockDuration). Transition durations: alert/loading 200 ms
// (alert-transitions.js, loading-transitions.js), action sheet 400 in / 450 out.
const CLICK_BLOCK_BUFFER_MS = 64;
const MIN_DISMISS_BLOCK_MS = 400;
const ENTER_MS: Record<OverlayKind, number> = {
  alert: 200,
  loading: 200,
  actionSheet: 400,
  toast: 0,
};
const LEAVE_MS: Record<OverlayKind, number> = {
  alert: 200,
  loading: 200,
  actionSheet: 450,
  toast: 0,
};

let entries: OverlayEntry[] = [];
let nextId = 1;
let clickBlock = false;
let clickBlockTimer: ReturnType<typeof setTimeout> | undefined;
let clickBlockUntil = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

export const overlayStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getEntries: () => entries,
  getClickBlock: () => clickBlock,
};

function blockClicks(ms: number) {
  const until = Date.now() + ms;
  if (clickBlock && until <= clickBlockUntil) {
    return;
  }
  clickBlockUntil = until;
  clickBlock = true;
  if (clickBlockTimer) {
    clearTimeout(clickBlockTimer);
  }
  clickBlockTimer = setTimeout(() => {
    clickBlock = false;
    clickBlockTimer = undefined;
    emit();
  }, ms);
}

function present(
  kind: OverlayKind,
  options: any,
  dismissOnPageChange: boolean,
): { dismiss(): void } {
  const entry: OverlayEntry = {
    id: nextId++,
    kind,
    options,
    dismissOnPageChange,
    leaving: false,
  };
  entries = [...entries, entry];
  if (kind !== 'toast') {
    blockClicks(ENTER_MS[kind] + CLICK_BLOCK_BUFFER_MS);
  }
  emit();
  return { dismiss: () => requestDismiss(entry.id) };
}

// ViewController.dismiss(data, role): start the leave transition. The component calls finishDismiss
// when its leave animation is done.
export function requestDismiss(
  id: number,
  data?: unknown,
  role?: string,
): void {
  const entry = entries.find(e => e.id === id);
  if (!entry || entry.leaving) {
    return;
  }
  entries = entries.map(e =>
    e.id === id ? { ...e, leaving: true, data, role } : e,
  );
  if (entry.kind !== 'toast') {
    // toast.js dismisses with { disableApp: false }: no click block
    blockClicks(
      Math.max(
        MIN_DISMISS_BLOCK_MS,
        LEAVE_MS[entry.kind] + CLICK_BLOCK_BUFFER_MS,
      ),
    );
  }
  emit();
}

// Called once the leave animation has finished: remove the view, then onDidDismiss(data, role).
export function finishDismiss(id: number): void {
  const entry = entries.find(e => e.id === id);
  if (!entry) {
    return;
  }
  entries = entries.filter(e => e.id !== id);
  emit();
  entry.options.onDidDismiss?.(entry.data, entry.role);
}

export function showAlert(opts: AlertOptions): { dismiss(): void } {
  return present('alert', opts, false);
}

export function showLoading(opts: LoadingOptions = {}): { dismiss(): void } {
  return present('loading', opts, !!opts.dismissOnPageChange);
}

// ToastController.create({ message, duration: 3000, position: 'bottom' }) as dbservice.presentToast does.
export function showToast(
  message: string,
  opts: ToastOptions = {},
): { dismiss(): void } {
  const options: ToastOptions = { duration: 3000, ...opts, message };
  return present('toast', options, !!opts.dismissOnPageChange);
}

export function showActionSheet(opts: ActionSheetOptions): { dismiss(): void } {
  return present('actionSheet', opts, false);
}

// Hardware back: only the default portal (alerts and action sheets) counts. Views stay in the
// portal until their leave transition has finished, as in Ionic.
export function isOverlayOpen(): boolean {
  return entries.some(e => e.kind === 'alert' || e.kind === 'actionSheet');
}

// NOTE (parity): Ionic's back handler dismisses `_overlayPortal._views[0]`, the OLDEST alert or action
// sheet, with a plain dismiss(): no button handler runs.
export function dismissTopOverlay(): void {
  const first = entries.find(
    e => (e.kind === 'alert' || e.kind === 'actionSheet') && !e.leaving,
  );
  if (first) {
    requestDismiss(first.id);
  }
}

// OverlayPortal (components/app/overlay-portal.js:32-37): when a page (not an overlay) has left, every
// view with dismissOnPageChange is dismissed.
export function notifyPageChange(): void {
  entries
    .filter(e => e.dismissOnPageChange && !e.leaving)
    .forEach(e => requestDismiss(e.id));
}

export function _resetOverlaysForTests(): void {
  entries = [];
  clickBlock = false;
  clickBlockUntil = 0;
  if (clickBlockTimer) {
    clearTimeout(clickBlockTimer);
    clickBlockTimer = undefined;
  }
  emit();
}
