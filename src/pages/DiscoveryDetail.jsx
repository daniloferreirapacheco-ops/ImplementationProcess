import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"

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

  useEffect(() => { fetchRecord(); fetchQuestions() }, [id])

  const fetchRecord = async () => {
    const { data } = await supabase
      .from("discovery_records")
      .select("*, opportunities(name, accounts(name))")
      .eq("id", id).single()
    setRecord(data)
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
  }

  const closeQuestion = async (qId) => {
    await supabase.from("open_questions")
      .update({ status: "closed" }).eq("id", qId)
    fetchQuestions()
  }

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

        <button onClick={() => navigate('/discovery')}
          style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer",
            fontSize: "14px", padding: 0, marginBottom: "16px" }}>
          ← Back to Discovery
        </button>

        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              {record?.opportunities?.name || "Discovery Record"}
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>
              🏢 {record?.opportunities?.accounts?.name}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <select value={record?.status || "in_progress"}
              onChange={e => updateStatus(e.target.value)}
              style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "14px",
                fontWeight: "600", border: `2px solid ${statusColors[record?.status] || "#94a3b8"}`,
                color: statusColors[record?.status] || "#94a3b8",
                backgroundColor: "white", cursor: "pointer" }}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
            <button onClick={() => navigate(`/discovery/${id}/roi`)}
              style={{ backgroundColor: "#10b981", color: "white", border: "none",
                padding: "10px 20px", borderRadius: "8px", cursor: "pointer",
                fontWeight: "600", fontSize: "14px" }}>
              ROI Analysis
            </button>
            <button onClick={() => navigate(`/scope/new?discovery=${id}`)}
              style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
                padding: "10px 20px", borderRadius: "8px", cursor: "pointer",
                fontWeight: "600", fontSize: "14px" }}>
              Build Scope
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
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
                Business Profile
              </h2>
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
            </div>
            {record?.key_pain_points && (
              <div style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>
                  Key Pain Points
                </h2>
                <p style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}>{record.key_pain_points}</p>
              </div>
            )}
            {record?.missing_information && (
              <div style={{ ...cardStyle, borderColor: "#fde68a", backgroundColor: "#fffbeb" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#92400e", margin: "0 0 12px 0" }}>
                  ⚠️ Missing Information
                </h2>
                <p style={{ color: "#92400e", lineHeight: "1.6", margin: 0 }}>{record.missing_information}</p>
              </div>
            )}
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
              { label: "Workflow Notes", value: record?.workflow_notes },
              { label: "Current Systems", value: record?.current_systems },
            ].map(item => item.value && (
              <div key={item.label} style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>
                  {item.label}
                </h2>
                <p style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}>{item.value}</p>
              </div>
            ))}
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
