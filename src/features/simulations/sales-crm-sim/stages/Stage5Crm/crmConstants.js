export const PIPELINE_STAGES = ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

export const STAGE_DEFAULT_PROBABILITY = {
  Qualification: 10,
  'Needs Analysis': 25,
  Proposal: 50,
  Negotiation: 75,
  'Closed Won': 100,
  'Closed Lost': 0,
}

export const STAGE_COLORS = {
  Qualification: 'bg-slate-100 text-slate-700 border-slate-200',
  'Needs Analysis': 'bg-blue-100 text-blue-700 border-blue-200',
  Proposal: 'bg-violet-100 text-violet-700 border-violet-200',
  Negotiation: 'bg-amber-100 text-amber-700 border-amber-200',
  'Closed Won': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Closed Lost': 'bg-red-100 text-red-700 border-red-200',
}

export const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Note']

export function formatCurrency(amount) {
  if (amount == null || amount === '') return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
