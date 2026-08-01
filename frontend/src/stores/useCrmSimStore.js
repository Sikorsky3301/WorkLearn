import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createEvent } from '../features/simulations/sales-crm-sim/engine/eventLogger'
import { STAGES } from '../features/simulations/sales-crm-sim/engine/simulationConfig'
import { SEED_LEAD } from '../features/simulations/sales-crm-sim/data/seedData'
import { getManagerReply, getStageGreeting } from '../features/simulations/sales-crm-sim/data/managerChatKnowledge'

const uid = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const initialState = {
  status: 'not_started', // not_started | in_progress | completed
  enrollmentId: null,
  startedAt: null,
  completedAt: null,
  currentStageIndex: 1,
  completedStages: [],
  elapsedSeconds: 0,

  leadQualification: { leadScore: null, buyingIntent: '', priority: '', notes: '', reasoning: '' },

  research: {
    companyProfile: '', products: '', competitors: '', challenges: '',
    decisionMakers: '', budget: '', timeline: '',
    painPoints: '', opportunities: '', risks: '',
  },

  outreachEmail: { subject: '', body: '', cta: '', grade: null, revisions: 0 },

  discoveryCall: { transcript: [], notes: '', mood: 'neutral', budgetNoted: '', timelineNoted: '' },

  crm: {
    leads: [SEED_LEAD],
    accounts: [],
    contacts: [],
    opportunities: [],
    activities: [],
    tasks: [],
    events: [],
  },

  objectionHandling: { transcript: [], mood: 'neutral', objectionsRaised: [], objectionsResolved: [] },

  proposal: {
    executiveSummary: '', businessProblems: '', recommendedSolution: '',
    implementationPlan: '', expectedROI: '', timeline: '', pricingSummary: '',
  },

  close: {
    demoScheduled: false, signatureRequested: false, negotiationNotes: '',
    followUpBooked: false, onboardingTaskCreated: false, opportunityStageUpdated: false,
  },

  eventLog: [],
  scores: null,

  // Non-AI, keyword-matched manager chat — see data/managerChatKnowledge.js
  managerChat: { messages: [], greetedStages: [] },
}

export const useCrmSimStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      logEvent: (type, payload = {}) => set((s) => ({
        eventLog: [...s.eventLog, createEvent(type, s.currentStageIndex, payload)],
      })),

      startSimulation: (enrollmentId) => set((s) => {
        // A different enrollment id than what's cached means the enrollment
        // this progress belonged to no longer exists — most commonly an
        // admin de-enrolled the student (which deletes the Enrollment row
        // and revokes the offer-acceptance badge server-side) and the
        // student then re-enrolled, getting a brand-new enrollment id.
        // localStorage has no idea any of that happened, so without this
        // check a re-enroll would silently resume the old, orphaned CRM
        // data, transcripts, and stage progress instead of starting clean.
        if (s.enrollmentId && s.enrollmentId !== enrollmentId) {
          return {
            ...initialState,
            crm: { ...initialState.crm, leads: [SEED_LEAD] },
            status: 'in_progress',
            enrollmentId,
            startedAt: new Date().toISOString(),
            eventLog: [createEvent('sim_start', 1, { enrollmentId, resetFromStaleEnrollment: true })],
          }
        }
        if (s.status !== 'not_started') return {}
        return {
          status: 'in_progress',
          enrollmentId,
          startedAt: new Date().toISOString(),
          eventLog: [...s.eventLog, createEvent('sim_start', 1, { enrollmentId })],
        }
      }),

      tick: () => set((s) => (s.status === 'in_progress' ? { elapsedSeconds: s.elapsedSeconds + 1 } : {})),

      goToStage: (index) => set((s) => ({
        currentStageIndex: index,
        eventLog: [...s.eventLog, createEvent('stage_enter', index)],
      })),

      completeStage: (index) => set((s) => {
        if (s.completedStages.includes(index)) return {}
        const completedStages = [...s.completedStages, index]
        const nextStage = STAGES.find((st) => st.index === index + 1)
        const allDone = completedStages.length >= STAGES.length
        return {
          completedStages,
          currentStageIndex: nextStage ? nextStage.index : s.currentStageIndex,
          status: allDone ? 'completed' : s.status,
          completedAt: allDone ? new Date().toISOString() : s.completedAt,
          eventLog: [...s.eventLog, createEvent('stage_complete', index)],
        }
      }),

      updateLeadQualification: (patch) => set((s) => ({
        leadQualification: { ...s.leadQualification, ...patch },
        eventLog: [...s.eventLog, createEvent('field_update', s.currentStageIndex, { form: 'leadQualification', patch })],
      })),

      updateResearch: (patch) => set((s) => ({
        research: { ...s.research, ...patch },
        eventLog: [...s.eventLog, createEvent('field_update', s.currentStageIndex, { form: 'research', patch })],
      })),

      updateOutreachEmail: (patch) => set((s) => ({
        outreachEmail: { ...s.outreachEmail, ...patch, revisions: patch.grade ? s.outreachEmail.revisions : s.outreachEmail.revisions + 1 },
        eventLog: [...s.eventLog, createEvent('email_revision', s.currentStageIndex, { patch })],
      })),

      setEmailGrade: (grade) => set((s) => ({
        outreachEmail: { ...s.outreachEmail, grade },
        eventLog: [...s.eventLog, createEvent('email_graded', s.currentStageIndex, { grade })],
      })),

      appendDiscoveryMessage: (message) => set((s) => ({
        discoveryCall: { ...s.discoveryCall, transcript: [...s.discoveryCall.transcript, message] },
        eventLog: [...s.eventLog, createEvent('chat_message', s.currentStageIndex, { stage: 'discovery', role: message.role })],
      })),

      updateDiscoveryCall: (patch) => set((s) => ({ discoveryCall: { ...s.discoveryCall, ...patch } })),

      appendObjectionMessage: (message) => set((s) => ({
        objectionHandling: { ...s.objectionHandling, transcript: [...s.objectionHandling.transcript, message] },
        eventLog: [...s.eventLog, createEvent('chat_message', s.currentStageIndex, { stage: 'objection', role: message.role })],
      })),

      updateObjectionHandling: (patch) => set((s) => ({ objectionHandling: { ...s.objectionHandling, ...patch } })),

      // ── CRM entity CRUD ──────────────────────────────────────────────
      addAccount: (account) => set((s) => {
        const rec = { id: uid('acct'), createdAt: new Date().toISOString(), ...account }
        return {
          crm: { ...s.crm, accounts: [...s.crm.accounts, rec] },
          eventLog: [...s.eventLog, createEvent('crm_create', s.currentStageIndex, { entity: 'account', id: rec.id })],
        }
      }),
      updateAccount: (id, patch) => set((s) => ({
        crm: { ...s.crm, accounts: s.crm.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) },
        eventLog: [...s.eventLog, createEvent('crm_update', s.currentStageIndex, { entity: 'account', id, patch })],
      })),
      deleteAccount: (id) => set((s) => ({
        crm: { ...s.crm, accounts: s.crm.accounts.filter((a) => a.id !== id) },
        eventLog: [...s.eventLog, createEvent('crm_delete', s.currentStageIndex, { entity: 'account', id })],
      })),

      addContact: (contact) => set((s) => {
        const rec = { id: uid('cnt'), createdAt: new Date().toISOString(), ...contact }
        return {
          crm: { ...s.crm, contacts: [...s.crm.contacts, rec] },
          eventLog: [...s.eventLog, createEvent('crm_create', s.currentStageIndex, { entity: 'contact', id: rec.id })],
        }
      }),
      updateContact: (id, patch) => set((s) => ({
        crm: { ...s.crm, contacts: s.crm.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) },
        eventLog: [...s.eventLog, createEvent('crm_update', s.currentStageIndex, { entity: 'contact', id, patch })],
      })),
      deleteContact: (id) => set((s) => ({
        crm: { ...s.crm, contacts: s.crm.contacts.filter((c) => c.id !== id) },
        eventLog: [...s.eventLog, createEvent('crm_delete', s.currentStageIndex, { entity: 'contact', id })],
      })),

      addOpportunity: (opp) => set((s) => {
        const rec = { id: uid('opp'), createdAt: new Date().toISOString(), stage: 'Qualification', probability: 10, ...opp }
        return {
          crm: { ...s.crm, opportunities: [...s.crm.opportunities, rec] },
          eventLog: [...s.eventLog, createEvent('crm_create', s.currentStageIndex, { entity: 'opportunity', id: rec.id })],
        }
      }),
      updateOpportunity: (id, patch) => set((s) => ({
        crm: { ...s.crm, opportunities: s.crm.opportunities.map((o) => (o.id === id ? { ...o, ...patch } : o)) },
        eventLog: [...s.eventLog, createEvent('crm_update', s.currentStageIndex, { entity: 'opportunity', id, patch })],
      })),
      deleteOpportunity: (id) => set((s) => ({
        crm: { ...s.crm, opportunities: s.crm.opportunities.filter((o) => o.id !== id) },
        eventLog: [...s.eventLog, createEvent('crm_delete', s.currentStageIndex, { entity: 'opportunity', id })],
      })),

      addActivity: (activity) => set((s) => {
        const rec = { id: uid('act'), createdAt: new Date().toISOString(), ...activity }
        return {
          crm: { ...s.crm, activities: [rec, ...s.crm.activities] },
          eventLog: [...s.eventLog, createEvent('crm_create', s.currentStageIndex, { entity: 'activity', id: rec.id })],
        }
      }),

      addTask: (task) => set((s) => {
        const rec = { id: uid('task'), createdAt: new Date().toISOString(), done: false, ...task }
        return {
          crm: { ...s.crm, tasks: [...s.crm.tasks, rec] },
          eventLog: [...s.eventLog, createEvent('crm_create', s.currentStageIndex, { entity: 'task', id: rec.id })],
        }
      }),
      toggleTask: (id) => set((s) => ({
        crm: { ...s.crm, tasks: s.crm.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) },
        eventLog: [...s.eventLog, createEvent('crm_update', s.currentStageIndex, { entity: 'task', id, patch: { toggled: true } })],
      })),
      deleteTask: (id) => set((s) => ({
        crm: { ...s.crm, tasks: s.crm.tasks.filter((t) => t.id !== id) },
        eventLog: [...s.eventLog, createEvent('crm_delete', s.currentStageIndex, { entity: 'task', id })],
      })),

      addCalendarEvent: (evt) => set((s) => {
        const rec = { id: uid('evt'), ...evt }
        return {
          crm: { ...s.crm, events: [...s.crm.events, rec] },
          eventLog: [...s.eventLog, createEvent('crm_create', s.currentStageIndex, { entity: 'calendar_event', id: rec.id })],
        }
      }),

      updateProposal: (patch) => set((s) => ({
        proposal: { ...s.proposal, ...patch },
        eventLog: [...s.eventLog, createEvent('field_update', s.currentStageIndex, { form: 'proposal', patch })],
      })),

      updateClose: (patch) => set((s) => ({
        close: { ...s.close, ...patch },
        eventLog: [...s.eventLog, createEvent('decision', s.currentStageIndex, { form: 'close', patch })],
      })),

      setScores: (scores) => set({ scores }),

      // ── Manager chat (rule-based, no AI) ─────────────────────────────
      sendManagerMessage: (text) => set((s) => ({
        managerChat: {
          ...s.managerChat,
          messages: [...s.managerChat.messages, { id: uid('mmsg'), role: 'user', text, ts: Date.now() }],
        },
        eventLog: [...s.eventLog, createEvent('manager_chat_message', s.currentStageIndex, { role: 'user' })],
      })),

      appendManagerReply: (userText) => set((s) => {
        const reply = getManagerReply(userText, s.currentStageIndex)
        return {
          managerChat: {
            ...s.managerChat,
            messages: [...s.managerChat.messages, { id: uid('mmsg'), role: 'manager', text: reply, ts: Date.now() }],
          },
          eventLog: [...s.eventLog, createEvent('manager_chat_message', s.currentStageIndex, { role: 'manager' })],
        }
      }),

      greetStageForManagerChat: (stageIndex) => set((s) => {
        if (s.managerChat.greetedStages.includes(stageIndex)) return {}
        const text = getStageGreeting(stageIndex, { isFirstStage: s.managerChat.greetedStages.length === 0 })
        return {
          managerChat: {
            ...s.managerChat,
            messages: [...s.managerChat.messages, { id: uid('mmsg'), role: 'manager', text, ts: Date.now() }],
            greetedStages: [...s.managerChat.greetedStages, stageIndex],
          },
        }
      }),

      resetSimulation: () => set({ ...initialState, crm: { ...initialState.crm, leads: [SEED_LEAD] } }),
    }),
    {
      name: 'wl-crm-sim-attempt',
      version: 1,
    }
  )
)
