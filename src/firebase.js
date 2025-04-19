// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDfXzWslqOTMBHEq983qOk43HKiBGc7H5s",
  authDomain: "or-shift-app.firebaseapp.com",
  projectId: "or-shift-app",
  storageBucket: "or-shift-app.appspot.com", // ← typo修正（.app → .app**spot**.com）
  messagingSenderId: "781791263711",
  appId: "1:781791263711:web:4df8085607558168a1626a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ ローカルならエミュレーターに接続
if (window.location.hostname === "localhost") {
  connectFirestoreEmulator(db, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099");
}

export { db, auth };
