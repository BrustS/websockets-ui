import { WebSocketMessage } from '../../types';
import { BattleshipWebSocketServer } from '../WebsocketServer';
import { WebSocket } from 'ws';

export function handleRoomMessage(
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

  const playerManager = server.getPlayerManager();
  const player = playerManager.getPlayer(playerIndex);
  if (!player) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { error: true, errorText: 'Player not found' },
      id: 0
    }));
    return;
  }

  const roomManager = server.getRoomManager();
  const gameManager = server.getGameManager();

  if (message.type === 'create_room') {
    const newRoom = roomManager.createRoom(player.name, playerIndex);
    server.broadcastUpdateRooms();

    ws.send(JSON.stringify({
      type: 'create_room',
      data: '',
      id: 0
    }));
  } else if (message.type === 'add_user_to_room') {
    const roomId = message.data.indexRoom;
    const room = roomManager.addUserToRoom(roomId, player.name, playerIndex);

    if (!room) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { error: true, errorText: 'Failed to join room' },
        id: 0
      }));
      return;
    }

    const [player1, player2] = room.roomUsers;
    const game = gameManager.createGame(room.roomId, player1.index, player2.index);

    room.roomUsers.forEach((user, idx) => {
      server.sendToPlayer(user.index, {
        type: 'create_game',
        data: {
          idGame: game.gameId,
          idPlayer: user.index
        },
        id: 0
      });
    });

    roomManager.removeRoom(room.roomId);
    server.broadcastUpdateRooms();
  }
}