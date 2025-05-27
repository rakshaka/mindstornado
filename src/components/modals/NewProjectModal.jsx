import { useState, useEffect } from "react";

export default function NewProjectModal({ open, onClose, onCreate, defaultValue = "" }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setName(defaultValue);
    }
  }, [defaultValue, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">
          {defaultValue ? "Renombrar proyecto" : "Nuevo proyecto"}
        </h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del proyecto"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => {
              setName("");
              onClose();
            }}
            className="px-3 py-1 rounded text-sm text-gray-600 hover:text-black"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            {defaultValue ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
