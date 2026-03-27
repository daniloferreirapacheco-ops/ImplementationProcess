import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"
import { useToast } from "../components/Toast"

const productFamilies = [
  "Web Offset", "Sheetfed Offset", "Digital Print", "Wide Format",
  "Flexo", "Gravure", "Labels", "Packaging", "Mailing", "Fulfillment"
]

const dataReadinessOptions = [
  { value: "ready", label: "Ready - Data is clean and available" },
  { value: "partial", label: "Partial - Some data needs cleanup" },
  { value: "poor", label: "Poor - Significant data work needed" },
  { value: "unknown", label: "Unknown - Not assessed yet" }
]

const maturityOptions = [
  { value: "advanced", label: "Advanced - Well documented processes" },
  { value: "intermediate", label: "Intermediate - Some documentation" },
  { value: "basic", label: "Basic - Minimal documentation" },
  { value: "unknown", label: "Unknown" }
]

export default function NewDiscovery() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const opportunityId = searchParams.get("opportunity")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [opportunities, setOpportunities] = useState([])
  const [activeTab, setActiveTab] = useState("business")
  const [form, setForm] = useState({
    opportunity_id: opportunityId || "",
    business_segment: "",
    number_of_locations: 1,
    number_of_estimators: 0,
    process_maturity: "basic",
    key_pain_points: "",
    product_families: [],
    workflow_notes: "",
    current_systems: "",
    integration_needs: "",
    data_readiness: "unknown",
    reporting_needs: "",
    decision_maker: "",
    sme_contacts: "",
    meeting_cadence: "",
    missing_information: "",
    specialist_review_required: false
  })

  useEffect(() => { fetchOpportunities() }, [])

  const fetchOpportunities = async () => {
    const { data } = await supabase
      .from("opportunities")
      .select("id, name, accounts(name)")
      .not("stage", "eq", "closed_lost")
    setOpportunities(data || [])
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleFamily = (family) => {
    setForm(prev => ({
      ...prev,
      product_families: prev.product_families.includes(family)
        ? prev.product_families.filter(f => f !== family)
        : [...prev.product_families, family]
    }))
  }

  const calculateScore = () => {
    let score = 0
    if (form.data_readiness === "poor") score += 30
    if (form.data_readiness === "partial") score += 15
    if (form.process_maturity === "basic") score += 20
    if (form.specialist_review_required) score += 25
    if (form.integration_needs) score += 15
    score += form.product_families.length * 3
    return Math.min(score, 100)
  }

  const handleSubmit = async () => {
    if (!form.opportunity_id) { setError("Please select an opportunity"); return }
    setLoading(true)
    setError("")
    try {
      const payload = {
        ...form,
        complexity_score: calculateScore(),
        created_by: profile?.id
      }
      // Convert empty strings to null for optional text/array fields
      const optionalFields = ['business_segment', 'key_pain_points', 'workflow_notes',
        'current_systems', 'integration_needs', 'reporting_needs', 'decision_maker',
        'sme_contacts', 'meeting_cadence', 'missing_information']
      optionalFields.forEach(f => { if (!payload[f]) payload[f] = null })
      const { data, error: err } = await supabase
        .from("discovery_records")
        .insert(payload)
        .select().single()
      if (err) throw err
      toast("Discovery created successfully")
      navigate(`/discovery/${data.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const tabs = [
    { id: "business", label: "🏢 Business" },
    { id: "products", label: "🖨️ Products" },
    { id: "workflow", label: "⚙️ Workflow" },
    { id: "technical", label: "🔗 Technical" },
    { id: "governance", label: "👥 Governance" }
  ]

  const inputStyle = { width: "100%", padding: "10px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }
  const labelStyle = { display: "block", marginBottom: "6px",
    fontWeight: "500", fontSize: "14px", color: "#374151" }
  const cardStyle = { backgroundColor: "white", borderRadius: "12px",
    padding: "24px", marginBottom: "20px", border: "1px solid #e2e8f0" }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Discovery" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px", maxWidth: "1420px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate("/discovery")} style={{ color: "#94a3b8", cursor: "pointer" }}>Discovery</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>New Discovery</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            New Discovery
          </h1>
        </div>

        {error && <div style={{ backgroundColor: "#fee2e2", color: "#dc2626",
          padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>}

        <div style={cardStyle}>
          <label style={labelStyle}>Linked Opportunity *</label>
          <select value={form.opportunity_id} onChange={e => update("opportunity_id", e.target.value)}
            style={inputStyle}>
            <option value="">Select opportunity...</option>
            {opportunities.map(o => (
              <option key={o.id} value={o.id}>
                {o.accounts?.name} — {o.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: "8px 18px", borderRadius: "8px", border: "none",
                cursor: "pointer", fontSize: "14px", fontWeight: "500",
                backgroundColor: activeTab === tab.id ? "#8b5cf6" : "#e2e8f0",
                color: activeTab === tab.id ? "white" : "#475569" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "business" && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
              Business Profile
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Business Segment</label>
                <input value={form.business_segment}
                  onChange={e => update("business_segment", e.target.value)}
                  autoFocus placeholder="e.g. Commercial Print, Packaging..."
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Number of Locations</label>
                <input type="number" value={form.number_of_locations}
                  onChange={e => update("number_of_locations", parseInt(e.target.value, 10) || 0)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Number of Estimators</label>
                <input type="number" value={form.number_of_estimators}
                  onChange={e => update("number_of_estimators", parseInt(e.target.value, 10) || 0)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Process Maturity</label>
                <select value={form.process_maturity}
                  onChange={e => update("process_maturity", e.target.value)}
                  style={inputStyle}>
                  {maturityOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Key Pain Points</label>
                <textarea value={form.key_pain_points}
                  onChange={e => update("key_pain_points", e.target.value)}
                  placeholder="What problems is the customer trying to solve?"
                  rows={4} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
              Product Families
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {productFamilies.map(family => (
                <div key={family} onClick={() => toggleFamily(family)}
                  style={{ padding: "12px", borderRadius: "8px", cursor: "pointer",
                    border: `2px solid ${form.product_families.includes(family) ? "#8b5cf6" : "#e2e8f0"}`,
                    backgroundColor: form.product_families.includes(family) ? "#f5f3ff" : "white",
                    color: form.product_families.includes(family) ? "#7c3aed" : "#475569",
                    fontWeight: form.product_families.includes(family) ? "600" : "400",
                    fontSize: "14px" }}>
                  {form.product_families.includes(family) ? "✓ " : ""}{family}
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px" }}>
              <label style={labelStyle}>Data Readiness</label>
              <select value={form.data_readiness}
                onChange={e => update("data_readiness", e.target.value)}
                style={inputStyle}>
                {dataReadinessOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === "workflow" && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
              Workflow Definition
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Workflow Notes</label>
                <textarea value={form.workflow_notes}
                  onChange={e => update("workflow_notes", e.target.value)}
                  placeholder="Describe the customer workflow from estimate to delivery..."
                  rows={5} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={labelStyle}>Current Systems in Use</label>
                <textarea value={form.current_systems}
                  onChange={e => update("current_systems", e.target.value)}
                  placeholder="List current MIS, ERP, CRM and other systems..."
                  rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={labelStyle}>Missing Information</label>
                <textarea value={form.missing_information}
                  onChange={e => update("missing_information", e.target.value)}
                  placeholder="What information is still needed to complete discovery?"
                  rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "technical" && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
              Technical Environment
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Integration Needs</label>
                <textarea value={form.integration_needs}
                  onChange={e => update("integration_needs", e.target.value)}
                  placeholder="Describe any integrations needed with other systems..."
                  rows={4} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={labelStyle}>Reporting Needs</label>
                <textarea value={form.reporting_needs}
                  onChange={e => update("reporting_needs", e.target.value)}
                  placeholder="Describe critical reporting requirements..."
                  rows={4} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px",
                padding: "16px", backgroundColor: "#fef3c7", borderRadius: "8px",
                border: "1px solid #fde68a" }}>
                <input type="checkbox" checked={form.specialist_review_required}
                  onChange={e => update("specialist_review_required", e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                <label style={{ fontWeight: "600", color: "#92400e", cursor: "pointer" }}>
                  ⚠️ Specialist Review Required
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "governance" && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
              Governance & Contacts
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Decision Maker</label>
                <input value={form.decision_maker}
                  onChange={e => update("decision_maker", e.target.value)}
                  placeholder="Name and role of primary decision maker"
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Meeting Cadence</label>
                <input value={form.meeting_cadence}
                  onChange={e => update("meeting_cadence", e.target.value)}
                  placeholder="e.g. Weekly on Tuesdays at 2pm"
                  style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Subject Matter Experts / Contacts</label>
                <textarea value={form.sme_contacts}
                  onChange={e => update("sme_contacts", e.target.value)}
                  placeholder="List SMEs, their roles and contact info..."
                  rows={4} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "14px", backgroundColor: "#8b5cf6",
            color: "white", border: "none", borderRadius: "8px", fontSize: "16px",
            fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, marginTop: "8px" }}>
          {loading ? "Creating..." : "Create Discovery Record"}
        </button>
      </main>
    </div>
  )
}
