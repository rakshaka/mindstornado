import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginAlertModal({ open, onClose }) {
  if (!open) return null;

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onClose(); // cerrar modal tras login
    } catch (err) {
      console.error("Error al iniciar sesión", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Necesitás iniciar sesión</h2>
        <p className="text-sm text-gray-600">Para realizar esta acción, primero tenés que iniciar sesión.</p>
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Iniciar sesión con Google
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:underline"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
