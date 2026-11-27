const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const request = async (path, options = {}) => {
  const response = await fetch(`${serverUrl}${path}`, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  if (!data) {
    throw new Error('Invalid server response');
  }

  return data;
};

export const createRoom = (nickname) => request('/api/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ nickname }),
});

export const joinRoom = (roomCode, nickname) => request(
  `/api/rooms/${encodeURIComponent(roomCode)}/join`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname }),
  },
);

export const getRoomInfo = (roomCode, signal) => request(
  `/api/rooms/${encodeURIComponent(roomCode)}`,
  { signal },
);