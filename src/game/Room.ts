import { Room } from '../types';

export class RoomManager {
  private rooms: Room[] = [];
  private roomCounter = 0;

  createRoom(playerName: string, playerIndex: number | string): Room {
    const newRoom: Room = {
      roomId: ++this.roomCounter,
      roomUsers: [{ name: playerName, index: playerIndex }]
    };
    
    this.rooms.push(newRoom);
    return newRoom;
  }

  addUserToRoom(roomId: number | string, playerName: string, playerIndex: number | string): Room | undefined {
    const room = this.rooms.find(r => r.roomId === roomId);
    
    if (room && room.roomUsers.length === 1) {
      room.roomUsers.push({ name: playerName, index: playerIndex });
      return room;
    }
    
    return undefined;
  }

  removeRoom(roomId: number | string): void {
    this.rooms = this.rooms.filter(r => r.roomId !== roomId);
  }

  getAvailableRooms(): Room[] {
    return this.rooms.filter(room => room.roomUsers.length === 1);
  }
}