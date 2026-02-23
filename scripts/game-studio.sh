#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${STELLAR_STUDIO_REPO:-https://github.com/jamesbachini/Stellar-Game-Studio.git}"
STUDIO_DIR="${STELLAR_STUDIO_DIR:-.stellar-game-studio}"

print_help() {
  cat <<'EOF'
Uso:
  scripts/game-studio.sh init
  scripts/game-studio.sh setup
  scripts/game-studio.sh create <game-name>
  scripts/game-studio.sh dev <game-name>
  scripts/game-studio.sh build <game-name>
  scripts/game-studio.sh deploy <game-name>
  scripts/game-studio.sh publish <game-name>
  scripts/game-studio.sh all <game-name>

Variables opcionales:
  STELLAR_STUDIO_DIR   Directorio local del Game Studio (default: .stellar-game-studio)
  STELLAR_STUDIO_REPO  URL del repo del Game Studio
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: no se encontró '$1' en PATH." >&2
    exit 1
  fi
}

ensure_studio_repo() {
  require_cmd git

  if [[ ! -d "$STUDIO_DIR/.git" ]]; then
    echo "Clonando Game Studio en '$STUDIO_DIR'..."
    git clone "$REPO_URL" "$STUDIO_DIR"
  else
    echo "Actualizando Game Studio en '$STUDIO_DIR'..."
    git -C "$STUDIO_DIR" pull --ff-only
  fi
}

run_bun() {
  require_cmd bun
  ensure_studio_repo
  (cd "$STUDIO_DIR" && bun "$@")
}

cmd="${1:-help}"
case "$cmd" in
  help|-h|--help)
    print_help
    ;;
  init)
    ensure_studio_repo
    ;;
  setup)
    run_bun run setup
    ;;
  create)
    game_name="${2:-}"
    [[ -n "$game_name" ]] || { echo "Error: falta <game-name>." >&2; exit 1; }
    run_bun run create "$game_name"
    ;;
  dev)
    game_name="${2:-}"
    [[ -n "$game_name" ]] || { echo "Error: falta <game-name>." >&2; exit 1; }
    run_bun run dev:game "$game_name"
    ;;
  build)
    game_name="${2:-}"
    [[ -n "$game_name" ]] || { echo "Error: falta <game-name>." >&2; exit 1; }
    run_bun run build "$game_name"
    ;;
  deploy)
    game_name="${2:-}"
    [[ -n "$game_name" ]] || { echo "Error: falta <game-name>." >&2; exit 1; }
    run_bun run deploy "$game_name"
    ;;
  publish)
    game_name="${2:-}"
    [[ -n "$game_name" ]] || { echo "Error: falta <game-name>." >&2; exit 1; }
    run_bun run publish "$game_name" --build
    ;;
  all)
    game_name="${2:-}"
    [[ -n "$game_name" ]] || { echo "Error: falta <game-name>." >&2; exit 1; }
    run_bun run setup
    run_bun run create "$game_name"
    run_bun run dev:game "$game_name"
    ;;
  *)
    echo "Comando no reconocido: $cmd" >&2
    print_help
    exit 1
    ;;
esac
