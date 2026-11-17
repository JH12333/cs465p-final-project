import { randomBytes, randomUUID } from 'node:crypto';

const rooms = new Map();
const maxPlayersPerRoom = 2;
const maxNicknameLength = 20;
const roomCodePattern = /^[0-9a-f]{6}$/i;

export class RoomError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'RoomError';
    this.status = status;
  }
}

function validateNickname(nickname) {
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
}

function generateRoomCode() {
  let code;

  do {
    code = randomBytes(3).toString('hex').toUpperCase();
  } while (rooms.has(code));

  return code;
}

function serializeRoom({ code, players }) {
  return {
    code,
    players: players.map(({ id, nickname }) => ({
      id,
      nickname,
    })),
  };
}

function findRoom(code) {
  if (typeof code !== 'string' || !roomCodePattern.test(code)) {
    throw new RoomError('Invalid room code');
  }

  const room = rooms.get(code.toUpperCase());

  if (!room) {
    throw new RoomError('Room not found', 404);
  }

  return room;
}

export function createRoom(nickname) {
  const name = validateNickname(nickname);
  const player = {
    id: randomUUID(),
    nickname: name,
  };

  const room = {
    code: generateRoomCode(),
    players: [player],
  };

  rooms.set(room.code, room);

  return {
    playerId: player.id,
    room: serializeRoom(room),
  };
}

export function getRoomInfo(code) {
  return serializeRoom(findRoom(code));
}

export function joinRoom(code, nickname) {
  const name = validateNickname(nickname);
  const room = findRoom(code);

  if (room.players.length >= maxPlayersPerRoom) {
    throw new RoomError('Room is full', 409);
  }

  const player = {
    id: randomUUID(),
    nickname: name,
  };

  room.players.push(player);

  return {
    playerId: player.id,
    room: serializeRoom(room),
  };
}