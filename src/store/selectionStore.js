import { create } from 'zustand';

export const useSelectionStore = create((set) => ({
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  updateSelectedNode: (updatedNode) =>
    set((state) => ({
      selectedNode: updatedNode,
    })),
}));
