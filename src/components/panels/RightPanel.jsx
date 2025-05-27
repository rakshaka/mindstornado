import { useSelectionStore } from "../../store/selectionStore";
import { Trash2, MoveUp, MoveDown, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const COLORS = [
  "bg-nodeColors-yellow",
  "bg-nodeColors-pink",
  "bg-nodeColors-green",
  "bg-nodeColors-blue",
  "bg-nodeColors-purple",
];

export default function RightPanel({ updateNodeInCanvas }) {
  const selectedNode = useSelectionStore((state) => state.selectedNode);
  const updateSelectedNode = useSelectionStore((state) => state.updateSelectedNode);
  const setSelectedNode = useSelectionStore((state) => state.setSelectedNode);

  if (!selectedNode) return null;

  const handleContentChange = (e) => {
    const updated = { ...selectedNode, content: e.target.value };
    updateSelectedNode(updated);
    updateNodeInCanvas(updated);
  };

  const handleColorChange = (color) => {
    const updated = { ...selectedNode, color };
    updateSelectedNode(updated);
    updateNodeInCanvas(updated);
  };

  const handleFontSizeChange = (e) => {
    const updated = { ...selectedNode, fontRem: parseFloat(e.target.value) };
    updateSelectedNode(updated);
    updateNodeInCanvas(updated);
  };

  const handleDelete = () => {
    if (window.confirm("¿Eliminar este nodo?")) {
      updateNodeInCanvas({ ...selectedNode, _delete: true });
      setSelectedNode(null);
    }
  };

  const handleBringToFront = () => {
    updateNodeInCanvas({ ...selectedNode, _action: "bringToFront" });
  };

  const handleSendToBack = () => {
    updateNodeInCanvas({ ...selectedNode, _action: "sendToBack" });
  };

  const isImageNode = selectedNode.type === "image";

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 sticky top-0 h-screen overflow-y-auto shadow-lg z-50">
      <h2 className="font-semibold text-lg mb-4">🛠 Inspector</h2>

      {!isImageNode && (
        <>
          {/* Contenido */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
            <textarea
              value={selectedNode.content}
              onChange={handleContentChange}
              className="w-full border rounded p-2 text-sm"
              rows={5}
            />
          </div>

          {/* Color */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-6 h-6 rounded-full border-2 ${color} ${
                    selectedNode.color === color ? "border-black" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Alineación */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Alineación</label>
            <div className="flex gap-2">
              {[
                { align: "left", icon: <AlignLeft className="w-4 h-4" /> },
                { align: "center", icon: <AlignCenter className="w-4 h-4" /> },
                { align: "right", icon: <AlignRight className="w-4 h-4" /> },
              ].map(({ align, icon }) => (
                <button
                  key={align}
                  onClick={() => {
                    const updated = { ...selectedNode, textAlign: align };
                    updateSelectedNode(updated);
                    updateNodeInCanvas(updated);
                  }}
                  className={`p-2 border rounded ${
                    selectedNode.textAlign === align ? "bg-gray-200 border-black" : "border-gray-300"
                  }`}
                  title={`Alinear ${align}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Tamaño de fuente */}
          <div className="mb-4 mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño de fuente</label>
            <input
              type="range"
              min={0.8}
              max={4}
              step={0.2}
              value={selectedNode.fontRem || 1}
              onChange={handleFontSizeChange}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1 text-right">
              {selectedNode.fontRem?.toFixed(1) || "1.0"} rem
            </div>
          </div>
        </>
      )}

      {/* Z-Index Controls */}
      <div className="flex gap-2 mt-6">
        <button
          onClick={handleBringToFront}
          className="flex items-center gap-1 text-sm text-gray-700 hover:text-black"
          title="Traer al frente"
        >
          <MoveUp className="w-4 h-4" />
          Frente
        </button>
        <button
          onClick={handleSendToBack}
          className="flex items-center gap-1 text-sm text-gray-700 hover:text-black"
          title="Enviar atrás"
        >
          <MoveDown className="w-4 h-4" />
          Fondo
        </button>
      </div>

      {/* Eliminar */}
      <div className="mt-6">
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800"
        >
          <Trash2 className="w-4 h-4" />
          {isImageNode && selectedNode.imageUrl ? "Eliminar imagen" : "Eliminar sticky"}
        </button>
      </div>
    </div>
  );
}
