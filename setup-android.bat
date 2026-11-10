@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo SHBACE MEDICAL - Android Studio project setup
echo ===============================================
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Install Node.js 22 or newer first.
  pause
  exit /b 1
)
node -e "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if errorlevel 1 (
  echo ERROR: Node.js 22 or newer is required.
  node --version
  pause
  exit /b 1
)
where java >nul 2>nul
if errorlevel 1 (
  echo ERROR: Install Android Studio and JDK 21 first.
  pause
  exit /b 1
)
echo [1/4] Installing project dependencies...
call npm ci --no-audit --no-fund
if errorlevel 1 goto failed
echo [2/4] Checking web application files...
call npm run check:web
if errorlevel 1 goto failed
if not exist "android\app\src\main\AndroidManifest.xml" (
  echo [3/4] Creating the native Android project...
  call npx cap add android
  if errorlevel 1 goto failed
) else (
  echo [3/4] Existing Android project found.
)
echo [4/4] Syncing web app and native plugins...
call npx cap sync android
if errorlevel 1 goto failed
echo Opening Android Studio...
call npx cap open android
if errorlevel 1 goto failed
echo.
echo Setup complete. In Android Studio choose:
echo Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
pause
exit /b 0
:failed
echo.
echo Setup failed. Review the error above.
pause
exit /b 1
