import createGameServer from './createGameServer.js';

const port = Number(process.env.PORT) || 3001;
const { httpServer } = createGameServer();

httpServer.listen(port, () => {
  process.stdout.write(
    `Bomberman backend running on port ${port}\n`,
  );
});