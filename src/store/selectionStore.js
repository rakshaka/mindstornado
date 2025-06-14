import { create } from "zustand";

export const useSelectionStore = create((set) => ({
  selectedNode: null,
  selectedNodes: [],
  
  setSelectedNode: (node) => set({ 
    selectedNode: node, 
    selectedNodes: [node] // ← esto es clave para que el RightPanel funcione como antes
  }),

  updateSelectedNode: (updatedNode) => set((state) => ({
    selectedNode: updatedNode,
    selectedNodes: state.selectedNodes.map((n) =>
      n.id === updatedNode.id ? updatedNode : n
    ),
  })),

  addToSelection: (node) => set((state) => {
    if (state.selectedNodes.find((n) => n.id === node.id)) return {};
    return {
      selectedNodes: [...state.selectedNodes, node],
      selectedNode: node,
    };
  }),

  removeFromSelection: (id) => set((state) => {
    const filtered = state.selectedNodes.filter((n) => n.id !== id);
    return {
      selectedNodes: filtered,
      selectedNode: filtered.length === 1 ? filtered[0] : null,
    };
  }),

  clearSelection: () => set({
    selectedNode: null,
    selectedNodes: [],
  }),
}));
