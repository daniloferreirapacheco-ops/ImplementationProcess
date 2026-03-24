// Shared styles & constants for Use Cases & Testing

export const STATUS_COLORS = {
  "Passed": { bg: "#dcfce7", text: "#166534" },
  "Resolved": { bg: "#dcfce7", text: "#166534" },
  "Failed": { bg: "#fee2e2", text: "#991b1b" },
  "Critical": { bg: "#fee2e2", text: "#991b1b" },
  "Blocked": { bg: "#fee2e2", text: "#991b1b" },
  "In Progress": { bg: "#dbeafe", text: "#1e40af" },
  "Pending": { bg: "#f1f5f9", text: "#475569" },
  "Not Started": { bg: "#f1f5f9", text: "#475569" },
  "Draft": { bg: "#f1f5f9", text: "#475569" },
  "Complete": { bg: "#dcfce7", text: "#166534" },
  "Closed": { bg: "#e2e8f0", text: "#334155" },
  "Planned": { bg: "#f1f5f9", text: "#475569" },
  "Ready to Retest": { bg: "#f3e8ff", text: "#6b21a8" },
  "Open": { bg: "#fee2e2", text: "#991b1b" },
  "Pass": { bg: "#dcfce7", text: "#166534" },
  "Fail": { bg: "#fee2e2", text: "#991b1b" },
  "High": { bg: "#fef3c7", text: "#92400e" },
  "Medium": { bg: "#e0f2fe", text: "#075985" },
  "Low": { bg: "#f1f5f9", text: "#475569" },
  "Standard": { bg: "#f1f5f9", text: "#475569" },
}

export const pill = (status) => {
  const c = STATUS_COLORS[status] || { bg: "#f1f5f9", text: "#475569" }
  return {
    display: "inline-block", fontSize: "11px", fontWeight: "600",
    padding: "2px 8px", borderRadius: "10px",
    backgroundColor: c.bg, color: c.text, whiteSpace: "nowrap"
  }
}

export const tag = {
  display: "inline-block", fontSize: "11px", fontWeight: "500",
  padding: "2px 8px", borderRadius: "4px",
  backgroundColor: "#f1f5f9", color: "#475569", marginRight: "4px"
}

export const metaLabel = {
  fontSize: "11px", color: "#94a3b8", textTransform: "uppercase",
  letterSpacing: "0.5px", margin: "0 0 2px 0", fontWeight: "500"
}

export const metaValue = {
  fontSize: "13px", color: "#1e293b", fontWeight: "600", margin: 0
}

export const divider = {
  borderTop: "0.5px solid #e2e8f0", margin: "16px 0"
}

export const card = {
  backgroundColor: "white", borderRadius: "8px",
  border: "0.5px solid #e2e8f0", padding: "20px", marginBottom: "12px"
}

export const btn = (color = "#3b82f6") => ({
  padding: "7px 16px", fontSize: "12px", fontWeight: "600",
  border: "0.5px solid " + color, borderRadius: "6px",
  cursor: "pointer", backgroundColor: color, color: "white"
})

export const btnOutline = (color = "#3b82f6") => ({
  padding: "7px 16px", fontSize: "12px", fontWeight: "600",
  border: "0.5px solid " + color, borderRadius: "6px",
  cursor: "pointer", backgroundColor: "white", color: color
})
