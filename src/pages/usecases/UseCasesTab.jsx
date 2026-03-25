import { useState } from "react"
import { pill, tag, metaLabel, metaValue, divider, card, btn, btnOutline, STATUS_COLORS } from "./styles"

function CircleProgress({ passed, failed, pending, size = 90 }) {
  const total = passed + failed + pending
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const passArc = total > 0 ? (passed / total) * circ : 0
  const failArc = total > 0 ? (failed / total) * circ : 0
  return (
    <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#10b981" strokeWidth="7"
        strokeDasharray={`${passArc} ${circ}`} strokeDashoffset="0"
        transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="round" />
      {failed > 0 && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ef4444" strokeWidth="7"
        strokeDasharray={`${failArc} ${circ}`} strokeDashoffset={`-${passArc}`}
        transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="round" />}
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize="20" fontWeight="700" fill="#1e293b">{pct}%</text>
    </svg>
  )
}

export default function UseCasesTab({ useCases, defects, signoffs, cycles, onEditUseCase, onDeleteUseCase, onAddUseCase }) {
  const [selectedId, setSelectedId] = useState(useCases[0]?.id || null)
  const selected = useCases.find(u => u.id === selectedId) || useCases[0]
  const selTests = selected?.tests || []
  const selDefects = defects.filter(d => d.use_case_id === selected?.id)
  const selSignoffs = signoffs.filter(s => s.use_case_id === selected?.id)
  const failedTest = selTests.find(t => t.result === "Fail")
  const failedDefect = failedTest ? defects.find(d => d.test_case_id === failedTest.id && d.status !== "Resolved") : null

  const passed = selTests.filter(t => t.result === "Pass").length
  const failed = selTests.filter(t => t.result === "Fail").length
  const pending = selTests.filter(t => !t.result).length

  // Overall project stats
  const allTests = useCases.flatMap(u => u.tests || [])
  const allPassed = allTests.filter(t => t.result === "Pass").length
  const allFailed = allTests.filter(t => t.result === "Fail").length
  const ucComplete = useCases.filter(u => u.status === "Passed").length
  const critOpen = defects.filter(d => d.severity === "Critical" && d.status === "Open").length

  const cycle = cycles.find(c => c.id === selected?.cycle_id)

  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 160px)", overflow: "hidden" }}>
      {/* Left List Panel */}
      <div style={{ width: "260px", minWidth: "260px", borderRight: "0.5px solid #e2e8f0",
        backgroundColor: "white", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #e2e8f0",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>Use Cases</span>
          <button onClick={onAddUseCase} style={{ width: "26px", height: "26px", borderRadius: "6px", border: "0.5px solid #d1d5db",
            backgroundColor: "white", cursor: "pointer", fontSize: "14px", color: "#3b82f6",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>+</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {useCases.map(uc => (
            <div key={uc.id} onClick={() => setSelectedId(uc.id)}
              style={{
                padding: "10px 14px", cursor: "pointer",
                borderLeft: selectedId === uc.id ? "3px solid #3b82f6" : "3px solid transparent",
                backgroundColor: selectedId === uc.id ? "#eff6ff" : "white",
                borderBottom: "0.5px solid #f1f5f9"
              }}>
              <div style={{ fontSize: "13px", fontWeight: "500", color: "#1e293b", marginBottom: "4px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uc.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={pill(uc.status)}>{uc.status}</span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{(uc.tests || []).length} tests</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", backgroundColor: "#f8fafc" }}>
        {selected && (
          <>
            {/* Use Case Definition Card */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{selected.name}</h3>
                  <span style={pill(selected.status)}>{selected.status}</span>
                </div>
                <button style={btnOutline("#64748b")} onClick={() => onEditUseCase && onEditUseCase(selected)}>Edit</button>
              </div>

              <div style={{ display: "flex", gap: "4px", marginBottom: "14px", flexWrap: "wrap" }}>
                {selected.module && <span style={tag}>{selected.module}</span>}
                {selected.workflow_area && <span style={tag}>{selected.workflow_area}</span>}
                {(selected.type_tags || []).map(t => <span key={t} style={tag}>{t}</span>)}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div><p style={metaLabel}>Module</p><p style={metaValue}>{selected.module || "—"}</p></div>
                <div><p style={metaLabel}>Owner</p><p style={metaValue}>{selected.owner || "—"}</p></div>
                <div><p style={metaLabel}>Priority</p><p style={metaValue}>
                  <span style={pill(selected.priority)}>{selected.priority}</span>
                </p></div>
                <div><p style={metaLabel}>Cycle</p><p style={metaValue}>{cycle?.name || "—"}</p></div>
              </div>

              <div style={divider} />
              <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6", margin: "0 0 12px 0" }}>
                {selected.description}
              </p>

              <div style={divider} />
              <p style={{ ...metaLabel, marginBottom: "8px" }}>Expected Workflow Steps</p>
              <ol style={{ margin: 0, paddingLeft: "20px" }}>
                {(selected.expected_steps || []).map((step, i) => (
                  <li key={i} style={{ fontSize: "13px", color: "#334155", marginBottom: "4px", lineHeight: "1.5" }}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Test Cases Table Card */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  Test Cases ({selTests.length})
                </h3>
                <button style={btn("#3b82f6")} onClick={onAddUseCase}>+ Add Test</button>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ width: "28px", padding: "6px 4px", borderBottom: "0.5px solid #e2e8f0" }}></th>
                    <th style={{ padding: "6px 8px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                      textAlign: "left", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Test Case</th>
                    <th style={{ padding: "6px 8px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                      textAlign: "left", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Expected</th>
                    <th style={{ padding: "6px 8px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                      textAlign: "center", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Result</th>
                    <th style={{ padding: "6px 8px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                      textAlign: "center", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                    <th style={{ padding: "6px 8px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                      textAlign: "left", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tester</th>
                  </tr>
                </thead>
                <tbody>
                  {selTests.map(tc => (
                    <tr key={tc.id} style={{
                      backgroundColor: tc.result === "Fail" ? "#fef2f2" : "white"
                    }}>
                      <td style={{ padding: "8px 4px", borderBottom: "0.5px solid #f1f5f9", textAlign: "center" }}>
                        {tc.result === "Pass" ? (
                          <span style={{ color: "#10b981", fontSize: "16px" }}>&#10003;</span>
                        ) : tc.result === "Fail" ? (
                          <span style={{ color: "#ef4444", fontSize: "14px", fontWeight: "700" }}>&#10005;</span>
                        ) : (
                          <span style={{ display: "inline-block", width: "14px", height: "14px",
                            border: "1.5px solid #d1d5db", borderRadius: "3px" }} />
                        )}
                      </td>
                      <td style={{ padding: "8px", fontSize: "13px", fontWeight: "500", color: "#1e293b",
                        borderBottom: "0.5px solid #f1f5f9" }}>{tc.name}</td>
                      <td style={{ padding: "8px", fontSize: "12px", color: "#94a3b8",
                        borderBottom: "0.5px solid #f1f5f9", maxWidth: "220px", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tc.expected_outcome}</td>
                      <td style={{ padding: "8px", borderBottom: "0.5px solid #f1f5f9", textAlign: "center" }}>
                        {tc.result ? <span style={pill(tc.result)}>{tc.result}</span> : <span style={{ color: "#cbd5e1", fontSize: "11px" }}>—</span>}
                      </td>
                      <td style={{ padding: "8px", borderBottom: "0.5px solid #f1f5f9", textAlign: "center" }}>
                        <span style={pill(tc.status)}>{tc.status}</span>
                      </td>
                      <td style={{ padding: "8px", fontSize: "12px", color: "#64748b",
                        borderBottom: "0.5px solid #f1f5f9" }}>{tc.tester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Failure Detail Card (if any failed test) */}
            {failedDefect && (
              <div style={{ ...card, borderLeft: "3px solid #ef4444" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#dc2626", margin: "0 0 8px 0" }}>
                  {failedDefect.title}
                </h3>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", margin: "0 0 14px 0" }}>
                  {failedDefect.description}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div><p style={metaLabel}>Logged By</p><p style={metaValue}>{failedDefect.logged_by}</p></div>
                  <div><p style={metaLabel}>Date</p><p style={metaValue}>{new Date(failedDefect.logged_at).toLocaleDateString()}</p></div>
                  <div><p style={metaLabel}>Severity</p><p style={metaValue}><span style={pill(failedDefect.severity)}>{failedDefect.severity}</span></p></div>
                  <div><p style={metaLabel}>Assigned To</p><p style={metaValue}>{failedDefect.assigned_to}</p></div>
                </div>
                <div style={divider} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={btn("#10b981")}>Mark Resolved</button>
                  <button style={btn("#6366f1")}>Retest</button>
                  <button style={btn("#dc2626")}>Escalate</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Summary Panel */}
      <div style={{ width: "280px", minWidth: "280px", borderLeft: "0.5px solid #e2e8f0",
        backgroundColor: "white", overflowY: "auto", padding: "16px" }}>

        {/* Completion */}
        <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "0.5px solid #e2e8f0" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Completion</p>
          <CircleProgress passed={passed} failed={failed} pending={pending} />
          <div style={{ display: "flex", justifyContent: "center", gap: "14px", marginTop: "10px" }}>
            {[
              { label: "Passed", count: passed, color: "#10b981" },
              { label: "Failed", count: failed, color: "#ef4444" },
              { label: "Pending", count: pending, color: "#cbd5e1" }
            ].map(d => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: d.color, display: "inline-block" }} />
                <span style={{ fontSize: "11px", color: "#64748b" }}>{d.count} {d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* This Use Case */}
        <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "0.5px solid #e2e8f0" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>This Use Case</p>
          {[
            { label: "Cycle", value: cycle?.name || "—" },
            { label: "Owner", value: selected?.owner || "—" },
            { label: "Priority", value: selected?.priority || "—" },
            { label: "Last Updated", value: "Mar 18, 2026" },
            { label: "Open Issues", value: selDefects.filter(d => d.status === "Open").length.toString() }
          ].map(f => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>{f.label}</span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>{f.value}</span>
            </div>
          ))}
        </div>

        {/* Overall Project */}
        <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "0.5px solid #e2e8f0" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Overall Project</p>
          {[
            { label: "Use Cases Complete", value: ucComplete, total: useCases.length, color: "#3b82f6" },
            { label: "Tests Passed", value: allPassed, total: allTests.length, color: "#10b981" },
            { label: "Critical Issues Open", value: critOpen, total: Math.max(critOpen, 1), color: "#ef4444" }
          ].map(b => {
            const pct = b.total > 0 ? Math.round((b.value / b.total) * 100) : 0
            return (
              <div key={b.label} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                  <span style={{ color: "#64748b" }}>{b.label}</span>
                  <span style={{ fontWeight: "600", color: "#1e293b" }}>{b.value}/{b.total}</span>
                </div>
                <div style={{ height: "5px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", backgroundColor: b.color, borderRadius: "3px" }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Signoff */}
        <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "0.5px solid #e2e8f0" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Signoff</p>
          {selSignoffs.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "14px", height: "14px", borderRadius: "50%", display: "inline-flex",
                alignItems: "center", justifyContent: "center",
                backgroundColor: s.signed ? "#10b981" : "white",
                border: s.signed ? "none" : "1.5px solid #d1d5db" }}>
                {s.signed && <span style={{ color: "white", fontSize: "9px", fontWeight: "700" }}>&#10003;</span>}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#1e293b" }}>{s.signer_name}</span>
                <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "6px" }}>{s.signer_role}</span>
              </div>
              <span style={{ fontSize: "11px", color: s.signed ? "#10b981" : "#94a3b8" }}>
                {s.signed ? new Date(s.signed_at).toLocaleDateString() : "Pending"}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <button style={{ ...btn("#3b82f6"), width: "100%", marginBottom: "8px", textAlign: "center" }}>
          Send reminder to customer
        </button>
        <button style={{ ...btnOutline("#3b82f6"), width: "100%", textAlign: "center" }}>
          Generate test report
        </button>
      </div>
    </div>
  )
}
