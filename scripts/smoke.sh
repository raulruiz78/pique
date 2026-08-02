#!/usr/bin/env bash
set -euo pipefail
APP_URL="${PIQUE_APP_URL:-http://127.0.0.1:3000}"
curl --fail --silent --show-error "$APP_URL" >/dev/null
curl --fail --silent --show-error "$APP_URL/manifest.webmanifest" >/dev/null
echo "Pique responde y sirve el manifest PWA en $APP_URL"

