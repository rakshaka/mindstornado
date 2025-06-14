export default function UnsavedChangesModal({ open, onCancel, onDiscard, onSave }) {
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 shadow-md w-96">
          <h2 className="text-lg font-semibold mb-4">¿Guardar antes de limpiar?</h2>
          <p className="text-sm text-gray-700 mb-6">
            Estás por salir sin guardar tu trabajo actual. ¿Qué querés hacer?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onSave}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
            >
              Guardar y limpiar
            </button>
            <button
              onClick={onDiscard}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 text-sm"
            >
              Limpiar sin guardar
            </button>
            <button
              onClick={onCancel}
              className="text-gray-500 px-3 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }