import { useCanvasStore } from '@/store/canvasStore';
import { useProjectStore } from '@/store/projectStore';
import { useSelectionStore } from '@/store/selectionStore';

export const resetCanvas = () => {
  useCanvasStore.getState().setNodes([]);
  useCanvasStore.getState().setSavedNodes([]);
  useProjectStore.getState().setProjectId(null);
  useSelectionStore.getState().clearSelection();
};
