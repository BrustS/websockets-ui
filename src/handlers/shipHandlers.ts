import { WebSocketMessage } from '../../types';
import { BattleshipWebSocketServer } from '../WebsocketServer';
import { WebSocket } from 'ws';

export function handleShipMessage(
  server: BattleshipWebSocketServer,
  ws: WebSocket,
  message: WebSocketMessage,
  connection: { playerIndex?: number | string } | undefined
): void {
  if (message.type !== 'add_ships') return;

  const playerIndex = connection?.playerIndex;
  if (!playerIndex) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { error: true, errorText: 'Player not registered' },
      id: 0
    }));
    return;
  }

  const { gameId, ships, indexPlayer } = message.data;
  
  if (indexPlayer !== playerIndex) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { error: true, errorText: 'Player index mismatch' },
      id: 0
    }));
    return;
  }

  const gameManager = server.getGameManager();
  gameManager.addShips(gameId, playerIndex, ships);

  // Check if both players have added ships
  if (gameManager.isReadyToStart(gameId)) {
    const game = gameManager['games'][gameId];
    
    // Send start_game to both players with their own ships
    Object.keys(game.players).forEach(pIndex => {
      const playerShips = game.players[pIndex].ships;
      
      server.sendToPlayer(pIndex, {
        type: 'start_game',
        data: {
          ships: playerShips,
          currentPlayerIndex: game.currentPlayer
        },
        id: 0
      });

      // Also send the opponent's ships (required by the frontend)
      const opponentIndex = Object.keys(game.players).find(id => id !== pIndex) as string;
      const opponentShips = game.players[opponentIndex].ships.map(ship => ({
        ...ship,
        position: { x: -1, y: -1 } // Hide actual positions
      }));

      server.sendToPlayer(pIndex, {
        type: 'update_board',
        data: {
          ships: opponentShips,
          currentPlayerIndex: game.currentPlayer
        },
        id: 0
      });
    });

    // Send turn info
    server.sendToGamePlayers(gameId, {
      type: 'turn',
      data: {
        currentPlayer: game.currentPlayer
      },
      id: 0
    });
  }
} 