import { createContext, useContext, useState, useCallback } from "react"

const ToastContext = createContext({})

export const useToast = () => useContext(ToastContext)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const colors = {
    success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", icon: "✓" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "✗" },
    info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: "ℹ" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "⚠" },
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "8px" }}>
        {toasts.map(t => {
          const c = colors[t.type] || colors.success
          return (
            <div key={t.id} style={{
              padding: "12px 20px", borderRadius: "10px", backgroundColor: c.bg,
              border: `1px solid ${c.border}`, color: c.text, fontSize: "14px",
              fontWeight: "500", display: "flex", alignItems: "center", gap: "10px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: "280px",
              animation: "slideIn 0.3s ease-out"
            }}>
              <span style={{ fontSize: "16px", fontWeight: "700" }}>{c.icon}</span>
              {t.message}
            </div>
          )
        })}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </ToastContext.Provider>
  )
}
