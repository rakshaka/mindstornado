import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { useSelectionStore } from "@/store/selectionStore";
import EmojiPicker from "emoji-picker-react";

export default function EmojiNode({
  node,
  onDrag,
  onResize,
  onUpdate,
  scale = 1,
  isMultiSelectEnabled = false,
  isPanMode = false,
}) {
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

  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const emoji = node.content || "😀";

  const mouseDownPos = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef(new Map());

  const handleMouseDown = (e) => {
    if (isPanMode) return;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };

    const allNodes = useSelectionStore.getState().selectedNodes;
    const selection = isMultiSelectEnabled && isSelected ? allNodes : [node];

    dragStartPos.current = new Map(
      selection.map((n) => [n.id, { x: n.x, y: n.y }])
    );
  };

  const handleDrag = (e, d) => {
    const selection = Array.from(dragStartPos.current.entries());
    const draggedStart = dragStartPos.current.get(node.id);
    if (!draggedStart) return;

    const deltaX = d.x - draggedStart.x;
    const deltaY = d.y - draggedStart.y;

    selection.forEach(([id, pos]) => {
      onDrag(id, pos.x + deltaX, pos.y + deltaY);
    });
  };

  const handleDragStop = (e, d) => {
    const wasClick =
      Math.abs(e.clientX - mouseDownPos.current.x) < 3 &&
      Math.abs(e.clientY - mouseDownPos.current.y) < 3;

    if (wasClick) {
      if (isMultiSelectEnabled) {
        if (isSelected) {
          removeFromSelection(node.id);
        } else {
          addToSelection(node);
        }
      } else {
        setSelectedNode(node);
      }
    }
  };

  const handleClick = () => {
    if (isMultiSelectEnabled) {
      isSelected ? removeFromSelection(node.id) : addToSelection(node);
    } else {
      setSelectedNode(node);
    }
  };

  const handleDoubleClick = () => {
    setShowPicker(true);
  };

  const handleEmojiClick = (emojiData) => {
    onUpdate({
      ...node,
      content: emojiData.emoji,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    });
    setShowPicker(false);
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="relative">
      <Rnd
        data-node-id={node.id}
        size={{ width: 200, height: node.width }}
        position={{ x: node.x, y: node.y }}
        scale={scale}
        bounds={false}
        enableResizing={{ bottomRight: true }}
        onMouseDown={handleMouseDown}
        onDrag={handleDrag}
        onDragStop={handleDragStop}
        onResizeStop={(e, dir, ref, delta, position) => {
          const size = parseInt(ref.style.width);
          onResize(node.id, { width: size, height: size });
          onDrag(node.id, position.x, position.y);
        }}
        style={{ zIndex: node.zIndex ?? 1 }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`rounded-full select-none flex items-center justify-center transition-none ${
          isSelected ? "ring-4 ring-blue-400" : ""
        } bg-transparent`}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            fontSize: `${node.fontRem ?? 4}rem`,
            lineHeight: 1,
            overflow: "hidden",
            textAlign: "center",
          }}
        >
          {emoji}
        </div>
      </Rnd>

      {showPicker && (
        <div ref={pickerRef} className="absolute top-full mt-2 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
}
