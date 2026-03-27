export default function SearchInput({ value, onChange, placeholder = "Search...", width = "260px" }) {
  return (
    <div style={{ position: "relative", width }}>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "7px 32px 7px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box", outline: "none" }}
        onFocus={e => e.target.style.borderColor = "#3b82f6"}
        onBlur={e => e.target.style.borderColor = "#d1d5db"} />
      {value && (
        <button onClick={() => onChange("")}
          style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "14px", padding: "2px", lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
          onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
          ✕
        </button>
      )}
    </div>
  )
}
