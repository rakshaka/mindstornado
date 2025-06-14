import { useState, useRef } from "react";
import { useSelectionStore } from "@/store/selectionStore";
import { useCanvasStore } from "@/store/canvasStore";

const useImageUploader = () => {
  const cloudName = "dumcglbwo";
  const uploadPreset = "minds_unsigned";

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!data.secure_url) throw new Error("Upload failed");
    return data.secure_url;
  };

  return { uploadToCloudinary };
};

//ANALIZA IMAGEN
const analyzeImage = async (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let hasAlpha = false;
      let avgBrightness = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
        if (a < 255) hasAlpha = true;
        avgBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
        count++;
      }

      avgBrightness = avgBrightness / count;
      resolve({ hasAlpha, avgBrightness });
    };

    img.onerror = () => resolve({ hasAlpha: false, avgBrightness: 255 });
  });
};


const resizeImageFile = (file, maxSize = 1280, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => (img.src = e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      const scale = Math.min(maxSize / width, maxSize / height, 1);
      width *= scale;
      height *= scale;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height); // importante para transparencia
      ctx.drawImage(img, 0, 0, width, height);

      const isPng = file.type === "image/png";

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Resize failed"));
          const newFile = new File([blob], file.name, {
            type: isPng ? "image/png" : "image/jpeg",
          });
          resolve(newFile);
        },
        isPng ? "image/png" : "image/jpeg",
        quality
      );
    };

    img.onerror = reject;
  });
};


export default function ImageNode({
  node,
  onUpdate,
  onDrag,
  onResize,
  onStartDrag,
  onEndDrag,
  scale = 1,
  isMultiSelectEnabled = false,
  isPanMode = false,
}) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { uploadToCloudinary } = useImageUploader();

  const {
    selectedNode,
    selectedNodes,
    setSelectedNode,
    addToSelection,
    removeFromSelection,
  } = useSelectionStore();

  const isSelected = isMultiSelectEnabled
    ? selectedNodes.some((n) => n?.id === node.id)
    : selectedNode?.id === node.id;

    const handleImageChange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Solo se permiten imágenes.");
        return;
      }
    
      setLoading(true);
      try {
        const resizedFile = await resizeImageFile(file);
        const imageUrl = await uploadToCloudinary(resizedFile);
    
        const { hasAlpha, avgBrightness } = await analyzeImage(imageUrl);
        const isDark = avgBrightness < 100;
    
        const tempImg = new Image();
        tempImg.onload = () => {
          const ratio = tempImg.width / tempImg.height;
          const maxWidth = 300;
          const width = Math.min(tempImg.width, maxWidth);
          const height = width / ratio;
    
          onUpdate({
            ...node,
            imageUrl,
            width,
            height,
            forceWhiteBackground: hasAlpha && isDark,
          });
        };
        tempImg.src = imageUrl;
      } catch (err) {
        console.error("Cloudinary error:", err);
        alert("Error al subir imagen");
      } finally {
        setLoading(false);
      }
    };

  const handleMoveStart = (e) => {
    if (e.button === 1 || e.target.dataset.handle === "resize" || isPanMode) return;
  
    e.stopPropagation();
    e.preventDefault();
  
    const initialX = e.clientX;
    const initialY = e.clientY;
    let moved = false;
  
    if (isMultiSelectEnabled) {
      const alreadySelected = useSelectionStore.getState().selectedNodes.some(n => n.id === node.id);
      if (!alreadySelected) {
        addToSelection(node);
      }
    } else {
      useSelectionStore.getState().clearSelection(); // 🔥 forzamos limpieza
      setSelectedNode(node);
    }
  
    const allNodes = useCanvasStore.getState().nodes;
    const currentSelection = isMultiSelectEnabled
      ? useSelectionStore.getState().selectedNodes
      : [node];
  
    const selection = currentSelection.map(sel => allNodes.find(n => n.id === sel.id) || sel);
  
    const initialPositions = selection.map(n => ({
      id: n.id,
      x: n.x,
      y: n.y,
    }));
  
    const offsetMap = new Map(
      initialPositions.map(pos => [
        pos.id,
        {
          offsetX: initialX - pos.x * scale,
          offsetY: initialY - pos.y * scale,
        },
      ])
    );
  
    const move = (ev) => {
      moved = true;
  
      initialPositions.forEach((pos) => {
        const { offsetX, offsetY } = offsetMap.get(pos.id);
        const deltaX = (ev.clientX - offsetX) / scale - pos.x;
        const deltaY = (ev.clientY - offsetY) / scale - pos.y;
  
        onDrag(pos.id, pos.x + deltaX, pos.y + deltaY);
      });
    };
  
    const up = (ev) => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
  
      if (moved) {
        initialPositions.forEach((pos) => {
          const { offsetX, offsetY } = offsetMap.get(pos.id);
          const deltaX = (ev.clientX - offsetX) / scale - pos.x;
          const deltaY = (ev.clientY - offsetY) / scale - pos.y;
  
          onEndDrag?.(pos.id, pos.x + deltaX, pos.y + deltaY);
        });
      }
    };
  
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  
  
  const handleResizeStart = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = node.width;
    const startHeight = node.height;
    const aspectRatio = startWidth / startHeight;

    const move = (ev) => {
      let deltaX = (ev.clientX - startX) / scale;
      let deltaY = (ev.clientY - startY) / scale;

      let newWidth = startWidth + deltaX;
      let newHeight = startHeight + deltaY;

      if (!ev.shiftKey) {
        newHeight = newWidth / aspectRatio;
      }

      if (newWidth > 50 && newHeight > 50) {
        onResize(node.id, { width: newWidth, height: newHeight });
      }
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div
      className={`absolute rounded-xl shadow-md group select-none ${
        isSelected ? "ring-4 ring-blue-400" : "ring-0"
      }`}
      data-node-id={node.id}
      style={{
        top: node.y,
        left: node.x,
        width: node.width,
        height: node.height,
        zIndex: node.zIndex || 1,
        backgroundColor: "transparent",
      }}
      onMouseDown={handleMoveStart}
      onClick={(e) => {
        e.stopPropagation();
        if (!isMultiSelectEnabled) {
          setSelectedNode(node);
        }
      }}
      onDoubleClick={() => fileInputRef.current.click()}
    >
      {node.imageUrl ? (
        <div
          className="w-full h-full rounded-xl overflow-hidden"
          style={{
            backgroundColor: node.forceWhiteBackground ? "white" : "transparent",
          }}
        >
          <img
            src={node.imageUrl}
            alt="uploaded"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 border border-dashed rounded-lg">
          {loading ? "Subiendo..." : "Haz doble click para subir una imagen"}
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageChange}
      />
      {isSelected && (
        <div
          className="absolute w-3 h-3 bottom-1 right-1 bg-blue-400 rounded-full cursor-se-resize"
          data-handle="resize"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}