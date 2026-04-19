const firebaseAppModule = require("firebase/app");
const firebaseAuthModule = require("firebase/auth");
const firebaseFirestoreModule = require("firebase/firestore");
const firebaseStorageModule = require("firebase/storage");

function getFirebaseClientConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

export function getFirebaseClientApp() {
  const config = getFirebaseClientConfig();
  if (!config) {
    throw new Error(
      "Firebase Client nao configurado. Defina as variaveis NEXT_PUBLIC_FIREBASE_*.",
    );
  }

  return firebaseAppModule.getApps().length > 0
    ? firebaseAppModule.getApp()
    : firebaseAppModule.initializeApp(config);
}

export function getFirebaseClientAuth() {
  return firebaseAuthModule.getAuth(getFirebaseClientApp());
}

export function getFirebaseClientDb() {
  return firebaseFirestoreModule.getFirestore(getFirebaseClientApp());
}

export function getFirebaseClientStorage() {
  return firebaseStorageModule.getStorage(getFirebaseClientApp());
}
