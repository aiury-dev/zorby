import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { Storage } from "firebase-admin/storage";

const firebaseAdminAppModule = require("firebase-admin/app");
const firebaseAdminAuthModule = require("firebase-admin/auth");
const firebaseAdminFirestoreModule = require("firebase-admin/firestore");
const firebaseAdminStorageModule = require("firebase-admin/storage");

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n");
}

function getFirebaseAdminConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    credential: firebaseAdminAppModule.cert({
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    }),
    projectId,
    storageBucket,
  };
}

let firebaseAdminApp: App | null = null;

export function getFirebaseAdminApp(): App {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const config = getFirebaseAdminConfig();
  if (!config) {
    throw new Error(
      "Firebase Admin nao configurado. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.",
    );
  }

  firebaseAdminApp =
    firebaseAdminAppModule.getApps()[0] ?? firebaseAdminAppModule.initializeApp(config);

  return firebaseAdminApp as App;
}

export function getFirebaseAdminAuth(): Auth {
  return firebaseAdminAuthModule.getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb(): Firestore {
  return firebaseAdminFirestoreModule.getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage(): Storage {
  return firebaseAdminStorageModule.getStorage(getFirebaseAdminApp());
}
