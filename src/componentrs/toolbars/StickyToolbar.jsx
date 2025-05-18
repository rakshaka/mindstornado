import { forwardRef } from "react";
import { Trash2, Undo2, Redo2 } from "lucide-react";

const COLORS = [
  "bg-nodeColors-yellow",
  "bg-nodeColors-pink",
  "bg-nodeColors-green",
  "bg-nodeColors-blue",
  "bg-nodeColors-purple",
];

const StickyToolbar = forwardRef(
  ({ node, onChangeColor, onDelete, onUndo, onRedo }, ref) => {
    return (
      <div
        ref={ref}
        className="absolute top-4 left-4 bg-white shadow rounded-lg border px-3 py-2 flex items-center gap-2 z-50"
      >
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChangeColor(node.id, color)}
            className={`w-6 h-6 rounded-full border-2 ${color} ${
              node.color === color ? "border-black" : "border-transparent"
            }`}
          />
        ))}
        {/*
        <button
          onClick={onUndo}
          className="p-1 bg-gray-100 rounded hover:bg-gray-200"
          title="Deshacer"
        >
          <Undo2 className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={onRedo}
          className="p-1 bg-gray-100 rounded hover:bg-gray-200"
          title="Rehacer"
        >
          <Redo2 className="w-4 h-4 text-gray-700" />
        </button>
        */}
        <button
          onClick={onDelete}
          className="ml-2 p-1 bg-red-100 rounded hover:bg-red-200"
          title="Eliminar sticky"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    );
  }
);

export default StickyToolbar;
