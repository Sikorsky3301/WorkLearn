import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const activityFeed = [
  {
    type: 'simulation',
    icon: 'sim',
    title: 'Completed Module 3',
    sub: 'Advanced System Design for PMs',
    time: '2h ago',
    color: 'bg-blue-600',
  },
  {
    type: 'doubt',
    icon: 'doubt',
    title: 'Doubt submitted',
    sub: 'Multi-region failover strategies?',
    time: '3h ago',
    color: 'bg-amber-500',
  },
  {
    type: 'quiz',
    icon: 'quiz',
    title: 'Quiz passed — 88%',
    sub: 'Data-Driven Decision Making',
    time: 'Yesterday',
    color: 'bg-green-600',
  },
  {
    type: 'session',
    icon: 'session',
    title: 'Mentor session attended',
    sub: 'Enterprise Risk Assessment',
    time: '2 days ago',
    color: 'bg-primary',
  },
  {
    type: 'simulation',
    icon: 'sim',
    title: 'Started simulation',
    sub: 'SaaS Enterprise Migration Project',
    time: '3 days ago',
    color: 'bg-blue-600',
  },
]

const initialDoubts = [
  {
    id: 1,
    topic: 'System Design',
    question: 'Multi-region failover strategies for high-availability systems?',
    status: 'pending',
    submittedAt: '3h ago',
  },
  {
    id: 2,
    topic: 'Stakeholder Mgmt',
    question: 'How to handle executive pushback on Q3 budget decisions?',
    status: 'scheduled',
    submittedAt: '1 day ago',
    sessionDate: 'Tomorrow, 4:00 PM',
  },
  {
    id: 3,
    topic: 'Data Analysis',
    question: 'Which metric framework is best for early-stage B2B SaaS products?',
    status: 'resolved',
    submittedAt: '3 days ago',
    resolvedNote: 'Use AARRR funnel adapted for B2B — focus on Activation and Retention over Acquisition.',
  },
]

const scheduledSlots = [
  { date: 'Thu, 27 Jun', time: '4:00 PM', duration: '45 min', topic: 'Doubt Review + Q3 Goal Planning', booked: true },
  { date: 'Sat, 29 Jun', time: '11:00 AM', duration: '30 min', topic: 'Simulation Debrief', booked: false },
  { date: 'Mon, 1 Jul', time: '2:00 PM', duration: '45 min', topic: 'Career Roadmap Check-in', booked: false },
  { date: 'Wed, 3 Jul', time: '5:00 PM', duration: '30 min', topic: 'Technical Skill Deep-dive', booked: false },
]

const initialMessages = [
  {
    role: 'mentor',
    text: "Hi Rishi! I've reviewed your recent activity — you completed Module 3 of System Design and scored 88% on the Data quiz. Great progress this week.",
    time: '10:24 AM',
  },
  {
    role: 'mentor',
    text: "I noticed you submitted a doubt about multi-region failover. I've added it to Thursday's session agenda. Anything else on your mind?",
    time: '10:24 AM',
    actions: [
      { label: 'View Session Agenda', primary: false },
      { label: 'Submit Another Doubt', primary: true },
    ],
  },
  {
    role: 'user',
    text: "Yes — I'm also unsure about how to structure a PRD for a system migration project. Can you help?",
    time: '10:26 AM',
  },
  {
    role: 'mentor',
    text: "Absolutely. A migration PRD needs: (1) Current-state audit, (2) Success criteria with rollback triggers, (3) Stakeholder sign-off matrix, and (4) Phased timeline with dependency mapping. Want me to add this to your doubt list for Thursday?",
    time: '10:26 AM',
    actions: [
      { label: '+ Add to Doubts', primary: true },
      { label: 'Explain More', primary: false },
    ],
  },
]

const statusConfig = {
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  scheduled: { label: 'In Session', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  resolved: { label: 'Resolved', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
}

export default function AIMentor() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [doubts, setDoubts] = useState(initialDoubts)
  const [rightTab, setRightTab] = useState('doubts')
  const [doubtForm, setDoubtForm] = useState({ topic: '', question: '' })
  const [showDoubtForm, setShowDoubtForm] = useState(false)
  const [expandedDoubt, setExpandedDoubt] = useState(null)

  function sendMessage() {
    if (!input.trim()) return
    setMessages(prev => [...prev, { role: 'user', text: input, time: 'Just now' }])
    setInput('')
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'mentor',
        text: "I've noted that. Let me add this to your profile so we can cover it in our next session. Would you like to schedule a focused session on this topic?",
        time: 'Just now',
        actions: [{ label: '📅 Schedule Session', primary: true }],
      }])
    }, 800)
  }

  function submitDoubt() {
    if (!doubtForm.topic || !doubtForm.question) return
    setDoubts(prev => [{
      id: Date.now(),
      topic: doubtForm.topic,
      question: doubtForm.question,
      status: 'pending',
      submittedAt: 'Just now',
    }, ...prev])
    setDoubtForm({ topic: '', question: '' })
    setShowDoubtForm(false)
  }

  function bookSlot(idx) {
    const slot = scheduledSlots[idx]
    setMessages(prev => [...prev, {
      role: 'mentor',
      text: `Great! I've scheduled our session for ${slot.date} at ${slot.time} (${slot.duration}). Topic: "${slot.topic}". You'll get a reminder 30 minutes before.`,
      time: 'Just now',
    }])
  }

  return (
    <div className="max-w-container mx-auto px-6 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">AI Mentor</h1>
          <p className="text-sm text-on-surface-variant">Your personal learning guide — tracks progress, clears doubts, and meets on demand.</p>
        </div>
        <button
          className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          onClick={() => { setRightTab('schedule') }}
        >
          <CalIcon /> Schedule Session
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5" style={{ minHeight: 'calc(100vh - 180px)' }}>

        {/* ── Col 1: Mentor Profile + Activity Feed ── */}
        <div className="col-span-1 flex flex-col gap-4">
          {/* Mentor profile card */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">Sarah — AI Mentor</p>
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                  Online now
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              {['Product Management', 'System Design', 'Data Strategy', 'Stakeholder Comms'].map(tag => (
                <span key={tag} className="inline-block mr-1.5 mb-1 chip">{tag}</span>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 text-center gap-2">
              {[
                { val: '24', label: 'Sessions' },
                { val: '11', label: 'Doubts cleared' },
                { val: '98%', label: 'Satisfaction' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-sm font-bold text-primary">{s.val}</p>
                  <p className="text-xs text-on-surface-variant leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="card flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="section-label">Activity Tracker</span>
              <span className="text-xs text-on-surface-variant">This week</span>
            </div>
            <div className="space-y-0">
              {activityFeed.map((item, i) => (
                <div key={i} className={`flex items-start gap-3 py-3 ${i < activityFeed.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className={`w-7 h-7 ${item.color} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
                    <ActivityIcon type={item.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-on-surface leading-tight">{item.title}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-tight truncate">{item.sub}</p>
                  </div>
                  <span className="text-xs text-on-surface-variant shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
            <button className="btn-ghost text-xs mt-3">View full history →</button>
          </div>
        </div>

        {/* ── Col 2–3: Chat ── */}
        <div className="col-span-2 flex flex-col">
          <div className="card flex flex-col flex-1" style={{ minHeight: 580 }}>
            {/* Chat header */}
            <div className="flex items-center gap-3 pb-3 border-b border-border mb-4 shrink-0">
              <div className="relative">
                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">AI Mentor · Sarah</p>
                <p className="text-xs text-on-surface-variant">Aware of your simulations, doubts &amp; progress</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Live
                </span>
              </div>
            </div>

            {/* Context pill */}
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-full px-3 py-1">
                <span className="text-xs text-primary font-medium">Tracking 5 recent activities</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                <span className="text-xs text-amber-700 font-medium">2 doubts pending</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'mentor' && (
                    <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                  )}
                  <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`} style={{ maxWidth: '78%' }}>
                    <div className={`px-3 py-2.5 rounded-lg text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-surface-low border border-border text-on-surface rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    {msg.actions && (
                      <div className="flex gap-2 flex-wrap">
                        {msg.actions.map((action, j) => (
                          <button
                            key={j}
                            onClick={() => {
                              if (action.label.includes('Schedule')) setRightTab('schedule')
                              if (action.label.includes('Doubt')) { setRightTab('doubts'); setShowDoubtForm(true) }
                            }}
                            className={action.primary ? 'btn-primary text-xs px-3 py-1.5' : 'btn-secondary text-xs px-3 py-1.5'}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-on-surface-variant">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="shrink-0">
              <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors bg-white">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask your mentor anything about your learning journey..."
                  className="flex-1 text-sm outline-none bg-transparent text-on-surface placeholder-gray-400"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setRightTab('doubts'); setShowDoubtForm(true) }}
                    className="text-xs text-on-surface-variant hover:text-primary font-medium transition-colors whitespace-nowrap"
                    title="Log as a doubt for the next session"
                  >
                    + Log doubt
                  </button>
                  <button
                    onClick={sendMessage}
                    className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:bg-primary-dark transition-colors"
                  >
                    <SendIcon />
                  </button>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5 text-center">
                Mentor reads your simulation history, quiz scores &amp; doubt log automatically
              </p>
            </div>
          </div>
        </div>

        {/* ── Col 4: Doubts + Schedule ── */}
        <div className="col-span-1 flex flex-col gap-4">
          {/* Tab switcher */}
          <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
            {[
              { key: 'doubts', label: 'Doubts' },
              { key: 'schedule', label: 'Schedule' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setRightTab(tab.key)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  rightTab === tab.key
                    ? 'bg-primary text-white'
                    : 'bg-white text-on-surface-variant hover:bg-surface-low'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── DOUBTS PANEL ── */}
          {rightTab === 'doubts' && (
            <div className="flex flex-col gap-3 flex-1">
              {/* Submit toggle */}
              {!showDoubtForm ? (
                <button
                  onClick={() => setShowDoubtForm(true)}
                  className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
                >
                  <PlusIcon /> Submit a Doubt
                </button>
              ) : (
                <div className="card border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-semibold text-primary mb-3">New Doubt</p>
                  <input
                    type="text"
                    value={doubtForm.topic}
                    onChange={e => setDoubtForm(p => ({ ...p, topic: e.target.value }))}
                    placeholder="Topic (e.g. System Design)"
                    className="input text-xs py-2 mb-2"
                  />
                  <textarea
                    value={doubtForm.question}
                    onChange={e => setDoubtForm(p => ({ ...p, question: e.target.value }))}
                    placeholder="Describe your doubt clearly..."
                    rows={3}
                    className="input text-xs resize-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button onClick={submitDoubt} className="btn-primary text-xs px-3 py-1.5 flex-1">Submit</button>
                    <button onClick={() => setShowDoubtForm(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                  </div>
                </div>
              )}

              {/* Doubt list */}
              <div className="card flex-1 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="section-label">Doubt Backlog</span>
                  <span className="text-xs text-on-surface-variant">{doubts.length} total</span>
                </div>
                <div className="space-y-3">
                  {doubts.map(d => {
                    const cfg = statusConfig[d.status]
                    const isOpen = expandedDoubt === d.id
                    return (
                      <div
                        key={d.id}
                        className={`border rounded-lg overflow-hidden transition-colors ${isOpen ? 'border-primary/40' : 'border-border'}`}
                      >
                        <button
                          className="w-full text-left p-3 hover:bg-surface-low transition-colors"
                          onClick={() => setExpandedDoubt(isOpen ? null : d.id)}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="chip text-xs">{d.topic}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.bg} ${cfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface leading-snug font-medium">{d.question}</p>
                          <p className="text-xs text-on-surface-variant mt-1">{d.submittedAt}</p>
                        </button>

                        {isOpen && (
                          <div className="px-3 pb-3 border-t border-border bg-surface-low">
                            {d.status === 'scheduled' && d.sessionDate && (
                              <div className="pt-3 flex items-center gap-2">
                                <CalIcon small />
                                <p className="text-xs text-blue-700 font-medium">Scheduled: {d.sessionDate}</p>
                              </div>
                            )}
                            {d.status === 'resolved' && d.resolvedNote && (
                              <div className="pt-3">
                                <p className="text-xs font-semibold text-green-700 mb-1">Mentor's Answer</p>
                                <p className="text-xs text-on-surface-variant leading-relaxed">{d.resolvedNote}</p>
                              </div>
                            )}
                            {d.status === 'pending' && (
                              <div className="pt-3 flex gap-2">
                                <button
                                  onClick={() => setRightTab('schedule')}
                                  className="btn-secondary text-xs px-2 py-1"
                                >
                                  Schedule session
                                </button>
                                <button
                                  onClick={() => setDoubts(prev => prev.filter(x => x.id !== d.id))}
                                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── SCHEDULE PANEL ── */}
          {rightTab === 'schedule' && (
            <div className="flex flex-col gap-3 flex-1">
              {/* Next booked session */}
              <div className="card border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                    <CalIcon white />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">Next Session</p>
                    <p className="text-xs text-on-surface-variant">Thu, 27 Jun · 4:00 PM · 45 min</p>
                  </div>
                </div>
                <p className="text-xs text-on-surface font-medium">Doubt Review + Q3 Goal Planning</p>
                <div className="mt-2 flex gap-2">
                  <button className="btn-primary text-xs px-3 py-1.5">Join Session</button>
                  <button className="btn-secondary text-xs px-3 py-1.5">Reschedule</button>
                </div>
              </div>

              {/* Available slots */}
              <div className="card flex-1 p-4">
                <span className="section-label mb-3 block">Available Slots</span>
                <div className="space-y-2.5">
                  {scheduledSlots.filter(s => !s.booked).map((slot, i) => (
                    <div key={i} className="border border-border rounded-lg p-3 hover:border-primary transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-on-surface">{slot.date}</p>
                          <p className="text-xs text-on-surface-variant">{slot.time} · {slot.duration}</p>
                          <p className="text-xs text-on-surface-variant mt-1 italic">{slot.topic}</p>
                        </div>
                        <button
                          onClick={() => bookSlot(scheduledSlots.indexOf(slot))}
                          className="btn-primary text-xs px-3 py-1.5 shrink-0"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Past sessions */}
                <div className="mt-4 pt-3 border-t border-border">
                  <span className="section-label mb-2 block">Past Sessions</span>
                  {[
                    { date: 'Mon, 23 Jun', topic: 'Enterprise Risk Assessment', summary: 'Covered risk taxonomy and PRD structure.' },
                    { date: 'Fri, 20 Jun', topic: 'Data Literacy Deep-dive', summary: 'AARRR metrics framework for B2B SaaS.' },
                  ].map((s, i) => (
                    <div key={i} className={`py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-on-surface">{s.topic}</p>
                        <span className="text-xs text-on-surface-variant">{s.date}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{s.summary}</p>
                      <button className="btn-ghost text-xs mt-1">View notes →</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
        <span>© 2024 WorkLearn AI. All rights reserved.</span>
      </footer>
    </div>
  )
}

function ActivityIcon({ type }) {
  const props = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'white', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'sim') return <svg {...props}><polygon points="5 3 19 12 5 21 5 3" /></svg>
  if (type === 'doubt') return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  if (type === 'quiz') return <svg {...props}><polyline points="20 6 9 17 4 12" /></svg>
  return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
}

function CalIcon({ small, white } = {}) {
  const size = small ? 13 : 14
  const color = white ? 'white' : 'currentColor'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
