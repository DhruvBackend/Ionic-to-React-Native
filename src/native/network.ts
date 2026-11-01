// Connectivity. Ionic: @ionic-native/network onConnect() / onDisconnect() (dashboard.ts:80-85) ->
// cordova-plugin-network-information 3.0.0. Pages only set a flag in the callbacks (dbService.connectionChk).
// The plugin fires 'online' once at start-up when connected and on every change; NetInfo does the same (it reports the
// current state on subscribe). `online` here is "the device has a network"; NetInfo's isInternetReachable is ignored,
// like the plugin, which only looked at the connection type.
import NetInfo from '@react-native-community/netinfo';
import { fail, guard, ok, type NativeResult } from './result';
import { isMock, mockFailure } from './mock';

export type NetworkState = { online: boolean; type: string };

const mockListeners = new Set<(online: boolean) => void>();

// Test helper: delivers a connectivity change to MOCK-mode subscribers.
export function emitMockNetwork(online: boolean): void {
  mockListeners.forEach(cb => cb(online));
}

// Calls cb(true) on connect and cb(false) on disconnect. Returns the unsubscribe function. Never throws.
export function onNetworkChange(cb: (online: boolean) => void): () => void {
  if (isMock()) {
    mockListeners.add(cb);
    return () => {
      mockListeners.delete(cb);
    };
  }
  try {
    return NetInfo.addEventListener(state => cb(state.isConnected === true));
  } catch {
    return () => {};
  }
}

export function getNetworkState(): Promise<NativeResult<NetworkState>> {
  if (isMock()) {
    return Promise.resolve(mockFailure('network') ?? ok({ online: true, type: 'wifi' }));
  }
  return guard(async () => {
    const s = await NetInfo.fetch();
    return s.isConnected === null ? fail('unavailable') : ok({ online: s.isConnected, type: s.type });
  });
}
