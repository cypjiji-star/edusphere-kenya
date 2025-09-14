
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "studio-8322695498-589c5",
  "appId": "1:853801330881:web:025112dc4e29e784024c40",
  "storageBucket": "studio-8322695498-589c5.appspot.com",
  "apiKey": "AIzaSyDxRU3vLJzXKFD5PpZ73eYxoI48pFveLNY",
  "authDomain": "studio-8322695498-589c5.firebaseapp.com",
  "messagingSenderId": "853801330881"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);
const firestore = getFirestore(app);

export { app, storage, firestore };
