# Human-vs-bots

Juego Web3 sobre Stellar con integración Zero-Knowledge (ZK): una arena en tiempo real donde pones a prueba tu estrategia contra agentes.

## 🎮 Objetivo

`Human-vs-bots` está pensado para ejecutarse como juego con frontend + contratos Soroban compilados a WASM.

## ⚡ Quickstart (WASM)

Esta guía resume el flujo recomendado para levantar el proyecto rápido.

### 0) Flujo recomendado en este repo

Este repositorio incluye un wrapper para automatizar el uso de Stellar Game Studio:

- `scripts/game-studio.sh`

Comandos disponibles:

```bash
./scripts/game-studio.sh init
./scripts/game-studio.sh setup
./scripts/game-studio.sh create human-vs-bots
./scripts/game-studio.sh dev human-vs-bots
./scripts/game-studio.sh build human-vs-bots
./scripts/game-studio.sh deploy human-vs-bots
./scripts/game-studio.sh publish human-vs-bots
```

Por defecto clona/actualiza Game Studio en `.stellar-game-studio`.

Si quieres otra ruta:

```bash
STELLAR_STUDIO_DIR=/ruta/custom ./scripts/game-studio.sh setup
```

### 1) Requisitos

Instala estas herramientas:

- [Bun](https://bun.sh/) (scripts y frontend)
- [Rust + Cargo](https://rustup.rs/) (compilación de contratos)
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli) (deploy)
- Target Rust `wasm32v1-none`

Comandos (Linux/macOS/WSL):

```bash
curl -fsSL https://bun.sh/install | bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --locked stellar-cli --features opt
rustup target add wasm32v1-none
```

> En Windows usa **WSL** para ejecutar `bun`, `cargo` y `stellar` de forma confiable.

### 2) Clonar el Game Studio (manual, opcional)

```bash
git clone https://github.com/jamesbachini/Stellar-Game-Studio.git
cd Stellar-Game-Studio
```

### 3) Setup automático (build + deploy + frontend)

```bash
./scripts/game-studio.sh setup
```

Este comando normalmente hace:

- Build de contratos Soroban a WASM
- Creación de cuentas de prueba (`admin`, `player1`, `player2`)
- Deploy en Stellar testnet
- Generación de bindings TypeScript
- Configuración de variables de entorno
- Instalación de dependencias frontend

## 🧩 Crear o preparar el juego

### Crear un juego nuevo

```bash
./scripts/game-studio.sh create my-game
```

### Correr en desarrollo (WASM + frontend)

```bash
./scripts/game-studio.sh dev my-game
```

Servidor local esperado:

- `https://localhost:3000`

## 🔁 Build / Deploy iterativo

Cuando hagas cambios:

```bash
./scripts/game-studio.sh build my-game
./scripts/game-studio.sh deploy my-game
```

## 🚀 Publicación

Exporta frontend listo para producción (wallets externas como Freighter):

```bash
./scripts/game-studio.sh publish my-game
```

## 🔐 Integración Zero-Knowledge

Opciones sugeridas en Stellar:

1. **RISC Zero**
	- Docs: https://dev.risczero.com/
	- Verifier: https://github.com/NethermindEth/stellar-risc0-verifier/

2. **Noir**
	- Docs: https://noir-lang.org/docs/
	- Verifier: https://github.com/yugocabrio/rs-soroban-ultrahonk

> Nota: El soporte de Noir en Stellar puede ser más limitado por restricciones de cómputo on-chain.

## 📌 Requisito de contrato mock (hackathon)

Los contratos del juego deben invocar `start_game()` y `end_game()` en el contrato mock de testnet:

`CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`

## 📚 Referencia oficial

- Quickstart original: https://dorahacks.io/hackathon/stellar-hacks-zk-gaming/quickstart-guide

## ✅ Flujo mínimo recomendado

```bash
./scripts/game-studio.sh setup
./scripts/game-studio.sh create my-game
./scripts/game-studio.sh dev my-game
```

Si quieres ejecutar específicamente este proyecto bajo el nombre `human-vs-bots`, usa:

```bash
./scripts/game-studio.sh dev human-vs-bots
```

## 🧰 VS Code Tasks

También puedes correr todo desde **Run Task** en VS Code (`Terminal > Run Task`):

- `WASM: Init Game Studio`
- `WASM: Setup`
- `WASM: Create human-vs-bots`
- `WASM: Dev human-vs-bots`
- `WASM: Build human-vs-bots`
- `WASM: Deploy human-vs-bots`
- `WASM: Publish human-vs-bots`
- `Demo: Open Zemeroth`

## 🕹️ Demo por defecto: Zemeroth (WASM)

Este repositorio incluye una versión demo de Zemeroth compilada a WASM para usarla como base estratégica visual mientras se integra la capa Web3.

- Ruta: `demo/zemeroth-demo/index.html`
- Fuente: https://github.com/ozkriff/zemeroth
- Licencias: MIT / Apache-2.0 (ver archivos `THIRD_PARTY_ZEMEROTH_LICENSE_*`)
- Estado: compilado para navegador con `wasm32-unknown-unknown`

Abrir por `file://` (rápido):

```bash
"$BROWSER" file:///workspaces/Human-vs-bots/demo/zemeroth-demo/index.html
```

Servir por HTTP (recomendado):

```bash
./scripts/serve-zemeroth.sh 4180
"$BROWSER" http://127.0.0.1:4180
```

Acceso por defecto desde la raíz del repo:

```bash
python3 -m http.server 4180 --directory /workspaces/Human-vs-bots
"$BROWSER" http://127.0.0.1:4180
```

La raíz redirige automáticamente a `demo/zemeroth-demo/`.

## 🧪 Demo alternativa: CIV Minimal Lite

- Ruta: `demo/civ-lite/index.html`
- Mantiene la implementación original del prototipo Human vs Bots para iterar mecánicas y UI.

## 🧠 Referencias analizadas y mejoras aplicadas

Repos revisados:

- https://github.com/C7-Game/Prototype
- https://github.com/yairm210/Unciv
- https://github.com/freeciv/freeciv
- https://openciv3.org/

Mejoras trasladadas al mock (sin copiar código):

- Separación lógica de turno vs render visual (patrón engine/UI)
- Pathfinding A* para movimiento con coste de terreno
- IA por prioridades (captura > combate > presión territorial)
- Capas tácticas de visualización (niebla de guerra, ruta, minimapa)
- Animación de movimiento para feedback de acciones

Siguiente integración recomendada con Stellar Game Studio:

- Encapsular estado/acciones del turno para serializarlas a contrato Soroban
- Mantener el renderer `canvas` como frontend y enviar `start_game/end_game` al mock hub
- Añadir verificación deterministic-friendly para resolver combate fuera de UI
