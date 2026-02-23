/**
 * simulate.ts
 *
 * Simulates a full Clawbot Vault Wars game between a human player and
 * Clawbot entirely off-chain.  Useful for testing the decision engine
 * and the game-resolution logic without deploying to a network.
 *
 * Usage:
 *   npx ts-node scripts/simulate.ts [--turns <n>] [--human-strategy random|fixed:<action>]
 *
 * Examples:
 *   npx ts-node scripts/simulate.ts --turns 5
 *   npx ts-node scripts/simulate.ts --turns 10 --human-strategy fixed:Vault
 */

import {
  Action,
  ClawbotState,
  TurnHistory,
  clawbotDecide,
  resolveTurn,
} from "../bot/clawbot";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { turns: number; humanStrategy: string } {
  const args = process.argv.slice(2);

  const turnsIdx = args.indexOf("--turns");
  const turns =
    turnsIdx !== -1 && args[turnsIdx + 1] ? parseInt(args[turnsIdx + 1], 10) : 10;

  const stratIdx = args.indexOf("--human-strategy");
  const humanStrategy =
    stratIdx !== -1 && args[stratIdx + 1] ? args[stratIdx + 1] : "random";

  return { turns, humanStrategy };
}

// ---------------------------------------------------------------------------
// Human strategy helpers
// ---------------------------------------------------------------------------

const ALL_ACTIONS: Action[] = ["Attack", "Defend", "Vault"];

function randomAction(): Action {
  return ALL_ACTIONS[Math.floor(Math.random() * ALL_ACTIONS.length)];
}

function humanAction(strategy: string): Action {
  if (strategy === "random") return randomAction();
  if (strategy.startsWith("fixed:")) {
    const fixed = strategy.slice(6) as Action;
    if (ALL_ACTIONS.includes(fixed)) return fixed;
  }
  console.warn(`Unknown human strategy "${strategy}", defaulting to random.`);
  return randomAction();
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

function simulate(turns: number, humanStrategy: string): void {
  console.log("=".repeat(60));
  console.log("  Clawbot Vault Wars – Game Simulation");
  console.log(`  Turns: ${turns}  |  Human strategy: ${humanStrategy}`);
  console.log("=".repeat(60));

  const state: ClawbotState = {
    turn: 1,
    clawbotScore: 0,
    opponentScore: 0,
    history: [],
  };

  for (let t = 1; t <= turns; t++) {
    state.turn = t;

    const clawAction = clawbotDecide(state);
    const humanAct = humanAction(humanStrategy);

    const { deltaClawbot, deltaOpponent } = resolveTurn(clawAction, humanAct);

    state.clawbotScore += deltaClawbot;
    state.opponentScore += deltaOpponent;

    const entry: TurnHistory = {
      turn: t,
      clawbotAction: clawAction,
      opponentAction: humanAct,
      deltaClawbot,
      deltaOpponent,
    };
    state.history.push(entry);

    console.log(
      `Turn ${String(t).padStart(2)} | ` +
        `Human: ${humanAct.padEnd(7)} | ` +
        `Clawbot: ${clawAction.padEnd(7)} | ` +
        `Δ Human: ${String(deltaOpponent).padStart(3)}  ` +
        `Δ Bot: ${String(deltaClawbot).padStart(3)}  | ` +
        `Score  Human: ${String(state.opponentScore).padStart(4)}  ` +
        `Bot: ${String(state.clawbotScore).padStart(4)}`
    );
  }

  console.log("=".repeat(60));
  console.log("  Final Scores");
  console.log(`  🧑 Human   : ${state.opponentScore}`);
  console.log(`  🤖 Clawbot : ${state.clawbotScore}`);

  if (state.opponentScore > state.clawbotScore) {
    console.log("  🏆 Winner  : Human!");
  } else if (state.clawbotScore > state.opponentScore) {
    console.log("  🏆 Winner  : Clawbot!");
  } else {
    console.log("  🤝 Result  : Draw");
  }
  console.log("=".repeat(60));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const { turns, humanStrategy } = parseArgs();
simulate(turns, humanStrategy);
