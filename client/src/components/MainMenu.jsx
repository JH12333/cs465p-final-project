import { useState } from 'react';

const MainMenu = function MainMenu({
  onCreateRoom,
  onJoinRoom,
  onPlayLocal,
  isLoading,
  error,
}) {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCreate = () => {
    onCreateRoom(nickname.trim());
  };

  const handleJoin = (event) => {
    event.preventDefault();

    onJoinRoom(
      roomCode.trim().toUpperCase(),
      nickname.trim(),
    );
  };

  return (
    <section className="menu-page">
      <div className="menu-card">
        <header className="menu-header">
          <h1>3D Bomberman</h1>
          <p>Multiplayer First-Person Arena</p>
        </header>

        <form className="menu-form" onSubmit={handleJoin}>
          <label htmlFor="nickname">Nickname</label>

          <input
            id="nickname"
            type="text"
            placeholder="Enter your nickname"
            value={nickname}
            maxLength={20}
            disabled={isLoading}
            onChange={(event) => setNickname(event.target.value)}
          />

          <button
            type="button"
            className="primary-button"
            disabled={isLoading}
            onClick={handleCreate}
          >
            Create Room
          </button>

          <div className="menu-divider">
            <span>OR</span>
          </div>

          <label htmlFor="room-code">Room Code</label>

          <input
            id="room-code"
            type="text"
            placeholder="Enter room code"
            value={roomCode}
            maxLength={6}
            disabled={isLoading}
            onChange={(event) => setRoomCode(
              event.target.value.toUpperCase(),
            )}
          />

          <button
            type="submit"
            className="secondary-button"
            disabled={isLoading}
          >
            Join Room
          </button>
        </form>

        {isLoading && (
          <p className="status-message" role="status">
            Connecting to server...
          </p>
        )}

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="local-game-button"
          disabled={isLoading}
          onClick={onPlayLocal}
        >
          Play Local Prototype
        </button>
      </div>
    </section>
  );
};

export default MainMenu;
