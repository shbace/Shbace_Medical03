# Shbace Medical — Android Studio + iPhone PWA

## Android Studio

This repository contains the Shbace Medical web application and its Capacitor 8 configuration. The Android project is generated reproducibly by the Android build workflow.

### Automatic project ZIP and APK

1. Open **Actions** in this GitHub repository.
2. Select **Build Shbace Medical Android**.
3. Choose **Run workflow** on the `main` branch.
4. Wait for the green completed run.
5. Download **Shbace-Medical-Android-Deliverables** from the run's Artifacts section.
6. The artifact contains:
   - `Shbace_Medical_Android_Studio.zip`: complete Android Studio project, including the generated `android/` directory and Gradle Wrapper.
   - `Shbace_Medical.apk`: debug APK for direct installation.

The generated project uses the official app icon artwork in `splash_icon.png`, Capacitor application ID `com.shbace.medical`, and app name `Shbace Medical`.

### Local setup (Windows)

Requirements: Android Studio with Android SDK, JDK 21, and Node.js 22 or newer.

1. Download or clone this repository.
2. Run `setup-android.bat`.
3. The script installs dependencies, creates the Android project if needed, syncs Capacitor plugins and opens Android Studio.
4. In Android Studio choose **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

### Local setup (macOS / Linux)

Install the same prerequisites, then run:

```bash
chmod +x setup-android.sh
./setup-android.sh
```

## iPhone PWA

The PWA is published at:

https://shbace.github.io/Shbace_Medical03/pwa-boot.html

On iPhone: open the link in Safari → Share → Add to Home Screen. Keep **Open as Web App** enabled.

The service worker caches the application shell and same-origin resources after the first successful online visit. Third-party services and remote documents may still require connectivity.

## Data integrity

The original medical content and question-bank assets in `www/` are included in the project. Do not replace them with demo data. Keep a separate backup before changing the question bank or its schema.
