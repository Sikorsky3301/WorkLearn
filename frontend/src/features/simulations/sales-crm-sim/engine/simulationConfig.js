// The "stage / task / rubric" schema for the CRM sim's crm_workspace task
// type — STAGES is read by store/useCrmSimStore.js, stageByIndex by
// data/managerChatKnowledge.js's rule-based manager replies.

export const STAGES = [
  {
    id: 'lead-qualification',
    index: 1,
    title: 'Lead Qualification',
    shortTitle: 'Qualify',
    objective: 'Review the inbound lead and decide if it is worth pursuing.',
    briefing:
      "A new inbound lead just landed in your queue. Before you spend a minute on outreach, figure out " +
      'whether this is worth pursuing — score it, judge buying intent, and write down your reasoning.',
    hints: [
      'Revenue and employee count tell you if this deal is even worth your time.',
      "Recent news and buying signals often matter more than firmographics alone.",
      'A lead score without written reasoning is not defensible to your manager.',
    ],
    rubric: { research: 0.4, discovery: 0.3, professionalism: 0.3 },
    successCriteria: ['Lead score is set', 'Buying intent is judged', 'Reasoning notes are written (40+ characters)'],
  },
  {
    id: 'research',
    index: 2,
    title: 'Research',
    shortTitle: 'Research',
    objective: 'Build a real picture of the account before you reach out.',
    briefing:
      'Dig into the account — company profile, products, competitors, challenges, decision makers, ' +
      'budget, and timeline. Everything you learn here makes your outreach and discovery call sharper.',
    hints: [
      'Look for what a competitor is already doing there — it shapes your angle.',
      'Note who the likely economic buyer is versus who you\'ll actually be talking to.',
      'Specific pain points beat generic industry pain points.',
    ],
    rubric: { research: 0.7, professionalism: 0.3 },
    successCriteria: ['At least one pain point identified', 'At least one opportunity identified', 'At least one risk identified'],
  },
  {
    id: 'cold-outreach',
    index: 3,
    title: 'Cold Outreach',
    shortTitle: 'Outreach',
    objective: 'Write a cold email that earns a reply.',
    briefing:
      'Turn your research into a cold email — a clear subject line, a personalized body that shows you ' +
      'did your homework, and one specific call to action.',
    hints: [
      'Lead with their problem, not your product.',
      'One CTA. Not "let me know if you have any questions."',
      'Reference something specific from your research — generic emails get deleted.',
    ],
    rubric: { email: 1.0 },
    successCriteria: ['Subject line written', 'Email body written', 'Call to action written', 'Email graded by AI'],
  },
  {
    id: 'discovery-call',
    index: 4,
    title: 'Discovery Call',
    shortTitle: 'Discovery',
    objective: 'Get the prospect talking and uncover what actually matters to them.',
    briefing:
      'You\'re live with the prospect now. Build rapport, ask real discovery questions, and come out of ' +
      'this call understanding their challenges, goals, budget, and timeline — not just pitching features.',
    hints: [
      'Open with a question, not a pitch.',
      'Ask about the cost of the status quo, not just their goals.',
      "If they mention a specific number or date, that's a buying signal — don't let it pass by.",
    ],
    rubric: { discovery: 0.6, communication: 0.4 },
    successCriteria: ['At least 6 messages exchanged', 'Call notes written', 'Budget and timeline noted'],
  },
  {
    id: 'crm',
    index: 5,
    title: 'CRM — Work the Deal',
    shortTitle: 'CRM',
    objective: 'Get the deal properly logged and moving through your pipeline.',
    briefing:
      'Time to work the CRM like it\'s your job — because it is. Create the account, contact, and ' +
      'opportunity, set a realistic pipeline stage and close date, and leave yourself a clear next step.',
    hints: [
      'An opportunity with no next task is a deal that stalls.',
      'Probability should match pipeline stage — a 90% "Discovery" deal is not defensible.',
      'Log every activity — your manager (and the scoring engine) reads the CRM, not your memory.',
    ],
    rubric: { crmAccuracy: 1.0 },
    successCriteria: ['Account created', 'Contact created', 'Opportunity created with stage, probability, and close date', 'At least one follow-up task created'],
  },
  {
    id: 'objection-handling',
    index: 6,
    title: 'Objection Handling',
    shortTitle: 'Objections',
    objective: 'Handle real pushback without losing the deal.',
    briefing:
      'The prospect has concerns — price, a competitor, approval, security, whatever comes up. Address ' +
      'them directly and specifically. Generic reassurance loses deals; substance wins them.',
    hints: [
      'Acknowledge the objection before you answer it — don\'t just steamroll past it.',
      'Bring receipts: a number, a case study, a specific feature — not just confidence.',
      'An objection you don\'t fully resolve should get a concrete next step, not a hand-wave.',
    ],
    rubric: { objectionHandling: 0.7, negotiation: 0.3 },
    successCriteria: ['At least 4 messages exchanged', 'At least one objection explicitly addressed'],
  },
  {
    id: 'proposal',
    index: 7,
    title: 'Proposal',
    shortTitle: 'Proposal',
    objective: 'Put together a proposal that makes the business case.',
    briefing:
      'Write the proposal you\'d actually send: the business problem, your recommended solution, an ' +
      'implementation plan, the expected ROI, a timeline, and pricing.',
    hints: [
      'Tie the ROI number back to something the buyer told you in discovery.',
      'Implementation plan should reduce risk, not just list steps.',
      'Pricing should match what you scoped in the opportunity — don\'t contradict your own CRM.',
    ],
    rubric: { negotiation: 0.5, communication: 0.5 },
    successCriteria: ['All 7 proposal sections completed'],
  },
  {
    id: 'close',
    index: 8,
    title: 'Close',
    shortTitle: 'Close',
    objective: 'Take the concrete actions that actually close a deal.',
    briefing:
      'This is where deals actually close or stall. Schedule the demo, request the signature, log your ' +
      'negotiation notes, book the follow-up, create the onboarding task, and move the opportunity to its ' +
      'final stage.',
    hints: [
      "A deal isn't closed until the CRM says so — update the opportunity stage.",
      'Always leave a follow-up on the calendar, win or lose.',
      'The onboarding task is what turns a signature into a happy customer.',
    ],
    rubric: { closing: 0.6, negotiation: 0.4 },
    successCriteria: ['Demo scheduled', 'Signature requested', 'Follow-up booked', 'Onboarding task created', 'Opportunity stage updated to Closed Won or Closed Lost'],
  },
]

export function stageByIndex(index) {
  return STAGES.find((s) => s.index === index) ?? STAGES[0]
}
