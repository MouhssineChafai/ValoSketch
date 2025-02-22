export interface GameState {
  lobbyId: string;
  players: Player[];
  currentRound: number;
  currentTurn: number;
  settings: GameSettings;
  status: 'waiting' | 'playing' | 'finished';
}

export interface Player {
  id: string;
  username: string;
  score: number;
  isDrawing: boolean;
  isHost: boolean;
}

export interface GameSettings {
  gameMode: 'agents' | 'weapons' | 'both' | 'custom';
  drawingTime: number;
  waitingTime: number;
  rounds: number;
  turnsPerRound: number;
}

export interface LobbyState extends GameState {
  host: string;
} 