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
import { iframeDefaults } from '../theme/ionicMdScroll';

export interface WebEmbedProps {
  uri: string;
  height: number | `${number}%`; // the iframe height attribute (180, or '100%')
  border?: 'inset' | 'none';
  testID?: string;
}

export function WebEmbed({ uri, height, border = 'inset', testID = 'web-embed' }: WebEmbedProps) {
  const d = iframeDefaults;
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
        source={{ uri }}
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
