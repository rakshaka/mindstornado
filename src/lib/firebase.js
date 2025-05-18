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

const firebaseConfig = {
  apiKey: "AIzaSyAzzc_HJjfU9k-4HlDUPDWCMtv9TPIyt2k",
  authDomain: "minds-tornado.firebaseapp.com",
  projectId: "minds-tornado",
  storageBucket: "minds-tornado.firebasestorage.app",
  messagingSenderId: "792262882692",
  appId: "1:792262882692:web:bc5f5e3b787b2c624619d1",
  measurementId: "G-LN9L7R0GLL"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

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
  serverTimestamp
};

function login() {
  return signInWithRedirect(auth, provider);
}

function logout() {
  return signOut(auth);
}
