import { useState, useRef } from "react";
import { useSelectionStore } from "@/store/selectionStore";

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
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Resize failed"));
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
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
  scale = 1, // 👈 nuevo prop para compensar el zoom
}) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { uploadToCloudinary } = useImageUploader();
  const setSelectedNode = useSelectionStore((state) => state.setSelectedNode);
  const selectedNode = useSelectionStore((state) => state.selectedNode);
  const isSelected = selectedNode?.id === node.id;

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
    if (e.button === 1 || e.target.dataset.handle === "resize") return;

    const initialX = e.clientX;
    const initialY = e.clientY;
    const startX = node.x;
    const startY = node.y;

    setSelectedNode(node);
    onStartDrag?.(node.id);

    const move = (ev) => {
      const deltaX = (ev.clientX - initialX) / scale;
      const deltaY = (ev.clientY - initialY) / scale;
      onDrag(node.id, startX + deltaX, startY + deltaY);
    };

    const up = (ev) => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      const deltaX = (ev.clientX - initialX) / scale;
      const deltaY = (ev.clientY - initialY) / scale;
      onEndDrag?.(node.id, startX + deltaX, startY + deltaY);
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
        const ratio = aspectRatio;
        newHeight = newWidth / ratio;
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
        isSelected ? "ring-2 ring-blue-500" : "ring-0"
      }`}
      data-node-id={node.id}
      style={{
        top: node.y,
        left: node.x,
        width: node.width,
        height: node.height,
        zIndex: node.zIndex || 1,
        backgroundColor: "white",
      }}
      onMouseDown={handleMoveStart}
      onDoubleClick={() => fileInputRef.current.click()}
    >
      {node.imageUrl ? (
        <img
          src={node.imageUrl}
          alt="uploaded"
          className="w-full h-full object-fill rounded-lg pointer-events-none"
        />
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
          className="absolute w-4 h-4 bottom-1 right-1 bg-blue-500 rounded-full cursor-se-resize"
          data-handle="resize"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}
