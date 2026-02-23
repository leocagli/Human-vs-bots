import React, { useEffect, useState } from "react";
import { CommitPanel } from "./CommitPanel";
import { TurnLog } from "./TurnLog";

/** Mirrors the on-chain GamePhase enum. */
type GamePhase = "WaitingForPlayers" | "Commit" | "Reveal" | "Finished";

/** Lightweight representation of game state fetched from the contract. */
interface GameState {
  phase: GamePhase;
  turn: number;
  scorePlayerOne: number;
  scorePlayerTwo: number;
  playerOne: string;
  playerTwo: string;
}

interface TurnEntry {
  turn: number;
  action: string;
  deltaP1: number;
  deltaP2: number;
}

/** Clawbot Vault Wars – main game UI. */
export const GameUI: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [turnLog, setTurnLog] = useState<TurnEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Poll the smart contract for the latest game state. */
  const fetchGameState = async () => {
    try {
      setLoading(true);
      // TODO: replace with actual Soroban RPC call using stellar-sdk.
      const mockState: GameState = {
        phase: "Commit",
        turn: 1,
        scorePlayerOne: 0,
        scorePlayerTwo: 0,
        playerOne: "GBZX...HUMAN",
        playerTwo: "GCLAW...BOT",
      };
      setGameState(mockState);
    } catch (err) {
      setError("Failed to load game state.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameState();
  }, []);

  const handleTurnComplete = (entry: TurnEntry) => {
    setTurnLog((prev) => [...prev, entry]);
    fetchGameState();
  };

  if (loading) return <div className="loading">Loading game state…</div>;
  if (error) return <div className="error">{error}</div>;
  if (!gameState) return null;

  return (
    <div className="game-ui">
      <header className="game-header">
        <h1>Clawbot Vault Wars</h1>
        <div className="scoreboard">
          <span>
            🧑 {gameState.playerOne}: <strong>{gameState.scorePlayerOne}</strong>
          </span>
          <span className="vs">VS</span>
          <span>
            🤖 {gameState.playerTwo}: <strong>{gameState.scorePlayerTwo}</strong>
          </span>
        </div>
        <div className="turn-info">
          Turn <strong>{gameState.turn}</strong> — Phase:{" "}
          <strong>{gameState.phase}</strong>
        </div>
      </header>

      <main className="game-body">
        {gameState.phase === "Commit" || gameState.phase === "Reveal" ? (
          <CommitPanel
            turn={gameState.turn}
            phase={gameState.phase}
            onTurnComplete={handleTurnComplete}
          />
        ) : gameState.phase === "Finished" ? (
          <div className="game-over">
            <h2>Game Over!</h2>
            <p>
              {gameState.scorePlayerOne > gameState.scorePlayerTwo
                ? "🧑 Human wins!"
                : gameState.scorePlayerTwo > gameState.scorePlayerOne
                ? "🤖 Clawbot wins!"
                : "It's a draw!"}
            </p>
          </div>
        ) : (
          <div className="waiting">Waiting for players to join…</div>
        )}

        <TurnLog entries={turnLog} />
      </main>
    </div>
  );
};

export default GameUI;
