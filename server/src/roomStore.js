import { randomBytes, randomUUID } from 'node:crypto';

const rooms = new Map();
const maxPlayersPerRoom = 4;
const maxNicknameLength = 20;
const roomCodePattern = /^[0-9a-f]{6}$/i;

export class RoomError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'RoomError';
    this.status = status;
  }
}

const validateNickname = (nickname) => {
  if (typeof nickname !== 'string') {
    throw new RoomError('Nickname is required');
  }

  const trimmedNickname = nickname.trim();

  if (
    trimmedNickname.length === 0
    || trimmedNickname.length > maxNicknameLength
  ) {
    throw new RoomError('Nickname must contain 1 to 20 characters');
  }

  return trimmedNickname;
};

const generateRoomCode = () => {
  let code;

  do {
    code = randomBytes(3).toString('hex').toUpperCase();
  } while (rooms.has(code));

  return code;
};

const serializeRoom = ({ code, status, players }) => ({
  code,
  status,
  players: players.map(({ id, nickname }) => ({
    id,
    nickname,
  })),
});

const findRoom = (code) => {
  if (typeof code !== 'string' || !roomCodePattern.test(code)) {
    throw new RoomError('Invalid room code');
  }

  const room = rooms.get(code.toUpperCase());

  if (!room) {
    throw new RoomError('Room not found', 404);
  }

  return room;
};

const createPlayer = (nickname) => ({
  id: randomUUID(),
  nickname,
  sessionToken: randomBytes(32).toString('hex'),
});

export const createRoom = (nickname) => {
  const name = validateNickname(nickname);
  const player = createPlayer(name);

  const room = {
    code: generateRoomCode(),
    status: 'waiting',
    players: [player],
  };

  rooms.set(room.code, room);

  return {
    playerId: player.id,
    sessionToken: player.sessionToken,
    room: serializeRoom(room),
  };
};

export const getRoomInfo = (code) => serializeRoom(findRoom(code));

export const joinRoom = (code, nickname) => {
  const name = validateNickname(nickname);
  const room = findRoom(code);

  if (room.status !== 'waiting') {
    throw new RoomError('Room is not accepting new players', 409);
  }

  if (room.players.length >= maxPlayersPerRoom) {
    throw new RoomError('Room is full', 409);
  }

  const player = createPlayer(name);

  room.players.push(player);

  return {
    playerId: player.id,
    sessionToken: player.sessionToken,
    room: serializeRoom(room),
  };
};

export const leaveRoom = (code, playerId) => {
  const room = findRoom(code);

  const playerIndex = room.players.findIndex(
    ({ id }) => id === playerId,
  );

  if (playerIndex === -1) {
    throw new RoomError('Player not found', 404);
  }

  room.players.splice(playerIndex, 1);

  if (room.players.length === 0) {
    rooms.delete(room.code);

    return null;
  }

  return serializeRoom(room);
};

export const setRoomStatus = (code, status) => {
  const room = findRoom(code);

  if (!['waiting', 'playing'].includes(status)) {
    throw new RoomError('Invalid room status');
  }

  room.status = status;

  return serializeRoom(room);
};

export const authenticatePlayer = (
  code,
  playerId,
  sessionToken,
) => {
  const room = findRoom(code);

  const player = room.players.find(
    ({ id }) => id === playerId,
  );

  if (
    !player
    || typeof sessionToken !== 'string'
    || player.sessionToken !== sessionToken
  ) {
    throw new RoomError('Invalid room credentials', 401);
  }

  return {
    roomCode: room.code,
    playerId: player.id,
  };
};
