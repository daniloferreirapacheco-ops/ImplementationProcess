import { pill, metaLabel, card, btn, btnOutline, divider } from "./styles"

export default function SignoffTab({ useCases, signoffs, onToggleSignoff, onDeleteSignoff, onAddSignoff }) {
  const allSignoffs = signoffs
  const totalRequired = allSignoffs.length
  const totalSigned = allSignoffs.filter(s => s.signed).length
  const pct = totalRequired > 0 ? Math.round((totalSigned / totalRequired) * 100) : 0

  // Group by use case
  const ucGroups = useCases.map(uc => {
    const ucSigs = signoffs.filter(s => s.use_case_id === uc.id)
    const signed = ucSigs.filter(s => s.signed).length
    const total = ucSigs.length
    const complete = total > 0 && signed === total
    return { ...uc, sigs: ucSigs, signed, total, complete }
  })

  const fullySignedOff = ucGroups.filter(g => g.complete).length
  const partiallySignedOff = ucGroups.filter(g => g.signed > 0 && !g.complete).length
  const notSignedOff = ucGroups.filter(g => g.signed === 0).length

  // Unique signers
  const signerMap = {}
  allSignoffs.forEach(s => {
    if (!signerMap[s.signer_name]) signerMap[s.signer_name] = { name: s.signer_name, role: s.signer_role, signed: 0, total: 0 }
    signerMap[s.signer_name].total++
    if (s.signed) signerMap[s.signer_name].signed++
  })
  const signers = Object.values(signerMap)

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "16px 20px" }}>
      {/* Summary Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Overall Progress", value: `${pct}%`, sub: `${totalSigned} of ${totalRequired} signoffs`, color: "#3b82f6" },
          { label: "Fully Signed Off", value: fullySignedOff, sub: `of ${useCases.length} use cases`, color: "#10b981" },
          { label: "Partially Signed", value: partiallySignedOff, sub: "awaiting remaining", color: "#f59e0b" },
          { label: "Not Signed", value: notSignedOff, sub: "not yet started", color: "#94a3b8" },
        ].map((m, i) => (
          <div key={i} style={{ ...card, padding: "16px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 6px 0", fontWeight: "500" }}>{m.label}</p>
            <p style={{ fontSize: "32px", fontWeight: "700", color: m.color, margin: "0 0 2px 0" }}>{m.value}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Signer Summary */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", margin: "0 0 14px 0" }}>Signer Progress</h3>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${signers.length}, 1fr)`, gap: "16px" }}>
          {signers.map(s => {
            const sPct = s.total > 0 ? Math.round((s.signed / s.total) * 100) : 0
            return (
              <div key={s.name} style={{ textAlign: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", margin: "0 auto 8px",
                  background: `conic-gradient(${sPct === 100 ? "#10b981" : "#3b82f6"} ${sPct * 3.6}deg, #e2e8f0 0deg)`,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: "700", color: sPct === 100 ? "#10b981" : "#1e293b" }}>{sPct}%</div>
                </div>
                <p style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", margin: "0 0 1px 0" }}>{s.name}</p>
                <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{s.role}</p>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>{s.signed}/{s.total} signed</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Use Case Signoff Table */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", margin: 0 }}>Use Case Signoff Status</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={btn("#3b82f6")}>Send All Reminders</button>
            <button style={btnOutline("#64748b")}>Export Report</button>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                textAlign: "left", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Use Case</th>
              <th style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                textAlign: "center", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Test Status</th>
              {signers.map(s => (
                <th key={s.name} style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                  textAlign: "center", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.name.split(" ")[0]}</th>
              ))}
              <th style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "600", color: "#64748b",
                textAlign: "center", borderBottom: "0.5px solid #e2e8f0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Overall</th>
            </tr>
          </thead>
          <tbody>
            {ucGroups.map(uc => (
              <tr key={uc.id} style={{ borderBottom: "0.5px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "500", color: "#1e293b" }}>{uc.name}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{uc.module}</div>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <span style={pill(uc.status)}>{uc.status}</span>
                </td>
                {signers.map(signer => {
                  const sig = uc.sigs.find(s => s.signer_name === signer.name)
                  return (
                    <td key={signer.name} style={{ padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                        <span onClick={() => sig && onToggleSignoff && onToggleSignoff(sig.id, sig.signed)} style={{
                          width: "20px", height: "20px", borderRadius: "50%", display: "inline-flex",
                          alignItems: "center", justifyContent: "center", cursor: sig ? "pointer" : "default",
                          backgroundColor: sig?.signed ? "#10b981" : "white",
                          border: sig?.signed ? "none" : "1.5px solid #d1d5db"
                        }}>
                          {sig?.signed && <span style={{ color: "white", fontSize: "11px", fontWeight: "700" }}>&#10003;</span>}
                        </span>
                        {sig?.signed && (
                          <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                            {new Date(sig.signed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </td>
                  )
                })}
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <span style={pill(uc.complete ? "Passed" : uc.signed > 0 ? "In Progress" : "Not Started")}>
                    {uc.complete ? "Complete" : uc.signed > 0 ? `${uc.signed}/${uc.total}` : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
