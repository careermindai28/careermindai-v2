import admin from 'firebase-admin';

/**
 * IMPORTANT:
 * - Do NOT initialize Admin at import-time.
 * - Build step imports route files; if env vars aren't present, build will crash.
 * - So we initialize lazily only when called.
 */

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing Firebase Admin env vars. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY. Missing: ${name}`
    );
  }
  return v;
}

function getAdminApp() {
  if (admin.apps.length > 0) return admin.app();

  const projectId = mustGetEnv('FIREBASE_PROJECT_ID');
  const clientEmail = mustGetEnv('FIREBASE_CLIENT_EMAIL');
  let privateKey = mustGetEnv('FIREBASE_PRIVATE_KEY');

  // Fix escaped newlines (very common on Vercel / env files)
  privateKey = privateKey.replace(/\\n/g, '\n');

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
  });
}

/** ✅ What your routes are importing */
export function getAdminDb() {
  return admin.firestore(getAdminApp());
}

export function getAdminAuth() {
  return admin.auth(getAdminApp());
}

/** ✅ Some of your routes/pages also import these */
export function getFirestore() {
  return admin.firestore(getAdminApp());
}

export function getStorageBucket() {
  return admin.storage(getAdminApp()).bucket();
}
