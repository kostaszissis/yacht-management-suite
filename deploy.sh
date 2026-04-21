#!/bin/bash
cd /var/www/yacht-prod
echo "=== VALIDATE & AUTO-FIX ==="
bash validate-fixes.sh
echo ""
echo "=== BUILDING ==="
npm run build
if [ $? -ne 0 ]; then
  echo "⛔ BUILD FAILED"
  exit 1
fi
\cp -rf build/* .
echo "✅ DEPLOY DONE — Now SCP to local + git push"
