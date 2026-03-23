import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const severityColors = {
  low: "#10b981", medium: "#f59e0b", high: "#ef4444", critical: "#dc2626"
}

const statusColors = {
  pending: "#94a3b8", passed: "#10b981", failed: "#ef4444", blocked: "#f97316"
}

export default function TestCycleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cycle, setCycle] = useState(null)
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("cases")
  const [newCase, setNewCase] = useState({
    name: "", scenario: "", expected_result: "", severity: "medium"
  })
  const [showAddCase, setShowAddCase] = useState(false)

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    const [{ data: cyc }, { data: tcs }] = await Promise.all([
      supabase.from("test_cycles").select("*, projects(name, accounts(name))").eq("id", id).single(),
      supabase.from("test_cases").select("*").eq("cycle_id", id).order("created_at")
    ])
    setCycle(cyc)
    setCases(tcs || [])
    setLoading(false)
  }

  const updateCycleStatus = async (status) => {
    await supabase.from("test_cycles").update({ status, updated_at: new Date() }).eq("id", id)
    setCycle(prev => ({ ...prev, status }))
  }

  const addCase = async () => {
    if (!newCase.name) return
    setSaving(true)
    const { data } = await supabase.from("test_cases")
      .insert({ ...newCase, cycle_id: id, project_id: cycle.project_id })
      .select().single()
    setCases(prev => [...prev, data])
    setNewCase({ name: "", scenario: "", expected_result: "", severity: "medium" })
    setShowAddCase(false)
    setSaving(false)
  }

  const updateCaseStatus = async (caseId, status) => {
    await supabase.from("test_cases").update({ status, updated_at: new Date() }).eq("id", caseId)
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status } : c))
    const updated = cases.map(c => c.id === caseId ? { ...c, status } : c)
    const passed = updated.filter(c => c.status === "passed").length
    const failed = updated.filter(c => c.status === "failed").length
    await supabase.from("test_cycles").update({
      pass_count: passed, fail_count: failed,
      completion_percentage: Math.round(((passed + failed) / updated.length) * 100)
    }).eq("id", id)
    setCycle(prev => ({ ...prev, pass_count: passed, fail_count: failed }))
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Testing" />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
        height: "calc(100vh - 64px)", color: "#64748b" }}>Loading...</div>
    </div>
  )

  const total = cases.length
  const passed = cases.filter(c => c.status === "passed").length
  const failed = cases.filter(c => c.status === "failed").length
  const pending = cases.filter(c => c.status === "pending").length
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

  const tabs = [
    { id: "cases", label: `Test Cases (${total})` },
    { id: "summary", label: "Summary" }
  ]

  const cardStyle = { backgroundColor: "white", borderRadius: "12px",
    padding: "24px", border: "1px solid #e2e8f0", marginBottom: "20px" }
  const inputStyle = { width: "100%", padding: "10px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }
  const labelStyle = { display: "block", marginBottom: "6px",
    fontWeight: "500", fontSize: "14px", color: "#374151" }

  const cycleStatusColors = {
    not_started: "#94a3b8", in_progress: "#3b82f6",
    passed: "#10b981", failed: "#ef4444", blocked: "#f97316"
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Testing" />
      <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              {cycle?.name}
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>
              📁 {cycle?.projects?.name}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <select value={cycle?.status || "not_started"}
              onChange={e => updateCycleStatus(e.target.value)}
              style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "14px",
                fontWeight: "600", border: `2px solid ${cycleStatusColors[cycle?.status] || "#94a3b8"}`,
                color: cycleStatusColors[cycle?.status] || "#94a3b8",
                backgroundColor: "white", cursor: "pointer" }}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Cases", value: total, color: "#3b82f6" },
            { label: "Passed", value: passed, color: "#10b981" },
            { label: "Failed", value: failed, color: "#ef4444" },
            { label: "Pass Rate", value: `${passRate}%`, color: passRate >= 80 ? "#10b981" : passRate >= 60 ? "#f59e0b" : "#ef4444" }
          ].map(item => (
            <div key={item.label} style={{ backgroundColor: "white", borderRadius: "12px",
              padding: "20px", border: "1px solid #e2e8f0", textAlign: "center",
              borderTop: `4px solid ${item.color}` }}>
              <p style={{ fontSize: "32px", fontWeight: "700", color: item.color, margin: "0 0 4px 0" }}>
                {item.value}
              </p>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{item.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: "8px 18px", borderRadius: "8px", border: "none",
                cursor: "pointer", fontSize: "14px", fontWeight: "500",
                backgroundColor: activeTab === tab.id ? "#06b6d4" : "#e2e8f0",
                color: activeTab === tab.id ? "white" : "#475569" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "cases" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
              <button onClick={() => setShowAddCase(!showAddCase)}
                style={{ backgroundColor: "#06b6d4", color: "white", border: "none",
                  padding: "10px 20px", borderRadius: "8px", cursor: "pointer",
                  fontWeight: "600", fontSize: "14px" }}>
                {showAddCase ? "Cancel" : "+ Add Test Case"}
              </button>
            </div>

            {showAddCase && (
              <div style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                  New Test Case
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Test Name *</label>
                    <input value={newCase.name}
                      onChange={e => setNewCase(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Verify estimate calculates correctly for 4-color job"
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Scenario</label>
                    <textarea value={newCase.scenario}
                      onChange={e => setNewCase(prev => ({ ...prev, scenario: e.target.value }))}
                      placeholder="Describe the test scenario..."
                      rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Expected Result</label>
                    <textarea value={newCase.expected_result}
                      onChange={e => setNewCase(prev => ({ ...prev, expected_result: e.target.value }))}
                      placeholder="What should happen when this test passes?"
                      rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Severity</label>
                    <select value={newCase.severity}
                      onChange={e => setNewCase(prev => ({ ...prev, severity: e.target.value }))}
                      style={inputStyle}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <button onClick={addCase} disabled={saving}
                  style={{ marginTop: "16px", backgroundColor: "#06b6d4", color: "white",
                    border: "none", padding: "10px 24px", borderRadius: "6px",
                    cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
                  {saving ? "Adding..." : "Add Test Case"}
                </button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {cases.map(tc => (
                <div key={tc.id} style={{ backgroundColor: "white", borderRadius: "12px",
                  padding: "16px 20px", border: "1px solid #e2e8f0",
                  borderLeft: `4px solid ${severityColors[tc.severity] || "#94a3b8"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px 0", fontSize: "15px",
                        fontWeight: "600", color: "#1e293b" }}>
                        {tc.name}
                      </p>
                      {tc.scenario && (
                        <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>
                          {tc.scenario}
                        </p>
                      )}
                      {tc.expected_result && (
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                          Expected: {tc.expected_result}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginLeft: "16px",
                      alignItems: "center" }}>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px",
                        backgroundColor: (severityColors[tc.severity] || "#94a3b8") + "20",
                        color: severityColors[tc.severity] || "#94a3b8",
                        fontWeight: "600", textTransform: "capitalize" }}>
                        {tc.severity}
                      </span>
                      <button onClick={() => updateCaseStatus(tc.id, "passed")}
                        style={{ backgroundColor: tc.status === "passed" ? "#10b981" : "#f0fdf4",
                          color: tc.status === "passed" ? "white" : "#10b981",
                          border: "1px solid #10b981", padding: "4px 12px",
                          borderRadius: "6px", cursor: "pointer", fontWeight: "600",
                          fontSize: "12px" }}>
                        ✓ Pass
                      </button>
                      <button onClick={() => updateCaseStatus(tc.id, "failed")}
                        style={{ backgroundColor: tc.status === "failed" ? "#ef4444" : "#fef2f2",
                          color: tc.status === "failed" ? "white" : "#ef4444",
                          border: "1px solid #ef4444", padding: "4px 12px",
                          borderRadius: "6px", cursor: "pointer", fontWeight: "600",
                          fontSize: "12px" }}>
                        ✗ Fail
                      </button>
                      <button onClick={() => updateCaseStatus(tc.id, "pending")}
                        style={{ backgroundColor: "#f8fafc", color: "#64748b",
                          border: "1px solid #e2e8f0", padding: "4px 12px",
                          borderRadius: "6px", cursor: "pointer", fontWeight: "600",
                          fontSize: "12px" }}>
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {cases.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  No test cases yet — add your first one above
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "summary" && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
              Test Cycle Summary
            </h2>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", color: "#64748b" }}>Overall Pass Rate</span>
                <span style={{ fontSize: "14px", fontWeight: "700",
                  color: passRate >= 80 ? "#10b981" : passRate >= 60 ? "#f59e0b" : "#ef4444" }}>
                  {passRate}%
                </span>
              </div>
              <div style={{ backgroundColor: "#e2e8f0", borderRadius: "8px",
                height: "16px", overflow: "hidden" }}>
                <div style={{ width: `${passRate}%`, height: "100%",
                  backgroundColor: passRate >= 80 ? "#10b981" : passRate >= 60 ? "#f59e0b" : "#ef4444",
                  transition: "width 0.3s" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[
                { label: "Critical Cases", value: cases.filter(c => c.severity === "critical").length, color: "#dc2626" },
                { label: "High Severity", value: cases.filter(c => c.severity === "high").length, color: "#ef4444" },
                { label: "Still Pending", value: pending, color: "#f59e0b" },
              ].map(item => (
                <div key={item.label} style={{ padding: "16px", backgroundColor: "#f8fafc",
                  borderRadius: "8px", textAlign: "center" }}>
                  <p style={{ fontSize: "28px", fontWeight: "700", color: item.color, margin: "0 0 4px 0" }}>
                    {item.value}
                  </p>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{item.label}</p>
                </div>
              ))}
            </div>
            {cycle?.notes && (
              <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "#f8fafc",
                borderRadius: "8px" }}>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", margin: "0 0 8px 0" }}>
                  Notes
                </p>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>{cycle.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
