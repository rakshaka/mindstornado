import React, { useEffect, useRef, useState } from 'react';

export default function NodeConnections({ connections = [], offset, scale }) {
  const svgRef = useRef(null);
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const newLines = connections.map(({ from, to }) => {
      const fromEl = document.querySelector(`[data-node-id="${from}"]`);
      const toEl = document.querySelector(`[data-node-id="${to}"]`);
      if (!fromEl || !toEl) return null;
  
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      const svgRect = svgRef.current.getBoundingClientRect();
  
      return {
        x1: (fromRect.left + fromRect.width / 2 - svgRect.left - offset.x) / scale,
        y1: (fromRect.top + fromRect.height / 2 - svgRect.top - offset.y) / scale,
        x2: (toRect.left + toRect.width / 2 - svgRect.left - offset.x) / scale,
        y2: (toRect.top + toRect.height / 2 - svgRect.top - offset.y) / scale,
      };
    }).filter(Boolean);
  
    setLines(newLines);
  }, [connections, offset, scale]);

  return (
    <svg ref={svgRef} className="absolute inset-0 pointer-events-none z-0">
      <defs>
        <marker
          id="arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#4A90E2" />
        </marker>
      </defs>
      {lines.map((line, idx) => (
        <line
          key={idx}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#4A90E2"
          strokeWidth={2}
          markerEnd="url(#arrow)"
        />
      ))}
    </svg>
  );
}
