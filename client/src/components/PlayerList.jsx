const maxPlayers = 4;
const getPlayerStatus = (player) => {
  if (player.ready === undefined) {
    return 'Pending';
  }

  return player.ready ? 'Ready' : 'Not Ready';
};

const PlayerList = function PlayerList({ players, playerId }) {
  const emptySlots = Math.max(0, maxPlayers - players.length);

  return (
    <div className="player-list">
      <div className="player-list-header">
        <h2>Players</h2>

        <span>
          {`${players.length} / ${maxPlayers}`}
        </span>
      </div>

      <ul>
        {players.map((player) => (
          <li className="player-row" key={player.id}>
            <div className="player-avatar">
              {player.nickname.charAt(0).toUpperCase()}
            </div>

            <span className="player-name">
              {player.nickname}

              {player.id === playerId && (
                <span className="current-player"> (You)</span>
              )}
            </span>

            <span className="player-status">{getPlayerStatus(player)}</span>
          </li>
        ))}

        {Array.from({ length: emptySlots }, (_, index) => (
          <li
            className="player-row empty-player"
            key={`empty-slot-${maxPlayers - emptySlots + index}`}
          >
            <div className="player-avatar">+</div>
            <span>Waiting for player...</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;
