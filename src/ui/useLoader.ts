// LoadingController as a hook (plan Task 9 interface `useLoader`). Ionic pages kept `this.loading` and
// called present()/dismiss() by hand, so errors and page changes left loaders open (Review Focus 4).
// This hook always closes what it opened: on hide(), when a wrapped promise settles (resolve AND
// reject, the rejection is rethrown) and when the component unmounts.
import { useCallback, useEffect, useRef } from 'react';
import { showLoading, type LoadingOptions } from './overlays';

// dbservice.ts:203-217 onShowLoadingHandler: content 'Please wait...', dismissOnPageChange: true.
const DEFAULT_CONTENT = 'Please wait...';

export function useLoader() {
  const current = useRef<{ dismiss(): void } | null>(null);

  const hide = useCallback(() => {
    current.current?.dismiss();
    current.current = null;
  }, []);

  const show = useCallback(
    (content: string = DEFAULT_CONTENT, opts: Omit<LoadingOptions, 'content'> = {}) => {
      // A second show() must not orphan the first loader (Ionic did).
      current.current?.dismiss();
      current.current = showLoading({ dismissOnPageChange: true, ...opts, content });
    },
    [],
  );

  const wrap = useCallback(
    async <T,>(p: Promise<T>): Promise<T> => {
      if (!current.current) {
        show();
      }
      try {
        return await p;
      } finally {
        hide();
      }
    },
    [show, hide],
  );

  useEffect(() => hide, [hide]);

  return { show, hide, wrap };
}
