use soroban_sdk::{contracttype, Address};

/// Represents the current phase of the game.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum GamePhase {
    WaitingForPlayers,
    Commit,
    Reveal,
    Finished,
}

/// Represents a single vault entry that a player commits to each turn.
#[contracttype]
#[derive(Clone, Debug)]
pub struct VaultCommit {
    /// Pedersen commitment hash of the player's chosen action.
    pub commitment: soroban_sdk::BytesN<32>,
}

/// Revealed action for a turn.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Action {
    Attack,
    Defend,
    Vault,
}

/// Stores the full state of a game session.
#[contracttype]
#[derive(Clone, Debug)]
pub struct GameState {
    pub player_one: Address,
    pub player_two: Address,
    pub phase: GamePhase,
    pub turn: u32,
    pub score_player_one: i32,
    pub score_player_two: i32,
    /// ZK proof submitted by player one for the current turn.
    pub proof_player_one: soroban_sdk::Bytes,
    /// ZK proof submitted by player two for the current turn.
    pub proof_player_two: soroban_sdk::Bytes,
}
