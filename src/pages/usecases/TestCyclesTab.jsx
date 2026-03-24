import { pill, metaLabel, metaValue, divider, card, btn, btnOutline, STATUS_COLORS } from "./styles"

function MiniDots({ tests }) {
  return (
    <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", justifyContent: "center" }}>
      {tests.map((t, i) => (
        <span key={i} style={{
          width: "10px", height: "10px", borderRadius: "50%", display: "inline-block",
          backgroundColor: t.result === "Pass" ? "#10b981" : t.result === "Fail" ? "#ef4444" : "#cbd5e1"
        }} />
      ))}
    </div>
  )
}

function SignoffDots({ signoffs }) {
  return (
    <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
      {signoffs.map((s, i) => (
        <span key={i} style={{
          width: "12px", height: "12px", borderRadius: "50%", display: "inline-block",
          backgroundColor: s.signed ? "#10b981" : "white",
          border: s.signed ? "none" : "1.5px solid #d1d5db"
        }} />
      ))}
    </div>
  )
}

export default function TestCyclesTab({ useCases, cycles, signoffs, defects }) {
  // Aggregate stats
  const allTests = useCases.flatMap(u => u.tests || [])
  const totalTests = allTests.length
  const passedCount = allTests.filter(t => t.result === "Pass").length
  const failedBlocked = allTests.filter(t => t.result === "Fail" || t.status === "Blocked").length
  const notRun = allTests.filter(t => !t.result && t.status !== "Blocked").length
  const passRate = totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "16px 20px" }}>
      {/* Summary Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Test Cases", value: totalTests, sub: `Across ${useCases.length} use cases`, color: "#1e293b" },
          { label: "Passed", value: passedCount, sub: `${passRate}% pass rate`, color: "#10b981" },
          { label: "Failed / Blocked", value: failedBlocked, sub: `${totalTests > 0 ? Math.round((failedBlocked / totalTests) * 100) : 0}% of total`, color: "#ef4444" },
          { label: "Not Yet Run", value: notRun, sub: `${totalTests > 0 ? Math.round((notRun / totalTests) * 100) : 0}% remaining`, color: "#94a3b8" },
        ].map((m, i) => (
          <div key={i} style={{ ...card, padding: "16px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 6px 0", fontWeight: "500" }}>{m.label}</p>
            <p style={{ fontSize: "32px", fontWeight: "700", color: m.color, margin: "0 0 2px 0" }}>{m.value}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Active/Planned Cycles */}
      {cycles.map(cycle => {
        const cycleUCs = useCases.filter(u => cycle.use_case_ids.includes(u.id))
        const cycleTests = cycleUCs.flatMap(u => u.tests || [])
        const cPassed = cycleTests.filter(t => t.result === "Pass").length
        const cFailed = cycleTests.filter(t => t.result === "Fail").length
        const cPending = cycleTests.filter(t => !t.result).length
        const cTotal = cycleTests.length
        const cPct = cTotal > 0 ? Math.round((cPassed / cTotal) * 100) : 0
        const ucSignedOff = cycleUCs.filter(u => {
          const uSigs = signoffs.filter(s => s.use_case_id === u.id)
          return uSigs.length > 0 && uSigs.every(s => s.signed)
        }).length
        const isPlanned = cycle.status === "Planned"

        return (
          <div key={cycle.id} style={{
            ...card, padding: 0, marginBottom: "16px",
            border: isPlanned ? "1.5px dashed #d1d5db" : "0.5px solid #e2e8f0",
            opacity: isPlanned ? 0.85 : 1
          }}>
            {/* Cycle Header */}
            <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: isPlanned ? "#94a3b8" : "#1e293b", margin: 0 }}>
                    {cycle.name}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {cycle.start_date ? new Date(cycle.start_date).toLocaleDateString() : ""} – {cycle.end_date ? new Date(cycle.end_date).toLocaleDateString() : ""}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{cycle.owner}</span>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>{cycleUCs.length} use cases</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {!isPlanned && (
                    <div style={{ width: "120px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                        <span style={{ color: "#64748b" }}>Progress</span>
                        <span style={{ fontWeight: "600", color: "#1e293b" }}>{cPct}%</span>
                      </div>
                      <div style={{ height: "5px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${cPct}%`, height: "100%", backgroundColor: "#3b82f6", borderRadius: "3px" }} />
                      </div>
                    </div>
                  )}
                  <span style={pill(cycle.status)}>{cycle.status}</span>
                  <button style={isPlanned ? btnOutline("#64748b") : btn("#3b82f6")}>
                    {isPlanned ? "Configure" : "View"}
                  </button>
                </div>
              </div>
            </div>

            {/* Use Case Table */}
            {!isPlanned && (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      <th style={{ padding: "8px 16px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                        textAlign: "left", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Use Case</th>
                      <th style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                        textAlign: "left", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Owner</th>
                      <th style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                        textAlign: "center", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tests</th>
                      <th style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                        textAlign: "center", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px", color: "#10b981" }}>Passed</th>
                      <th style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                        textAlign: "center", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px", color: "#ef4444" }}>Failed</th>
                      <th style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                        textAlign: "center", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                      <th style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                        textAlign: "center", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Signoff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycleUCs.map(uc => {
                      const tests = uc.tests || []
                      const p = tests.filter(t => t.result === "Pass").length
                      const f = tests.filter(t => t.result === "Fail").length
                      const ucSigs = signoffs.filter(s => s.use_case_id === uc.id)
                      return (
                        <tr key={uc.id} style={{ borderBottom: "0.5px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ fontSize: "13px", fontWeight: "500", color: "#1e293b" }}>{uc.name}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{uc.module} · {uc.priority}</div>
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: "#64748b" }}>{uc.owner}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <MiniDots tests={tests} />
                            <div style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{tests.length}</div>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "14px", fontWeight: "600", color: p > 0 ? "#10b981" : "#cbd5e1" }}>{p}</td>
                          <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "14px", fontWeight: "600", color: f > 0 ? "#ef4444" : "#cbd5e1" }}>{f}</td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <span style={pill(uc.status)}>{uc.status}</span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <SignoffDots signoffs={ucSigs.length > 0 ? ucSigs : [{ signed: false }, { signed: false }, { signed: false }]} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Cycle Footer */}
                <div style={{ padding: "12px 16px", backgroundColor: "#f8fafc", borderTop: "0.5px solid #e2e8f0",
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                    <span><b>{cTotal}</b> tests</span>
                    <span style={{ color: "#10b981" }}><b>{cPassed}</b> passed</span>
                    <span style={{ color: "#ef4444" }}><b>{cFailed}</b> failed</span>
                    <span><b>{cPending}</b> pending</span>
                    <span><b>{ucSignedOff}</b>/{cycleUCs.length} signed off</span>
                  </div>
                  <button style={btnOutline("#64748b")}>Close Cycle</button>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
