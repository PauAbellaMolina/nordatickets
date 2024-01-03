import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_KEY,
  AUTH_DOMAIN,
  PROJECT_ID,
  STORAGE_BUCKET,
  MESSAGING_SENDER_ID,
  APP_ID,
  MEASUREMENT_ID
} from '@env';

export const FIREBASE_CONFIG = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID
};

export const FIREBASE_APP = initializeApp(FIREBASE_CONFIG);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_CF = getFunctions(FIREBASE_APP, 'europe-west1');
// connectFunctionsEmulator(FIREBASE_CF, "127.0.0.1", 5001); //PAU INFO JUST FOR DEVING

let persistence;
if (Platform.OS === 'web') {
  persistence = browserLocalPersistence;
} else {
  persistence = getReactNativePersistence(ReactNativeAsyncStorage);
}

export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence: persistence
});
