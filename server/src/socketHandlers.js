import {
  authenticatePlayer,
  getRoomInfo,
  leaveRoom,
  RoomError,
} from './roomStore.js';

const registerSocketHandlers = (io) => {
  const playerSockets = new Map();

  const broadcastRoom = (room) => {
    if (room) {
      io.to(`room:${room.code}`).emit('room:update', room);
    }
  };

  io.use((socket, next) => {
    const {
      roomCode,
      playerId,
      sessionToken,
    } = socket.handshake.auth ?? {};

    try {
      const player = authenticatePlayer(
        roomCode,
        playerId,
        sessionToken,
      );

      Object.assign(socket.data, {
        roomCode: player.roomCode,
        playerId: player.playerId,
      });

      return next();
    } catch {
      return next(new Error('Invalid room credentials'));
    }
  });

  io.on('connection', (socket) => {
    const { roomCode, playerId } = socket.data;

    let room;

    try {
      room = getRoomInfo(roomCode);
    } catch (error) {
      if (!(error instanceof RoomError)) {
        throw error;
      }

      socket.disconnect();
      return;
    }

    if (!room.players.some(({ id }) => id === playerId)) {
      socket.disconnect();
      return;
    }

    const sockets = playerSockets.get(playerId) ?? new Set();

    sockets.add(socket);
    playerSockets.set(playerId, sockets);

    socket.join(`room:${roomCode}`);
    socket.emit('room:update', room);

    process.stdout.write(
      `Player ${playerId} connected to room ${roomCode}\n`,
    );

    socket.on('room:leave', (acknowledge) => {
      const activeSockets = playerSockets.get(playerId);

      if (!activeSockets?.has(socket)) {
        if (typeof acknowledge === 'function') {
          acknowledge({
            ok: false,
            error: 'Player is not in the room',
          });
        }

        return;
      }

      const updatedRoom = leaveRoom(roomCode, playerId);

      playerSockets.delete(playerId);

      if (typeof acknowledge === 'function') {
        acknowledge({ ok: true });
      }

      activeSockets.forEach((activeSocket) => {
        activeSocket.disconnect();
      });

      broadcastRoom(updatedRoom);
    });

    socket.on('disconnect', (reason) => {
      process.stdout.write(
        `Player ${playerId} disconnected: ${reason}\n`,
      );

      const activeSockets = playerSockets.get(playerId);

      if (
        !activeSockets
        || !activeSockets.delete(socket)
        || activeSockets.size > 0
      ) {
        return;
      }

      playerSockets.delete(playerId);

      const updatedRoom = leaveRoom(roomCode, playerId);

      broadcastRoom(updatedRoom);
    });
  });
};

export default registerSocketHandlers;
