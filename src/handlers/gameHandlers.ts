import { WebSocketMessage } from '../../types';
import { BattleshipWebSocketServer } from '../WebsocketServer';
import { WebSocket } from 'ws';

export function handleGameMessage(
  server: BattleshipWebSocketServer,
  ws: WebSocket,
  message: WebSocketMessage,
  connection: { playerIndex?: number | string } | undefined
): void {
  const playerIndex = connection?.playerIndex;
  if (!playerIndex) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { error: true, errorText: 'Player not registered' },
      id: 0
    }));
    return;
  }

  const gameManager = server.getGameManager();
  const { gameId, indexPlayer } = message.data;

  if (indexPlayer !== playerIndex) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { error: true, errorText: 'Player index mismatch' },
      id: 0
    }));
    return;
  }

  if (message.type === 'attack') {
    const { x, y } = message.data;
    const position = { x, y };

    try {
      const status = gameManager.attack(gameId, playerIndex, position);
     
      server.sendToGamePlayers(gameId, {
        type: 'attack',
        data: {
          position,
          currentPlayer: playerIndex,
          status
        },
        id: 0
      });

        const game = gameManager['games'][gameId];
      const opponentIndex = Object.keys(game.players).find(id => id !== playerIndex) as string;
     
      Object.keys(game.players).forEach(pIndex => {
        const isCurrentPlayer = pIndex === playerIndex;
        const ships = isCurrentPlayer 
          ? game.players[pIndex].ships 
          : game.players[pIndex].ships.map(s => ({ ...s, position: { x: -1, y: -1 }}));
        
        const hits = game.players[opponentIndex].hits;
        const misses = game.players[opponentIndex].misses;
        
        server.sendToPlayer(pIndex, {
          type: 'update_board',
          data: {
            ships,
            hits,
            misses,
            currentPlayerIndex: game.currentPlayer
          },
          id: 0
        });
      });

      const winner = gameManager.checkWinCondition(gameId);
      if (winner) {
        const playerManager = server.getPlayerManager();
        playerManager.incrementWins(winner);
        
        server.sendToGamePlayers(gameId, {
          type: 'finish',
          data: {
            winPlayer: winner
          },
          id: 0
        });
        
        server.broadcastUpdateWinners();
        return;
      }

      if (status === 'miss') {
        const game = gameManager['games'][gameId];
        server.sendToGamePlayers(gameId, {
          type: 'turn',
          data: {
            currentPlayer: game.currentPlayer
          },
          id: 0
        });
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { error: true, errorText: error instanceof Error ? error.message : 'Attack failed' },
        id: 0
      }));
    }
  } else if (message.type === 'randomAttack') {
    try {
      const { position, status } = gameManager.randomAttack(gameId, playerIndex);
    
      server.sendToGamePlayers(gameId, {
        type: 'attack',
        data: {
          position,
          currentPlayer: playerIndex,
          status
        },
        id: 0
      });

      const winner = gameManager.checkWinCondition(gameId);
      if (winner) {
        const playerManager = server.getPlayerManager();
        playerManager.incrementWins(winner);
        
        server.sendToGamePlayers(gameId, {
          type: 'finish',
          data: {
            winPlayer: winner
          },
          id: 0
        });
        
        server.broadcastUpdateWinners();
        return;
      }
      
      if (status === 'miss') {
        const game = gameManager['games'][gameId];
        server.sendToGamePlayers(gameId, {
          type: 'turn',
          data: {
            currentPlayer: game.currentPlayer
          },
          id: 0
        });
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { error: true, errorText: error instanceof Error ? error.message : 'Random attack failed' },
        id: 0
      }));
    }
  }
}