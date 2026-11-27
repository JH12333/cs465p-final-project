import { useState } from 'react';
import PlayerList from './PlayerList';

const Lobby = function Lobby({
  room,
  playerId,
  connectionStatus,
  error,
}) {
  const [copyMessage, setCopyMessage] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopyMessage('Room code copied');
    } catch {
      setCopyMessage('Unable to copy room code');
    }
  };

  return (
    <section className="menu-page">
      <div className="menu-card lobby-card">
        <header className="menu-header">
          <h1>Multiplayer Lobby</h1>
          <p>Invite your friends to join the room</p>
        </header>

        <div className="room-code-panel">
          <div>
            <span className="room-code-label">Room Code</span>
            <strong className="room-code">{room.code}</strong>
          </div>

          <button
            type="button"
            className="copy-button"
            onClick={handleCopy}
          >
            Copy
          </button>
        </div>

        {copyMessage && (
          <p className="status-message" role="status">
            {copyMessage}
          </p>
        )}

        <PlayerList
          players={room.players}
          playerId={playerId}
        />

        <div className="lobby-actions">
          <button
            type="button"
            className="primary-button"
            disabled
          >
            Ready
          </button>

          <button
            type="button"
            className="primary-button"
            disabled
          >
            Start Game
          </button>

          <button
            type="button"
            className="leave-button"
            disabled
          >
            Leave Room
          </button>
        </div>

        <p className="status-message" role="status">
          {connectionStatus}
        </p>

        <p className="status-message">
          Room controls will be available after server integration.
        </p>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
};

export default Lobby;
