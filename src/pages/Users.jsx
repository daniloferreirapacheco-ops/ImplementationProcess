import { useState, useEffect } from "react"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"

const roles = [
  { value: "admin", label: "Admin", color: "#6366f1" },
  { value: "leadership", label: "Leadership", color: "#8b5cf6" },
  { value: "project_manager", label: "Project Manager", color: "#3b82f6" },
  { value: "consultant", label: "Consultant", color: "#10b981" },
  { value: "sales", label: "Sales", color: "#f59e0b" },
  { value: "support", label: "Support", color: "#06b6d4" },
  { value: "product_specialist", label: "Product Specialist", color: "#ec4899" },
]

const roleColor = (r) => roles.find(ro => ro.value === r)?.color || "#94a3b8"

const thStyle = {
  padding: "6px 12px", textAlign: "left", fontSize: "12px", fontWeight: "600",
  color: "#64748b", borderBottom: "2px solid #d1d5db", backgroundColor: "#f1f5f9",
  position: "sticky", top: 0, whiteSpace: "nowrap", textTransform: "uppercase",
  letterSpacing: "0.5px", userSelect: "none"
}

const tdStyle = {
  padding: "5px 12px", fontSize: "13px", color: "#1e293b",
  borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap"
}

const inputStyle = {
  padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px",
  fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box"
}

export default function Users() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editingRole, setEditingRole] = useState(null)

  const [form, setForm] = useState({
    email: "", password: "", full_name: "", role: "consultant"
  })

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password || !form.full_name) {
      setError("All fields are required")
      return
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    setCreating(true)
    setError("")
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name }
        }
      })
      if (signUpError) throw signUpError

      // Update the profile with the role
      if (data?.user?.id) {
        await supabase.from("profiles")
          .update({ role: form.role, full_name: form.full_name })
          .eq("id", data.user.id)
      }

      setSuccess(`User "${form.full_name}" created successfully`)
      setForm({ email: "", password: "", full_name: "", role: "consultant" })
      setShowCreate(false)
      setTimeout(() => setSuccess(""), 4000)
      fetchUsers()
    } catch (err) {
      setError(err.message || "Failed to create user")
    } finally {
      setCreating(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    setEditingRole(null)
  }

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "all" || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Users" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px", maxWidth: "1200px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
              User Management
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
              {users.length} user{users.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          <button onClick={() => { setShowCreate(!showCreate); setError(""); setSuccess("") }}
            style={{
              padding: "9px 20px", backgroundColor: "#3b82f6", color: "white",
              border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600",
              cursor: "pointer"
            }}>
            {showCreate ? "Cancel" : "+ New User"}
          </button>
        </div>

        {/* Success Banner */}
        {success && (
          <div style={{
            padding: "12px 16px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: "8px", marginBottom: "16px", fontSize: "13px", color: "#166534"
          }}>
            {success}
          </div>
        )}

        {/* Create User Form */}
        {showCreate && (
          <div style={{
            backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0",
            padding: "24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px" }}>
              Create New User
            </h2>
            {error && (
              <div style={{
                padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: "8px", marginBottom: "14px", fontSize: "13px", color: "#dc2626"
              }}>
                {error}
              </div>
            )}
            <form onSubmit={handleCreate}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                    Full Name *
                  </label>
                  <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="John Smith" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                    Email *
                  </label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="john@company.com" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                    Password *
                  </label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 6 characters" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                    Role
                  </label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={creating}
                style={{
                  padding: "9px 24px", backgroundColor: creating ? "#93c5fd" : "#3b82f6",
                  color: "white", border: "none", borderRadius: "8px", fontSize: "13px",
                  fontWeight: "600", cursor: creating ? "not-allowed" : "pointer"
                }}>
                {creating ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center"
        }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ ...inputStyle, maxWidth: "280px" }} />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            style={{ ...inputStyle, maxWidth: "180px", cursor: "pointer" }}>
            <option value="all">All Roles</option>
            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {/* Users Table */}
        <div style={{
          backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0",
          overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
              {search || roleFilter !== "all" ? "No users match the filters." : "No users found."}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ cursor: "default" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "30px", height: "30px", borderRadius: "50%",
                          backgroundColor: roleColor(u.role), display: "flex",
                          alignItems: "center", justifyContent: "center",
                          color: "white", fontSize: "12px", fontWeight: "600", flexShrink: 0
                        }}>
                          {(u.full_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: "500" }}>{u.full_name || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {editingRole === u.id ? (
                        <select autoFocus value={u.role || ""}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          onBlur={() => setEditingRole(null)}
                          style={{ ...inputStyle, padding: "4px 8px", width: "auto", fontSize: "12px" }}>
                          <option value="">No role</option>
                          {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span onClick={() => setEditingRole(u.id)}
                          style={{
                            display: "inline-block", padding: "3px 10px", borderRadius: "12px",
                            fontSize: "11px", fontWeight: "600", cursor: "pointer",
                            backgroundColor: u.role ? `${roleColor(u.role)}18` : "#f1f5f9",
                            color: u.role ? roleColor(u.role) : "#94a3b8",
                            border: `1px solid ${u.role ? `${roleColor(u.role)}30` : "#e2e8f0"}`
                          }}>
                          {u.role ? roles.find(r => r.value === u.role)?.label || u.role : "Click to assign"}
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: "#64748b", fontSize: "12px" }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ ...tdStyle, color: "#64748b", fontSize: "12px" }}>
                      {u.updated_at ? new Date(u.updated_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "12px" }}>
          Click on a role badge to change it.
        </p>
      </main>
    </div>
  )
}
