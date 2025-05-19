import { GameState, Position, ShipData, AttackStatus } from '../types';

export class GameManager {
  private games: { [key: string]: GameState } = {};
  private gameCounter = 0;

  createGame(roomId: number | string, player1Index: number | string, player2Index: number | string): GameState {
    const gameId = ++this.gameCounter;
    
    this.games[gameId] = {
      players: {
        [player1Index]: { ships: [], hits: [], misses: [] },
        [player2Index]: { ships: [], hits: [], misses: [] }
      },
      currentPlayer: player1Index,
      gameId
    };
    
    return this.games[gameId];
  }

  addShips(gameId: number | string, playerIndex: number | string, ships: ShipData[]): void {
    const game = this.games[gameId];
    if (game) {
      game.players[playerIndex].ships = ships;
    }
  }

  isReadyToStart(gameId: number | string): boolean {
    const game = this.games[gameId];
    if (!game) return false;
    
    return Object.values(game.players).every(p => p.ships.length > 0);
  }

  attack(gameId: number | string, attackerIndex: number | string, position: Position): AttackStatus {
    const game = this.games[gameId];
    if (!game || game.currentPlayer !== attackerIndex) {
      throw new Error('Invalid attack');
    }

    const opponentIndex = Object.keys(game.players).find(id => id !== attackerIndex) as string;
    const opponent = game.players[opponentIndex];
    
    const wasAttacked = [...opponent.hits, ...opponent.misses].some(
      p => p.x === position.x && p.y === position.y
    );
    
    if (wasAttacked) {
      throw new Error('Position already attacked');
    }

    const hitShip = opponent.ships.find(ship => {
      const shipPositions = this.getShipPositions(ship);
      return shipPositions.some(p => p.x === position.x && p.y === position.y);
    });

    if (hitShip) {
      opponent.hits.push(position);

      const shipPositions = this.getShipPositions(hitShip);
      const isKilled = shipPositions.every(pos => 
        opponent.hits.some(hit => hit.x === pos.x && hit.y === pos.y)
      );
      
      if (isKilled) {
        this.addSurroundingMisses(gameId, opponentIndex, hitShip);
        return 'killed';
      }
      
      return 'shot';
    } else {
      opponent.misses.push(position);
      game.currentPlayer = opponentIndex;
      return 'miss';
    }
  }

  randomAttack(gameId: number | string, attackerIndex: number | string): { position: Position; status: AttackStatus } {
    const game = this.games[gameId];
    if (!game || game.currentPlayer !== attackerIndex) {
      throw new Error('Invalid attack');
    }

    const opponentIndex = Object.keys(game.players).find(id => id !== attackerIndex) as string;
    const opponent = game.players[opponentIndex];
    
    let position: Position;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      position = {
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10)
      };
      attempts++;
    } while (
      [...opponent.hits, ...opponent.misses].some(
        p => p.x === position.x && p.y === position.y
      ) && attempts < maxAttempts
    );
    
    if (attempts >= maxAttempts) {
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          if (![...opponent.hits, ...opponent.misses].some(p => p.x === x && p.y === y)) {
            position = { x, y };
            break;
          }
        }
      }
    }

    const status = this.attack(gameId, attackerIndex, position);
    return { position, status };
  }

checkWinCondition(gameId: number | string): number | string | null {
    const game = this.games[gameId];
    if (!game) return null;
    
    for (const [playerIndex, playerData] of Object.entries(game.players)) {
      const opponentIndex = Object.keys(game.players).find(id => id !== playerIndex) as string;
      const opponentShips = game.players[opponentIndex].ships;
      
      const allShipsDestroyed = opponentShips.every(ship => {
        const shipPositions = this.getShipPositions(ship);
        return shipPositions.every(pos => 
          game.players[playerIndex].hits.some(hit => hit.x === pos.x && hit.y === pos.y)
        );
      });
      
      if (allShipsDestroyed) {
        return playerIndex;
      }
    }
    
    return null;
  }

  private getShipPositions(ship: ShipData): Position[] {
    const positions: Position[] = [];
    const { x, y } = ship.position;
    
    for (let i = 0; i < ship.length; i++) {
      positions.push({
        x: ship.direction ? x + i : x,
        y: ship.direction ? y : y + i
      });
    }
    
    return positions;
  }

  private addSurroundingMisses(gameId: number | string, playerIndex: number | string, ship: ShipData): void {
    const game = this.games[gameId];
    if (!game) return;
    
    const shipPositions = this.getShipPositions(ship);
    const opponentIndex = Object.keys(game.players).find(id => id !== playerIndex) as string;
    const opponent = game.players[opponentIndex];
    
    for (const pos of shipPositions) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const newX = pos.x + dx;
          const newY = pos.y + dy;
        
          if (newX >= 0 && newX < 10 && newY >= 0 && newY < 10) {
            const wasAttacked = [...opponent.hits, ...opponent.misses].some(
              p => p.x === newX && p.y === newY
            );
            
            if (!wasAttacked) {
              opponent.misses.push({ x: newX, y: newY });
            }
          }
        }
      }
    }
  }
}