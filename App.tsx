// App root (Ionic: src/app/app.component.ts + app.html).
// Start-up logic (session restore, version check, back button, status bar, splash) arrives in plan Task 8.
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
