import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- agregado

const firebaseConfig = {
  apiKey: "AIzaSyAzzc_HJjfU9k-4HlDUPDWCMtv9TPIyt2k",
  authDomain: "minds-tornado.firebaseapp.com",
  projectId: "minds-tornado",
  storageBucket: "minds-tornado.appspot.com", // <-- corregido
  messagingSenderId: "792262882692",
  appId: "1:792262882692:web:bc5f5e3b787b2c624619d1",
  measurementId: "G-LN9L7R0GLL"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app); // <-- inicializado

export {
  auth,
  provider,
  db,
  login,
  logout,
  getRedirectResult,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  storage // <-- exportado correctamente
};

function login() {
  return signInWithRedirect(auth, provider);
}

function logout() {
  return signOut(auth);
}
