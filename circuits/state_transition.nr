// Clawbot Vault Wars – State Transition Circuit
// Verifies that a turn-based state transition is valid without revealing
// the players' chosen actions.
//
// NOTE: The game-resolution rules in resolve_turn must stay in sync with
// resolve_delta in circuits/final_score.nr and resolveTurn in bot/clawbot.ts.

use dep::std;

/// Inputs provided by the prover for a single turn.
struct StateTurnInputs {
    // Private inputs
    action_player_one: Field,   // 0 = Attack, 1 = Defend, 2 = Vault
    action_player_two: Field,
    salt_player_one: Field,
    salt_player_two: Field,

    // Public inputs
    commitment_player_one: Field,
    commitment_player_two: Field,
    score_before_player_one: Field,
    score_before_player_two: Field,
    score_after_player_one: Field,
    score_after_player_two: Field,
}

/// Computes a Pedersen commitment: H(action || salt).
fn compute_commitment(action: Field, salt: Field) -> Field {
    std::hash::pedersen_hash([action, salt])
}

/// Resolves a turn and returns (delta_p1, delta_p2).
/// Rules:
///   Attack vs Attack  -> (0, 0)
///   Attack vs Defend  -> (-1, +1)
///   Attack vs Vault   -> (+2, -1)
///   Defend vs Attack  -> (+1, -1)
///   Defend vs Defend  -> (0, 0)
///   Defend vs Vault   -> (0, 0)
///   Vault  vs Attack  -> (-1, +2)
///   Vault  vs Defend  -> (0, 0)
///   Vault  vs Vault   -> (+1, +1)
fn resolve_turn(a1: Field, a2: Field) -> (Field, Field) {
    // Encode outcome as (score_p1_change, score_p2_change)
    // We represent negative deltas as field arithmetic.
    if a1 == 0 {
        if a2 == 0 { (0, 0) }
        else if a2 == 1 { (0 - 1, 1) }
        else { (2, 0 - 1) }
    } else if a1 == 1 {
        if a2 == 0 { (1, 0 - 1) }
        else if a2 == 1 { (0, 0) }
        else { (0, 0) }
    } else {
        if a2 == 0 { (0 - 1, 2) }
        else if a2 == 1 { (0, 0) }
        else { (1, 1) }
    }
}

fn main(inputs: StateTurnInputs) {
    // 1. Verify commitments match the private actions.
    let comm1 = compute_commitment(inputs.action_player_one, inputs.salt_player_one);
    let comm2 = compute_commitment(inputs.action_player_two, inputs.salt_player_two);
    assert(comm1 == inputs.commitment_player_one, "Commitment mismatch for player one");
    assert(comm2 == inputs.commitment_player_two, "Commitment mismatch for player two");

    // 2. Compute expected score deltas.
    let (d1, d2) = resolve_turn(inputs.action_player_one, inputs.action_player_two);

    // 3. Verify the reported post-turn scores are consistent.
    assert(
        inputs.score_after_player_one == inputs.score_before_player_one + d1,
        "Score update invalid for player one"
    );
    assert(
        inputs.score_after_player_two == inputs.score_before_player_two + d2,
        "Score update invalid for player two"
    );
}
