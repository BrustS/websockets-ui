import { Player } from '../types';

export class PlayerManager {
  private players: Player[] = [];

  addPlayer(name: string, password: string): Player {
    const existingPlayer = this.players.find(p => p.name === name);
    
    if (existingPlayer) {
      if (existingPlayer.password !== password) {
        throw new Error('Invalid password');
      }
      return existingPlayer;
    }

    const newPlayer: Player = {
      name,
      password,
      index: this.players.length + 1,
      wins: 0
    };
    
    this.players.push(newPlayer);
    return newPlayer;
  }

  getPlayer(index: number | string): Player | undefined {
    return this.players.find(p => p.index === index);
  }

  incrementWins(index: number | string): void {
    const player = this.getPlayer(index);
    if (player) {
      player.wins++;
    }
  }

  getWinners(): { name: string; wins: number }[] {
    return this.players
      .filter(p => p.wins > 0)
      .sort((a, b) => b.wins - a.wins)
      .map(p => ({ name: p.name, wins: p.wins }));
  }
}