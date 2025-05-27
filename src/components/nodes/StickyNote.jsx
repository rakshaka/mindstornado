import { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { useSelectionStore } from "@/store/selectionStore";

export default function StickyNote({ node, onDrag, onResize, scale = 1 }) {
  const setSelectedNode = useSelectionStore((state) => state.setSelectedNode);
  const [size, setSize] = useState({ width: node.width, height: node.height });
  const [position, setPosition] = useState({ x: node.x, y: node.y });
  const [fontSize, setFontSize] = useState(node.fontRem ? `${node.fontRem}rem` : "1rem");

  const contentRef = useRef(null);

  useEffect(() => {
    setFontSize(node.fontRem ? `${node.fontRem}rem` : "1rem");
  }, [node.fontRem]);

  const handleSelect = (e) => {
    if (e.button === 1) return; // Ignorar botón del medio
    e.stopPropagation();
    setSelectedNode(node);
  };

  return (
    <Rnd
      size={size}
      position={position}
      minWidth={250}
      minHeight={150}
      scale={scale} // 👈 Corrige el drag con zoom
      onClick={handleSelect}
      onDragStart={handleSelect}
      onResizeStart={handleSelect}
      onDragStop={(e, d) => {
        if (e.button === 1) return;
        const newPos = { x: d.x, y: d.y };
        setPosition(newPos);
        onDrag(node.id, d.x, d.y);
      }}
      onResize={(e, direction, ref, delta, pos) => {
        const newWidth = parseInt(ref.style.width);
        const newHeight = parseInt(ref.style.height);
        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: pos.x, y: pos.y });
      }}
      onResizeStop={(e, direction, ref, delta, pos) => {
        const newWidth = parseInt(ref.style.width);
        const newHeight = parseInt(ref.style.height);
        const { x, y } = pos;
        setSize({ width: newWidth, height: newHeight });
        setPosition({ x, y });
        onResize(node.id, { width: newWidth, height: newHeight });
        onDrag(node.id, x, y);
      }}
      bounds="parent"
      enableResizing
      className={`select-none rounded-xl shadow text-gray-800 p-3 transition-none ${node.color}`}
      style={{ zIndex: node.zIndex ?? 1 }}
    >
      <div
        ref={contentRef}
        className="w-full h-full font-comic whitespace-pre-wrap break-words overflow-hidden pointer-events-none"
        style={{ fontSize, textAlign: node.textAlign || "left" }}
      >
        {node.content}
      </div>
    </Rnd>
  );
}
