import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { v4 as uuid } from "uuid";
import StickyNote from "@/components/nodes/StickyNote";
import ImageNode from "@/components/nodes/ImageNode";
import EmojiNode from "@/components/nodes/EmojiNode";
import { StickyNote as StickyIcon, Image, Mic, ZoomIn, ZoomOut, Move, LassoSelect, Hand, MessageCircleMore, MousePointer2,Smile } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import RightPanel from "../components/panels/RightPanel";
import { useSelectionStore } from "@/store/selectionStore";
import { useCanvasStore } from "@/store/canvasStore";
import MarqueeSelector from "@/components/MarqueeSelector";
import NodeConnections from "@/components/connections/NodeConnections";

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
  const [isPanMode, setIsPanMode] = useState(false);
  const [marquee, setMarquee] = useState(null);

  const [isMultiSelectEnabled, setIsMultiSelectEnabled] = useState(false);
  const [multiSelectForcedByKey, setMultiSelectForcedByKey] = useState(false);


  const setGlobalNodes = useCanvasStore((state) => state.setNodes);
  const projectId = useProjectStore((state) => state.projectId);
  const selectedNode = useSelectionStore((state) => state.selectedNode);
  const setSelectedNode = useSelectionStore((state) => state.setSelectedNode);

  const user = auth.currentUser;
  const projectRef = projectId ? doc(db, "projects", projectId) : null;

  const zoomToFitAllNodes = () => {
    if (nodes.length === 0 || !canvasRef.current) return;
  
    const padding = 500;
  
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
    const newScale = Math.min(scaleX, scaleY, 1);
  
    const newOffsetX = canvas.width / 2 - ((bounds.minX + bounds.maxX) / 2) * newScale;
    const newOffsetY = canvas.height / 2 - ((bounds.minY + bounds.maxY) / 2) * newScale;
  
    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  useEffect(() => {
    if (!projectId) return;
  
    const ref = doc(db, "projects", projectId);
    getDoc(ref).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const cleanNodes = (data.nodes || []).filter((n) => n && n.id);
        setNodes(cleanNodes);
        setGlobalNodes(cleanNodes);
        setSelectedNode(null);
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }
    });
  }, [projectId]);
  
  // borra nodos con supr
  useEffect(() => {
    const handleKeyDown = (e) => {
      const selected = useSelectionStore.getState().selectedNodes;
  
      // DELETE
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selected.length) {
          if (window.confirm(`¿Eliminar ${selected.length} nodos?`)) {
            pushToHistory();
            const updated = useCanvasStore.getState().nodes.filter(
              (n) => !selected.some((s) => s.id === n.id)
            );
            setNodes(updated);
            updateNodesInDB(updated);
            useSelectionStore.getState().clearSelection();
          }
        }
      }
  
      // UNDO
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
  
      // REDO
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
        e.preventDefault();
        handleRedo();
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "Control" || e.metaKey) {
      setMultiSelectForcedByKey(true);
    }
  };
  const handleKeyUp = (e) => {
    if (e.key === "Control" || e.metaKey) {
      setMultiSelectForcedByKey(false);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  };
}, []);

  
  

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
  
      const worldX = (mouseX - offset.x) / scale;
      const worldY = (mouseY - offset.y) / scale;
  
      const newOffsetX = mouseX - worldX * newScale;
      const newOffsetY = mouseY - worldY * newScale;
  
      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    };
  
    const handleMouseDown = (e) => {
      const isLeftButton = e.button === 0;
      const isMiddleButton = e.button === 1;
  
      // Habilitar pan con botón izquierdo SOLO si el modo pan está activo
      if ((isPanMode && isLeftButton) || (!isPanMode && isMiddleButton)) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY, origin: offset });
      }
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
  
    const handleMouseUp = () => {
      setIsPanning(false);
      setPanStart(null);
    };
  
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
  }, [offset, isPanning, panStart, isPanMode, scale]);
  

  const updateNodesInDB = (updated) => {
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

  const handleAddNode = (type = "text", pos = { x: 300, y: 300 }) => {
    
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

  const handleEndDrag = (id, newX, newY) => {
    pushToHistory();
  
    setNodes((prev) => {
      const nodeDragged = prev.find((n) => n.id === id);
      if (!nodeDragged) return prev;
  
      const dx = newX - nodeDragged.x;
      const dy = newY - nodeDragged.y;
  
      const snapshot = useSelectionStore.getState().selectedNodes;
      const isMulti = snapshot.length > 1 && snapshot.some(n => n.id === id);
      const affectedIds = isMulti ? snapshot.map(n => n.id) : [id];
  
      const updated = prev.map((n) =>
        affectedIds.includes(n.id)
          ? { ...n, x: n.x + dx, y: n.y + dy }
          : n
      );
  
      updateNodesInDB(updated);
      return updated;
    });
  };  
  
  

  const handleDrag = (id, newX, newY) => {
    const snapshot = useSelectionStore.getState().selectedNodes;
  
    setNodes((prevNodes) => {
      const nodeDragged = prevNodes.find((n) => n.id === id);
      if (!nodeDragged) return prevNodes;
  
      const dx = newX - nodeDragged.x;
      const dy = newY - nodeDragged.y;
  
      const isMulti = snapshot.length > 1 && snapshot.some(n => n.id === id);
      const affectedIds = isMulti ? snapshot.map(n => n.id) : [id];
  
      const updated = prevNodes.map((n) =>
        affectedIds.includes(n.id)
          ? { ...n, x: n.x + dx, y: n.y + dy }
          : n
      );
  
      updateNodesInDB(updated);
      return updated;
    });
  };
  
  const handleResize = (id, newSize) => {
    setNodes((prevNodes) => {
      const updated = prevNodes.map((node) =>
        node.id === id ? { ...node, ...newSize } : node
      );
      updateNodesInDB(updated);
      return updated;
    });
  };
  

  const handleUpdateFromRightPanel = (updatedNode) => {
    if (updatedNode._delete) {
      const filtered = nodes.filter((n) => n.id !== updatedNode.id);
      setNodes(filtered); // 👈 Asegura reflejo inmediato
      updateNodesInDB(filtered);
      return;
    }
  
    let updated;
  
    if (updatedNode._action === "bringToFront") {
      const maxZ = Math.max(...nodes.map((n) => n.zIndex || 1));
      updated = nodes.map((n) =>
        n.id === updatedNode.id ? { ...n, zIndex: maxZ + 1 } : n
      );
    } else if (updatedNode._action === "sendToBack") {
      updated = nodes.map((n) =>
        n.id === updatedNode.id ? { ...n, zIndex: 1 } : { ...n, zIndex: (n.zIndex || 1) + 1 }
      );
    } else {
      updated = nodes.map((n) =>
        n.id === updatedNode.id
          ? {
              ...n,
              ...updatedNode,
              x: updatedNode.x ?? n.x,
              y: updatedNode.y ?? n.y,
              width: updatedNode.width ?? n.width,
              height: updatedNode.height ?? n.height,
            }
          : n
      );
    }
  
    setNodes(updated); // 👈 Actualizá localmente también
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

  const toolbarTransform = selectedNode
  ? "translateX(calc(-50% - 120px))"
  : "translateX(-50%)";

return (
  <div className="flex h-screen relative">
    {/* TOOLS ARRIBA */}
    <div
      className="absolute top-4 bg-white rounded-xl shadow-lg p-3 flex gap-4 items-center z-50 transition-all duration-300"
      style={{ left: "50%", transform: toolbarTransform }}
    >
      <div className="flex items-center gap-5">
        <div
          role="button"
          onClick={() => setIsMultiSelectEnabled((prev) => !prev)}
          className={`transition-all p-1 rounded ${isMultiSelectEnabled ? 'bg-blue-200 shadow-md scale-110' : 'hover:bg-gray-100'}`}
          title="Selección múltiple"
        >
          <LassoSelect className="w-6 h-6 text-black" />
        </div>
        <div
          role="button"
          onClick={() => setIsPanMode(prev => !prev)}
          className={`transition-all p-1 rounded ${isPanMode ? 'bg-blue-200 shadow-md scale-110' : 'hover:bg-gray-100'}`}
          title="Mover lienzo"
        >
          <Hand className="w-6 h-6" />
        </div>
        <div role="button" onClick={zoomToFitAllNodes} title="Centrar todo">
          <Move className="w-6 h-6" />
        </div>
        <div role="button" onClick={() => setScale((s) => Math.min(s + 0.1, 3))}>
          <ZoomIn className="w-6 h-6" />
        </div>
        <div role="button" onClick={() => setScale((s) => Math.max(s - 0.1, 0.2))}>
          <ZoomOut className="w-6 h-6" />
        </div>
      </div>
    </div>

    {/* TOOLS ABAJO */}
    <div
      className="absolute bottom-4 bg-white rounded-xl shadow-lg p-3 flex gap-6 items-center z-50 transition-all duration-300"
      style={{ left: "50%", transform: toolbarTransform }}
    >
      <div
        role="button"
        onClick={() => handleAddNode("text")}
        className="hover:scale-110 transition-transform"
        title="Sticky Note"
      >
        <StickyIcon className="w-6 h-6 text-yellow-600" />
      </div>
      <div
        role="button"
        onClick={(e) => {
          const canvasRect = canvasRef.current.getBoundingClientRect();
          const mouseX = e.clientX - canvasRect.left;
          const mouseY = e.clientY - canvasRect.top;
          handleAddNode("image", {
            x: (mouseX - offset.x) / scale,
            y: (mouseY - offset.y) / scale,
          });
        }}
        className="hover:scale-110 transition-transform"
        title="Imagen"
      >
        <Image className="w-6 h-6 text-blue-500" />
      </div>
      <div
        role="button"
        onClick={() => handleAddNode("emoji")}
        className="hover:scale-110 transition-transform"
        title="Emoji"
      >
        <Smile className="w-6 h-6 text-pink-500" />
      </div>
      <div
        role="button"
        onClick={() => alert("Audio próximamente")}
        className="hover:scale-110 transition-transform"
        title="Audio"
      >
        <Mic className="w-6 h-6 text-purple-500" />
      </div>
    </div>

    {/* CANVAS */}
    <div
      className={`flex-1 relative overflow-auto ${isPanMode ? 'cursor-grab' : 'cursor-default'} bg-gray-100`}
      ref={canvasRef}
      onMouseDown={(e) => {
        if (isPanMode) return;
        const isNode = e.target.closest("[data-node-id]");
        if (!isNode) {
          useSelectionStore.getState().clearSelection();
        }
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
        <NodeConnections
          connections={[{ from: '1', to: '2' }]}
          offset={offset}
          scale={scale}
        />
        {isMultiSelectEnabled && (
          <MarqueeSelector
            canvasRef={canvasRef}
            nodes={nodes}
            offset={offset}
            scale={scale}
          />
        )}

        {nodes.map((node) => {
          if (node.type === "image") {
            return (
              <ImageNode
                key={node.id}
                node={node}
                scale={scale}
                isPanMode={isPanMode}
                onUpdate={(updatedNode) => {
                  const updated = nodes.map((n) =>
                    n.id === node.id ? { ...n, ...updatedNode } : n
                  );
                  setNodes(updated);
                  updateNodesInDB(updated);
                }}
                onDrag={handleDrag}
                onResize={handleResize}
                onStartDrag={() => {}}
                onEndDrag={handleEndDrag}
                isMultiSelectEnabled={isMultiSelectEnabled}
              />
            );
          }
          if (node.type === "emoji") {
            return (
              <EmojiNode
                key={node.id}
                node={node}
                onUpdate={handleUpdateFromRightPanel}
                onDrag={handleDrag}
                onResize={handleResize}
                scale={scale}
                isPanMode={isPanMode}
                isMultiSelectEnabled={isMultiSelectEnabled || multiSelectForcedByKey}
              />
            );
          }
          return (
            <StickyNote
              key={`${node.id}-${node.width}x${node.height}`}
              node={node}
              isPanMode={isPanMode}
              onDrag={handleDrag}
              onResize={handleResize}
              scale={scale}
              isMultiSelectEnabled={isMultiSelectEnabled || multiSelectForcedByKey}
            />
          );
        })}
      </div>
    </div>

    {selectedNode && (
      <RightPanel
      updateNodeInCanvas={handleUpdateFromRightPanel}
      deleteMultipleNodes={(ids) => {
        pushToHistory();
        const updated = nodes.filter((n) => !ids.includes(n.id));
        setNodes(updated);
        updateNodesInDB(updated);
        useSelectionStore.getState().clearSelection();
        }}
      />
    )}
  </div>
);
}