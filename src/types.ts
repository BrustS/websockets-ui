export type ShipType = 'small' | 'medium' | 'large' | 'huge';
export type AttackStatus = 'miss' | 'killed' | 'shot';

export interface Position {
  x: number;
  y: number;
}

export interface ShipData {
  position: Position;
  direction: boolean;
  length: number;
  type: ShipType;
}

export interface Player {
  name: string;
  password: string;
  index: number | string;
  wins: number;
}

export interface Room {
  roomId: number | string;
  roomUsers: {
    name: string;
    index: number | string;
  }[];
}

export interface WebSocketMessage {
  type: string;
  data: any;
  id: number;
}

export interface GameState {
  players: {
    [key: string]: {
      ships: ShipData[];
      hits: Position[];
      misses: Position[];
    };
  };
  currentPlayer: number | string;
  gameId: number | string;
}