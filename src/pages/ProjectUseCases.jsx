import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"
import UseCasesTab from "./usecases/UseCasesTab"
import TestCyclesTab from "./usecases/TestCyclesTab"
import DefectsTab from "./usecases/DefectsTab"
import SignoffTab from "./usecases/SignoffTab"
import { SAMPLE_USE_CASES, SAMPLE_DEFECTS, SAMPLE_CYCLES, SAMPLE_SIGNOFFS } from "./usecases/sampleData"
import { btn, btnOutline } from "./usecases/styles"

const TABS = [
  { id: "usecases", label: "Use Cases" },
  { id: "cycles", label: "Test Cycles" },
  { id: "defects", label: "Defects" },
  { id: "signoff", label: "Signoff Status" }
]

export default function ProjectUseCases() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("usecases")

  // Data state — starts with sample data, will be overridden by DB if available
  const [useCases, setUseCases] = useState(SAMPLE_USE_CASES)
  const [defects, setDefects] = useState(SAMPLE_DEFECTS)
  const [cycles, setCycles] = useState(SAMPLE_CYCLES)
  const [signoffs, setSignoffs] = useState(SAMPLE_SIGNOFFS)

  useEffect(() => { fetchProject() }, [id])

  const fetchProject = async () => {
    const { data: proj } = await supabase
      .from("projects").select("*, accounts(name)").eq("id", id).single()
    setProject(proj)

    // Try to load from DB; fall back to sample data
    const [{ data: ucs }, { data: defs }, { data: cycs }, { data: sigs }] = await Promise.all([
      supabase.from("use_cases").select("*").eq("project_id", id).order("created_at"),
      supabase.from("defects").select("*").eq("project_id", id).order("logged_at", { ascending: false }),
      supabase.from("uc_cycles").select("*").eq("project_id", id).order("start_date"),
      supabase.from("uc_signoffs").select("*").eq("project_id", id)
    ])

    // If DB has data, load test cases per use case and use DB data
    if (ucs && ucs.length > 0) {
      const { data: allTests } = await supabase.from("use_case_tests").select("*")
      const testsMap = {}
      ;(allTests || []).forEach(t => {
        if (!testsMap[t.use_case_id]) testsMap[t.use_case_id] = []
        testsMap[t.use_case_id].push(t)
      })
      setUseCases(ucs.map(uc => ({ ...uc, tests: testsMap[uc.id] || [] })))
      if (defs && defs.length > 0) setDefects(defs)
      if (cycs && cycs.length > 0) setCycles(cycs)
      if (sigs && sigs.length > 0) setSignoffs(sigs)
    }
    // else keep sample data

    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
          height: "calc(100vh - 64px)", color: "#64748b" }}>Loading...</div>
      </main>
    </div>
  )

  // Counts for tab badges
  const openDefects = defects.filter(d => d.status === "Open").length
  const totalTests = useCases.reduce((s, u) => s + (u.tests || []).length, 0)
  const passedTests = useCases.reduce((s, u) => s + (u.tests || []).filter(t => t.result === "Pass").length, 0)

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "16px 24px 0", backgroundColor: "white", borderBottom: "0.5px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              {/* Breadcrumb */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span onClick={() => navigate(`/projects/${id}`)}
                  style={{ fontSize: "13px", color: "#3b82f6", cursor: "pointer", fontWeight: "500" }}>
                  {project?.name || "Project"}
                </span>
                <span style={{ fontSize: "12px", color: "#cbd5e1" }}>/</span>
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>{project?.accounts?.name || "Customer"}</span>
                <span style={{ fontSize: "12px", color: "#cbd5e1" }}>/</span>
                <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: "600" }}>Use Cases & Testing</span>
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                Use Cases & Testing
              </h1>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {activeTab === "usecases" && <button style={btn("#3b82f6")}>+ New Use Case</button>}
              {activeTab === "cycles" && <button style={btn("#3b82f6")}>+ New Cycle</button>}
              {activeTab === "defects" && <button style={btn("#dc2626")}>+ Log Defect</button>}
              {activeTab === "signoff" && <button style={btn("#10b981")}>Request Signoff</button>}
              <button onClick={() => navigate(`/projects/${id}`)} style={btnOutline("#64748b")}>
                Back to Project
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div style={{ display: "flex", gap: "0" }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              let badge = null
              if (tab.id === "defects" && openDefects > 0) {
                badge = <span style={{ marginLeft: "6px", fontSize: "10px", fontWeight: "700",
                  backgroundColor: "#fee2e2", color: "#dc2626", padding: "1px 6px",
                  borderRadius: "8px" }}>{openDefects}</span>
              }
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "10px 20px", fontSize: "13px", fontWeight: "600",
                    cursor: "pointer", border: "none", backgroundColor: "transparent",
                    color: isActive ? "#3b82f6" : "#64748b",
                    borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                    transition: "all 0.15s"
                  }}>
                  {tab.label}{badge}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {activeTab === "usecases" && (
            <UseCasesTab useCases={useCases} defects={defects} signoffs={signoffs} cycles={cycles} />
          )}
          {activeTab === "cycles" && (
            <TestCyclesTab useCases={useCases} cycles={cycles} signoffs={signoffs} defects={defects} />
          )}
          {activeTab === "defects" && (
            <DefectsTab defects={defects} />
          )}
          {activeTab === "signoff" && (
            <SignoffTab useCases={useCases} signoffs={signoffs} cycles={cycles} />
          )}
        </div>
      </main>
    </div>
  )
}
