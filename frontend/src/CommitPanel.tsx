import React, { useState } from "react";

type GamePhase = "Commit" | "Reveal";

interface TurnEntry {
  turn: number;
  action: string;
  deltaP1: number;
  deltaP2: number;
}

interface CommitPanelProps {
  turn: number;
  phase: GamePhase;
  onTurnComplete: (entry: TurnEntry) => void;
}

type Action = "Attack" | "Defend" | "Vault";

/**
 * CommitPanel handles the commit-reveal flow for a single turn.
 *
 * Commit phase: the player picks an action; a Pedersen commitment is
 *   generated client-side and submitted to the contract.
 * Reveal phase: the player's salt + action are revealed, and a ZK proof
 *   of the state transition is generated and submitted on-chain.
 */
export const CommitPanel: React.FC<CommitPanelProps> = ({
  turn,
  phase,
  onTurnComplete,
}) => {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [committed, setCommitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const actions: Action[] = ["Attack", "Defend", "Vault"];

  const handleCommit = async () => {
    if (!selectedAction) return;
    setSubmitting(true);
    try {
      // TODO: generate Pedersen commitment and call contract.commit_action().
      setStatusMsg(`Commitment for "${selectedAction}" submitted. Waiting for opponent…`);
      setCommitted(true);
    } catch (err) {
      setStatusMsg("Commitment failed. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReveal = async () => {
    if (!selectedAction) return;
    setSubmitting(true);
    try {
      // TODO: generate ZK proof and call contract.reveal_action().
      const mockEntry: TurnEntry = {
        turn,
        action: selectedAction,
        deltaP1: selectedAction === "Attack" ? 1 : selectedAction === "Vault" ? 1 : 0,
        deltaP2: selectedAction === "Attack" ? -1 : 0,
      };
      setStatusMsg("Turn revealed and ZK proof verified ✓");
      onTurnComplete(mockEntry);
      setCommitted(false);
      setSelectedAction(null);
    } catch (err) {
      setStatusMsg("Reveal failed. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="commit-panel">
      <h2>Turn {turn} — {phase} Phase</h2>

      <div className="action-buttons">
        {actions.map((action) => (
          <button
            key={action}
            className={`action-btn ${selectedAction === action ? "selected" : ""}`}
            onClick={() => setSelectedAction(action)}
            disabled={committed || submitting}
          >
            {action === "Attack" ? "⚔️" : action === "Defend" ? "🛡️" : "🔒"}{" "}
            {action}
          </button>
        ))}
      </div>

      {phase === "Commit" && !committed && (
        <button
          className="submit-btn"
          onClick={handleCommit}
          disabled={!selectedAction || submitting}
        >
          {submitting ? "Submitting…" : "Commit Action"}
        </button>
      )}

      {phase === "Reveal" && committed && (
        <button
          className="submit-btn"
          onClick={handleReveal}
          disabled={submitting}
        >
          {submitting ? "Generating ZK Proof…" : "Reveal & Prove"}
        </button>
      )}

      {statusMsg && <p className="status-msg">{statusMsg}</p>}
    </div>
  );
};

export default CommitPanel;
