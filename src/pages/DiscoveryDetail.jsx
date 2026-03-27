import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"
import { useToast } from "../components/Toast"

export default function DiscoveryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [newQuestion, setNewQuestion] = useState("")
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const { toast } = useToast()

  useEffect(() => { fetchRecord(); fetchQuestions() }, [id])

  const fetchRecord = async () => {
    const { data } = await supabase
      .from("discovery_records")
      .select("*, opportunities(name, accounts(name))")
      .eq("id", id).single()
    setRecord(data)
    if (data) setForm({
      business_segment: data.business_segment || '', number_of_locations: data.number_of_locations || 0,
      number_of_estimators: data.number_of_estimators || 0, process_maturity: data.process_maturity || '',
      data_readiness: data.data_readiness || '', complexity_score: data.complexity_score || 0,
      key_pain_points: data.key_pain_points || '', missing_information: data.missing_information || '',
      workflow_notes: data.workflow_notes || '', current_systems: data.current_systems || '',
      notes: data.notes || '',
    })
    setLoading(false)
  }

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from("open_questions")
      .select("*")
      .eq("discovery_id", id)
      .order("created_at", { ascending: false })
    setQuestions(data || [])
  }

  const addQuestion = async () => {
    if (!newQuestion.trim()) return
    setAddingQuestion(true)
    await supabase.from("open_questions").insert({
      discovery_id: id,
      question: newQuestion,
      asked_by: profile.id
    })
    setNewQuestion("")
    fetchQuestions()
    setAddingQuestion(false)
  }

  const updateStatus = async (status) => {
    await supabase.from("discovery_records")
      .update({ status, updated_at: new Date() }).eq("id", id)
    setRecord(prev => ({ ...prev, status }))
    // Auto-propagate: discovery completed → advance opportunity stage
    if (status === "completed" && record?.opportunity_id) {
      await supabase.from("opportunities")
        .update({ stage: "discovery_complete", updated_at: new Date().toISOString() })
        .eq("id", record.opportunity_id)
    }
  }

  const closeQuestion = async (qId) => {
    await supabase.from("open_questions")
      .update({ status: "closed" }).eq("id", qId)
    fetchQuestions()
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this discovery record? This cannot be undone.')) return
    await supabase.from("discovery_records").delete().eq("id", id)
    navigate('/discovery')
  }

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const saveRecord = async () => {
    const payload = { ...form, complexity_score: parseInt(form.complexity_score) || 0,
      number_of_locations: parseInt(form.number_of_locations) || 0,
      number_of_estimators: parseInt(form.number_of_estimators) || 0,
      updated_at: new Date().toISOString() }
    for (const k of ['business_segment','process_maturity','data_readiness','key_pain_points','missing_information','workflow_notes','current_systems','notes']) {
      if (!payload[k]) payload[k] = null
    }
    await supabase.from("discovery_records").update(payload).eq("id", id)
    setRecord(prev => ({ ...prev, ...payload }))
    setEditing(false)
    toast("Discovery saved successfully")
  }

  const inputSm = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }

  if (loading || !record) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Discovery" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
          height: "calc(100vh - 64px)", color: "#64748b" }}>{loading ? "Loading..." : "Discovery record not found."}</div>
      </main>
    </div>
  )

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "products", label: "Products & Data" },
    { id: "workflow", label: "Workflow" },
    { id: "technical", label: "Technical" },
    { id: "roi", label: "ROI Analysis" },
    { id: "questions", label: `Questions (${questions.filter(q => q.status === "open").length})` }
  ]

  const cardStyle = { backgroundColor: "white", borderRadius: "12px",
    padding: "24px", border: "1px solid #e2e8f0", marginBottom: "20px" }
  const labelStyle = { fontSize: "12px", color: "#64748b", fontWeight: "500",
    textTransform: "uppercase", margin: "0 0 4px 0" }
  const valueStyle = { fontSize: "15px", color: "#1e293b", fontWeight: "500", margin: 0 }

  const statusColors = { in_progress: "#f59e0b", completed: "#10b981",
    blocked: "#ef4444", not_started: "#94a3b8" }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Discovery" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px", maxWidth: "1420px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate("/discovery")} style={{ color: "#94a3b8", cursor: "pointer" }}>Discovery</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>{record?.opportunities?.name || "Record"}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              {record?.opportunities?.name || "Discovery Record"}
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>
              🏢 {record?.opportunities?.accounts?.name}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                style={{ padding: "8px 16px", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                Edit
              </button>
            ) : (
              <>
                <button onClick={saveRecord}
                  style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                  Save
                </button>
                <button onClick={() => setEditing(false)}
                  style={{ padding: "8px 16px", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                  Cancel
                </button>
              </>
            )}
            <select value={record?.status || "in_progress"} onChange={e => updateStatus(e.target.value)}
              style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", border: `2px solid ${statusColors[record?.status] || "#94a3b8"}`, color: statusColors[record?.status] || "#94a3b8", backgroundColor: "white", cursor: "pointer" }}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
            <button onClick={() => navigate(`/discovery/${id}/roi`)}
              style={{ backgroundColor: "#10b981", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
              ROI Analysis
            </button>
            <button onClick={() => navigate(`/scope/new?discovery=${id}`)}
              style={{ backgroundColor: "#3b82f6", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
              Build Scope
            </button>
            <button onClick={handleDelete}
              style={{ padding: "8px 16px", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
              Delete
            </button>
          </div>
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

        {activeTab === "overview" && (
          <div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>Business Profile</h2>
              {editing ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                  <div><label style={labelStyle}>Business Segment</label><input value={form.business_segment} onChange={e => updateForm('business_segment', e.target.value)} style={inputSm} /></div>
                  <div><label style={labelStyle}>Locations</label><input type="number" value={form.number_of_locations} onChange={e => updateForm('number_of_locations', e.target.value)} style={inputSm} /></div>
                  <div><label style={labelStyle}>Estimators</label><input type="number" value={form.number_of_estimators} onChange={e => updateForm('number_of_estimators', e.target.value)} style={inputSm} /></div>
                  <div><label style={labelStyle}>Process Maturity</label>
                    <select value={form.process_maturity} onChange={e => updateForm('process_maturity', e.target.value)} style={inputSm}>
                      <option value="">Select...</option><option value="basic">Basic</option><option value="developing">Developing</option><option value="mature">Mature</option><option value="advanced">Advanced</option>
                    </select></div>
                  <div><label style={labelStyle}>Data Readiness</label>
                    <select value={form.data_readiness} onChange={e => updateForm('data_readiness', e.target.value)} style={inputSm}>
                      <option value="">Select...</option><option value="not_ready">Not Ready</option><option value="partial">Partial</option><option value="ready">Ready</option><option value="excellent">Excellent</option>
                    </select></div>
                  <div><label style={labelStyle}>Complexity Score (0-100)</label><input type="number" value={form.complexity_score} onChange={e => updateForm('complexity_score', e.target.value)} style={inputSm} /></div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  {[
                    { label: "Business Segment", value: record?.business_segment || "Not set" },
                    { label: "Locations", value: record?.number_of_locations || 0 },
                    { label: "Estimators", value: record?.number_of_estimators || 0 },
                    { label: "Process Maturity", value: record?.process_maturity || "Unknown" },
                    { label: "Data Readiness", value: record?.data_readiness || "Unknown" },
                    { label: "Complexity Score", value: record?.complexity_score || 0 },
                  ].map(item => (
                    <div key={item.label} style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                      <p style={labelStyle}>{item.label}</p>
                      <p style={{ ...valueStyle, textTransform: "capitalize" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>Key Pain Points</h2>
              {editing ? (
                <textarea value={form.key_pain_points} onChange={e => updateForm('key_pain_points', e.target.value)} rows={3} placeholder="What are the customer's main pain points?" style={{ ...inputSm, resize: 'vertical' }} />
              ) : (
                <p style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}>{record?.key_pain_points || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No pain points documented yet</span>}</p>
              )}
            </div>
            <div style={{ ...cardStyle, borderColor: editing || record?.missing_information ? "#fde68a" : "#e2e8f0", backgroundColor: editing || record?.missing_information ? "#fffbeb" : "white" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#92400e", margin: "0 0 12px 0" }}>Missing Information</h2>
              {editing ? (
                <textarea value={form.missing_information} onChange={e => updateForm('missing_information', e.target.value)} rows={3} placeholder="What information is still needed?" style={{ ...inputSm, resize: 'vertical' }} />
              ) : (
                <p style={{ color: "#92400e", lineHeight: "1.6", margin: 0 }}>{record?.missing_information || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>None identified</span>}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
              Product Families
            </h2>
            {record?.product_families?.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                {record.product_families.map((f, i) => (
                  <span key={i} style={{ backgroundColor: "#f5f3ff", color: "#7c3aed",
                    padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "500" }}>
                    {f}
                  </span>
                ))}
              </div>
            ) : <p style={{ color: "#64748b" }}>No product families defined</p>}
            <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
              <p style={labelStyle}>Data Readiness</p>
              <p style={{ ...valueStyle, textTransform: "capitalize" }}>{record?.data_readiness || "Unknown"}</p>
            </div>
          </div>
        )}

        {activeTab === "workflow" && (
          <div>
            {[
              { label: "Workflow Notes", field: "workflow_notes", placeholder: "Document the customer's current workflows..." },
              { label: "Current Systems", field: "current_systems", placeholder: "What systems are currently in use?" },
              { label: "Notes", field: "notes", placeholder: "Additional discovery notes..." },
            ].map(item => (editing || record?.[item.field]) ? (
              <div key={item.label} style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>{item.label}</h2>
                {editing ? (
                  <textarea value={form[item.field]} onChange={e => updateForm(item.field, e.target.value)} rows={3} placeholder={item.placeholder} style={{ ...inputSm, resize: 'vertical' }} />
                ) : (
                  <p style={{ color: "#475569", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>{record[item.field]}</p>
                )}
              </div>
            ) : null)}
            {!editing && !record?.workflow_notes && !record?.current_systems && !record?.notes && (
              <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8", backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <p style={{ margin: "0 0 8px", fontSize: "15px" }}>No workflow details documented yet</p>
                <button onClick={() => setEditing(true)} style={{ padding: "8px 20px", backgroundColor: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>Add Details</button>
              </div>
            )}
          </div>
        )}

        {activeTab === "technical" && (
          <div>
            {[
              { label: "Integration Needs", value: record?.integration_needs },
              { label: "Reporting Needs", value: record?.reporting_needs },
            ].map(item => item.value && (
              <div key={item.label} style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>
                  {item.label}
                </h2>
                <p style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}>{item.value}</p>
              </div>
            ))}
            {record?.specialist_review_required && (
              <div style={{ ...cardStyle, backgroundColor: "#fef3c7", borderColor: "#fde68a" }}>
                <p style={{ color: "#92400e", fontWeight: "600", margin: 0 }}>
                  ⚠️ Specialist Review Required for this discovery
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "roi" && (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white",
            borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>&#128200;</p>
            <p style={{ color: "#1e293b", fontSize: "18px", fontWeight: "600", margin: "0 0 8px 0" }}>
              ROI Discovery & Calculator
            </p>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px 0" }}>
              Capture business metrics, quantify savings, and build the ROI case for this opportunity
            </p>
            <button onClick={() => navigate(`/discovery/${id}/roi`)}
              style={{ backgroundColor: "#10b981", color: "white", border: "none",
                padding: "12px 28px", borderRadius: "8px", cursor: "pointer", fontWeight: "600",
                fontSize: "15px" }}>
              Open ROI Analysis
            </button>
          </div>
        )}

        {activeTab === "questions" && (
          <div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Add Open Question
              </h2>
              <div style={{ display: "flex", gap: "12px" }}>
                <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)}
                  placeholder="Type a question that needs answering..."
                  onKeyDown={e => e.key === "Enter" && addQuestion()}
                  style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db",
                    borderRadius: "6px", fontSize: "14px" }} />
                <button onClick={addQuestion} disabled={addingQuestion}
                  style={{ backgroundColor: "#8b5cf6", color: "white", border: "none",
                    padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                    fontWeight: "600", fontSize: "14px" }}>
                  Add
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {questions.map(q => (
                <div key={q.id} style={{ ...cardStyle, marginBottom: 0,
                  borderLeft: `4px solid ${q.status === "open" ? "#f59e0b" : "#10b981"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#1e293b", flex: 1 }}>{q.question}</p>
                    <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                      <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "12px",
                        backgroundColor: q.status === "open" ? "#fef3c7" : "#dcfce7",
                        color: q.status === "open" ? "#92400e" : "#166534",
                        fontWeight: "600" }}>
                        {q.status}
                      </span>
                      {q.status === "open" && (
                        <button onClick={() => closeQuestion(q.id)}
                          style={{ backgroundColor: "#10b981", color: "white", border: "none",
                            padding: "3px 10px", borderRadius: "12px", cursor: "pointer",
                            fontSize: "12px", fontWeight: "600" }}>
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  No questions yet — add your first one above
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
