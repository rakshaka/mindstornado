import MainLayout from "@/components/layout/MainLayout";
import LeftPanel from "@/components/panels/LeftPanel";
import CanvasContent from "./CanvasContent";

export default function Canvas() {
  return (
    <MainLayout
      left={<LeftPanel />}
      center={<CanvasContent />}
    />
  );
}
