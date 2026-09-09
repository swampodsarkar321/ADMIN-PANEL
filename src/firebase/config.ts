import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

export const isFirebaseConfigured =
  !!cfg.apiKey && !!cfg.databaseURL && !cfg.databaseURL.includes('YOUR-PROJECT');

const app = getApps().length ? getApps()[0] : initializeApp(cfg);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const ADMIN_EMAILS = ((import.meta.env.VITE_ADMIN_EMAILS as string) || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
