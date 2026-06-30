import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const stakeholderFeedback = [
  {
    name: 'Elena Vasco',
    role: 'CTO',
    initials: 'EV',
    color: 'bg-purple-600',
    time: '2h ago',
    message: 'I\'ve reviewed your daily plan. Ensure the migration timeline accounts for the 3-week QA phase we discussed in last week\'s planning call.',
    tag: 'NEW',
    tagColor: 'bg-red-100 text-red-700',
  },
  {
    name: 'Marcus Chen',
    role: 'Engineering Lead',
    initials: 'MC',
    color: 'bg-blue-600',
    time: '3h ago',
    message: 'We\'ve identified a bottleneck in the staging environment. Check the logs at `/var/legacy/` — the CPU spikes might delay your migration window.',
    tag: null,
  },
  {
    name: 'David Miller',
    role: 'Product Director',
    initials: 'DM',
    color: 'bg-green-600',
    time: '5h ago',
    message: 'Customer success team is worried about all the changes to the billing dashboard. Can you keep the legacy UI for internal users for now?',
    tag: null,
  },
]

const todoTasks = [
  { id: 1, title: 'Review Migration Docs', subtasks: [] },
  { id: 2, title: 'Identify Legacy Dependencies', subtasks: [] },
]

const inProgressTasks = [
  { id: 3, title: 'Drafting Roll-back Plan', subtasks: [{ label: 'Finalize rollback triggers', done: false }], assignee: 'You', tag: 'Critical' },
]

const evaluationQueue = []

export default function SimulationWorkspace() {
  const navigate = useNavigate()
  const [reply, setReply] = useState('')
  const [activeTab, setActiveTab] = useState('stakeholder')

  return (
    <div className="max-w-container mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
        <span>Simulations</span>
        <span>/</span>
        <span className="text-on-surface font-medium">SaaS Enterprise Migration Project</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main workspace */}
        <div className="col-span-2 space-y-5">
          {/* Project Brief */}
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-on-surface">Simulation Brief</h2>
              <span className="chip bg-primary/10 text-primary">LEVEL 2</span>
            </div>

            <h3 className="text-base font-semibold text-on-surface mb-3">Project: Enterprise Cloud Integration</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              Our primary client, <span className="font-semibold text-on-surface">Stratosphere SaaS</span>, is undergoing a massive infrastructure migration to a hybrid cloud environment. As the lead Associate Product Manager, your goal is to manage the transition of their legacy billing system (B3 Legacy) to the new WorkLearn-integrated API stack.
            </p>

            <div className="flex items-center gap-6 mb-4 text-sm">
              <div>
                <span className="section-label">Affected Users</span>
                <p className="font-semibold text-on-surface mt-0.5">4,200 Enterprise Users</p>
              </div>
              <div>
                <span className="section-label">Integrity Level</span>
                <p className="font-semibold text-red-600 mt-0.5">High Data Integrity</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-on-surface mb-2">Objectives for this session:</p>
              <ul className="space-y-1.5">
                {[
                  'Analyze the API documentation provided in the resource locker.',
                  'Develop a risk mitigation plan for the Q3 maintenance window.',
                  'Address immediate feedback from the CTO (see Sidebar).',
                ].map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Mentor Insight */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex items-start gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs">AI</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary mb-0.5">AI Mentor Insight</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  The B3 Legacy system uses a non-standard XML response. Ensure your migration logic handles a <code className="bg-primary/10 px-1 rounded text-primary">TransactionWrapper</code> tag. If your migration logic includes a <code className="bg-primary/10 px-1 rounded text-primary">null</code> check for this field, you'll avoid a critical downstream failure.
                </p>
              </div>
            </div>
          </div>

          {/* Task Board */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-on-surface">Task Board</h2>
              <button className="btn-ghost text-xs">+ Add Task</button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* TO DO */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="section-label">To Do</span>
                  <span className="bg-gray-100 text-on-surface-variant text-xs font-semibold px-1.5 py-0.5 rounded-full">{todoTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {todoTasks.map((task) => (
                    <div key={task.id} className="p-3 bg-surface-low border border-border rounded-lg">
                      <p className="text-xs font-medium text-on-surface">{task.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* IN PROGRESS */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="section-label text-blue-600">In Progress</span>
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">{inProgressTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {inProgressTasks.map((task) => (
                    <div key={task.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-medium text-on-surface mb-1.5">{task.title}</p>
                      {task.subtasks.map((sub, i) => (
                        <label key={i} className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer">
                          <input type="checkbox" className="accent-primary" />
                          {sub.label}
                        </label>
                      ))}
                      <div className="flex items-center gap-1.5 mt-2">
                        {task.tag && <span className="chip bg-red-100 text-red-700">{task.tag}</span>}
                        <span className="text-xs text-on-surface-variant">→ {task.assignee}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REVIEW */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="section-label text-green-600">Review</span>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">0</span>
                </div>
                <div className="p-4 border border-dashed border-border rounded-lg text-center">
                  <p className="text-xs text-on-surface-variant">No tasks in review</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="col-span-1 space-y-4">
          {/* Timer */}
          <div className="card bg-primary text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">Active Module</p>
                <p className="text-2xl font-bold mt-0.5">04:22:15 <span className="text-sm opacity-70">Remaining</span></p>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-lg">⏱️</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card p-0 overflow-hidden">
            <div className="flex border-b border-border">
              {[
                { key: 'stakeholder', label: 'Stakeholder Feedback' },
                { key: 'evaluation', label: 'Evaluation Queue' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${
                    activeTab === tab.key
                      ? 'text-primary border-b-2 border-primary bg-surface-low'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === 'stakeholder' && (
                <div className="space-y-4">
                  {stakeholderFeedback.map((fb, i) => (
                    <div key={i} className={`pb-4 ${i < stakeholderFeedback.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 ${fb.color} rounded-full flex items-center justify-center shrink-0`}>
                          <span className="text-white text-xs font-bold">{fb.initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-on-surface">{fb.name}</p>
                            {fb.tag && <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${fb.tagColor}`}>{fb.tag}</span>}
                          </div>
                          <p className="text-xs text-on-surface-variant">{fb.role} · {fb.time}</p>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{fb.message}</p>
                    </div>
                  ))}

                  {/* Reply box */}
                  <div>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Draft a reply to the team..."
                      rows={3}
                      className="input resize-none text-xs"
                    />
                    <button className="btn-secondary w-full mt-2 text-xs py-2">📝 Draft Reply</button>
                  </div>
                </div>
              )}

              {activeTab === 'evaluation' && (
                <div className="text-center py-6">
                  <p className="text-xs text-on-surface-variant">No artifacts submitted for evaluation yet.</p>
                  <p className="text-xs text-on-surface-variant mt-1">Complete a task and submit it for AI Evaluator review.</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit for Evaluation */}
          <button onClick={() => navigate('/evaluations/q3-systems')} className="btn-primary w-full py-3 text-sm">Submit for Evaluation</button>
        </div>
      </div>

      <footer className="mt-8 border-t border-border pt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <span>WorkLearn AI</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Terms of Service</a>
          <a href="#" className="hover:text-primary">Privacy Policy</a>
          <a href="#" className="hover:text-primary">Help Center</a>
          <a href="#" className="hover:text-primary">Contact Support</a>
        </div>
      </footer>
    </div>
  )
}
