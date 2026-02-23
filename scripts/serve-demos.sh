#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4180}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -f "$ROOT_DIR/index.html" ]]; then
  echo "[serve-demos] No se encontró index.html en $ROOT_DIR"
  exit 1
fi

echo "[serve-demos] Serving $ROOT_DIR on http://127.0.0.1:$PORT"
python3 -m http.server "$PORT" --directory "$ROOT_DIR"
