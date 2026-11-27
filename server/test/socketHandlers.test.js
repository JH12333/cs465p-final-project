import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { io as createClient } from 'socket.io-client';
import createGameServer from '../src/createGameServer.js';
import {
  createRoom,
  joinRoom,
} from '../src/roomStore.js';

const startTestServer = async (t) => {
  const { httpServer, io } = createGameServer({
    clientOrigin: 'http://localhost:5173',
  });

  httpServer.listen(0, '127.0.0.1');
  await once(httpServer, 'listening');

  const { port } = httpServer.address();

  t.after(() => new Promise((resolve) => {
    io.close(resolve);
  }));

  return {
    io,
    url: `http://127.0.0.1:${port}`,
  };
};

const createTestClient = (t, url, auth) => {
  const socket = createClient(url, {
    autoConnect: false,
    reconnection: false,
    forceNew: true,
    auth,
  });

  t.after(() => {
    socket.disconnect();
  });

  return socket;
};

const connectClient = (socket) => new Promise(
  (resolve, reject) => {
    socket.once('connect_error', reject);

    socket.once('connect', () => {
      socket.off('connect_error', reject);
      resolve();
    });

    socket.connect();
  },
);

const getCredentials = ({
  room,
  playerId,
  sessionToken,
}) => ({
  roomCode: room.code,
  playerId,
  sessionToken,
});

test('connects multiple valid players to the same room', {
  timeout: 10000,
}, async (t) => {
  const { io, url } = await startTestServer(t);

  const alice = createRoom('Alice');
  const bob = joinRoom(alice.room.code, 'Bob');

  const first = createTestClient(
    t,
    url,
    getCredentials(alice),
  );

  const second = createTestClient(
    t,
    url,
    getCredentials(bob),
  );

  await Promise.all([
    connectClient(first),
    connectClient(second),
  ]);

  const room = io.sockets.adapter.rooms.get(
    `room:${alice.room.code}`,
  );

  assert.equal(first.connected, true);
  assert.equal(second.connected, true);
  assert.equal(room.size, 2);
});

test('rejects invalid session credentials', {
  timeout: 10000,
}, async (t) => {
  const { url } = await startTestServer(t);
  const player = createRoom('Alice');

  const socket = createTestClient(t, url, {
    ...getCredentials(player),
    sessionToken: 'invalid-token',
  });

  const errorPromise = once(socket, 'connect_error');

  socket.connect();

  const [error] = await errorPromise;

  assert.equal(error.message, 'Invalid room credentials');
  assert.equal(socket.connected, false);
});

test('rejects players attempting to join another room', {
  timeout: 10000,
}, async (t) => {
  const { url } = await startTestServer(t);

  const alice = createRoom('Alice');
  const bob = createRoom('Bob');

  const socket = createTestClient(t, url, {
    ...getCredentials(alice),
    roomCode: bob.room.code,
  });

  const errorPromise = once(socket, 'connect_error');

  socket.connect();

  const [error] = await errorPromise;

  assert.equal(error.message, 'Invalid room credentials');
  assert.equal(socket.connected, false);
});

test('isolates socket connections between rooms', {
  timeout: 10000,
}, async (t) => {
  const { io, url } = await startTestServer(t);

  const alice = createRoom('Alice');
  const bob = createRoom('Bob');

  const first = createTestClient(
    t,
    url,
    getCredentials(alice),
  );

  const second = createTestClient(
    t,
    url,
    getCredentials(bob),
  );

  await Promise.all([
    connectClient(first),
    connectClient(second),
  ]);

  const firstRoom = io.sockets.adapter.rooms.get(
    `room:${alice.room.code}`,
  );

  const secondRoom = io.sockets.adapter.rooms.get(
    `room:${bob.room.code}`,
  );

  assert.equal(firstRoom.size, 1);
  assert.equal(secondRoom.size, 1);
  assert.equal(firstRoom.has(first.id), true);
  assert.equal(firstRoom.has(second.id), false);
  assert.equal(secondRoom.has(second.id), true);
});

test('removes disconnected sockets from communication rooms', {
  timeout: 10000,
}, async (t) => {
  const { io, url } = await startTestServer(t);
  const player = createRoom('Alice');

  const socket = createTestClient(
    t,
    url,
    getCredentials(player),
  );

  await connectClient(socket);

  const serverSocket = io.sockets.sockets.get(socket.id);
  const disconnectPromise = once(serverSocket, 'disconnect');

  socket.disconnect();

  await disconnectPromise;

  assert.equal(
    io.sockets.adapter.rooms.has(
      `room:${player.room.code}`,
    ),
    false,
  );
});

test('preserves REST APIs and hides session tokens', {
  timeout: 10000,
}, async (t) => {
  const { url } = await startTestServer(t);

  const healthResponse = await fetch(`${url}/api/health`);
  const health = await healthResponse.json();

  assert.equal(healthResponse.status, 200);
  assert.equal(health.status, 'ok');

  const createResponse = await fetch(`${url}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nickname: 'Alice',
    }),
  });

  const created = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.match(created.sessionToken, /^[0-9a-f]{64}$/);

  const joinResponse = await fetch(
    `${url}/api/rooms/${created.room.code}/join`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nickname: 'Bob',
      }),
    },
  );

  const joined = await joinResponse.json();

  assert.equal(joinResponse.status, 200);
  assert.match(joined.sessionToken, /^[0-9a-f]{64}$/);
  assert.notEqual(created.sessionToken, joined.sessionToken);

  const roomResponse = await fetch(
    `${url}/api/rooms/${created.room.code}`,
  );

  const room = await roomResponse.json();

  assert.equal(roomResponse.status, 200);
  assert.equal(room.players.length, 2);

  room.players.forEach((player) => {
    assert.equal('sessionToken' in player, false);
  });

  const socket = createTestClient(
    t,
    url,
    getCredentials(joined),
  );

  await connectClient(socket);

  assert.equal(socket.connected, true);
});

test('configures CORS for the client origin', {
  timeout: 10000,
}, async (t) => {
  const { url } = await startTestServer(t);

  const response = await fetch(`${url}/api/health`, {
    headers: {
      Origin: 'http://localhost:5173',
    },
  });

  assert.equal(
    response.headers.get('access-control-allow-origin'),
    'http://localhost:5173',
  );
});

test('rejects players attempting to impersonate another player', {
  timeout: 10000,
}, async (t) => {
  const { url } = await startTestServer(t);

  const alice = createRoom('Alice');
  const bob = joinRoom(alice.room.code, 'Bob');

  const socket = createTestClient(t, url, {
    ...getCredentials(alice),
    playerId: bob.playerId,
  });

  const errorPromise = once(socket, 'connect_error');

  socket.connect();

  const [error] = await errorPromise;

  assert.equal(error.message, 'Invalid room credentials');
  assert.equal(socket.connected, false);
});
