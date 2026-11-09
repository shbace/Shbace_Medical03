# Changelog

## 1.0.0 - native hardening pass (versionCode 1)

### Added
- **Edge-to-edge + safe areas**: `MainActivity` draws behind transparent status/navigation bars and gives the page the real
  insets once (`window.ShbaceInsets.get()` + `shbace-insets` event). Keyboard (IME) height is applied as bottom padding of the
  content view and reported to the page as `bottom = 0` while open, so nothing is doubled.
- **Native splash**: `androidx.core:core-splashscreen` (`Theme.SplashScreen`), background `#030B1F`, app logo, held until the page
  paints (max 2.5 s). The web splash is untouched.
- **Back button**: `@capacitor/app` installed and registered (`Capacitor.Plugins.App`). No native back handler was added.
- **Local notifications** (`@capacitor/local-notifications`, no Firebase/server): channels `review`, `quiz`, `reminders`;
  `POST_NOTIFICATIONS`; white `ic_stat_notify`. `src/native-bridge.js` schedules a Smart Review notification and a daily 19:00
  study reminder from localStorage and respects `shbace_notif_prefs_v1`. Tapping opens the matching page.
- **Launcher shortcuts**: Quiz, Smart Review, Question Bank (`shbace://route/<page>`).
- **Adaptive launcher icon** (foreground/background/monochrome for Android 13) and legacy icons generated from the app logo,
  replacing the default Capacitor icon; Capacitor placeholder splash images removed.
- Backup rules (`backup_rules.xml`, `data_extraction_rules.xml`): student data kept, caches/notification schedule excluded.
- `scripts/use-web-file.mjs` (`npm run web:use -- file.html`) and `scripts/check-web.mjs` (`npm run check:web`).

### Changed
- Themes merged (`AppTheme`, `AppTheme.NoActionBar`, `AppTheme.NoActionBarLaunch`) with values-v23/v27/v28/v29/v35 variants;
  undefined `colorPrimary/colorPrimaryDark/colorAccent` colors now defined (the old `styles.xml` referenced missing resources).
- Manifest: `adjustResize`, `usesCleartextTraffic=false`, `allowBackup=true` with rules, `hardwareAccelerated`, `VIBRATE`.
- `versionName` 1.0 -> 1.0.0. Remote WebView debugging only when the build is debuggable.
- `capacitor.config.ts`: edge-to-edge margin handling disabled in Capacitor, LocalNotifications icon.
- Removed stale `capacitor-cordova-android-plugins/build/` and `.idea/caches`.
