import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"
import { useToast } from "../components/Toast"

export default function NewHandoff() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const preProjectId = searchParams.get('project') || ''
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({
    project_id: preProjectId,
    delivered_modules: [],
    environment_notes: "",
    known_issues: "",
    open_risks: "",
    support_instructions: "",
    escalation_map: "",
    approval_status: "not_started"
  })
  const [moduleInput, setModuleInput] = useState("")

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, name, accounts(name)")
      .order("name")
    setProjects(data || [])
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const addModule = () => {
    if (!moduleInput.trim()) return
    setForm(prev => ({
      ...prev,
      delivered_modules: [...prev.delivered_modules, moduleInput.trim()]
    }))
    setModuleInput("")
  }

  const removeModule = (idx) => {
    setForm(prev => ({
      ...prev,
      delivered_modules: prev.delivered_modules.filter((_, i) => i !== idx)
    }))
  }

  const handleSubmit = async () => {
    if (!form.project_id) {
      setError("Please select a project")
      return
    }
    setLoading(true)
    setError("")
    try {
      const { data, error: err } = await supabase
        .from("handoff_packages")
        .insert({ ...form, created_by: profile?.id })
        .select().single()
      if (err) throw err
      toast("Handoff created successfully")
      navigate(`/handoff/${data.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const inputStyle = { width: "100%", padding: "10px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }
  const labelStyle = { display: "block", marginBottom: "6px",
    fontWeight: "500", fontSize: "14px", color: "#374151" }
  const cardStyle = { backgroundColor: "white", borderRadius: "12px",
    padding: "24px", marginBottom: "20px", border: "1px solid #e2e8f0" }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Handoff" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px", maxWidth: "1420px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate("/handoff")} style={{ color: "#94a3b8", cursor: "pointer" }}>Handoff</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>New Handoff</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            New Handoff Package
          </h1>
          <button onClick={() => navigate("/handoff")}
            style={{ backgroundColor: "transparent", border: "1px solid #d1d5db",
              color: "#64748b", padding: "8px 16px", borderRadius: "6px",
              cursor: "pointer", fontSize: "14px" }}>
            ← Back
          </button>
        </div>

        {error && <div style={{ backgroundColor: "#fee2e2", color: "#dc2626",
          padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>}

        <div style={cardStyle}>
          <label style={labelStyle}>Project *</label>
          <select value={form.project_id} onChange={e => update("project_id", e.target.value)}
            style={inputStyle}>
            <option value="">Select project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.accounts?.name} — {p.name}</option>
            ))}
          </select>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
            Delivered Modules
          </h2>
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <input value={moduleInput} onChange={e => setModuleInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addModule()}
              placeholder="e.g. iQuote / Estimating"
              style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db",
                borderRadius: "6px", fontSize: "14px" }} />
            <button onClick={addModule}
              style={{ backgroundColor: "#14b8a6", color: "white", border: "none",
                padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                fontWeight: "600", fontSize: "14px" }}>
              Add
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {form.delivered_modules.map((mod, idx) => (
              <span key={idx} style={{ backgroundColor: "#f0fdfa", color: "#0f766e",
                padding: "6px 12px", borderRadius: "20px", fontSize: "13px",
                fontWeight: "500", display: "flex", alignItems: "center", gap: "8px" }}>
                {mod}
                <button onClick={() => removeModule(idx)}
                  style={{ backgroundColor: "transparent", border: "none",
                    color: "#0f766e", cursor: "pointer", fontSize: "16px",
                    padding: 0, lineHeight: 1 }}>
                  ×
                </button>
              </span>
            ))}
            {form.delivered_modules.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
                No modules added yet
              </p>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
            Handoff Details
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { label: "Environment & Configuration Notes", field: "environment_notes",
                placeholder: "Describe final environment setup, configuration details..." },
              { label: "Known Issues", field: "known_issues",
                placeholder: "List any known issues support should be aware of..." },
              { label: "Open Risks", field: "open_risks",
                placeholder: "List any open risks or items still being monitored..." },
              { label: "Support Instructions", field: "support_instructions",
                placeholder: "Specific instructions for the support team..." },
              { label: "Escalation Map", field: "escalation_map",
                placeholder: "Who to contact for different types of issues..." }
            ].map(item => (
              <div key={item.field}>
                <label style={labelStyle}>{item.label}</label>
                <textarea value={form[item.field]}
                  onChange={e => update(item.field, e.target.value)}
                  placeholder={item.placeholder}
                  rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "14px", backgroundColor: "#14b8a6",
            color: "white", border: "none", borderRadius: "8px", fontSize: "16px",
            fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1 }}>
          {loading ? "Creating..." : "Create Handoff Package"}
        </button>
      </main>
    </div>
  )
}
