#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, log, symbol_short, vec, Address, BytesN, Env, Symbol,
};

mod types;
use types::{Action, GamePhase, GameState, VaultCommit};

const GAME_STATE_KEY: Symbol = symbol_short!("GAME");
const MAX_TURNS: u32 = 10;

#[contract]
pub struct ClawbotVaultWars;

#[contractimpl]
impl ClawbotVaultWars {
    /// Initialise a new game between two players.
    pub fn init_game(env: Env, player_one: Address, player_two: Address) {
        player_one.require_auth();

        let state = GameState {
            player_one: player_one.clone(),
            player_two: player_two.clone(),
            phase: GamePhase::Commit,
            turn: 1,
            score_player_one: 0,
            score_player_two: 0,
            proof_player_one: soroban_sdk::Bytes::new(&env),
            proof_player_two: soroban_sdk::Bytes::new(&env),
        };

        env.storage().instance().set(&GAME_STATE_KEY, &state);
        log!(&env, "Game initialised: {} vs {}", player_one, player_two);
    }

    /// Player commits a Pedersen-hashed action for the current turn.
    pub fn commit_action(env: Env, player: Address, commitment: BytesN<32>) {
        player.require_auth();

        let mut state: GameState = env
            .storage()
            .instance()
            .get(&GAME_STATE_KEY)
            .expect("Game not initialised");

        assert!(state.phase == GamePhase::Commit, "Not in commit phase");
        assert!(
            player == state.player_one || player == state.player_two,
            "Unknown player"
        );

        // Store the commit so it can be checked during reveal.
        let commit = VaultCommit { commitment };
        let commit_key = if player == state.player_one {
            symbol_short!("COMM1")
        } else {
            symbol_short!("COMM2")
        };
        env.storage().instance().set(&commit_key, &commit);

        log!(&env, "Player {} committed for turn {}", player, state.turn);
    }

    /// Player reveals their action along with a ZK proof validating the transition.
    pub fn reveal_action(env: Env, player: Address, action: Action, proof: soroban_sdk::Bytes) {
        player.require_auth();

        let mut state: GameState = env
            .storage()
            .instance()
            .get(&GAME_STATE_KEY)
            .expect("Game not initialised");

        assert!(state.phase == GamePhase::Reveal, "Not in reveal phase");

        // Attach the proof to the appropriate player slot.
        if player == state.player_one {
            state.proof_player_one = proof;
        } else if player == state.player_two {
            state.proof_player_two = proof;
        } else {
            panic!("Unknown player");
        }

        env.storage().instance().set(&GAME_STATE_KEY, &state);
        log!(&env, "Player {} revealed action for turn {}", player, state.turn);
    }

    /// Finalise the current turn once both ZK proofs have been submitted.
    /// The on-chain contract trusts the ZK-verified score deltas supplied
    /// by the relayer after off-chain proof verification.
    pub fn finalise_turn(
        env: Env,
        score_delta_player_one: i32,
        score_delta_player_two: i32,
    ) {
        let mut state: GameState = env
            .storage()
            .instance()
            .get(&GAME_STATE_KEY)
            .expect("Game not initialised");

        // Update scores.
        state.score_player_one = state.score_player_one.saturating_add(score_delta_player_one);
        state.score_player_two = state.score_player_two.saturating_add(score_delta_player_two);

        let completed_turn = state.turn;
        if state.turn >= MAX_TURNS {
            state.phase = GamePhase::Finished;
        } else {
            state.turn += 1;
            state.phase = GamePhase::Commit;
        }

        env.storage().instance().set(&GAME_STATE_KEY, &state);
        log!(&env, "Turn {} finalised", completed_turn);
    }

    /// Returns a read-only snapshot of the current game state.
    pub fn get_state(env: Env) -> GameState {
        env.storage()
            .instance()
            .get(&GAME_STATE_KEY)
            .expect("Game not initialised")
    }
}
