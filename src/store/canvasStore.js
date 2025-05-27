import { create } from "zustand";

export const useCanvasStore = create((set) => ({
  nodes: [],
  setNodes: (newNodes) => set({ nodes: newNodes }),
}));
