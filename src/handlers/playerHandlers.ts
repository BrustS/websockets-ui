import { WebSocketMessage } from '../../types';
import { BattleshipWebSocketServer } from '../WebsocketServer';
import { WebSocket } from 'ws';

export function handlePlayerMessage(
  server: BattleshipWebSocketServer,
  ws: WebSocket,
  message: WebSocketMessage,
  connection: { playerIndex?: number | string } | undefined
): void {
  if (message.type !== 'reg') return;

  try {
    const { name, password } = message.data;
    const playerManager = server.getPlayerManager();
    const player = playerManager.addPlayer(name, password);
    if (connection) {
     connection.playerIndex = player.index;    
    }
   

    const response: WebSocketMessage = {
      type: 'reg',
      data: {
        name: player.name,
        index: player.index,
        error: false,
        errorText: ''
      },
      id: 0
    };

    ws.send(JSON.stringify(response));
    server.broadcastUpdateWinners();
  } catch (error) {
    const response: WebSocketMessage = {
      type: 'reg',
      data: {
        name: '',
        index: 0,
        error: true,
        errorText: error instanceof Error ? error.message : 'Registration failed'
      },
      id: 0
    };

    ws.send(JSON.stringify(response));
  }
}