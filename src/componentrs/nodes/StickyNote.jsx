import { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { Pencil } from "lucide-react";

export default function StickyNote({
  node,
  onDrag,
  onResize,
  onEdit,
  onEnterEdit,
  isEditing,
  toolbarRef,
  onBeforeEdit,
}) {
  const [value, setValue] = useState(node.content);
  const [size, setSize] = useState({ width: node.width, height: node.height });
  const stickyRef = useRef(null);
  const sizeRef = useRef(null);

  useEffect(() => {
    if (!sizeRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    observer.observe(sizeRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isEditing &&
        stickyRef.current &&
        !stickyRef.current.contains(e.target) &&
        (!toolbarRef?.current || !toolbarRef.current.contains(e.target))
      ) {
        if (value !== node.content) {
          onBeforeEdit?.(); // <<== guarda el estado antes del cambio
          onEdit(node.id, value);
        }
        onEnterEdit(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, onEnterEdit, onEdit, node.id, value, node.content, toolbarRef]);

  const handleEditClick = (e) => {
    e.stopPropagation();
    onBeforeEdit?.(); // <<== GUARDA ANTES DE EDITAR
    onEnterEdit(node.id);
  };

  const base = Math.min(size.width, size.height);
  const rawFontSize = Math.pow(base / 100, 1.5);
  const clampedFontSize = Math.min(rawFontSize, 2.2);
  const fontSize = `${clampedFontSize}rem`;

  return (
    <Rnd
      default={{
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
      }}
      minWidth={220}
      minHeight={150}
      onDragStop={(e, d) => onDrag(node.id, d.x, d.y)}
      onResizeStop={(e, direction, ref, delta, position) => {
        const newWidth = parseInt(ref.style.width);
        const newHeight = parseInt(ref.style.height);
        onResize(node.id, { width: newWidth, height: newHeight });
        onDrag(node.id, position.x, position.y);
      }}
      enableResizing
      bounds="parent"
      className={`select-none rounded-xl shadow text-gray-800 p-3 transition-colors duration-200 ${node.color}`}
    >
      <div className="relative w-full h-full z-10" ref={stickyRef}>
        <div ref={sizeRef} className="w-full h-full">
          {isEditing ? (
            <textarea
              className="w-full h-full bg-transparent resize-none outline-none font-comic z-0 overflow-auto"
              style={{ fontSize }}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          ) : (
            <div
              className="w-full h-full font-comic whitespace-pre-wrap break-words pointer-events-none overflow-hidden"
              style={{ fontSize }}
            >
              {node.content}
            </div>
          )}
        </div>

        <div className="absolute bottom-1 right-1 z-10">
          <button
            onClick={handleEditClick}
            data-ignore
            className="bg-white bg-opacity-70 p-1 rounded hover:bg-opacity-90"
            title="Editar"
          >
            <Pencil className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
    </Rnd>
  );
}
