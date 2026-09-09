import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

/* Firebase config is HARDCODED (dashboard env vars override it if set).
 * Web keys are public by design — real security is RTDB Rules + Auth. */
const cfg = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || "AIzaSyAeoScw5UK53ElBnNdhtJVAETb3_isOEKs",
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || "fram-and-go.firebaseapp.com",
  databaseURL: (import.meta.env.VITE_FIREBASE_DATABASE_URL as string) || "https://fram-and-go-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || "fram-and-go",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || "1:781295119002:web:4be2d54934395b491c0d23",
};

export const isFirebaseConfigured =
  !!cfg.apiKey && !!cfg.databaseURL && !cfg.databaseURL.includes('YOUR-PROJECT');

// Safe init: never crash the whole app at import time. If env is missing
// (e.g. Vercel build without variables), we render a setup screen instead.
let app: FirebaseApp | null = null;
let initError: string | null = null;
try {
  app = getApps().length ? getApps()[0] : initializeApp(cfg);
} catch (e: any) {
  initError = e?.message || String(e);
}

export const firebaseConfigError: string | null = !isFirebaseConfigured
  ? 'Missing Firebase environment variables (VITE_FIREBASE_API_KEY, VITE_FIREBASE_DATABASE_URL, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID, VITE_FIREBASE_AUTH_DOMAIN).'
  : initError;

export const auth = (app ? getAuth(app) : {}) as Auth;
export const db = (app ? getDatabase(app) : {}) as Database;
export const ADMIN_EMAILS = ((import.meta.env.VITE_ADMIN_EMAILS as string) || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
