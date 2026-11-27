import { io } from 'socket.io-client';

const serverUrl = import.meta.env.VITE_SERVER_URL
  || 'http://localhost:3001';

const createSocket = ({
  roomCode,
  playerId,
  sessionToken,
}) => io(serverUrl, {
  autoConnect: false,
  auth: {
    roomCode,
    playerId,
    sessionToken,
  },
});

export default createSocket;
