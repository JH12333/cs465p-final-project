import { authenticatePlayer } from './roomStore.js';

const registerSocketHandlers = (io) => {
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

    socket.join(`room:${roomCode}`);

    process.stdout.write(
      `Player ${playerId} connected to room ${roomCode}\n`,
    );

    socket.on('disconnect', (reason) => {
      process.stdout.write(
        `Player ${playerId} disconnected: ${reason}\n`,
      );
    });
  });
};

export default registerSocketHandlers;
