// The one gate for the full workbench experience.
//
// Everything under features/simulations/engineering/ — the roadmap, the
// redesigned task page, the manager briefing scene and the full-screen sandbox
// — renders only when this returns true. Every other simulation keeps the
// generic runtime it has today, untouched.
//
// WAS `isEngineeringSim`, matching the single domain "Engineering". The
// experience turned out to be about the SHAPE of a simulation, not its
// subject: a roadmap, code tasks with a graded artifact, and a sandbox. The
// Data Analytics sim is exactly that shape — it just writes Python against a
// CSV instead of JavaScript against a DOM — and the workbench has spoken
// `python` since it was written (see MONACO_LANGUAGE in
// SandboxWorkbenchPage.jsx). Keeping it on the old generic runtime, with a
// playground that ran nothing, was an accident of when each was built.
//
//   da-job-sim       → "Data Analytics"   ← now matched
//   frontend-dev-sim → "Engineering"      ← matched since this was written
//   sales-crm-sim    → "Sales"            ← deliberately NOT matched
//
// Sales stays out because its tasks are roleplay and CRM data entry, not code
// with a graded artifact — the workbench has nothing to show it.
//
// Note `cms_templates/it_engineering.py` uses "IT & Engineering", a different
// domain, and is deliberately NOT matched either.
//
// This is the single switch: narrow it, or widen it to more domains, by
// editing the set below alone.
export const WORKBENCH_DOMAINS = new Set(['Engineering', 'Data Analytics'])

export function hasWorkbenchExperience(simulation) {
  return WORKBENCH_DOMAINS.has(simulation?.domain)
}
