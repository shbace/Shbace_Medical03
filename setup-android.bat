@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo SHBACE MEDICAL - Android project setup
echo ===============================================
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js 22 or newer is required.
  echo Install Node.js 22+ and run this file again.
  pause
  exit /b 1
)
node -e "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if errorlevel 1 (
  echo ERROR: Node.js 22 or newer is required. Detected:
  node --version
  pause
  exit /b 1
)
echo Installing project packages...
npm install --no-audit --no-fund
if errorlevel 1 goto failed
echo Building the native Haptics bridge...
npm run build
if errorlevel 1 goto failed
if not exist "android\app\src\main\AndroidManifest.xml" (
  echo Creating the Android native project...
  npx cap add android
  if errorlevel 1 goto failed
)
node scripts\ensure-vibrate-permission.mjs
if errorlevel 1 goto failed
echo Syncing web files and native plugins...
npx cap sync android
if errorlevel 1 goto failed
echo Opening Android Studio...
npx cap open android
if errorlevel 1 goto failed
echo Done. Build the APK from Android Studio: Build ^> Build Bundle(s) / APK(s) ^> Build APK(s).
pause
exit /b 0
:failed
echo.
echo Setup did not complete. Copy the error shown above and send it to ChatGPT.
pause
exit /b 1
