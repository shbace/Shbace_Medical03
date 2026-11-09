# Shbace Medical - Capacitor Android project

Dark-blue medical Question Bank. The whole UI is one HTML file (`www/index.html`) inside Capacitor 8. All data is in
localStorage; there is no backend, Firebase or Play Store setup.

## Requirements
Node.js 22+, Android Studio (Otter or newer) with SDK Platform 36, JDK 21 (bundled with Android Studio).
First Gradle sync downloads Gradle 8.14.3 and Android dependencies, so it needs internet once.

## Build the debug APK
```bash
npm install                 # required: Gradle includes plugins from node_modules
npm run android:sync        # bundles src/native-bridge.js -> www, cap sync, VIBRATE check
npm run android:open        # opens Android Studio
```
Android Studio: wait for Gradle sync, then **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
Output: `android/app/build/outputs/apk/debug/app-debug.apk`. Or from a terminal: `cd android && ./gradlew assembleDebug`
(`gradlew.bat assembleDebug` on Windows).
On Windows `setup-android.bat` does the same steps.

## Updating the web file
```bash
npm run web:use -- path/to/SHBACE_MEDICAL_....html   # copies to www/index.html, injects ./native-bridge.js, checks it
npm run android:sync
```
`npm run check:web` runs `node --check` on every inline script and reports whether the page reads
`window.ShbaceInsets`, uses `--sab`, and registers the `backButton` listener.

### What the page must do (contract with the native layer)
- Safe areas: read `window.ShbaceInsets.get()` -> `{top,bottom,left,right}` in CSS px and listen to the `shbace-insets` event.
  Native code never pads the WebView for the bars itself.
- Back: `Capacitor.Plugins.App.addListener('backButton', ...)`; `Capacitor.Plugins.App.exitApp()` to leave.
- Notifications: nothing to call - `src/native-bridge.js` reads `shbace_qb_v6`, `shbace_quiz_v1` and `shbace_notif_prefs_v1`.
- Shortcuts / notification taps set the global `appPage` and call `renderAppDemo()` (only when the app is in `app` mode,
  past onboarding and not inside a running quiz).

## Project map
| Path | Purpose |
|---|---|
| `www/index.html` | App entry (web file) |
| `src/native-bridge.js` -> `www/native-bridge.js` | Haptics, App plugin, splash release, local notifications, routing |
| `android/app/src/main/java/com/shbace/medical/MainActivity.java` | Edge-to-edge, insets, IME, native splash, channels |
| `android/app/src/main/res/values*/styles.xml` | Themes (+ v23/v27/v28/v29/v35) |
| `android/app/src/main/res/xml/` | backup rules, shortcuts, file paths |
| `capacitor.config.ts` | Capacitor config |

## Verifying insets are applied once (debug build)
`adb logcat -s ShbaceInsets` prints `webview y=0 h=<decorH>` when the keyboard is closed. If `y` or `h` differ, Capacitor
is adding its own margins: check `adjustMarginsForEdgeToEdge` / `SystemBars.insetsHandling` for your Capacitor version.

## Notes
- Local notifications can be delayed by Doze / battery optimisation on some vendors; they are inexact by design.
- A packaged APK can be unzipped; do not rely on it to protect the question bank.
