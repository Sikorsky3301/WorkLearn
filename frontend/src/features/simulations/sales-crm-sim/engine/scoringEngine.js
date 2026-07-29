import { SCORING_WEIGHTS } from './simulationConfig'

// Rule-based checks against actual CRM state / event log — used to ground
// the categories that are objectively checkable (rather than trusting the
// LLM's read of a JSON dump for these two).

export function computeCrmAccuracyScore(crm) {
  const checks = [
    crm.accounts.length > 0,
    crm.contacts.length > 0,
    crm.opportunities.some((o) => o.stage && o.probability != null && o.expectedCloseDate),
    crm.tasks.length > 0,
    crm.activities.length > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function computeClosingScore(close) {
  const checks = [
    close.demoScheduled,
    close.signatureRequested,
    close.followUpBooked,
    close.onboardingTaskCreated,
    close.opportunityStageUpdated,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export function computeRuleBasedScores(state) {
  return {
    crmAccuracy: computeCrmAccuracyScore(state.crm),
    closing: computeClosingScore(state.close),
  }
}

// Trims the full store state down to what's useful for the backend's
// final-score LLM prompt — full transcripts are kept (they're the highest-
// signal artifact), free-text fields are kept, raw CRM record timestamps/ids
// are dropped as noise.
export function buildAttemptSummary(state) {
  return {
    leadQualification: state.leadQualification,
    research: state.research,
    outreachEmail: {
      subject: state.outreachEmail.subject,
      body: state.outreachEmail.body,
      cta: state.outreachEmail.cta,
      grade: state.outreachEmail.grade,
      revisions: state.outreachEmail.revisions,
    },
    discoveryCall: {
      notes: state.discoveryCall.notes,
      budgetNoted: state.discoveryCall.budgetNoted,
      timelineNoted: state.discoveryCall.timelineNoted,
      transcript: state.discoveryCall.transcript.map((m) => ({ role: m.role, content: m.content })),
    },
    crmSummary: {
      accounts: state.crm.accounts.length,
      contacts: state.crm.contacts.length,
      opportunities: state.crm.opportunities.map((o) => ({
        name: o.name, stage: o.stage, probability: o.probability,
        amount: o.amount, expectedCloseDate: o.expectedCloseDate,
      })),
      tasks: state.crm.tasks.length,
      activities: state.crm.activities.length,
    },
    objectionHandling: {
      transcript: state.objectionHandling.transcript.map((m) => ({ role: m.role, content: m.content })),
    },
    proposal: state.proposal,
    close: state.close,
    elapsedSeconds: state.elapsedSeconds,
  }
}

// Blends the LLM's holistic read with the rule-based ground truth for the
// two objectively-checkable categories (60% rule-based / 40% LLM — the LLM
// still gets a say since e.g. a technically "complete" CRM record can still
// be badly reasoned), then computes the spec's weighted overall.
export function combineFinalScores(ruleBased, llmResult) {
  const llmCategories = llmResult?.categoryScores ?? {}
  const categoryScores = {}
  for (const key of Object.keys(SCORING_WEIGHTS)) {
    const llmVal = llmCategories[key] ?? 0
    const ruleVal = ruleBased[key]
    categoryScores[key] = ruleVal != null ? Math.round(ruleVal * 0.6 + llmVal * 0.4) : llmVal
  }

  const overall = Math.round(
    Object.entries(SCORING_WEIGHTS).reduce((sum, [key, weight]) => sum + (categoryScores[key] ?? 0) * weight, 0)
  )

  return {
    categoryScores,
    overall,
    strengths: llmResult?.strengths ?? [],
    weaknesses: llmResult?.weaknesses ?? [],
    hiringRecommendation: llmResult?.hiringRecommendation ?? 'Leaning Hire',
    coachingNotes: llmResult?.coachingNotes ?? [],
  }
}
