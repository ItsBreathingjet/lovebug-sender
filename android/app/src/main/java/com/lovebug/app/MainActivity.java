
package com.lovebug.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.plugin.PushNotifications;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register the Capacitor plugins
        registerPlugin(PushNotifications.class);
    }
}
