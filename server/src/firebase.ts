import admin from 'firebase-admin';
import * as path from 'path';
import dotenv from 'dotenv';
import type { LobbyState } from './types';

// Load environment variables
dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is not defined in environment variables');
}

const serviceAccount = require(path.resolve(serviceAccountPath));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const lobbiesRef = db.collection('lobbies');

export async function saveLobby(lobbyId: string, lobby: LobbyState): Promise<void> {
  await lobbiesRef.doc(lobbyId).set({
    ...lobby,
    updatedAt: new Date() // Add timestamp for cleanup later
  });
}

export async function getLobby(lobbyId: string): Promise<LobbyState | null> {
  try {
    const doc = await lobbiesRef.doc(lobbyId).get();
    return doc.exists ? (doc.data() as LobbyState) : null;
  } catch (error) {
    console.error('Error getting lobby:', error);
    return null;
  }
}

export async function deleteLobby(lobbyId: string): Promise<void> {
  try {
    await lobbiesRef.doc(lobbyId).delete();
  } catch (error) {
    console.error('Error deleting lobby:', error);
  }
}

export async function lobbyExists(lobbyId: string): Promise<boolean> {
  try {
    const doc = await lobbiesRef.doc(lobbyId).get();
    return doc.exists;
  } catch (error) {
    console.error('Error checking lobby existence:', error);
    return false;
  }
}

export default admin; 