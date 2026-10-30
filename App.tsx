// App root, ported from src/app/app.component.ts + app.html:
// platform.ready → status bar, version check, then the stored session decides the first page.
// Until that decision the app shows nothing, as Ionic did before setting rootPage.
// The splash screen (config.xml) is ported separately (plan Task 8b).
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';
import { AppFrame } from './src/app/AppFrame';
import { decideStartRoute, type StartDecision } from './src/app/startup';
import { useBackButton } from './src/app/useBackButton';
import { runVersionCheck } from './src/app/versionCheck';
import { initPushNotification } from './src/native/push';
import { RootNavigator } from './src/navigation/RootNavigator';

function Startup() {
  const [start, setStart] = useState<StartDecision | null>(null);
  useBackButton();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    runVersionCheck();
    decideStartRoute().then(decision => {
      setStart(decision);
      if (decision.startPushAfterMs) {
        timer = setTimeout(initPushNotification, decision.startPushAfterMs);
      }
    });
    return () => clearTimeout(timer);
  }, []);

  if (!start) {
    return <View style={StyleSheet.absoluteFill} />;
  }
  return <RootNavigator initialRouteName={start.route} />;
}

function App() {
  return (
    <SafeAreaProvider>
      <AppFrame>
        <Startup />
      </AppFrame>
    </SafeAreaProvider>
  );
}

export default App;
