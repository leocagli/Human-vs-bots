/**
 * Clawbot Decision Engine
 *
 * Implements the rule-based strategy that Clawbot uses when choosing
 * an action each turn.  The engine is designed to be extended with a
 * more sophisticated ML model in future iterations.
 */

export type Action = "Attack" | "Defend" | "Vault";

export interface TurnHistory {
  turn: number;
  clawbotAction: Action;
  opponentAction: Action;
  deltaClawbot: number;
  deltaOpponent: number;
}

export interface ClawbotState {
  turn: number;
  clawbotScore: number;
  opponentScore: number;
  history: TurnHistory[];
}

/**
 * Utility: pick a random element from an array.
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Counts how many times the opponent used each action in recent turns.
 */
function countOpponentActions(
  history: TurnHistory[],
  lastN: number
): Record<Action, number> {
  const counts: Record<Action, number> = { Attack: 0, Defend: 0, Vault: 0 };
  const slice = history.slice(-lastN);
  for (const entry of slice) {
    counts[entry.opponentAction]++;
  }
  return counts;
}

/**
 * Counter-strategy: choose the action that best exploits the opponent's
 * most frequent recent action.
 *
 * Counter table:
 *   Opponent mostly Attacks  → Defend (gains +1)
 *   Opponent mostly Defends  → Attack (no loss, bide time) / Vault (+1)
 *   Opponent mostly Vaults   → Attack (+2)
 */
function counterAction(mostFrequent: Action): Action {
  switch (mostFrequent) {
    case "Attack":
      return "Defend";
    case "Defend":
      return "Vault";
    case "Vault":
      return "Attack";
  }
}

/**
 * Core decision function.
 *
 * Strategy layers (applied in priority order):
 * 1. Early game (turns 1–2): randomise to avoid being predictable.
 * 2. Losing by ≥ 3: go aggressive (Attack or Vault).
 * 3. Winning by ≥ 3: play defensively (Defend or Vault).
 * 4. General: counter the opponent's most frequent recent action.
 * 5. Fallback: random.
 */
export function clawbotDecide(state: ClawbotState): Action {
  const { turn, clawbotScore, opponentScore, history } = state;

  // 1. Early-game randomness.
  if (turn <= 2) {
    return randomChoice<Action>(["Attack", "Defend", "Vault"]);
  }

  const scoreDiff = clawbotScore - opponentScore;

  // 2. Losing badly → be aggressive.
  if (scoreDiff <= -3) {
    return randomChoice<Action>(["Attack", "Vault"]);
  }

  // 3. Winning comfortably → protect the lead.
  if (scoreDiff >= 3) {
    return randomChoice<Action>(["Defend", "Vault"]);
  }

  // 4. Counter the opponent's recent pattern.
  const counts = countOpponentActions(history, 3);
  const mostFrequent = (Object.entries(counts) as [Action, number][]).reduce(
    (best, curr) => (curr[1] > best[1] ? curr : best),
    ["Attack" as Action, -1] as [Action, number]
  )[0];

  return counterAction(mostFrequent);
}

/**
 * Resolves a single turn and returns the score deltas for both players.
 *
 * NOTE: This resolution matrix must stay in sync with the identical logic
 * in circuits/state_transition.nr (resolve_turn) and circuits/final_score.nr
 * (resolve_delta).  Any rule change must be applied to all three locations.
 *
 * Rules:
 *   Attack  vs Attack  → (0,  0)
 *   Attack  vs Defend  → (-1, +1)
 *   Attack  vs Vault   → (+2, -1)
 *   Defend  vs Attack  → (+1, -1)
 *   Defend  vs Defend  → (0,  0)
 *   Defend  vs Vault   → (0,  0)
 *   Vault   vs Attack  → (-1, +2)
 *   Vault   vs Defend  → (0,  0)
 *   Vault   vs Vault   → (+1, +1)
 */
export function resolveTurn(
  clawbotAction: Action,
  opponentAction: Action
): { deltaClawbot: number; deltaOpponent: number } {
  const matrix: Record<Action, Record<Action, [number, number]>> = {
    Attack: { Attack: [0, 0], Defend: [-1, 1], Vault: [2, -1] },
    Defend: { Attack: [1, -1], Defend: [0, 0], Vault: [0, 0] },
    Vault: { Attack: [-1, 2], Defend: [0, 0], Vault: [1, 1] },
  };
  const [deltaClawbot, deltaOpponent] = matrix[clawbotAction][opponentAction];
  return { deltaClawbot, deltaOpponent };
}
