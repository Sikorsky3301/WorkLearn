// Scenario source material for the Nimbus CRM simulation — the "case file"
// the candidate reads through in Stages 1-2 before acting on it in Stages 3+.

export const SEED_LEAD = {
  id: 'lead_atlas_forge',
  name: 'Marcus Webb',
  title: 'VP of Operations',
  company: 'Atlas Forge Manufacturing',
  industry: 'Industrial Manufacturing',
  revenue: '$85M annual revenue',
  employees: '420 employees',
  existingCrm: 'Spreadsheets + a legacy on-prem CRM (last updated 2016)',
  painPoints: [
    'Sales reps track deals in personal spreadsheets — leadership has no real pipeline visibility',
    'Manual data entry means the CRM (when used at all) is chronically out of date',
    'Forecast accuracy is poor — Q3 forecast missed actual revenue by 34%',
  ],
  recentNews: [
    'Atlas Forge announced a new product line (precision-machined components for EV manufacturers) three months ago',
    'Hired a new VP of Sales six weeks ago, tasked with "modernizing the sales org"',
  ],
  websiteSummary:
    'Atlas Forge Manufacturing is a 40-year-old industrial manufacturer based in Ohio, supplying precision-machined ' +
    'components to automotive and, increasingly, EV manufacturers. Their site emphasizes reliability and long-term ' +
    'client relationships but has almost no modern digital sales/marketing presence.',
  buyingSignals: [
    'Filled out a "Request a Demo" form on the Nimbus CRM website after searching "CRM for manufacturers"',
    'New VP of Sales publicly posted on LinkedIn about wanting better pipeline visibility',
    'Job posting up for a "Sales Operations Analyst" — suggests budget for tooling/process investment',
  ],
}

export const ACCOUNT_RESEARCH = {
  companyProfile:
    'Atlas Forge Manufacturing — founded 1984, Youngstown, OH. ~420 employees, ~$85M revenue. Core business is ' +
    'precision-machined components for automotive OEMs; expanding into EV supply chains as of this year.',
  products: [
    'CNC-machined structural components (core business, ~70% of revenue)',
    'New: precision battery-enclosure components for EV manufacturers (launched this quarter)',
  ],
  competitors: [
    'HubSpot CRM — evaluated 8 months ago, rejected as "too marketing-focused, not built for long industrial sales cycles"',
    'Local ERP vendor is pitching a bolt-on CRM module as part of a larger ERP upgrade',
  ],
  challenges: [
    'No shared pipeline visibility — leadership finds out deals slipped only after they slip',
    'Long sales cycles (6-9 months) make spreadsheet tracking especially error-prone',
    'New EV product line means the sales team is prospecting a completely new buyer persona they have no playbook for',
  ],
  decisionMakers: [
    { name: 'Marcus Webb', title: 'VP of Operations', role: 'Champion / initial contact' },
    { name: 'Elena Kade', title: 'VP of Sales (new, 6 weeks)', role: 'Primary economic buyer — mandate to modernize' },
    { name: 'Ray Dominguez', title: 'CFO', role: 'Budget approval, will scrutinize ROI and contract terms' },
    { name: 'Priya Anand', title: 'Head of Procurement', role: 'Runs vendor evaluation, manages competing bids' },
  ],
  budgetSignal: 'Open sales-ops headcount suggests budget exists for process/tooling investment this fiscal year.',
  timelineSignal: 'New VP of Sales has a 90-day mandate from the CEO to show pipeline improvement — urgency is real.',
}

// Which persona the candidate is actually talking to at each conversational
// stage — drives both the frontend mood UI and the backend system prompt.
export const DISCOVERY_CONTACT = { key: 'friendly', name: 'Marcus Webb', title: 'VP of Operations' }
export const OBJECTION_CONTACT = { key: 'cfo', name: 'Ray Dominguez', title: 'CFO' }
