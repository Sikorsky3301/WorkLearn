// Category presentation, in one place because three components on this page
// draw the same four buckets and they must agree. The bucket names themselves
// come from the server (SKILL_CATEGORIES in app/core/config.py) — this file
// only says what each one looks like.
export const CATEGORY_STYLE = {
  Technical:  { dot: 'bg-primary',      bar: 'bg-primary',      soft: 'bg-primary/10' },
  Domain:     { dot: 'bg-teal-500',     bar: 'bg-teal-500',     soft: 'bg-teal-50' },
  Cognitive:  { dot: 'bg-amber-500',    bar: 'bg-amber-500',    soft: 'bg-amber-50' },
  Leadership: { dot: 'bg-secondary',    bar: 'bg-secondary',    soft: 'bg-secondary/10' },
}

export const CATEGORY_BLURB = {
  Technical:  'Building and querying',
  Domain:     'Field knowledge and standards',
  Cognitive:  'Judgement and architecture',
  Leadership: 'Carrying the work to people',
}
