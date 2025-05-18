import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { v4 as uuid } from "uuid";
import StickyNote from "@/componentrs/nodes/StickyNote";
import { StickyNote as StickyIcon, Image, Mic } from "lucide-react";
import StickyToolbar from "@/componentrs/toolbars/StickyToolbar";

const COLORS = [
  "bg-nodeColors-yellow",
  "bg-nodeColors-pink",
  "bg-nodeColors-green",
  "bg-nodeColors-blue",
  "bg-nodeColors-purple",
];

export default function Canvas() {
  const [nodes, setNodes] = useState([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const canvasRef = useRef(null);
  const toolbarRef = useRef(null);

  const user = auth.currentUser;
  const projectRef = user && doc(db, "projects", user.uid);

  useEffect(() => {
    if (!projectRef) return;
    getDoc(projectRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNodes(data.nodes || []);
      }
    });
  }, [projectRef]);

  const updateNodesInDB = (updated) => {
    setNodes(updated);
    updateDoc(projectRef, { nodes: updated });
  };

  const pushToHistory = () => {
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(nodes))]);
    setFuture([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture((f) => [nodes, ...f]);
    setNodes(previous);
    updateDoc(projectRef, { nodes: previous });
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, nodes]);
    setNodes(next);
    updateDoc(projectRef, { nodes: next });
    setFuture((f) => f.slice(1));
  };

  const handleBeforeEdit = () => {
    pushToHistory();
  };

  const handleAddNode = (type = "text") => {
    if (!user) return;
    pushToHistory();

    const newNode = {
      id: uuid(),
      type,
      content: "",
      color: selectedColor,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 200,
      height: 100,
    };

    const updated = [...nodes, newNode];
    updateNodesInDB(updated);
    setEditingNodeId(newNode.id);
  };

  const handleDrag = (id, newX, newY) => {
    pushToHistory();
    const updated = nodes.map((node) =>
      node.id === id ? { ...node, x: newX, y: newY } : node
    );
    updateNodesInDB(updated);
  };

  const handleResize = (id, newSize) => {
    pushToHistory();
    const updated = nodes.map((node) =>
      node.id === id ? { ...node, ...newSize } : node
    );
    updateNodesInDB(updated);
  };

  const handleEdit = (id, newContent) => {
    const updated = nodes.map((node) =>
      node.id === id ? { ...node, content: newContent } : node
    );
    updateNodesInDB(updated);
  };

  const handleColorChange = (id, newColor) => {
    pushToHistory();
    const updated = nodes.map((node) =>
      node.id === id ? { ...node, color: newColor } : node
    );
    updateNodesInDB(updated);
  };

  const handleClearAll = () => {
    pushToHistory();
    setNodes([]);
    updateDoc(projectRef, { nodes: [] });
  };

  const editingNode = nodes.find((n) => n.id === editingNodeId);

  return (
    <div className="fixed inset-0 overflow-auto bg-gray-100" ref={canvasRef}>
      {nodes.map((node) => (
        <StickyNote
          key={node.id}
          node={node}
          onDrag={handleDrag}
          onResize={handleResize}
          onEdit={handleEdit}
          isEditing={editingNodeId === node.id}
          onEnterEdit={setEditingNodeId}
          toolbarRef={toolbarRef}
          onBeforeEdit={handleBeforeEdit}
        />
      ))}

      {editingNode?.type === "text" && (
        <StickyToolbar
          ref={toolbarRef}
          node={editingNode}
          onChangeColor={handleColorChange}
          onDelete={() => {
            pushToHistory();
            const updated = nodes.filter((n) => n.id !== editingNode.id);
            updateNodesInDB(updated);
            setEditingNodeId(null);
          }}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg p-3 flex gap-4 items-center z-40">
        <button
          onClick={() => handleAddNode("text")}
          className="hover:scale-110 transition-transform"
          title="Sticky Note"
        >
          <StickyIcon className="w-6 h-6 text-yellow-600" />
        </button>
        <button
          onClick={() => alert("Imagen próximamente")}
          className="hover:scale-110 transition-transform"
          title="Imagen"
        >
          <Image className="w-6 h-6 text-blue-500" />
        </button>
        <button
          onClick={() => alert("Audio próximamente")}
          className="hover:scale-110 transition-transform"
          title="Audio"
        >
          <Mic className="w-6 h-6 text-purple-500" />
        </button>
        <button
          onClick={handleClearAll}
          className="text-red-500 hover:text-red-700 text-sm"
          title="Borrar todo"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
