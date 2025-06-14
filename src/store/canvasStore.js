import { create } from "zustand";

export const useCanvasStore = create((set, get) => ({
  nodes: [],
  savedNodes: [],

  setNodes: (nodes) => set({ nodes }),
  setSavedNodes: (nodes) => set({ savedNodes: nodes }),

  hasUnsavedChanges: () => {
    const { nodes, savedNodes } = get();
    return JSON.stringify(nodes) !== JSON.stringify(savedNodes);
  },
}));