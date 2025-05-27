// src/components/layout/MainLayout.jsx
export default function MainLayout({ left, center, right }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Panel izquierdo */}
      <aside className="w-[260px] bg-white border-r border-gray-200 overflow-y-auto">
        {left}
      </aside>

      {/* Panel central */}
      <main className="flex-1 relative overflow-hidden bg-gray-50">
        {center}
      </main>

      {/* Panel derecho: solo si se pasa */}
      {right && (
        <aside className="w-[300px] bg-white border-l border-gray-200 overflow-y-auto">
          {right}
        </aside>
      )}
    </div>
  );
}
