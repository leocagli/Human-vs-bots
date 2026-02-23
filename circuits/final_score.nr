// Clawbot Vault Wars – Final Score Circuit
// Verifies that the reported final scores are the result of a valid
// sequence of turns without revealing individual actions.
//
// NOTE: The game-resolution rules in resolve_delta must stay in sync with
// resolve_turn in circuits/state_transition.nr and resolveTurn in bot/clawbot.ts.

use dep::std;

global MAX_TURNS: u32 = 10;

/// Per-turn data committed to by the prover.
struct TurnData {
    action_player_one: Field,
    action_player_two: Field,
    salt_player_one: Field,
    salt_player_two: Field,
    commitment_player_one: Field,
    commitment_player_two: Field,
}

struct FinalScoreInputs {
    turns: [TurnData; 10],
    num_turns: Field,
    final_score_player_one: Field,
    final_score_player_two: Field,
}

fn compute_commitment(action: Field, salt: Field) -> Field {
    std::hash::pedersen_hash([action, salt])
}

fn resolve_delta(a1: Field, a2: Field) -> (Field, Field) {
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

fn main(inputs: FinalScoreInputs) {
    let mut score1: Field = 0;
    let mut score2: Field = 0;

    for i in 0..MAX_TURNS {
        let turn = inputs.turns[i];
        // Only accumulate scores for valid turns.
        if (i as Field) < inputs.num_turns {
            // Verify commitments.
            let c1 = compute_commitment(turn.action_player_one, turn.salt_player_one);
            let c2 = compute_commitment(turn.action_player_two, turn.salt_player_two);
            assert(c1 == turn.commitment_player_one, "Commitment mismatch p1");
            assert(c2 == turn.commitment_player_two, "Commitment mismatch p2");

            // Accumulate deltas.
            let (d1, d2) = resolve_delta(turn.action_player_one, turn.action_player_two);
            score1 = score1 + d1;
            score2 = score2 + d2;
        }
    }

    // Verify the final claimed scores match the accumulated totals.
    assert(score1 == inputs.final_score_player_one, "Final score mismatch for player one");
    assert(score2 == inputs.final_score_player_two, "Final score mismatch for player two");
}
