
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "studio-8322695498-589c5",
  "appId": "1:853801330881:web:025112dc4e29e784024c40",
  "storageBucket": "studio-8322695498-589c5.firebasestorage.app",
  "apiKey": "AIzaSyDxRU3vLJzXKFD5PpZ73eYxoI48pFveLNY",
  "authDomain": "studio-8322695498-589c5.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "853801330881"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);

export { app, storage };
