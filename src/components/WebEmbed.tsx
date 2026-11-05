// <iframe [src]=url width="100%" height="180" ...> -> a WebView (5 active usages: video list, complaint video, plumber
// complaint video, contact map, point-location map).
// Chromium draws an iframe with the UA rule `iframe{border:2px inset}`. THREE pages write the attribute typo `rameborder="0"`
// (video.html, complaint-detail.html, pulmber-customer-detail.html), so they keep it (default border="inset"); the other two
// have no border: contact.html (`style="border:0"`) and point-location.html (`frameborder="0" style="border:0"`), i.e.
// border="none". See iframeDefaults in ionicMdScroll.ts (inset colours: NOTE (parity), verify in the parity harness).
// NOTE (parity): an inline iframe also leaves the line box's descender gap below it (~4 px at 14 px Roboto); the page
// layout must add that when it matters (verify in the parity harness).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { isMockTransport } from '../api/client';
import { iframeDefaults } from '../theme/ionicMdScroll';

export interface WebEmbedProps {
  uri: string;
  height: number | `${number}%`; // the iframe height attribute (180, or '100%')
  border?: 'inset' | 'none';
  testID?: string;
  // Load `uri` inside an <iframe> of a tiny HTML page (Ionic's `<iframe [src]=url>`), not as the WebView's own document.
  // Needed by embeds that refuse top-level loading (Google Maps: "The Google Maps Embed API must be used in an iframe.").
  iframe?: boolean;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// the page Ionic's <iframe width="100%" height="100%" frameborder="0" style="border:0"> lives in (cordova-android serves it from https://localhost)
// html/body get height:100% so the iframe's height:100% fills the WebView (without it the iframe falls back to 150px: phone pass 2026-11-04)
export function iframeHtml(uri: string): string {
  return `<!DOCTYPE html><html style="height:100%"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;overflow:hidden;height:100%"><iframe src="${esc(uri)}" width="100%" height="100%" frameborder="0" style="border:0;display:block;width:100%;height:100%"></iframe></body></html>`;
}

// Uploaded media while answering from the mock transport (parity captures): the fixtures name files that do not exist on
// the server, so an empty page is shown instead of the server's 404 page (the Ionic harness serves the same blank page).
export function embedUri(uri: string): string {
  return isMockTransport() && uri.includes('/uploads/') ? 'about:blank' : uri;
}

export function WebEmbed({ uri: rawUri, height, border = 'inset', testID = 'web-embed', iframe = false }: WebEmbedProps) {
  const d = iframeDefaults;
  const uri = embedUri(rawUri);
  return (
    <View
      testID={testID}
      style={[
        styles.frame,
        { height },
        border === 'inset' && {
          borderWidth: d.insetWidth,
          borderTopColor: d.insetTopLeft,
          borderLeftColor: d.insetTopLeft,
          borderBottomColor: d.insetBottomRight,
          borderRightColor: d.insetBottomRight,
        },
      ]}
    >
      <WebView
        testID={`${testID}-webview`}
        // eslint-disable-next-line no-restricted-syntax -- cordova-android's own page origin, not a client URL
        source={iframe ? { html: iframeHtml(uri), baseUrl: 'https://localhost' } : { uri }}
        style={styles.web}
        javaScriptEnabled // an iframe runs scripts
        domStorageEnabled
        allowsFullscreenVideo // allowfullscreen
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%' }, // width="100%"
  web: { flex: 1, backgroundColor: 'transparent' }, // an iframe has a transparent background until the document paints
});
