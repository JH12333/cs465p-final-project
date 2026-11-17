import express from 'express';
import {
  createRoom,
  getRoomInfo,
  joinRoom,
  RoomError,
} from './roomStore.js';

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bomberman backend is running',
  });
});

// Create a room
app.post('/api/rooms', (req, res) => {
  const result = createRoom(req.body?.nickname);

  res.status(201).json(result);
});

// Retrieve room information
app.get('/api/rooms/:code', (req, res) => {
  const room = getRoomInfo(req.params.code);

  res.json(room);
});

// Join a room
app.post('/api/rooms/:code/join', (req, res) => {
  const result = joinRoom(
    req.params.code,
    req.body?.nickname,
  );

  res.json(result);
});

// Error handling
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof RoomError) {
    return res.status(error.status).json({
      error: error.message,
    });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON body',
    });
  }

  console.error(error);

  return res.status(500).json({
    error: 'Internal server error',
  });
});

app.listen(port, () => {
  process.stdout.write(
    `Bomberman backend running on port ${port}\n`,
  );
});