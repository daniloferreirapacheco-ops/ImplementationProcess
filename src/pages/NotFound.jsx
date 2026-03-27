import { useNavigate } from "react-router-dom"

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <div style={{ textAlign: "center", padding: "60px 40px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "36px" }}>
          ?
        </div>
        <h1 style={{ fontSize: "48px", fontWeight: "800", color: "#1e293b", margin: "0 0 8px" }}>404</h1>
        <p style={{ fontSize: "18px", color: "#64748b", margin: "0 0 8px" }}>Page not found</p>
        <p style={{ fontSize: "14px", color: "#94a3b8", margin: "0 0 32px", maxWidth: "400px" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button onClick={() => navigate(-1)}
            style={{ padding: "10px 24px", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
            Go Back
          </button>
          <button onClick={() => navigate("/dashboard")}
            style={{ padding: "10px 24px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
