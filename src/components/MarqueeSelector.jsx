export default function MarqueeSelector({ rect }) {
    if (!rect) return null;
  
    return (
      <div
        className="absolute border-2 border-blue-400 bg-blue-200/20 pointer-events-none z-50"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
        }}
      />
    );
  }
  