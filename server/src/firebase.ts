import admin from 'firebase-admin';
import dotenv from 'dotenv';
import type { LobbyState } from './types';

// Load environment variables
dotenv.config();

const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
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