#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node -e "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)" || {
  echo "Node.js 22 or newer is required." >&2; exit 1;
}
npm ci --no-audit --no-fund
npm run check:web
if [ ! -f android/app/src/main/AndroidManifest.xml ]; then
  npx cap add android
fi
npx cap sync android
npx cap open android
