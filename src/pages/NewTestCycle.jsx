import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"
import { useToast } from "../components/Toast"

export default function NewTestCycle() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const preProjectId = searchParams.get('project') || ''
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({
    name: "",
    project_id: preProjectId,
    start_date: "",
    end_date: "",
    notes: "",
    status: "not_started"
  })

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, name, accounts(name)")
      .not("status", "eq", "closed")
      .order("name")
    setProjects(data || [])
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.name || !form.project_id) {
      setError("Cycle name and project are required")
      return
    }
    setLoading(true)
    setError("")
    try {
      const { data, error: err } = await supabase
        .from("test_cycles")
        .insert({ ...form, owner_id: profile?.id })
        .select().single()
      if (err) throw err
      toast("Test cycle created successfully")
      navigate(`/testing/${data.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const inputStyle = { width: "100%", padding: "10px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }
  const labelStyle = { display: "block", marginBottom: "6px",
    fontWeight: "500", fontSize: "14px", color: "#374151" }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Testing" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px", maxWidth: "1420px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate("/testing")} style={{ color: "#94a3b8", cursor: "pointer" }}>Testing</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>New Test Cycle</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            New Test Cycle
          </h1>
          <button onClick={() => navigate(-1)}
            style={{ backgroundColor: "transparent", border: "1px solid #d1d5db",
              color: "#64748b", padding: "8px 16px", borderRadius: "6px",
              cursor: "pointer", fontSize: "14px" }}>
            ← Back
          </button>
        </div>

        {error && <div style={{ backgroundColor: "#fee2e2", color: "#dc2626",
          padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>}

        <div style={{ backgroundColor: "white", borderRadius: "12px",
          padding: "24px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Cycle Name *</label>
              <input value={form.name} onChange={e => update("name", e.target.value)}
                autoFocus placeholder="e.g. UAT Round 1 — Estimating Module"
                style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Project *</label>
              <select value={form.project_id} onChange={e => update("project_id", e.target.value)}
                style={inputStyle}>
                <option value="">Select project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.accounts?.name} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={form.start_date}
                onChange={e => update("start_date", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" value={form.end_date}
                onChange={e => update("end_date", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)}
                placeholder="Describe the scope of this test cycle..."
                rows={4} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "14px", backgroundColor: "#06b6d4",
              color: "white", border: "none", borderRadius: "8px", fontSize: "16px",
              fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, marginTop: "20px" }}>
            {loading ? "Creating..." : "Create Test Cycle"}
          </button>
        </div>
      </main>
    </div>
  )
}
