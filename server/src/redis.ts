import { createClient } from 'redis';
import type { LobbyState } from './types';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err: Error) => console.log('Redis Client Error', err));
redisClient.connect();

export async function saveLobby(lobbyId: string, lobby: LobbyState): Promise<void> {
  await redisClient.set(`lobby:${lobbyId}`, JSON.stringify(lobby));
  // Set expiration to 24 hours
  await redisClient.expire(`lobby:${lobbyId}`, 24 * 60 * 60);
}

export async function getLobby(lobbyId: string): Promise<LobbyState | null> {
  const lobby = await redisClient.get(`lobby:${lobbyId}`);
  return lobby ? JSON.parse(lobby) : null;
}

export async function deleteLobby(lobbyId: string): Promise<void> {
  await redisClient.del(`lobby:${lobbyId}`);
}

export async function lobbyExists(lobbyId: string): Promise<boolean> {
  return await redisClient.exists(`lobby:${lobbyId}`) === 1;
} 