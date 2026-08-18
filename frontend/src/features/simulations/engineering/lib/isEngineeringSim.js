// The one gate for the Engineering simulation experience.
//
// Everything under features/simulations/engineering/ — the roadmap, the
// redesigned task page, the manager briefing scene and the full-screen sandbox
// — renders only when this returns true. Every other simulation keeps the
// generic runtime it has today, untouched.
//
// Why `domain` and not the `frontend-dev-sim` slug:
//
//   da-job-sim      → "Data Analytics"
//   sales-crm-sim   → "Sales"
//   frontend-dev-sim → "Engineering"   ← the only match today
//
// so this is exactly as narrow as a slug check right now, but a simulation
// created from the Engineering CMS template (cms_templates/engineering.py,
// which sets domain "Engineering") inherits the experience automatically.
// That is the whole point of that template — a slug check would leave every
// future engineering sim on the old runtime.
//
// Note `cms_templates/it_engineering.py` uses "IT & Engineering", a different
// domain, and is deliberately NOT matched here.
//
// This is the single switch: narrow it to a slug, or widen it to more domains,
// by editing this function alone.
export const ENGINEERING_DOMAIN = 'Engineering'

export function isEngineeringSim(simulation) {
  return simulation?.domain === ENGINEERING_DOMAIN
}
