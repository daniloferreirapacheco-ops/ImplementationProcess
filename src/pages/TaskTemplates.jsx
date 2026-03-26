import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'

const standardLibrary = [
  { phase: 'Discovery', name: 'Kickoff Meeting', hours: 2 },
  { phase: 'Discovery', name: 'Current State Assessment', hours: 4 },
  { phase: 'Discovery', name: 'Requirements Gathering', hours: 8 },
  { phase: 'Discovery', name: 'Stakeholder Interviews', hours: 6 },
  { phase: 'Scope', name: 'Scope Document Draft', hours: 6 },
  { phase: 'Scope', name: 'Scope Review & Approval', hours: 2 },
  { phase: 'Configuration', name: 'System Configuration', hours: 16 },
  { phase: 'Configuration', name: 'Data Migration Setup', hours: 12 },
  { phase: 'Configuration', name: 'Integration Configuration', hours: 8 },
  { phase: 'Testing', name: 'Test Plan Creation', hours: 4 },
  { phase: 'Testing', name: 'UAT Execution', hours: 12 },
  { phase: 'Testing', name: 'Bug Fixes & Retesting', hours: 8 },
  { phase: 'Handoff', name: 'End-User Training', hours: 8 },
  { phase: 'Handoff', name: 'Go-Live Support & Handoff', hours: 6 },
]

const phaseColors = {
  'Discovery': '#3b82f6',
  'Scope': '#8b5cf6',
  'Configuration': '#f59e0b',
  'Testing': '#10b981',
  'Handoff': '#06b6d4'
}

export default function TaskTemplates() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customTask, setCustomTask] = useState({ phase: 'Discovery', name: '', hours: 2 })
  const [hourlyRate, setHourlyRate] = useState(150)
  const [scopeWorkstreams, setScopeWorkstreams] = useState(null)

  useEffect(() => { loadProjects() }, [])

  const loadProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name').order('name')
    setProjects(data || [])
    if (data?.length > 0) {
      setSelectedProject(data[0].id)
      loadTasks(data[0].id)
    }
    setLoading(false)
  }

  const loadTasks = async (projectId) => {
    const { data } = await supabase
      .from('task_templates')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order')
    if (data && data.length > 0) {
      setTasks(data)
    } else {
      // Initialize with standard library
      setTasks(standardLibrary.map((t, i) => ({
        ...t,
        id: `temp_${i}`,
        enabled: true,
        estimated_hours: t.hours,
        sort_order: i,
        is_custom: false
      })))
    }
  }

  const handleProjectChange = async (projectId) => {
    setSelectedProject(projectId)
    loadTasks(projectId)
    // Check if project has a linked scope
    const { data: proj } = await supabase.from('projects').select('scope_id, opportunity_id').eq('id', projectId).single()
    if (proj?.scope_id) {
      const { data: scope } = await supabase.from('scopes').select('workstream_hours').eq('id', proj.scope_id).single()
      setScopeWorkstreams(scope?.workstream_hours || null)
    } else if (proj?.opportunity_id) {
      const { data: scopes } = await supabase.from('scopes').select('workstream_hours').eq('opportunity_id', proj.opportunity_id).eq('approval_status', 'approved').limit(1)
      setScopeWorkstreams(scopes?.[0]?.workstream_hours || null)
    } else {
      setScopeWorkstreams(null)
    }
  }

  const importFromScope = () => {
    if (!scopeWorkstreams) return
    const phaseMap = {
      discovery_design: 'Discovery', configuration: 'Configuration',
      integration: 'Configuration', testing: 'Testing', training: 'Handoff',
      data_migration: 'Configuration', go_live: 'Handoff',
      project_management: 'Discovery', customization: 'Configuration',
      reporting: 'Configuration'
    }
    const newTasks = Object.entries(scopeWorkstreams).map(([key, hours], i) => ({
      id: `scope_${Date.now()}_${i}`,
      phase: phaseMap[key] || 'Configuration',
      name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      estimated_hours: Number(hours) || 0,
      enabled: true,
      sort_order: tasks.length + i,
      is_custom: false
    }))
    setTasks(newTasks)
  }

  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, enabled: !t.enabled } : t
    ))
  }

  const updateHours = (taskId, hours) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, estimated_hours: parseFloat(hours) || 0 } : t
    ))
  }

  const removeTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const addFromLibrary = (template) => {
    const newTask = {
      ...template,
      id: `temp_${Date.now()}`,
      enabled: true,
      estimated_hours: template.hours,
      sort_order: tasks.length,
      is_custom: false
    }
    setTasks(prev => [...prev, newTask])
    setShowAddForm(false)
  }

  const addCustomTask = () => {
    if (!customTask.name) return
    const newTask = {
      ...customTask,
      id: `custom_${Date.now()}`,
      enabled: true,
      estimated_hours: customTask.hours,
      sort_order: tasks.length,
      is_custom: true
    }
    setTasks(prev => [...prev, newTask])
    setCustomTask({ phase: 'Discovery', name: '', hours: 2 })
    setShowCustomForm(false)
  }

  const saveTasks = async () => {
    if (!selectedProject) return
    // Delete existing tasks for this project
    await supabase.from('task_templates').delete().eq('project_id', selectedProject)
    // Insert current tasks
    const payload = tasks.map((t, i) => ({
      project_id: selectedProject,
      phase: t.phase,
      name: t.name,
      estimated_hours: t.estimated_hours,
      enabled: t.enabled,
      is_custom: t.is_custom || false,
      sort_order: i,
      created_by: profile.id
    }))
    const { error } = await supabase.from('task_templates').insert(payload)
    if (error) alert('Error saving: ' + error.message)
  }

  const enabledTasks = tasks.filter(t => t.enabled)
  const totalHours = enabledTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
  const totalCost = totalHours * hourlyRate

  const phaseBreakdown = Object.entries(
    enabledTasks.reduce((acc, t) => {
      acc[t.phase] = (acc[t.phase] || 0) + (t.estimated_hours || 0)
      return acc
    }, {})
  )

  const libraryNotAdded = standardLibrary.filter(
    lib => !tasks.find(t => t.name === lib.name && t.phase === lib.phase)
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Templates" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
              Task Templates
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Standard task library — customize per project, track phase breakdown
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select value={selectedProject} onChange={e => handleProjectChange(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px',
                fontSize: '14px', minWidth: '220px' }}>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button onClick={saveTasks}
              style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' }}>
              Save Template
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
          {[
            { id: 'tasks', label: 'Task List' },
            { id: 'summary', label: 'Summary' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0',
                backgroundColor: activeTab === tab.id ? 'white' : '#e2e8f0',
                color: activeTab === tab.id ? '#1e293b' : '#64748b',
                border: activeTab === tab.id ? '1px solid #e2e8f0' : 'none',
                borderBottom: activeTab === tab.id ? '1px solid white' : 'none',
                cursor: 'pointer', fontWeight: activeTab === tab.id ? '600' : '400', fontSize: '14px' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'tasks' && (
          <>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button onClick={() => { setShowAddForm(!showAddForm); setShowCustomForm(false) }}
                style={{ padding: '8px 16px', backgroundColor: '#eff6ff', color: '#3b82f6',
                  border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                + Add from Library
              </button>
              <button onClick={() => { setShowCustomForm(!showCustomForm); setShowAddForm(false) }}
                style={{ padding: '8px 16px', backgroundColor: '#faf5ff', color: '#8b5cf6',
                  border: '1px solid #ddd6fe', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                + Custom Task
              </button>
              {scopeWorkstreams && (
                <button onClick={importFromScope}
                  style={{ padding: '8px 16px', backgroundColor: '#f0fdf4', color: '#10b981',
                    border: '1px solid #bbf7d0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  Import from Scope ({Object.keys(scopeWorkstreams).length} workstreams)
                </button>
              )}
            </div>

            {/* Add from Library */}
            {showAddForm && libraryNotAdded.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px',
                border: '1px solid #bfdbfe', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px 0' }}>
                  Available Library Tasks
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                  {libraryNotAdded.map((lib, i) => (
                    <div key={i} onClick={() => addFromLibrary(lib)}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
                        cursor: 'pointer', fontSize: '13px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center' }}>
                      <div>
                        <span style={{ color: phaseColors[lib.phase], fontWeight: '600', fontSize: '11px' }}>
                          {lib.phase.toUpperCase()}
                        </span>
                        <br />
                        <span style={{ color: '#1e293b' }}>{lib.name}</span>
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>{lib.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Task Form */}
            {showCustomForm && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px',
                border: '1px solid #ddd6fe', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px 0' }}>
                  Add Custom Task
                </h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>Phase</label>
                    <select value={customTask.phase} onChange={e => setCustomTask(p => ({ ...p, phase: e.target.value }))}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}>
                      {Object.keys(phaseColors).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>Task Name</label>
                    <input value={customTask.name} onChange={e => setCustomTask(p => ({ ...p, name: e.target.value }))}
                      placeholder="Task name"
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db',
                        borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ width: '80px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#64748b' }}>Hours</label>
                    <input type="number" value={customTask.hours}
                      onChange={e => setCustomTask(p => ({ ...p, hours: parseFloat(e.target.value) || 0 }))}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db',
                        borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={addCustomTask}
                    style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white',
                      border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Task List by Phase */}
            {Object.keys(phaseColors).map(phase => {
              const phaseTasks = tasks.filter(t => t.phase === phase)
              if (phaseTasks.length === 0) return null
              return (
                <div key={phase} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ width: '4px', height: '20px', borderRadius: '2px',
                      backgroundColor: phaseColors[phase] }} />
                    <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                      {phase}
                    </h2>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {phaseTasks.filter(t => t.enabled).length}/{phaseTasks.length} active
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {phaseTasks.map(task => (
                      <div key={task.id} style={{ backgroundColor: 'white', borderRadius: '8px',
                        padding: '12px 16px', border: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        opacity: task.enabled ? 1 : 0.4 }}>
                        <input type="checkbox" checked={task.enabled}
                          onChange={() => toggleTask(task.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        <span style={{ flex: 1, fontSize: '14px', color: '#1e293b',
                          textDecoration: task.enabled ? 'none' : 'line-through' }}>
                          {task.name}
                          {task.is_custom && (
                            <span style={{ marginLeft: '8px', fontSize: '10px', padding: '1px 6px',
                              borderRadius: '4px', backgroundColor: '#faf5ff', color: '#8b5cf6' }}>
                              CUSTOM
                            </span>
                          )}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input type="number" value={task.estimated_hours}
                            onChange={e => updateHours(task.id, e.target.value)}
                            style={{ width: '60px', padding: '4px 8px', border: '1px solid #d1d5db',
                              borderRadius: '4px', fontSize: '13px', textAlign: 'center' }} />
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>hrs</span>
                        </div>
                        <button onClick={() => removeTask(task.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626',
                            cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {activeTab === 'summary' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Phase Breakdown */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 20px 0' }}>
                Phase Breakdown
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {phaseBreakdown.map(([phase, hours]) => (
                  <div key={phase}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{phase}</span>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        {hours}h ({totalHours > 0 ? Math.round(hours / totalHours * 100) : 0}%)
                      </span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '4px',
                        backgroundColor: phaseColors[phase],
                        width: totalHours > 0 ? `${(hours / totalHours) * 100}%` : '0%',
                        transition: 'width 0.3s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Summary */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 20px 0' }}>
                Projected Cost
              </h2>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#64748b' }}>
                  Hourly Rate ($)
                </label>
                <input type="number" value={hourlyRate} onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)}
                  style={{ width: '120px', padding: '8px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>ACTIVE TASKS</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                    {enabledTasks.length}
                  </p>
                </div>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>TOTAL HOURS</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                    {totalHours}h
                  </p>
                </div>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>PROJECTED COST</p>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
                    ${totalCost.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
