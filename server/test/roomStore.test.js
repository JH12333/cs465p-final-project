import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRoom,
  getRoomInfo,
  joinRoom,
  RoomError,
} from '../src/roomStore.js';

test('creates a room with one host player', () => {
  const { playerId, room } = createRoom('  Alice  ');

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

test('returns 409 when a third player tries to join', () => {
  const { room } = createRoom('Alice');

  joinRoom(room.code, 'Bob');

  assert.throws(() => joinRoom(room.code, 'Charlie'), {
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