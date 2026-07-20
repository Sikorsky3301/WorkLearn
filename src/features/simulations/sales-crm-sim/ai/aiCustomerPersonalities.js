// Frontend-side mirror of backend-py/app/services/crm_sim_prompts.py's
// PERSONALITIES keys — this file only carries UI metadata (label/description/
// color); the actual system-prompt text lives on the backend.

export const PERSONALITIES = {
  busy: { label: 'Busy Executive', color: 'text-slate-600 bg-slate-100' },
  friendly: { label: 'Friendly Manager', color: 'text-emerald-700 bg-emerald-100' },
  skeptical: { label: 'Skeptical Buyer', color: 'text-amber-700 bg-amber-100' },
  technical: { label: 'Technical Evaluator', color: 'text-blue-700 bg-blue-100' },
  ceo: { label: 'CEO', color: 'text-purple-700 bg-purple-100' },
  cfo: { label: 'CFO', color: 'text-indigo-700 bg-indigo-100' },
  procurement: { label: 'Procurement Lead', color: 'text-cyan-700 bg-cyan-100' },
  operations_head: { label: 'Operations Head', color: 'text-orange-700 bg-orange-100' },
}

export const MOODS = {
  excited: { label: 'Excited', emoji: '🤩', color: 'text-emerald-700 bg-emerald-100' },
  neutral: { label: 'Neutral', emoji: '😐', color: 'text-slate-600 bg-slate-100' },
  annoyed: { label: 'Annoyed', emoji: '😒', color: 'text-red-700 bg-red-100' },
  curious: { label: 'Curious', emoji: '🤔', color: 'text-blue-700 bg-blue-100' },
  impatient: { label: 'Impatient', emoji: '⏱️', color: 'text-amber-700 bg-amber-100' },
  analytical: { label: 'Analytical', emoji: '🧮', color: 'text-indigo-700 bg-indigo-100' },
  price_sensitive: { label: 'Price Sensitive', emoji: '💰', color: 'text-orange-700 bg-orange-100' },
  enterprise_buyer: { label: 'Enterprise Buyer', emoji: '🏢', color: 'text-purple-700 bg-purple-100' },
}

export function moodMeta(mood) {
  return MOODS[mood] ?? MOODS.neutral
}

export function personalityMeta(key) {
  return PERSONALITIES[key] ?? PERSONALITIES.friendly
}
