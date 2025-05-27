import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { v4 as uuid } from "uuid";
import StickyNote from "@/components/nodes/StickyNote";
import ImageNode from "@/components/nodes/ImageNode";
import { StickyNote as StickyIcon, Image, Mic, ZoomIn, ZoomOut, Move } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import RightPanel from "../components/panels/RightPanel";
import { useSelectionStore } from "@/store/selectionStore";
import { useCanvasStore } from "@/store/canvasStore";

const COLORS = [
  "bg-nodeColors-yellow",
  "bg-nodeColors-pink",
  "bg-nodeColors-green",
  "bg-nodeColors-blue",
  "bg-nodeColors-purple",
];

export default function CanvasContent() {
  const [nodes, setNodes] = useState([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const canvasRef = useRef(null);
  const innerCanvasRef = useRef(null);
  const trashRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);

  const setGlobalNodes = useCanvasStore((state) => state.setNodes);
  const projectId = useProjectStore((state) => state.projectId);
  const selectedNode = useSelectionStore((state) => state.selectedNode);
  const setSelectedNode = useSelectionStore((state) => state.setSelectedNode);

  const user = auth.currentUser;
  const projectRef = projectId ? doc(db, "projects", projectId) : null;

  const zoomToFitAllNodes = () => {
    if (nodes.length === 0 || !canvasRef.current) return;
  
    const padding = 100;
  
    const bounds = nodes.reduce(
      (acc, node) => {
        acc.minX = Math.min(acc.minX, node.x);
        acc.minY = Math.min(acc.minY, node.y);
        acc.maxX = Math.max(acc.maxX, node.x + node.width);
        acc.maxY = Math.max(acc.maxY, node.y + node.height);
        return acc;
      },
      {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      }
    );
  
    const contentWidth = bounds.maxX - bounds.minX + padding * 2;
    const contentHeight = bounds.maxY - bounds.minY + padding * 2;
  
    const canvas = canvasRef.current.getBoundingClientRect();
    const scaleX = canvas.width / contentWidth;
    const scaleY = canvas.height / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // máx zoom = 1
  
    const newOffsetX = canvas.width / 2 - ((bounds.minX + bounds.maxX) / 2) * newScale;
    const newOffsetY = canvas.height / 2 - ((bounds.minY + bounds.maxY) / 2) * newScale;
  
    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };
  

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
    setGlobalNodes(updated);
    if (projectRef) {
      updateDoc(projectRef, { nodes: updated }).catch((err) => {
        console.error("Error al guardar en Firestore:", err);
      });
    }
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

  const handleAddNode = (type = "text") => {
    if (!user) return;
    pushToHistory();

    const maxZ = Math.max(0, ...nodes.map((n) => n.zIndex || 0));
    const newNode = {
      id: uuid(),
      type,
      content: "",
      imageUrl: "",
      color: selectedColor,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 200,
      height: 100,
      zIndex: maxZ + 1,
      fontRem: 1,
      textAlign: "left",
    };

    const updated = [...nodes, newNode];
    setNodes(updated);
    updateDoc(projectRef, { nodes: updated });
    setSelectedNode(newNode);

    if (type === "image") {
      setTimeout(() => {
        const input = document.querySelector(`[data-node-id="${newNode.id}"] input[type="file"]`);
        input?.click();
      }, 100);
    }
  };

  const handleDrag = (id, newX, newY) => {
    const updated = nodes.map((node) =>
      node.id === id ? { ...node, x: newX, y: newY } : node
    );
    updateNodesInDB(updated);
  };

  const handleResize = (id, newSize) => {
    const updated = nodes.map((node) =>
      node.id === id ? { ...node, ...newSize } : node
    );
    updateNodesInDB(updated);
  };

  const handleUpdateFromRightPanel = (updatedNode) => {
    if (updatedNode._delete) {
      const filtered = nodes.filter((n) => n.id !== updatedNode.id);
      updateNodesInDB(filtered);
      return;
    }

    if (updatedNode._action === "bringToFront") {
      const maxZ = Math.max(...nodes.map((n) => n.zIndex || 1));
      const updated = nodes.map((n) =>
        n.id === updatedNode.id ? { ...n, zIndex: maxZ + 1 } : n
      );
      updateNodesInDB(updated);
      return;
    }

    if (updatedNode._action === "sendToBack") {
      const updated = nodes.map((n) =>
        n.id === updatedNode.id ? { ...n, zIndex: 1 } : { ...n, zIndex: (n.zIndex || 1) + 1 }
      );
      updateNodesInDB(updated);
      return;
    }

    const updated = nodes.map((n) =>
      n.id === updatedNode.id ? { ...n, ...updatedNode } : n
    );

    updateNodesInDB(updated);
  };

  // WHEEL ZOOM + PAN CONTROL
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handleWheel = (e) => {
        e.preventDefault();
      
        const canvas = canvasRef.current;
        if (!canvas) return;
      
        const { left, top } = canvas.getBoundingClientRect();
        const mouseX = e.clientX - left;
        const mouseY = e.clientY - top;
      
        const delta = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.min(Math.max(scale * delta, 0.1), 4);
      
        // Coordenadas del cursor relativas al canvas (ajustadas al scale y offset actuales)
        const worldX = (mouseX - offset.x) / scale;
        const worldY = (mouseY - offset.y) / scale;
      
        // Nuevo offset para mantener el punto bajo el cursor fijo
        const newOffsetX = mouseX - worldX * newScale;
        const newOffsetY = mouseY - worldY * newScale;
      
        setScale(newScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
      };
      

    const handleMouseDown = (e) => {
      if (e.button !== 1) return;
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, origin: offset });
    };

    const handleMouseMove = (e) => {
      if (!isPanning || !panStart) return;
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setOffset({
        x: panStart.origin.x + dx,
        y: panStart.origin.y + dy,
      });
    };

    const handleMouseUp = () => setIsPanning(false);

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [offset, isPanning, panStart]);

  return (
    <div className="flex h-screen">
      <div
        className="flex-1 relative overflow-auto bg-gray-100"
        ref={canvasRef}
        onClick={(e) => {
          const isNode = e.target.closest("[data-node-id]");
          if (!isNode) setSelectedNode(null);
        }}
      >
        <div
          ref={innerCanvasRef}
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "top left",
            transition: "transform 0.05s ease-out",
          }}
        >
          {nodes.map((node) => {
            if (node.type === "image") {
              return (
                <ImageNode
                  key={node.id}
                  node={node}
                  scale={scale}
                  onUpdate={(updatedNode) => {
                    const updated = nodes.map((n) =>
                      n.id === node.id ? { ...n, ...updatedNode } : n
                    );
                    updateNodesInDB(updated);
                  }}
                  onDrag={handleDrag}
                  onResize={handleResize}
                  onStartDrag={() => {}}
                  onEndDrag={(_, x, y) => handleDrag(node.id, x, y)}
                  onClick={() => setSelectedNode(node)}
                />
              );
            }
            return (
                <StickyNote
                key={`${node.id}-${node.width}x${node.height}`}
                node={node}
                onDrag={handleDrag}
                onResize={handleResize}
                onClick={() => setSelectedNode(node)}
                scale={scale}
              />
            );
          })}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg p-3 flex gap-4 items-center z-40">
          <button
            onClick={() => handleAddNode("text")}
            className="hover:scale-110 transition-transform"
            title="Sticky Note"
          >
            <StickyIcon className="w-6 h-6 text-yellow-600" />
          </button>
          <button
            onClick={() => handleAddNode("image")}
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
          <div className="flex items-center gap-2 ml-4">
            <button onClick={() => setScale((s) => Math.min(s + 0.1, 3))}>
              <ZoomIn className="w-5 h-5" />
            </button>
            <button onClick={() => setScale((s) => Math.max(s - 0.1, 0.2))}>
              <ZoomOut className="w-5 h-5" />
            </button>
            <button onClick={zoomToFitAllNodes} title="Centrar todo">
            <Move className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {selectedNode && (
        <RightPanel updateNodeInCanvas={handleUpdateFromRightPanel} />
      )}
    </div>
  );
}
