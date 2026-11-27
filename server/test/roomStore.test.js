import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authenticatePlayer,
  createRoom,
  getRoomInfo,
  joinRoom,
  leaveRoom,
  RoomError,
  setRoomStatus,
} from '../src/roomStore.js';

test('creates a room with one host player', () => {
  const { playerId, room } = createRoom('  Alice  ');

  assert.equal(room.status, 'waiting');
  assert.match(room.code, /^[0-9A-F]{6}$/);
  assert.equal(room.players.length, 1);
  assert.deepEqual(room.players[0], {
    id: playerId,
    nickname: 'Alice',
  });
});

test('retrieves room information using a case-insensitive code', () => {
  const { room } = createRoom('Alice');
  const retrievedRoom = getRoomInfo(room.code.toLowerCase());

  assert.deepEqual(retrievedRoom, room);
});

test('lets a second player join an existing room', () => {
  const { room } = createRoom('Alice');
  const result = joinRoom(room.code, 'Bob');

  assert.equal(result.room.players.length, 2);
  assert.equal(result.room.players[1].nickname, 'Bob');
  assert.equal(result.room.players[1].id, result.playerId);
});

test('rejects invalid nicknames and room codes', () => {
  assert.throws(() => createRoom(' '), RoomError);
  assert.throws(() => createRoom('a'.repeat(21)), RoomError);

  assert.throws(() => getRoomInfo('INVALID'), {
    name: 'RoomError',
    status: 400,
  });
});

test('returns 404 when the room does not exist', () => {
  assert.throws(() => getRoomInfo('FFFFFF'), {
    name: 'RoomError',
    status: 404,
  });
});

test('returns 409 when a fifth player tries to join', () => {
  const { room } = createRoom('Alice');

  joinRoom(room.code, 'Bob');
  joinRoom(room.code, 'Charlie');
  const result = joinRoom(room.code, 'David');

  assert.equal(result.room.players.length, 4);

  assert.throws(() => joinRoom(room.code, 'Eve'), {
    name: 'RoomError',
    status: 409,
  });
});

test('does not expose mutable internal player lists', () => {
  const { room } = createRoom('Alice');

  room.players[0].nickname = 'Changed';
  room.players.push({
    id: 'fake',
    nickname: 'Fake',
  });

  const stored = getRoomInfo(room.code);

  assert.equal(stored.players.length, 1);
  assert.equal(stored.players[0].nickname, 'Alice');
});

test('removes a player while preserving other room members', () => {
  const alice = createRoom('Alice');
  const bob = joinRoom(alice.room.code, 'Bob');

  const updatedRoom = leaveRoom(
    alice.room.code,
    alice.playerId,
  );

  assert.equal(updatedRoom.players.length, 1);
  assert.equal(updatedRoom.players[0].id, bob.playerId);
  assert.deepEqual(
    getRoomInfo(alice.room.code),
    updatedRoom,
  );
});

test('deletes a room when the last player leaves', () => {
  const { room, playerId } = createRoom('Alice');

  assert.equal(leaveRoom(room.code, playerId), null);

  assert.throws(() => getRoomInfo(room.code), {
    name: 'RoomError',
    status: 404,
  });
});

test('rejects leaving a nonexistent room', () => {
  const { room, playerId } = createRoom('Alice');

  leaveRoom(room.code, playerId);

  assert.throws(() => leaveRoom(room.code, playerId), {
    name: 'RoomError',
    status: 404,
  });
});

test('rejects removing a player who is not in the room', () => {
  const alice = createRoom('Alice');
  const bob = createRoom('Bob');

  assert.throws(
    () => leaveRoom(alice.room.code, bob.playerId),
    {
      name: 'RoomError',
      status: 404,
    },
  );

  assert.equal(
    getRoomInfo(alice.room.code).players.length,
    1,
  );
});

test('invalidates session credentials after a player leaves', () => {
  const alice = createRoom('Alice');

  joinRoom(alice.room.code, 'Bob');
  leaveRoom(alice.room.code, alice.playerId);

  assert.throws(
    () => authenticatePlayer(
      alice.room.code,
      alice.playerId,
      alice.sessionToken,
    ),
    {
      name: 'RoomError',
      status: 401,
    },
  );
});

test('prevents players from joining rooms during active matches', () => {
  const { room } = createRoom('Alice');

  const updatedRoom = setRoomStatus(
    room.code,
    'playing',
  );

  assert.equal(updatedRoom.status, 'playing');

  assert.throws(() => joinRoom(room.code, 'Bob'), {
    name: 'RoomError',
    status: 409,
  });

  assert.equal(getRoomInfo(room.code).players.length, 1);

  setRoomStatus(room.code, 'waiting');

  const joined = joinRoom(room.code, 'Bob');

  assert.equal(joined.room.players.length, 2);
});

test('rejects invalid room status values', () => {
  const { room } = createRoom('Alice');

  assert.throws(
    () => setRoomStatus(room.code, 'invalid'),
    RoomError,
  );

  assert.equal(getRoomInfo(room.code).status, 'waiting');
});
