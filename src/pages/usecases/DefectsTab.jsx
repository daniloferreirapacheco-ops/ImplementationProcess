import { useState } from "react"
import { pill, tag, metaLabel, metaValue, divider, card, btn, btnOutline, STATUS_COLORS } from "./styles"

const FILTERS = ["All", "Open", "Critical", "Ready to Retest", "Resolved"]

function ActivityDot({ type }) {
  const colors = { logged: "#ef4444", assigned: "#3b82f6", comment: "#94a3b8", status: "#6366f1", resolved: "#10b981" }
  return (
    <span style={{ width: "8px", height: "8px", borderRadius: "50%", display: "inline-block",
      backgroundColor: colors[type] || "#94a3b8", marginTop: "5px", flexShrink: 0 }} />
  )
}

export default function DefectsTab({ defects, onUpdateDefect, onEditDefect, onDeleteDefect, onAddDefect }) {
  const [filter, setFilter] = useState("All")
  const [selectedId, setSelectedId] = useState(() => {
    const firstCritOpen = defects.find(d => d.severity === "Critical" && d.status === "Open")
    return firstCritOpen?.id || defects[0]?.id || null
  })

  const counts = {
    All: defects.length,
    Open: defects.filter(d => d.status === "Open").length,
    Critical: defects.filter(d => d.severity === "Critical" && d.status !== "Resolved").length,
    "Ready to Retest": defects.filter(d => d.status === "Ready to Retest").length,
    Resolved: defects.filter(d => d.status === "Resolved").length,
  }

  const filtered = defects.filter(d => {
    if (filter === "All") return true
    if (filter === "Open") return d.status === "Open"
    if (filter === "Critical") return d.severity === "Critical" && d.status !== "Resolved"
    if (filter === "Ready to Retest") return d.status === "Ready to Retest"
    if (filter === "Resolved") return d.status === "Resolved"
    return true
  })

  const selected = defects.find(d => d.id === selectedId) || filtered[0]
  const totalDefects = defects.length
  const critOpen = defects.filter(d => d.severity === "Critical" && d.status === "Open").length
  const readyRetest = defects.filter(d => d.status === "Ready to Retest").length
  const resolved = defects.filter(d => d.status === "Resolved").length

  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 160px)", overflow: "hidden" }}>
      {/* Left List Panel */}
      <div style={{ width: "340px", minWidth: "340px", borderRight: "0.5px solid #e2e8f0",
        backgroundColor: "white", display: "flex", flexDirection: "column" }}>
        {/* Filter Strip */}
        <div style={{ padding: "10px 12px", borderBottom: "0.5px solid #e2e8f0",
          display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => { setFilter(f); }}
              style={{
                padding: "3px 10px", fontSize: "11px", fontWeight: "500",
                borderRadius: "12px", cursor: "pointer",
                border: "0.5px solid " + (filter === f ? "#3b82f6" : "#d1d5db"),
                backgroundColor: filter === f ? "#3b82f6" : "white",
                color: filter === f ? "white" : "#475569"
              }}>
              {f} <span style={{ opacity: 0.7 }}>({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Defect List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map(d => (
            <div key={d.id} onClick={() => setSelectedId(d.id)}
              style={{
                padding: "12px 14px", cursor: "pointer",
                borderLeft: selectedId === d.id ? "3px solid #3b82f6" : "3px solid transparent",
                backgroundColor: selectedId === d.id ? "#eff6ff" : "white",
                borderBottom: "0.5px solid #f1f5f9"
              }}>
              <div style={{ fontSize: "13px", fontWeight: "500", color: "#1e293b", marginBottom: "6px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {d.title}
              </div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                <span style={pill(d.severity)}>{d.severity}</span>
                <span style={pill(d.status)}>{d.status}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                {d.module} · {d.use_case_name}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                {new Date(d.logged_at).toLocaleDateString()} · {d.logged_by} → {d.assigned_to}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "#94a3b8", fontSize: "13px" }}>
              No defects match this filter
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", backgroundColor: "#f8fafc" }}>
        {/* Summary Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
          {[
            { label: "Total Defects", value: totalDefects, color: "#1e293b" },
            { label: "Critical Open", value: critOpen, color: "#dc2626" },
            { label: "Ready to Retest", value: readyRetest, color: "#7c3aed" },
            { label: "Resolved", value: resolved, color: "#10b981" },
          ].map((m, i) => (
            <div key={i} style={{ ...card, padding: "12px", textAlign: "center", marginBottom: 0 }}>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", fontWeight: "500" }}>{m.label}</p>
              <p style={{ fontSize: "24px", fontWeight: "700", color: m.color, margin: 0 }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Defect Detail Card */}
        {selected && (
          <div style={{ ...card,
            borderLeft: selected.severity === "Critical" ? "3px solid #dc2626" : "none" }}>
            {/* Title + Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0, flex: 1 }}>{selected.title}</h3>
              <span style={pill(selected.severity)}>{selected.severity}</span>
              <span style={pill(selected.status)}>{selected.status}</span>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
              {selected.module && <span style={tag}>{selected.module}</span>}
              {selected.use_case_name && <span style={tag}>{selected.use_case_name}</span>}
              {selected.cycle_name && <span style={tag}>{selected.cycle_name}</span>}
            </div>

            {/* Field Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div><p style={metaLabel}>Logged By</p><p style={metaValue}>{selected.logged_by}</p></div>
              <div><p style={metaLabel}>Date Logged</p><p style={metaValue}>{new Date(selected.logged_at).toLocaleDateString()}</p></div>
              <div><p style={metaLabel}>Assigned To</p><p style={metaValue}>{selected.assigned_to}</p></div>
              <div><p style={metaLabel}>Use Case</p><p style={metaValue}>{selected.use_case_name}</p></div>
              <div><p style={metaLabel}>Test Case</p><p style={metaValue}>{selected.test_case_id || "—"}</p></div>
              <div><p style={metaLabel}>Linked Cycle</p><p style={metaValue}>{selected.cycle_name || "—"}</p></div>
            </div>

            <div style={divider} />

            {/* Description */}
            <p style={{ ...metaLabel, marginBottom: "6px" }}>Description</p>
            <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6", margin: "0 0 12px 0" }}>
              {selected.description}
            </p>

            <div style={divider} />

            {/* Structured Fields */}
            {[
              { label: "Steps to Reproduce", value: selected.steps_to_reproduce },
              { label: "Expected Result", value: selected.expected_result },
              { label: "Actual Result", value: selected.actual_result },
              { label: "Impact", value: selected.impact },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: "12px" }}>
                <p style={{ ...metaLabel, marginBottom: "4px" }}>{f.label}</p>
                <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.5", margin: 0, whiteSpace: "pre-line" }}>
                  {f.value || "—"}
                </p>
              </div>
            ))}

            <div style={divider} />

            {/* Activity Log */}
            <p style={{ ...metaLabel, marginBottom: "10px" }}>Activity</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(selected.activity_log || []).map((entry, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <ActivityDot type={entry.type} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", color: "#1e293b", lineHeight: "1.5" }}>
                      <span style={{ fontWeight: "600" }}>{entry.user}</span>
                      <span style={{ color: "#94a3b8", marginLeft: "6px" }}>
                        {new Date(entry.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#475569", margin: "2px 0 0 0", lineHeight: "1.5" }}>{entry.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={divider} />

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px" }}>
              {selected.status !== "Resolved" && (
                <>
                  <button style={btn("#10b981")} onClick={() => onUpdateDefect(selected.id, { status: "Resolved", resolved_at: new Date().toISOString() })}>Mark Resolved</button>
                  <button style={btn("#7c3aed")} onClick={() => onUpdateDefect(selected.id, { status: "Ready to Retest" })}>Send to Retest</button>
                  <button style={btn("#dc2626")} onClick={() => onUpdateDefect(selected.id, { severity: "Critical" })}>Escalate</button>
                </>
              )}
              <button style={btnOutline("#64748b")}>Add Comment</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
