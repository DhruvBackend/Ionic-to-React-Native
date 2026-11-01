package android.support.v4.content;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

/**
 * Compatibility shim. The ZXing scanner library shipped with phonegap-plugin-barcodescanner 8.1.0
 * (libs/barcodescanner-release-2.1.5.aar, the exact binary the shipped Ionic app contains) was compiled
 * against the old support library and calls android.support.v4.content.LocalBroadcastManager. This app
 * is AndroidX only, so the class is provided here and delegates to the AndroidX equivalent.
 */
public final class LocalBroadcastManager {
  private final androidx.localbroadcastmanager.content.LocalBroadcastManager delegate;

  private LocalBroadcastManager(Context context) {
    delegate = androidx.localbroadcastmanager.content.LocalBroadcastManager.getInstance(context);
  }

  public static LocalBroadcastManager getInstance(Context context) {
    return new LocalBroadcastManager(context);
  }

  public void registerReceiver(BroadcastReceiver receiver, IntentFilter filter) {
    delegate.registerReceiver(receiver, filter);
  }

  public void unregisterReceiver(BroadcastReceiver receiver) {
    delegate.unregisterReceiver(receiver);
  }

  public boolean sendBroadcast(Intent intent) {
    return delegate.sendBroadcast(intent);
  }
}
