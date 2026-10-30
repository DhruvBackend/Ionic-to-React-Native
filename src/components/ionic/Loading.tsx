// Ionic 3.9.5 md-mode <ion-loading> (components/loading/loading-component.js + loading.scss +
// loading.md.scss) with the Topbath overrides: transparent wrapper, no shadow (variables.scss:9940)
// and white content text (variables.scss:9945).
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { appFontSize, loadingMd, normalLineHeight, overlay, topbathLoading } from '../../theme/ionicMdOverlays';
import { finishDismiss, requestDismiss, type LoadingOptions, type OverlayEntry } from '../../ui/overlays';
import { Backdrop } from './Backdrop';
import { CrescentSpinner, GifLoader } from './Spinner';
import { stripHtml } from './html';
import { textStyle } from './text';
import { enterLeave, useOverlayLifecycle } from './useOverlayLifecycle';

// Content that is the Topbath loader image: `<img src="./assets/imgs/gif.svg" class="h55" />`
// (49 call sites; 10 without the class, 39 with it).
export function parseLoadingContent(content: string): { kind: 'gif'; size: number } | { kind: 'text'; text: string } {
  const img = /<img\b[^>]*src=["'][^"']*gif\.svg["'][^>]*>/i.exec(content);
  if (img) {
    const h55 = /class=["'][^"']*\bh55\b[^"']*["']/i.test(img[0]);
    return { kind: 'gif', size: h55 ? topbathLoading.gifSizeH55 : topbathLoading.gifSize };
  }
  return { kind: 'text', text: stripHtml(content) };
}

export function LoadingCmp({ entry }: { entry: OverlayEntry }) {
  const d: LoadingOptions = entry.options;
  const showBackdrop = d.showBackdrop ?? true; // loading.js:24
  const enableBackdropDismiss = d.enableBackdropDismiss ?? false; // loading.js:25
  // LoadingCmp.ngOnInit: no spinner given -> the mode's spinner (md: crescent); 'hide' draws none
  const showSpinner = d.spinner !== 'hide';
  const content = d.content ? parseLoadingContent(d.content) : null;
  const durationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const progress = useOverlayLifecycle(
    { enterMs: loadingMd.enter.duration, leaveMs: loadingMd.leave.duration, easing: overlay.easeInOut },
    entry.leaving,
    () => {
      // ionViewDidEnter: dismiss after `duration`
      if (d.duration) {
        durationTimer.current = setTimeout(() => requestDismiss(entry.id, undefined, 'backdrop'), d.duration);
      }
    },
    () => finishDismiss(entry.id),
  );
  useEffect(() => () => clearTimeout(durationTimer.current), []);
  useEffect(() => {
    if (entry.leaving) {
      clearTimeout(durationTimer.current);
    }
  }, [entry.leaving]);

  const wrapperOpacity = enterLeave(progress, loadingMd.enter.wrapperOpacity, loadingMd.leave.wrapperOpacity);
  const wrapperScale = enterLeave(progress, loadingMd.enter.wrapperScale, loadingMd.leave.wrapperScale);
  const backdropOpacity = enterLeave(progress, loadingMd.enter.backdropOpacity, loadingMd.leave.backdropOpacity);

  // .loading-spinner and .loading-content are block divs holding inline content; the strut of the
  // 14px Roboto line adds its descent below an inline-block spinner or <img> (baseline alignment).
  const descent = normalLineHeight(appFontSize) - Math.round((appFontSize * 1900) / 2048);

  return (
    <View testID="loading-root" style={[StyleSheet.absoluteFill, styles.root]}>
      <Backdrop hidden={!showBackdrop} opacity={backdropOpacity} onPress={() => enableBackdropDismiss && requestDismiss(entry.id, undefined, 'backdrop')} />
      <Animated.View
        testID="loading-wrapper"
        style={[styles.wrapper, { opacity: wrapperOpacity, transform: [{ scale: wrapperScale }] }]}>
        {showSpinner && (
          <View style={{ height: loadingMd.spinnerSize + descent }}>
            <CrescentSpinner testID="loading-spinner" />
          </View>
        )}
        {content && (
          <View testID="loading-content" style={showSpinner ? styles.contentAfterSpinner : undefined}>
            {content.kind === 'gif' ? (
              <View style={{ height: content.size + descent }}>
                <GifLoader size={content.size} color={topbathLoading.contentColor} />
              </View>
            ) : (
              <Text testID="loading-content-text" style={textStyle(appFontSize, 400, topbathLoading.contentColor)}>
                {content.text}
              </Text>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ion-loading { display: flex; align-items: center; justify-content: center }
  root: { alignItems: 'center', justifyContent: 'center' },
  // .loading-wrapper { display: flex; align-items: center } + .loading-md .loading-wrapper, with the
  // background and box-shadow replaced by Topbath's `transparent !important` / `none !important`
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: loadingMd.maxWidth,
    maxHeight: loadingMd.maxHeightPct,
    padding: loadingMd.padding,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  // .loading-md .loading-spinner + .loading-content { margin-left: 16px }
  contentAfterSpinner: { marginLeft: loadingMd.contentMarginStart },
});
