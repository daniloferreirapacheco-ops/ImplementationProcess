import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

const shortcuts = {
  "/customers": { new: "/customers/new" },
  "/contacts": { new: "/contacts/new" },
  "/opportunities": { new: "/opportunities/new" },
  "/discovery": { new: "/discovery/new" },
  "/scope": { new: "/scope/new" },
  "/projects": { new: "/projects/new" },
  "/testing": { new: "/testing/new" },
  "/handoff": { new: "/handoff/new" },
}

export default function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = (e) => {
      // Don't fire when typing in inputs
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT" || e.target.isContentEditable) return

      const path = location.pathname

      // N = New (on list pages)
      if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
        const match = Object.keys(shortcuts).find(p => path === p || path === p + "/")
        if (match) { e.preventDefault(); navigate(shortcuts[match].new) }
      }

      // G then D = Go to Dashboard
      if (e.key === "d" && !e.ctrlKey && !e.metaKey) {
        if (path !== "/dashboard") { navigate("/dashboard") }
      }

      // G then P = Go to Projects
      if (e.key === "p" && !e.ctrlKey && !e.metaKey) {
        if (!path.startsWith("/projects")) { navigate("/projects") }
      }

      // Escape = Go back
      if (e.key === "Escape") {
        // Only go back if not in a modal/dropdown (handled by NavBar)
      }

      // ? = Show shortcuts help (future)
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [location.pathname, navigate])
}
