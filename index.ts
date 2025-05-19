import { httpServer } from "./src/http_server/index.js";
import { BattleshipWebSocketServer } from './src/websocket_server/WebsocketServer.js';
import dotenv from 'dotenv';
const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);


dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const server = new BattleshipWebSocketServer(PORT);

console.log(`Server running on ws://localhost:${PORT}`);

process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await server.close();
  process.exit();
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await server.close();
  process.exit();
});
