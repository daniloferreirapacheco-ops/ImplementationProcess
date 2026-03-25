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

/* ── shared inline styles for modal overlays & forms ── */
const overlay = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(15,23,42,0.45)", zIndex: 900,
  display: "flex", justifyContent: "flex-end"
}
const slidePanel = {
  width: "480px", maxWidth: "90vw", height: "100vh",
  backgroundColor: "white", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
  display: "flex", flexDirection: "column", zIndex: 901
}
const panelHeader = (color) => ({
  padding: "20px 24px", borderBottom: "0.5px solid #e2e8f0",
  display: "flex", justifyContent: "space-between", alignItems: "center",
  backgroundColor: color || "white"
})
const panelBody = {
  flex: 1, overflowY: "auto", padding: "20px 24px"
}
const panelFooter = {
  padding: "16px 24px", borderTop: "0.5px solid #e2e8f0",
  display: "flex", justifyContent: "flex-end", gap: "8px"
}
const fieldLabel = {
  fontSize: "12px", fontWeight: "600", color: "#475569",
  marginBottom: "4px", display: "block"
}
const fieldInput = {
  width: "100%", padding: "8px 10px", fontSize: "13px",
  border: "0.5px solid #d1d5db", borderRadius: "6px",
  outline: "none", color: "#1e293b", boxSizing: "border-box"
}
const fieldSelect = {
  ...fieldInput, backgroundColor: "white", cursor: "pointer"
}
const fieldTextarea = {
  ...fieldInput, minHeight: "80px", resize: "vertical", fontFamily: "inherit"
}
const fieldGroup = { marginBottom: "14px" }
const fieldRow = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }

/* ── empty form shapes ── */
const EMPTY_USE_CASE = {
  name: "", module: "", workflow_area: "", priority: "Standard",
  owner: "", tester: "", description: ""
}
const EMPTY_CYCLE = {
  name: "", description: "", owner: "", start_date: "", end_date: ""
}
const EMPTY_DEFECT = {
  title: "", severity: "Medium", description: "", module: "", assigned_to: ""
}
const EMPTY_SIGNOFF = {
  use_case_id: "", signer_name: "", signer_role: ""
}

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

  // Modal / form state
  const [showUseCaseForm, setShowUseCaseForm] = useState(false)
  const [useCaseForm, setUseCaseForm] = useState(EMPTY_USE_CASE)
  const [editingUseCaseId, setEditingUseCaseId] = useState(null)

  const [showCycleForm, setShowCycleForm] = useState(false)
  const [cycleForm, setCycleForm] = useState(EMPTY_CYCLE)
  const [editingCycleId, setEditingCycleId] = useState(null)

  const [showDefectForm, setShowDefectForm] = useState(false)
  const [defectForm, setDefectForm] = useState(EMPTY_DEFECT)
  const [editingDefectId, setEditingDefectId] = useState(null)

  const [showSignoffForm, setShowSignoffForm] = useState(false)
  const [signoffForm, setSignoffForm] = useState(EMPTY_SIGNOFF)

  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchProject() }, [id])

  /* ───────── data loading ───────── */
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

  /* ───────── refresh helpers (reload single table from DB) ───────── */
  const refreshUseCases = async () => {
    const { data: ucs } = await supabase.from("use_cases").select("*").eq("project_id", id).order("created_at")
    if (ucs && ucs.length > 0) {
      const { data: allTests } = await supabase.from("use_case_tests").select("*")
      const testsMap = {}
      ;(allTests || []).forEach(t => {
        if (!testsMap[t.use_case_id]) testsMap[t.use_case_id] = []
        testsMap[t.use_case_id].push(t)
      })
      setUseCases(ucs.map(uc => ({ ...uc, tests: testsMap[uc.id] || [] })))
    }
  }

  const refreshDefects = async () => {
    const { data: defs } = await supabase.from("defects").select("*").eq("project_id", id).order("logged_at", { ascending: false })
    if (defs && defs.length > 0) setDefects(defs)
  }

  const refreshCycles = async () => {
    const { data: cycs } = await supabase.from("uc_cycles").select("*").eq("project_id", id).order("start_date")
    if (cycs && cycs.length > 0) setCycles(cycs)
  }

  const refreshSignoffs = async () => {
    const { data: sigs } = await supabase.from("uc_signoffs").select("*").eq("project_id", id)
    if (sigs && sigs.length > 0) setSignoffs(sigs)
  }

  /* ───────── CRUD: Use Cases ───────── */
  const openNewUseCase = () => {
    setEditingUseCaseId(null)
    setUseCaseForm(EMPTY_USE_CASE)
    setShowUseCaseForm(true)
  }

  const openEditUseCase = (uc) => {
    setEditingUseCaseId(uc.id)
    setUseCaseForm({
      name: uc.name || "",
      module: uc.module || "",
      workflow_area: uc.workflow_area || "",
      priority: uc.priority || "Standard",
      owner: uc.owner || "",
      tester: uc.tester || "",
      description: uc.description || ""
    })
    setShowUseCaseForm(true)
  }

  const saveUseCase = async () => {
    setSaving(true)
    const payload = {
      project_id: id,
      name: useCaseForm.name,
      module: useCaseForm.module,
      workflow_area: useCaseForm.workflow_area,
      priority: useCaseForm.priority,
      owner: useCaseForm.owner,
      tester: useCaseForm.tester,
      description: useCaseForm.description,
      status: "Draft"
    }

    if (editingUseCaseId) {
      const { error } = await supabase.from("use_cases").update(payload).eq("id", editingUseCaseId)
      if (!error) {
        setUseCases(prev => prev.map(uc =>
          uc.id === editingUseCaseId ? { ...uc, ...payload } : uc
        ))
      }
    } else {
      const { data, error } = await supabase.from("use_cases").insert(payload).select().single()
      if (!error && data) {
        setUseCases(prev => [...prev, { ...data, tests: [] }])
      }
    }

    setSaving(false)
    setShowUseCaseForm(false)
    refreshUseCases()
  }

  const deleteUseCase = async (ucId) => {
    await supabase.from("use_cases").delete().eq("id", ucId)
    setUseCases(prev => prev.filter(uc => uc.id !== ucId))
  }

  /* ───────── CRUD: Test Cycles ───────── */
  const openNewCycle = () => {
    setEditingCycleId(null)
    setCycleForm(EMPTY_CYCLE)
    setShowCycleForm(true)
  }

  const openEditCycle = (cycle) => {
    setEditingCycleId(cycle.id)
    setCycleForm({
      name: cycle.name || "",
      description: cycle.description || "",
      owner: cycle.owner || "",
      start_date: cycle.start_date || "",
      end_date: cycle.end_date || ""
    })
    setShowCycleForm(true)
  }

  const saveCycle = async () => {
    setSaving(true)
    const payload = {
      project_id: id,
      name: cycleForm.name,
      description: cycleForm.description,
      owner: cycleForm.owner,
      start_date: cycleForm.start_date || null,
      end_date: cycleForm.end_date || null,
      status: "Planned",
      use_case_ids: []
    }

    if (editingCycleId) {
      const { error } = await supabase.from("uc_cycles").update(payload).eq("id", editingCycleId)
      if (!error) {
        setCycles(prev => prev.map(c =>
          c.id === editingCycleId ? { ...c, ...payload } : c
        ))
      }
    } else {
      const { data, error } = await supabase.from("uc_cycles").insert(payload).select().single()
      if (!error && data) {
        setCycles(prev => [...prev, data])
      }
    }

    setSaving(false)
    setShowCycleForm(false)
    refreshCycles()
  }

  const deleteCycle = async (cycleId) => {
    await supabase.from("uc_cycles").delete().eq("id", cycleId)
    setCycles(prev => prev.filter(c => c.id !== cycleId))
  }

  /* ───────── CRUD: Defects ───────── */
  const openNewDefect = () => {
    setEditingDefectId(null)
    setDefectForm(EMPTY_DEFECT)
    setShowDefectForm(true)
  }

  const openEditDefect = (defect) => {
    setEditingDefectId(defect.id)
    setDefectForm({
      title: defect.title || "",
      severity: defect.severity || "Medium",
      description: defect.description || "",
      module: defect.module || "",
      assigned_to: defect.assigned_to || ""
    })
    setShowDefectForm(true)
  }

  const saveDefect = async () => {
    setSaving(true)
    const payload = {
      project_id: id,
      title: defectForm.title,
      severity: defectForm.severity,
      description: defectForm.description,
      module: defectForm.module,
      assigned_to: defectForm.assigned_to,
      status: "Open",
      logged_by: "Current User",
      logged_at: new Date().toISOString()
    }

    if (editingDefectId) {
      const { title, severity, description, module, assigned_to } = payload
      const { error } = await supabase.from("defects")
        .update({ title, severity, description, module, assigned_to })
        .eq("id", editingDefectId)
      if (!error) {
        setDefects(prev => prev.map(d =>
          d.id === editingDefectId ? { ...d, title, severity, description, module, assigned_to } : d
        ))
      }
    } else {
      const { data, error } = await supabase.from("defects").insert(payload).select().single()
      if (!error && data) {
        setDefects(prev => [data, ...prev])
      }
    }

    setSaving(false)
    setShowDefectForm(false)
    refreshDefects()
  }

  const updateDefect = async (defectId, updates) => {
    const { error } = await supabase.from("defects").update(updates).eq("id", defectId)
    if (!error) {
      setDefects(prev => prev.map(d => d.id === defectId ? { ...d, ...updates } : d))
    }
  }

  const deleteDefect = async (defectId) => {
    await supabase.from("defects").delete().eq("id", defectId)
    setDefects(prev => prev.filter(d => d.id !== defectId))
  }

  /* ───────── CRUD: Signoffs ───────── */
  const openNewSignoff = () => {
    setSignoffForm({
      ...EMPTY_SIGNOFF,
      use_case_id: useCases[0]?.id || ""
    })
    setShowSignoffForm(true)
  }

  const saveSignoff = async () => {
    setSaving(true)
    const payload = {
      project_id: id,
      use_case_id: signoffForm.use_case_id,
      signer_name: signoffForm.signer_name,
      signer_role: signoffForm.signer_role,
      signed: false,
      signed_at: null
    }

    const { data, error } = await supabase.from("uc_signoffs").insert(payload).select().single()
    if (!error && data) {
      setSignoffs(prev => [...prev, data])
    }

    setSaving(false)
    setShowSignoffForm(false)
    refreshSignoffs()
  }

  const toggleSignoff = async (signoffId, currentSigned) => {
    const newSigned = !currentSigned
    const newSignedAt = newSigned ? new Date().toISOString() : null
    const { error } = await supabase.from("uc_signoffs")
      .update({ signed: newSigned, signed_at: newSignedAt })
      .eq("id", signoffId)
    if (!error) {
      setSignoffs(prev => prev.map(s =>
        s.id === signoffId ? { ...s, signed: newSigned, signed_at: newSignedAt } : s
      ))
    }
  }

  const deleteSignoff = async (signoffId) => {
    await supabase.from("uc_signoffs").delete().eq("id", signoffId)
    setSignoffs(prev => prev.filter(s => s.id !== signoffId))
  }

  /* ───────── loading screen ───────── */
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

  /* ───────── slide-over panels ───────── */
  const renderUseCasePanel = () => {
    if (!showUseCaseForm) return null
    return (
      <div style={overlay} onClick={() => setShowUseCaseForm(false)}>
        <div style={slidePanel} onClick={e => e.stopPropagation()}>
          <div style={panelHeader("#eff6ff")}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
              {editingUseCaseId ? "Edit Use Case" : "New Use Case"}
            </h3>
            <button onClick={() => setShowUseCaseForm(false)}
              style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b", padding: "4px" }}>
              &#10005;
            </button>
          </div>
          <div style={panelBody}>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Name *</label>
              <input style={fieldInput} value={useCaseForm.name}
                onChange={e => setUseCaseForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Invoice Generation Workflow" />
            </div>
            <div style={fieldRow}>
              <div style={fieldGroup}>
                <label style={fieldLabel}>Module</label>
                <input style={fieldInput} value={useCaseForm.module}
                  onChange={e => setUseCaseForm(f => ({ ...f, module: e.target.value }))}
                  placeholder="e.g. Billing" />
              </div>
              <div style={fieldGroup}>
                <label style={fieldLabel}>Workflow Area</label>
                <input style={fieldInput} value={useCaseForm.workflow_area}
                  onChange={e => setUseCaseForm(f => ({ ...f, workflow_area: e.target.value }))}
                  placeholder="e.g. Finance" />
              </div>
            </div>
            <div style={fieldRow}>
              <div style={fieldGroup}>
                <label style={fieldLabel}>Priority</label>
                <select style={fieldSelect} value={useCaseForm.priority}
                  onChange={e => setUseCaseForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Standard">Standard</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div style={fieldGroup}>
                <label style={fieldLabel}>Owner</label>
                <input style={fieldInput} value={useCaseForm.owner}
                  onChange={e => setUseCaseForm(f => ({ ...f, owner: e.target.value }))}
                  placeholder="e.g. Sarah Mitchell" />
              </div>
            </div>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Tester</label>
              <input style={fieldInput} value={useCaseForm.tester}
                onChange={e => setUseCaseForm(f => ({ ...f, tester: e.target.value }))}
                placeholder="e.g. James Park" />
            </div>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Description</label>
              <textarea style={fieldTextarea} value={useCaseForm.description}
                onChange={e => setUseCaseForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the use case workflow and expected behavior..." />
            </div>
          </div>
          <div style={panelFooter}>
            <button style={btnOutline("#64748b")} onClick={() => setShowUseCaseForm(false)}>Cancel</button>
            <button style={{ ...btn("#3b82f6"), opacity: saving || !useCaseForm.name ? 0.6 : 1 }}
              disabled={saving || !useCaseForm.name}
              onClick={saveUseCase}>
              {saving ? "Saving..." : editingUseCaseId ? "Update Use Case" : "Create Use Case"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderCyclePanel = () => {
    if (!showCycleForm) return null
    return (
      <div style={overlay} onClick={() => setShowCycleForm(false)}>
        <div style={slidePanel} onClick={e => e.stopPropagation()}>
          <div style={panelHeader("#f0fdf4")}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
              {editingCycleId ? "Edit Test Cycle" : "New Test Cycle"}
            </h3>
            <button onClick={() => setShowCycleForm(false)}
              style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b", padding: "4px" }}>
              &#10005;
            </button>
          </div>
          <div style={panelBody}>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Cycle Name *</label>
              <input style={fieldInput} value={cycleForm.name}
                onChange={e => setCycleForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Cycle 3 — Integrations" />
            </div>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Description</label>
              <textarea style={fieldTextarea} value={cycleForm.description}
                onChange={e => setCycleForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what this test cycle covers..." />
            </div>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Owner</label>
              <input style={fieldInput} value={cycleForm.owner}
                onChange={e => setCycleForm(f => ({ ...f, owner: e.target.value }))}
                placeholder="e.g. Sarah Mitchell" />
            </div>
            <div style={fieldRow}>
              <div style={fieldGroup}>
                <label style={fieldLabel}>Start Date</label>
                <input style={fieldInput} type="date" value={cycleForm.start_date}
                  onChange={e => setCycleForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div style={fieldGroup}>
                <label style={fieldLabel}>End Date</label>
                <input style={fieldInput} type="date" value={cycleForm.end_date}
                  onChange={e => setCycleForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
          </div>
          <div style={panelFooter}>
            <button style={btnOutline("#64748b")} onClick={() => setShowCycleForm(false)}>Cancel</button>
            <button style={{ ...btn("#3b82f6"), opacity: saving || !cycleForm.name ? 0.6 : 1 }}
              disabled={saving || !cycleForm.name}
              onClick={saveCycle}>
              {saving ? "Saving..." : editingCycleId ? "Update Cycle" : "Create Cycle"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderDefectPanel = () => {
    if (!showDefectForm) return null
    return (
      <div style={overlay} onClick={() => setShowDefectForm(false)}>
        <div style={slidePanel} onClick={e => e.stopPropagation()}>
          <div style={panelHeader("#fef2f2")}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
              {editingDefectId ? "Edit Defect" : "Log Defect"}
            </h3>
            <button onClick={() => setShowDefectForm(false)}
              style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b", padding: "4px" }}>
              &#10005;
            </button>
          </div>
          <div style={panelBody}>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Title *</label>
              <input style={fieldInput} value={defectForm.title}
                onChange={e => setDefectForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief summary of the defect" />
            </div>
            <div style={fieldRow}>
              <div style={fieldGroup}>
                <label style={fieldLabel}>Severity</label>
                <select style={fieldSelect} value={defectForm.severity}
                  onChange={e => setDefectForm(f => ({ ...f, severity: e.target.value }))}>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div style={fieldGroup}>
                <label style={fieldLabel}>Module</label>
                <input style={fieldInput} value={defectForm.module}
                  onChange={e => setDefectForm(f => ({ ...f, module: e.target.value }))}
                  placeholder="e.g. Production" />
              </div>
            </div>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Assigned To</label>
              <input style={fieldInput} value={defectForm.assigned_to}
                onChange={e => setDefectForm(f => ({ ...f, assigned_to: e.target.value }))}
                placeholder="e.g. James Park" />
            </div>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Description</label>
              <textarea style={fieldTextarea} value={defectForm.description}
                onChange={e => setDefectForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what went wrong, steps to reproduce, expected vs actual..." />
            </div>
          </div>
          <div style={panelFooter}>
            <button style={btnOutline("#64748b")} onClick={() => setShowDefectForm(false)}>Cancel</button>
            <button style={{ ...btn("#dc2626"), opacity: saving || !defectForm.title ? 0.6 : 1 }}
              disabled={saving || !defectForm.title}
              onClick={saveDefect}>
              {saving ? "Saving..." : editingDefectId ? "Update Defect" : "Log Defect"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderSignoffPanel = () => {
    if (!showSignoffForm) return null
    return (
      <div style={overlay} onClick={() => setShowSignoffForm(false)}>
        <div style={slidePanel} onClick={e => e.stopPropagation()}>
          <div style={panelHeader("#f0fdf4")}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
              Request Signoff
            </h3>
            <button onClick={() => setShowSignoffForm(false)}
              style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b", padding: "4px" }}>
              &#10005;
            </button>
          </div>
          <div style={panelBody}>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Use Case *</label>
              <select style={fieldSelect} value={signoffForm.use_case_id}
                onChange={e => setSignoffForm(f => ({ ...f, use_case_id: e.target.value }))}>
                <option value="">Select a use case...</option>
                {useCases.map(uc => (
                  <option key={uc.id} value={uc.id}>{uc.name}</option>
                ))}
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Signer Name *</label>
              <input style={fieldInput} value={signoffForm.signer_name}
                onChange={e => setSignoffForm(f => ({ ...f, signer_name: e.target.value }))}
                placeholder="e.g. Mark Reynolds" />
            </div>
            <div style={fieldGroup}>
              <label style={fieldLabel}>Signer Role *</label>
              <input style={fieldInput} value={signoffForm.signer_role}
                onChange={e => setSignoffForm(f => ({ ...f, signer_role: e.target.value }))}
                placeholder="e.g. Operations Director" />
            </div>
          </div>
          <div style={panelFooter}>
            <button style={btnOutline("#64748b")} onClick={() => setShowSignoffForm(false)}>Cancel</button>
            <button style={{ ...btn("#10b981"), opacity: saving || !signoffForm.use_case_id || !signoffForm.signer_name || !signoffForm.signer_role ? 0.6 : 1 }}
              disabled={saving || !signoffForm.use_case_id || !signoffForm.signer_name || !signoffForm.signer_role}
              onClick={saveSignoff}>
              {saving ? "Saving..." : "Request Signoff"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ───────── main render ───────── */
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
              {activeTab === "usecases" && <button style={btn("#3b82f6")} onClick={openNewUseCase}>+ New Use Case</button>}
              {activeTab === "cycles" && <button style={btn("#3b82f6")} onClick={openNewCycle}>+ New Cycle</button>}
              {activeTab === "defects" && <button style={btn("#dc2626")} onClick={openNewDefect}>+ Log Defect</button>}
              {activeTab === "signoff" && <button style={btn("#10b981")} onClick={openNewSignoff}>Request Signoff</button>}
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
            <UseCasesTab
              useCases={useCases} defects={defects} signoffs={signoffs} cycles={cycles}
              setUseCases={setUseCases} setDefects={setDefects} setSignoffs={setSignoffs}
              onEditUseCase={openEditUseCase} onDeleteUseCase={deleteUseCase}
              onAddUseCase={openNewUseCase}
            />
          )}
          {activeTab === "cycles" && (
            <TestCyclesTab
              useCases={useCases} cycles={cycles} signoffs={signoffs} defects={defects}
              setCycles={setCycles}
              onEditCycle={openEditCycle} onDeleteCycle={deleteCycle}
              onAddCycle={openNewCycle}
            />
          )}
          {activeTab === "defects" && (
            <DefectsTab
              defects={defects}
              setDefects={setDefects}
              onEditDefect={openEditDefect} onDeleteDefect={deleteDefect}
              onAddDefect={openNewDefect}
              onUpdateDefect={updateDefect}
            />
          )}
          {activeTab === "signoff" && (
            <SignoffTab
              useCases={useCases} signoffs={signoffs} cycles={cycles}
              setSignoffs={setSignoffs}
              onToggleSignoff={toggleSignoff} onDeleteSignoff={deleteSignoff}
              onAddSignoff={openNewSignoff}
            />
          )}
        </div>
      </main>

      {/* Slide-over Panels */}
      {renderUseCasePanel()}
      {renderCyclePanel()}
      {renderDefectPanel()}
      {renderSignoffPanel()}
    </div>
  )
}
