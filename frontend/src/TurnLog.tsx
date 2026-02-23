import React from "react";

interface TurnEntry {
  turn: number;
  action: string;
  deltaP1: number;
  deltaP2: number;
}

interface TurnLogProps {
  entries: TurnEntry[];
}

/** Displays a chronological log of all completed turns. */
export const TurnLog: React.FC<TurnLogProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="turn-log empty">
        <p>No turns played yet.</p>
      </div>
    );
  }

  return (
    <div className="turn-log">
      <h3>Turn History</h3>
      <table className="turn-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Your Action</th>
            <th>Δ Human</th>
            <th>Δ Clawbot</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.turn}>
              <td>{entry.turn}</td>
              <td>{entry.action}</td>
              <td className={entry.deltaP1 >= 0 ? "positive" : "negative"}>
                {entry.deltaP1 >= 0 ? "+" : ""}
                {entry.deltaP1}
              </td>
              <td className={entry.deltaP2 >= 0 ? "positive" : "negative"}>
                {entry.deltaP2 >= 0 ? "+" : ""}
                {entry.deltaP2}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TurnLog;
