import { create } from "zustand";

export const useProjectStore = create((set) => ({
  projectId: null,
  setProjectId: (id) => set({ projectId: id }),
}));
