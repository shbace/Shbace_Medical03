import type { CapacitorConfig } from '@capacitor/cli';

// Edge-to-edge is handled natively in MainActivity (real insets -> window.ShbaceInsets).
// The two keys below stop Capacitor itself from ALSO adding margins/CSS for the system bars,
// so insets are applied exactly once. Unknown keys are ignored by older/newer Capacitor versions.
const config = {
  appId: 'com.shbace.medical',
  appName: 'Shbace Medical',
  webDir: 'www',
  android: {
    allowMixedContent: false,
    adjustMarginsForEdgeToEdge: 'disable' // Capacitor 7.x key (no-op where unsupported)
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'disable',            // Capacitor 8 core SystemBars: no injected CSS / margins
      style: 'DARK',                        // light icons on the dark background
      hidden: true                          // immersive: start with the system bars hidden (MainActivity also enforces it natively)
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_notify',          // res/drawable/ic_stat_notify.xml (white, monochrome)
      iconColor: '#2F8BFF'
    }
  }
} as CapacitorConfig;

export default config;
