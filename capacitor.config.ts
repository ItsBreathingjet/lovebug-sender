
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovebug.app',
  appName: 'Lovebug',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
