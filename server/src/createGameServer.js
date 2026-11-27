import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import {
  createRoom,
  getRoomInfo,
  joinRoom,
  RoomError,
} from './roomStore.js';
import registerSocketHandlers from './socketHandlers.js';

const createGameServer = ({
  clientOrigin = process.env.CLIENT_ORIGIN
    || 'http://localhost:5173',
} = {}) => {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ['GET', 'POST'],
    },
    allowRequest: (req, callback) => {
      const { origin } = req.headers;

      callback(null, !origin || origin === clientOrigin);
    },
  });

  app.use(cors({
    origin: clientOrigin,
  }));

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

    io.to(`room:${result.room.code}`).emit(
      'room:update',
      result.room,
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

  registerSocketHandlers(io);

  return {
    app,
    httpServer,
    io,
  };
};

export default createGameServer;