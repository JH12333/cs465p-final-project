import { useEffect, useState } from 'react';
import MainMenu from './components/MainMenu';
import Lobby from './components/Lobby';
import GameScene from './game/GameScene';
import {
  createRoom,
  getRoomInfo,
  joinRoom,
} from './services/roomApi';
import createSocket from './services/socket';

const roomCodePattern = /^[0-9a-f]{6}$/i;
const refreshInterval = 2000;

const App = function App() {
  const [session, setSession] = useState(null);
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingLocal, setIsPlayingLocal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [error, setError] = useState('');

  // Connect to the room after a successful REST request.
  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const socket = createSocket(session);
    const controller = new AbortController();

    let refreshId;

    const handleConnect = () => {
      setConnectionStatus('Connected to server');
    };

    const handleDisconnect = () => {
      setConnectionStatus('Disconnected from server');
    };

    const handleConnectError = (connectionError) => {
      setConnectionStatus(connectionError.message);
    };

    // Temporarily refresh room information through the REST API.
    const refreshRoom = async () => {
      try {
        const updatedRoom = await getRoomInfo(
          session.roomCode,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setRoom(updatedRoom);
          setError('');
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          refreshId = window.setTimeout(
            refreshRoom,
            refreshInterval,
          );
        }
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    socket.connect();
    refreshRoom();

    return () => {
      controller.abort();
      window.clearTimeout(refreshId);

      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      socket.disconnect();
    };
  }, [session]);

  // Create or join a room using the existing REST APIs.
  const enterRoom = async (requestRoom) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await requestRoom();

      setRoom(result.room);
      setConnectionStatus('Connecting to server...');

      setSession({
        roomCode: result.room.code,
        playerId: result.playerId,
        sessionToken: result.sessionToken,
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateNickname = (nickname) => {
    if (nickname.length === 0 || nickname.length > 20) {
      setError('Nickname must contain 1 to 20 characters');
      return false;
    }

    return true;
  };

  const handleCreateRoom = async (nickname) => {
    if (!validateNickname(nickname)) {
      return;
    }

    await enterRoom(() => createRoom(nickname));
  };

  const handleJoinRoom = async (roomCode, nickname) => {
    if (!validateNickname(nickname)) {
      return;
    }

    if (!roomCodePattern.test(roomCode)) {
      setError('Room code must contain 6 hexadecimal characters');
      return;
    }

    await enterRoom(() => joinRoom(roomCode, nickname));
  };

  if (isPlayingLocal) {
    return (
      <main>
        <GameScene />

        <div className="game-title">
          <h1>3D Bomberman</h1>
          <p>Local Game Prototype</p>
        </div>

        <button
          type="button"
          className="back-to-menu"
          onClick={() => setIsPlayingLocal(false)}
        >
          Back to Menu
        </button>
      </main>
    );
  }

  if (session && room) {
    return (
      <main>
        <Lobby
          room={room}
          playerId={session.playerId}
          connectionStatus={connectionStatus}
          error={error}
        />
      </main>
    );
  }

  return (
    <main>
      <MainMenu
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onPlayLocal={() => setIsPlayingLocal(true)}
        isLoading={isLoading}
        error={error}
      />
    </main>
  );
};

export default App;
