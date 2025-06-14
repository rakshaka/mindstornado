import { useRef } from "react";
import { Rnd } from "react-rnd";
import { useSelectionStore } from "@/store/selectionStore";

export default function StickyNote({
  node,
  onDrag,
  onResize,
  scale = 1,
  isMultiSelectEnabled = false,
  isPanMode = false,
  multiSelectForcedByKey = false, // ← nuevo
}) {
  const {
    selectedNode,
    selectedNodes,
    setSelectedNode,
    addToSelection,
    removeFromSelection,
  } = useSelectionStore();

  const multi = isMultiSelectEnabled || multiSelectForcedByKey;

const isSelected = multi
  ? (selectedNodes || []).some((n) => n?.id === node.id)
  : selectedNode?.id === node.id;


  const contentRef = useRef(null);
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef(new Map());

  const handleSelect = () => {
    if (isMultiSelectEnabled && isSelected) return;
    if (isMultiSelectEnabled) {
      if (isSelected) {
        removeFromSelection(node.id);
      } else {
        addToSelection(node);
      }
    } else {
      setSelectedNode(node);
    }
  };

  const handleClick = () => {
    const multi = isMultiSelectEnabled || multiSelectForcedByKey;
  
    if (multi) {
      if (isSelected) {
        removeFromSelection(node.id);
      } else {
        addToSelection(node);
      }
    } else {
      setSelectedNode(node);
    }
  };
  

  return (
    <Rnd
  data-node-id={node.id}
  size={{ width: node.width, height: node.height }}
  position={{ x: node.x, y: node.y }}
  minWidth={250}
  minHeight={150}
  scale={scale}
  bounds={false}
  enableResizing
  className={`select-none rounded-xl shadow text-black p-3 transition-none ${node.color} ${
    isSelected ? "ring-4 ring-blue-400" : "ring-0"
  }`}
  style={{ zIndex: node.zIndex ?? 1 }}
  onMouseDown={(e) => {
    if (isPanMode) return;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  
    const allNodes = useSelectionStore.getState().selectedNodes;
    const selection = isMultiSelectEnabled && isSelected ? allNodes : [node];
  
    dragStartPos.current = new Map(
      selection.map(n => [n.id, { x: n.x, y: n.y }])
    );
  }}
  
  onDrag={(e, d) => {
    const selection = Array.from(dragStartPos.current.entries());
    const draggedStart = dragStartPos.current.get(node.id);
    if (!draggedStart) return;
  
    const deltaX = d.x - draggedStart.x;
    const deltaY = d.y - draggedStart.y;
  
    selection.forEach(([id, pos]) => {
      onDrag(id, pos.x + deltaX, pos.y + deltaY);
    });
  }}
  
  onDragStop={(e, d) => {
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
  }}
    onResizeStop={(e, direction, ref, delta, position) => {
      const newWidth = parseInt(ref.style.width);
      const newHeight = parseInt(ref.style.height);
      const { x, y } = position;
      onResize(node.id, { width: newWidth, height: newHeight });
      onDrag(node.id, x, y);
    }}
  >
      <div
        ref={contentRef}
        className="w-full h-full font-comic whitespace-pre-wrap break-words overflow-hidden pointer-events-none"
        style={{
          fontSize: `${node.fontRem ?? 1}rem`,
          textAlign: node.textAlign || "left",
        }}
      >
        {node.content}
      </div>
    </Rnd>
  );
}
