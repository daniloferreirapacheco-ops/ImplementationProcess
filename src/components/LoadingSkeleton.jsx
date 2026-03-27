export default function LoadingSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div style={{ padding: "24px" }}>
      {/* Header skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <div style={{ width: "200px", height: "28px", backgroundColor: "#e2e8f0", borderRadius: "8px", marginBottom: "8px", animation: "pulse 1.5s infinite" }} />
          <div style={{ width: "140px", height: "16px", backgroundColor: "#f1f5f9", borderRadius: "6px", animation: "pulse 1.5s infinite" }} />
        </div>
        <div style={{ width: "120px", height: "36px", backgroundColor: "#e2e8f0", borderRadius: "8px", animation: "pulse 1.5s infinite" }} />
      </div>

      {/* Stat cards skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "12px", marginBottom: "24px" }}>
        {Array(cols).fill(0).map((_, i) => (
          <div key={i} style={{ backgroundColor: "white", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
            <div style={{ width: "60px", height: "24px", backgroundColor: "#e2e8f0", borderRadius: "6px", margin: "0 auto 6px", animation: "pulse 1.5s infinite" }} />
            <div style={{ width: "80px", height: "12px", backgroundColor: "#f1f5f9", borderRadius: "4px", margin: "0 auto", animation: "pulse 1.5s infinite" }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: "16px", padding: "12px 16px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          {Array(cols).fill(0).map((_, i) => (
            <div key={i} style={{ flex: i === 0 ? 2 : 1, height: "12px", backgroundColor: "#e2e8f0", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
        {Array(rows).fill(0).map((_, i) => (
          <div key={i} style={{ display: "flex", gap: "16px", padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
            {Array(cols).fill(0).map((_, j) => (
              <div key={j} style={{ flex: j === 0 ? 2 : 1, height: "14px", backgroundColor: i % 2 === 0 ? "#f1f5f9" : "#f8fafc", borderRadius: "4px", animation: "pulse 1.5s infinite", animationDelay: `${(i * cols + j) * 0.05}s` }} />
            ))}
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}
