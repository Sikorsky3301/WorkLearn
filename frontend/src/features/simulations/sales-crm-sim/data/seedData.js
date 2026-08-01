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
