import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'

export default function TimeTracking() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const timerRef = useRef(null)

  // Form state
  const [form, setForm] = useState({
    project_id: '',
    task_name: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    rate: '150',
    user_name: '',
    notes: ''
  })
  const [showCustomTask, setShowCustomTask] = useState(false)
  const [customTaskName, setCustomTaskName] = useState('')

  // Edit state
  const [editingEntry, setEditingEntry] = useState(null)
  const [editForm, setEditForm] = useState({ task_name: '', date: '', hours: '', rate: '', notes: '' })

  // Pagination
  const PER_PAGE = 25
  const [page, setPage] = useState(1)

  useEffect(() => { loadProjects() }, [])
  useEffect(() => {
    if (selectedProject) {
      loadEntries()
      loadTasks()
    }
  }, [selectedProject])

  useEffect(() => {
    if (profile) {
      setForm(prev => ({ ...prev, user_name: profile.full_name || '' }))
    }
  }, [profile])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const loadProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name').order('name')
    setProjects(data || [])
    if (data?.length > 0) {
      setSelectedProject(data[0].id)
      setForm(prev => ({ ...prev, project_id: data[0].id }))
    }
    setLoading(false)
  }

  const loadEntries = async () => {
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('project_id', selectedProject)
      .order('date', { ascending: false })
    setEntries(data || [])
  }

  const loadTasks = async () => {
    const { data } = await supabase
      .from('task_templates')
      .select('name, phase')
      .eq('project_id', selectedProject)
      .eq('enabled', true)
      .order('phase, sort_order')
    setTasks(data || [])
  }

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const startTimer = () => {
    setTimerRunning(true)
    setTimerSeconds(0)
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => prev + 1)
    }, 1000)
  }

  const stopTimer = () => {
    setTimerRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
    setForm(prev => ({ ...prev, hours: (timerSeconds / 3600).toFixed(2) }))
    setShowForm(true)
  }

  const resetTimer = () => {
    setTimerRunning(false)
    setTimerSeconds(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSave = async () => {
    if (!form.task_name || !form.hours) {
      setError('Task and hours are required')
      return
    }
    setError('')
    const payload = {
      project_id: selectedProject,
      task_name: form.task_name,
      date: form.date,
      hours: parseFloat(form.hours),
      rate: parseFloat(form.rate) || 0,
      cost: parseFloat(form.hours) * (parseFloat(form.rate) || 0),
      user_name: form.user_name,
      notes: form.notes,
      user_id: profile?.id,
      created_by: profile?.id
    }
    const { error: err } = await supabase.from('time_entries').insert(payload)
    if (err) { setError(err.message); return }
    setShowForm(false)
    setForm(prev => ({ ...prev, task_name: '', hours: '', notes: '' }))
    setShowCustomTask(false)
    setCustomTaskName('')
    setTimerSeconds(0)
    loadEntries()
  }

  const handleDelete = async (id) => {
    await supabase.from('time_entries').delete().eq('id', id)
    loadEntries()
  }

  const startEditing = (entry) => {
    setEditingEntry(entry.id)
    setEditForm({
      task_name: entry.task_name || '',
      date: entry.date || '',
      hours: entry.hours || '',
      rate: entry.rate || '',
      notes: entry.notes || ''
    })
  }

  const cancelEditing = () => {
    setEditingEntry(null)
    setEditForm({ task_name: '', date: '', hours: '', rate: '', notes: '' })
  }

  const handleEditSave = async () => {
    const hours = parseFloat(editForm.hours) || 0
    const rate = parseFloat(editForm.rate) || 0
    const { error: err } = await supabase
      .from('time_entries')
      .update({
        task_name: editForm.task_name,
        date: editForm.date,
        hours,
        rate,
        cost: hours * rate,
        notes: editForm.notes
      })
      .eq('id', editingEntry)
    if (err) { setError(err.message); return }
    setEditingEntry(null)
    setEditForm({ task_name: '', date: '', hours: '', rate: '', notes: '' })
    loadEntries()
  }

  const handleExportCSV = () => {
    if (entries.length === 0) return
    const headers = ['Date', 'Task', 'User', 'Hours', 'Rate', 'Cost', 'Notes']
    const rows = entries.map(e => [
      e.date,
      `"${(e.task_name || '').replace(/"/g, '""')}"`,
      `"${(e.user_name || '').replace(/"/g, '""')}"`,
      e.hours,
      e.rate,
      e.cost || 0,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-entries-${selectedProject}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(entries.length / PER_PAGE))
  const paginatedEntries = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0)
  const totalCost = entries.reduce((sum, e) => sum + (e.cost || 0), 0)

  const byUser = entries.reduce((acc, e) => {
    const user = e.user_name || 'Unknown'
    if (!acc[user]) acc[user] = { hours: 0, cost: 0 }
    acc[user].hours += e.hours || 0
    acc[user].cost += e.cost || 0
    return acc
  }, {})

  const byTask = entries.reduce((acc, e) => {
    const task = e.task_name || 'Unassigned'
    if (!acc[task]) acc[task] = { hours: 0, cost: 0 }
    acc[task].hours += e.hours || 0
    acc[task].cost += e.cost || 0
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Time" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
              Time Tracking
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Log time per project and task — with live timer and cost calculation
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select value={selectedProject} onChange={e => { setSelectedProject(e.target.value); updateForm('project_id', e.target.value) }}
              style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px',
                fontSize: '14px', minWidth: '220px' }}>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button onClick={handleExportCSV}
              style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569',
                border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '500' }}>
              Export CSV
            </button>
            <button onClick={() => setShowForm(true)}
              style={{ padding: '10px 20px', backgroundColor: '#f59e0b', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' }}>
              + Log Time
            </button>
          </div>
        </div>

        {/* Timer Widget */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px',
          border: '1px solid #e2e8f0', marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Live Timer</span>
            <span style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'monospace',
              color: timerRunning ? '#ef4444' : '#1e293b' }}>
              {formatTime(timerSeconds)}
            </span>
            {timerRunning && (
              <span style={{ width: '10px', height: '10px', borderRadius: '50%',
                backgroundColor: '#ef4444', animation: 'pulse 1s infinite' }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!timerRunning ? (
              <button onClick={startTimer}
                style={{ padding: '10px 24px', backgroundColor: '#10b981', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '600' }}>
                Start
              </button>
            ) : (
              <button onClick={stopTimer}
                style={{ padding: '10px 24px', backgroundColor: '#ef4444', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '600' }}>
                Stop & Log
              </button>
            )}
            {timerSeconds > 0 && !timerRunning && (
              <button onClick={resetTimer}
                style={{ padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#475569',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Entries', value: entries.length, color: '#3b82f6' },
            { label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, color: '#f59e0b' },
            { label: 'Total Cost', value: `$${totalCost.toLocaleString()}`, color: '#10b981' },
            { label: 'Team Members', value: Object.keys(byUser).length, color: '#8b5cf6' }
          ].map(card => (
            <div key={card.label} style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '20px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                {card.label.toUpperCase()}
              </p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: card.color }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Log Time Form */}
        {showForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px',
            border: '2px solid #f59e0b', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                Log Time Entry
              </h2>
              <button onClick={() => { setShowForm(false); setError('') }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>
                x
              </button>
            </div>
            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#dc2626',
                padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Task *
                </label>
                {tasks.length > 0 ? (
                  <select value={showCustomTask ? '__other__' : form.task_name} onChange={e => {
                    if (e.target.value === '__other__') {
                      setShowCustomTask(true)
                      setCustomTaskName('')
                      updateForm('task_name', '')
                    } else {
                      setShowCustomTask(false)
                      setCustomTaskName('')
                      updateForm('task_name', e.target.value)
                    }
                  }}
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                      borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="">Select task...</option>
                    {tasks.map((t, i) => (
                      <option key={i} value={t.name}>[{t.phase}] {t.name}</option>
                    ))}
                    <option value="__other__">Other (manual entry)</option>
                  </select>
                ) : (
                  <input value={form.task_name} onChange={e => updateForm('task_name', e.target.value)}
                    placeholder="Task name"
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                      borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                )}
                {showCustomTask && (
                  <input value={customTaskName} onChange={e => {
                    setCustomTaskName(e.target.value)
                    updateForm('task_name', e.target.value)
                  }}
                    placeholder="Enter task name"
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                      borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', marginTop: '8px' }} />
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Date
                </label>
                <input type="date" value={form.date} onChange={e => updateForm('date', e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Team Member
                </label>
                <input value={form.user_name} onChange={e => updateForm('user_name', e.target.value)}
                  placeholder="Your name"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Hours *
                </label>
                <input type="number" step="0.25" value={form.hours} onChange={e => updateForm('hours', e.target.value)}
                  placeholder="e.g. 2.5"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Rate ($/hr)
                </label>
                <input type="number" value={form.rate} onChange={e => updateForm('rate', e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '8px',
                  border: '1px solid #bbf7d0', fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                  Cost: ${((parseFloat(form.hours) || 0) * (parseFloat(form.rate) || 0)).toFixed(2)}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Notes
                </label>
                <input value={form.notes} onChange={e => updateForm('notes', e.target.value)}
                  placeholder="What did you work on?"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button onClick={() => { setShowForm(false); setError('') }}
                style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button onClick={handleSave}
                style={{ padding: '10px 20px', backgroundColor: '#f59e0b', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Log Entry
              </button>
            </div>
          </div>
        )}

        {/* Breakdown: By User + By Task */}
        {entries.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px 0' }}>By Team Member</h3>
              {Object.entries(byUser).map(([user, data]) => (
                <div key={user} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                  borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                  <span style={{ color: '#1e293b', fontWeight: '500' }}>{user}</span>
                  <span style={{ color: '#64748b' }}>{data.hours.toFixed(1)}h / ${data.cost.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px 0' }}>By Task</h3>
              {Object.entries(byTask).map(([task, data]) => (
                <div key={task} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                  borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                  <span style={{ color: '#1e293b', fontWeight: '500' }}>{task}</span>
                  <span style={{ color: '#64748b' }}>{data.hours.toFixed(1)}h / ${data.cost.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Entries Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
              Time Entries ({entries.length})
            </h2>
          </div>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '48px' }}>Loading...</p>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
              <p style={{ fontSize: '36px', margin: '0 0 8px 0' }}>&#9201;</p>
              <p style={{ fontSize: '14px', margin: 0 }}>No time entries yet. Use the timer or log manually.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Date', 'Task', 'User', 'Hours', 'Rate', 'Cost', 'Notes', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left',
                      fontSize: '12px', fontWeight: '600', color: '#64748b',
                      borderBottom: '1px solid #e2e8f0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map(entry => (
                  entry.id === editingEntry ? (
                    <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#fffbeb' }}>
                      <td style={{ padding: '8px 16px' }}>
                        <input type="date" value={editForm.date} onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                          style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <input value={editForm.task_name} onChange={e => setEditForm(prev => ({ ...prev, task_name: e.target.value }))}
                          style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{entry.user_name}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <input type="number" step="0.25" value={editForm.hours} onChange={e => setEditForm(prev => ({ ...prev, hours: e.target.value }))}
                          style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <input type="number" value={editForm.rate} onChange={e => setEditForm(prev => ({ ...prev, rate: e.target.value }))}
                          style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                        ${((parseFloat(editForm.hours) || 0) * (parseFloat(editForm.rate) || 0)).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <input value={editForm.notes} onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <button onClick={handleEditSave}
                          style={{ background: 'none', border: 'none', color: '#10b981',
                            cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginRight: '8px' }}>
                          Save
                        </button>
                        <button onClick={cancelEditing}
                          style={{ background: 'none', border: 'none', color: '#64748b',
                            cursor: 'pointer', fontSize: '12px' }}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b' }}>{entry.date}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{entry.task_name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{entry.user_name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>{entry.hours}h</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>${entry.rate}/hr</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                        ${(entry.cost || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', maxWidth: '200px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.notes}
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => startEditing(entry)}
                          style={{ background: 'none', border: 'none', color: '#3b82f6',
                            cursor: 'pointer', fontSize: '12px', marginRight: '8px' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(entry.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626',
                            cursor: 'pointer', fontSize: '12px' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          )}
          {/* Pagination Controls */}
          {entries.length > PER_PAGE && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, entries.length)} of {entries.length}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => setPage(1)} disabled={page === 1}
                  style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px',
                    backgroundColor: page === 1 ? '#f1f5f9' : 'white', color: page === 1 ? '#94a3b8' : '#475569',
                    cursor: page === 1 ? 'default' : 'pointer', fontSize: '13px' }}>
                  First
                </button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px',
                    backgroundColor: page === 1 ? '#f1f5f9' : 'white', color: page === 1 ? '#94a3b8' : '#475569',
                    cursor: page === 1 ? 'default' : 'pointer', fontSize: '13px' }}>
                  Prev
                </button>
                <span style={{ padding: '6px 12px', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                  {page} / {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px',
                    backgroundColor: page === totalPages ? '#f1f5f9' : 'white', color: page === totalPages ? '#94a3b8' : '#475569',
                    cursor: page === totalPages ? 'default' : 'pointer', fontSize: '13px' }}>
                  Next
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px',
                    backgroundColor: page === totalPages ? '#f1f5f9' : 'white', color: page === totalPages ? '#94a3b8' : '#475569',
                    cursor: page === totalPages ? 'default' : 'pointer', fontSize: '13px' }}>
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
