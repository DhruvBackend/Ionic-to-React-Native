// Ionic 3.9.5 md <ion-modal> (components/modal/modal-component.js, modal.scss, modal.md.scss,
// modal-transitions.js ModalMDSlideIn / ModalMDSlideOut). On phones (width < 768 px) the backdrop is hidden and
// the wrapper is the full screen, so the page slides up 40 px while fading in (280 ms) and back down while
// fading out (200 ms, another curve). Tablets (>= 768 x 600) would get a 600 x 500 centred card; Topbath
// is a phone app, so only the phone layout is built.
import React, { useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { modalMd } from '../../theme/ionicMdPickers';
import { finishDismiss, requestDismiss, type ModalOptions, type OverlayEntry } from '../../ui/overlays';
import { enterLeave, useOverlayLifecycle } from './useOverlayLifecycle';

export function ModalCmp({ entry }: { entry: OverlayEntry }) {
  const d: ModalOptions = entry.options;
  const enabled = useRef(false);
  const progress = useOverlayLifecycle(
    {
      enterMs: modalMd.enter.duration,
      leaveMs: modalMd.leave.duration,
      easing: modalMd.enter.easing,
      leaveEasing: modalMd.leave.easing,
    },
    entry.leaving,
    () => {
      enabled.current = true;
    },
    () => finishDismiss(entry.id),
  );
  const translateY = enterLeave(progress, modalMd.enter.translateY, modalMd.leave.translateY);
  const opacity = enterLeave(progress, modalMd.enter.opacity, modalMd.leave.opacity);
  return (
    <View testID="modal-root" style={StyleSheet.absoluteFill}>
      <Animated.View
        testID="modal-wrapper"
        style={[styles.wrapper, { opacity, transform: [{ translateY }] }]}
      >
        {d.render({ dismiss: (data, role) => requestDismiss(entry.id, data, role) })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: modalMd.backgroundColor },
});
