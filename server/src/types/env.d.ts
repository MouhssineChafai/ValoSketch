declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FIREBASE_PROJECT_ID: string;
      FIREBASE_PRIVATE_KEY: string;
      FIREBASE_CLIENT_EMAIL: string;
    }
  }
}

export {} 