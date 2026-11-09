#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node -e "const v=+process.versions.node.split('.')[0]; if(v<22){console.error('Node.js 22 or newer is required.');process.exit(1)}"
npm install
npm run build
if [ ! -f android/app/src/main/AndroidManifest.xml ]; then
  npx cap add android
fi
node scripts/ensure-vibrate-permission.mjs
npx cap sync android
npx cap open android
