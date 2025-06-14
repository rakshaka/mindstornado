import { useSelectionStore } from "../../store/selectionStore";
import { Trash2, MoveUp, MoveDown, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const COLORS = [
  "bg-nodeColors-yellow",
  "bg-nodeColors-pink",
  "bg-nodeColors-green",
  "bg-nodeColors-blue",
  "bg-nodeColors-purple",
];

export default function RightPanel({ updateNodeInCanvas, deleteMultipleNodes }) {
  const selectedNode = useSelectionStore((state) => state.selectedNode);
  const selectedNodes = useSelectionStore((state) => state.selectedNodes);
  const updateSelectedNode = useSelectionStore((state) => state.updateSelectedNode);
  const setSelectedNode = useSelectionStore((state) => state.setSelectedNode);

  const multipleSelected = selectedNodes.length > 1;

  if (!selectedNode && !multipleSelected) return null;

  const handleDeleteMultiple = () => {
    if (!selectedNodes.length) return;
    if (window.confirm(`¿Eliminar ${selectedNodes.length} nodos?`)) {
      const ids = selectedNodes.map((n) => n.id);
      deleteMultipleNodes(ids);
      setSelectedNode(null);
    }
  };
  

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
    const fontRem = parseFloat(e.target.value);
    const updated = {
      ...selectedNode,
      fontRem,
      x: selectedNode.x,        // preservamos posición actual
      y: selectedNode.y,
      width: selectedNode.width,
      height: selectedNode.height,
    };
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

  const isImageNode = selectedNode?.type === "image";
  const isEmojiNode = selectedNode?.type === "emoji";

  return (
    <div className="w-60 bg-white border-l border-gray-200 p-4 sticky top-0 h-screen overflow-y-auto shadow-lg z-50">
      <h2 className="font-semibold text-xs mb-4">🛠 Inspector</h2>

      {multipleSelected ? (
        <div>
          <p className="text-xs text-gray-600 mb-2">
            <strong>{selectedNodes.length}</strong> nodos seleccionados:
          </p>
          <ul className="text-xs text-gray-700 list-disc pl-4 space-y-1">
            {selectedNodes.map((n) => (
              <li key={n.id}>
                {n.type} •{" "}
                <span className="inline-block w-3 h-3 align-middle rounded-full mr-1" style={{ backgroundColor: "transparent" }} />
                <span className="font-mono text-[10px] text-gray-400">#{n.id.slice(0, 6)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <button
              onClick={handleDeleteMultiple}
              className="flex items-center gap-2 text-xs text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar {selectedNodes.length} nodos
            </button>
          </div>
        </div>
      ) : (
        <>
          {!(isImageNode || isEmojiNode) && (
            <>
              {/* Contenido */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Contenido</label>
                <textarea
                  value={selectedNode.content}
                  onChange={handleContentChange}
                  className="w-full border rounded p-2 text-xs"
                  rows={5}
                />
              </div>

              {/* Color */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <div
                      key={color}
                      role="button"
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
                <label className="block text-xs font-medium text-gray-700 mb-1 ">Alineación</label>
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Tamaño de fuente</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.1}
                  value={selectedNode.fontRem || 1}
                  onChange={handleFontSizeChange}
                  className="w-full"
                />
                <div className="text-xs text-gray-600 mt-1 text-left">
                  {selectedNode.fontRem?.toFixed(1) || "1.0"}
                </div>
              </div>
            </>
          )}
          {isEmojiNode && (
              <div className="mb-4 mt-6">
                <label className="block text-xs font-medium text-gray-700 mb-1">Tamaño del emoji</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.1}
                  value={selectedNode.fontRem || 4}
                  onChange={(e) => {
                    const updated = { ...selectedNode, fontRem: parseFloat(e.target.value) };
                    updateSelectedNode(updated);
                    updateNodeInCanvas(updated);
                  }}
                  className="w-full"
                />
                <div className="text-xs text-gray-600 mt-1 text-left">
                  {selectedNode.fontRem?.toFixed(1) || "4.0"}
                </div>
              </div>
            )}

          {/* Z-Index Controls */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleBringToFront}
              className="flex items-center gap-1 text-xs text-gray-700 hover:text-black"
              title="Traer al frente"
            >
              <MoveUp className="w-4 h-4" />
              Traer al Frente
            </button>
            <button
              onClick={handleSendToBack}
              className="flex items-center gap-1 text-xs text-gray-700 hover:text-black"
              title="Enviar atrás"
            >
              <MoveDown className="w-4 h-4" />
              Enviar atrás
            </button>
          </div>

          {/* Eliminar */}
          <div className="mt-6">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 text-xs text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
              {isEmojiNode
                ? "Eliminar emoji"
                : isImageNode && selectedNode.imageUrl
                ? "Eliminar imagen"
                : "Eliminar sticky"
              }
            </button>
          </div>
        </>
      )}
    </div>
  );
}
