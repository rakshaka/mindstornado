import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import "@fontsource/comic-neue";
import "./index.css"; // o donde esté tu Tailwind
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import Canvas from "./pages/Canvas";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) navigate("/canvas");
    });
    return () => unsub();
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          createdAt: serverTimestamp(),
          plan: "free"
        });
      }

      setUser(user);
      navigate("/canvas");
    } catch (error) {
      console.error("Login cancelado o fallido:", error.code);
    }
  };

  const logout = () => {
    signOut(auth);
    setUser(null);
    navigate("/");
  };

  if (loading) return null;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen flex items-center justify-center bg-white text-gray-800">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">🌀 Minds Tornado</h1>
              <button
                onClick={login}
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
              >
                Iniciar sesión con Google
              </button>
            </div>
          </div>
        }
      />
      <Route path="/canvas" element={<Canvas />} />
    </Routes>
  );
}
