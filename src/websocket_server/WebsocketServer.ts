import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage } from '../types';
import { PlayerManager } from '../game/Player';
import { RoomManager } from '../game/Room';
import { GameManager } from '../game/Game';
import { handlePlayerMessage } from '../handlers/playerHandlers';
import { handleRoomMessage } from '../handlers/roomHandlers';
import { handleShipMessage } from '../handlers/shipHandlers';
import { handleGameMessage } from '../handlers/gameHandlers';

export class BattleshipWebSocketServer {
  private wss: WebSocketServer;
  private playerManager = new PlayerManager();
  private roomManager = new RoomManager();
  private gameManager = new GameManager();
  private connections = new Map<WebSocket, { playerIndex?: number | string }>();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws) => {
      this.connections.set(ws, {});
      console.log('New client connected');

      ws.on('message', (message) => {
        try {
          const parsedMessage: WebSocketMessage = JSON.parse(message.toString());
          console.log('Received:', parsedMessage);

          this.handleMessage(ws, parsedMessage);
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            data: { error: true, errorText: 'Invalid message format' },
            id: 0
          }));
        }
      });

      ws.on('close', () => {
        this.connections.delete(ws);
        console.log('Client disconnected');
      });
    });

    console.log(`WebSocket server started on port ${port}`);
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage): void {
    const connection = this.connections.get(ws);
    
    switch (message.type) {
      case 'reg':
        handlePlayerMessage(this, ws, message, connection);
        break;
      case 'create_room':
      case 'add_user_to_room':
        handleRoomMessage(this, ws, message, connection);
        break;
      case 'add_ships':
        handleShipMessage(this, ws, message, connection);
        break;
      case 'attack':
      case 'randomAttack':
        handleGameMessage(this, ws, message, connection);
        break;
      default:
        ws.send(JSON.stringify({
          type: 'error',
          data: { error: true, errorText: 'Unknown message type' },
          id: 0
        }));
    }
  }

  broadcastUpdateRooms(): void {
    const availableRooms = this.roomManager.getAvailableRooms();
    const message: WebSocketMessage = {
      type: 'update_room',
      data: availableRooms,
      id: 0
    };
    
    this.broadcast(message);
  }

  broadcastUpdateWinners(): void {
    const winners = this.playerManager.getWinners();
    const message: WebSocketMessage = {
      type: 'update_winners',
      data: winners,
      id: 0
    };
    
    this.broadcast(message);
  }

  sendToPlayer(playerIndex: number | string, message: WebSocketMessage): void {
    for (const [ws, connection] of this.connections) {
      if (connection.playerIndex === playerIndex) {
        ws.send(JSON.stringify(message));
        break;
      }
    }
  }

  sendToGamePlayers(gameId: number | string, message: WebSocketMessage): void {
    const game = this.gameManager['games'][gameId];
    if (!game) return;
    
    Object.keys(game.players).forEach(playerIndex => {
      this.sendToPlayer(playerIndex, message);
    });
  }

  private broadcast(message: WebSocketMessage): void {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        console.log('WebSocket server closed');
        resolve();
      });
    });
  }

  getPlayerManager(): PlayerManager {
    return this.playerManager;
  }

  getRoomManager(): RoomManager {
    return this.roomManager;
  }

getGameManager(): GameManager {
    return this.gameManager;
  }

  getConnections(): Map<WebSocket, { playerIndex?: number | string }> {
    return this.connections;
  }
}