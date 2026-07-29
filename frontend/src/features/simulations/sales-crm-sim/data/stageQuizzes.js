// 5 reinforcement questions per stage — shown once, right after a candidate
// first completes a stage, before they're let into the next one. Answering
// doesn't block advancement (matches the DA/Frontend sims' quiz convention:
// it's a comprehension check + a small XP nudge, not a hard gate) but it
// does turn "click Continue" into a real interaction instead of a formality.
// Keyed by stage index (1-8). Each question: { question, options[4], correct: index }.

export const STAGE_QUIZZES = {
  1: [
    {
      question: "What is Atlas Forge Manufacturing's approximate annual revenue?",
      options: ['$8.5M', '$85M', '$850M', '$8.5B'],
      correct: 1,
    },
    {
      question: 'What does Atlas Forge currently use to track deals?',
      options: ['Salesforce', 'HubSpot', 'Spreadsheets + a legacy on-prem CRM', 'No CRM at all'],
      correct: 2,
    },
    {
      question: 'What recent product line did Atlas Forge launch?',
      options: ['Consumer electronics', 'Precision components for EV manufacturers', 'Enterprise software', 'Renewable energy'],
      correct: 1,
    },
    {
      question: 'Which of these is a genuine buying signal from the lead file?',
      options: ['A random cold call', 'An inbound demo request after searching "CRM for manufacturers"', 'A competitor referral', 'Nothing stood out'],
      correct: 1,
    },
    {
      question: "Why does buying intent matter more than firmographics alone when scoring a lead?",
      options: ["It doesn't matter", 'It signals urgency and readiness to act, not just company fit', 'Firmographics are always more important', 'Intent only matters after the sale'],
      correct: 1,
    },
  ],
  2: [
    {
      question: 'Who is the primary economic buyer at Atlas Forge?',
      options: ['Marcus Webb', 'Elena Kade, the new VP of Sales', 'Ray Dominguez', 'Priya Anand'],
      correct: 1,
    },
    {
      question: 'Which competitor did Atlas Forge already evaluate and reject?',
      options: ['Zoho', 'HubSpot', 'Microsoft Dynamics', 'Salesforce'],
      correct: 1,
    },
    {
      question: 'Why was that competitor rejected?',
      options: ['Too expensive', 'Too marketing-focused, not built for long industrial sales cycles', 'Poor customer support', 'Security concerns'],
      correct: 1,
    },
    {
      question: 'What creates real urgency in this deal?',
      options: ['End of fiscal year', "Elena's 90-day mandate from the CEO to show pipeline improvement", 'A limited-time discount', 'Nothing in particular'],
      correct: 1,
    },
    {
      question: 'Who runs the competing-vendor evaluation process at Atlas Forge?',
      options: ['Marcus Webb', 'Ray Dominguez', 'Priya Anand, Head of Procurement', 'Elena Kade'],
      correct: 2,
    },
  ],
  3: [
    {
      question: "What should a cold email's opening line focus on?",
      options: ["Your product's features", "The prospect's problem", "Your company's history", 'A generic greeting'],
      correct: 1,
    },
    {
      question: 'How many calls-to-action should a good cold email have?',
      options: ['As many as possible', 'Zero', 'Exactly one, clear and low-friction', 'Three, to give options'],
      correct: 2,
    },
    {
      question: 'What actually makes an email feel personalized rather than generic?',
      options: ["Using the prospect's first name", 'Referencing specific research about their business', 'A longer subject line', 'Bold text'],
      correct: 1,
    },
    {
      question: "Which AI grading category checks whether the email is tailored to Atlas Forge specifically?",
      options: ['Grammar', 'Personalization', 'CTA strength', 'Professionalism'],
      correct: 1,
    },
    {
      question: 'Why is a vague CTA like "let me know if you have questions" weak?',
      options: ["It's too short", 'It puts the burden of the next step on the prospect instead of proposing one', "It's grammatically incorrect", "It's too personalized"],
      correct: 1,
    },
  ],
  4: [
    {
      question: 'What should a discovery call open with?',
      options: ['A pitch', 'A question, not a pitch', 'Pricing information', 'A product demo'],
      correct: 1,
    },
    {
      question: 'Which is the stronger discovery question?',
      options: ['"Do you like our product?"', '"What\'s the cost of not solving this problem?"', '"Can I get your email?"', '"Are you the decision maker?"'],
      correct: 1,
    },
    {
      question: 'What does "speaking ratio" measure in this stage?',
      options: ['How fast you talk', 'The balance of talk time between rep and prospect', 'Your typing speed', 'Call duration'],
      correct: 1,
    },
    {
      question: 'If the prospect mentions a specific budget number, what should you do?',
      options: ['Ignore it', "Note it — it's a buying signal", 'Change the subject', 'End the call'],
      correct: 1,
    },
    {
      question: 'What is the actual goal of a discovery call?',
      options: ['Close the deal immediately', 'Uncover real pain, budget, and timeline', 'Send a proposal on the spot', 'Argue with the prospect'],
      correct: 1,
    },
  ],
  5: [
    {
      question: "What should an opportunity's probability reflect?",
      options: ['A random guess', 'Consistency with its pipeline stage', 'Always 100%', 'Always 50%'],
      correct: 1,
    },
    {
      question: 'Why does every opportunity need a follow-up task?',
      options: ["It doesn't", 'An opportunity with no next step is a deal that stalls', 'Tasks are optional busywork', 'Only for deals you already lost'],
      correct: 1,
    },
    {
      question: 'What does a well-formed opportunity need at minimum?',
      options: ['A name only', 'A stage, probability, and expected close date', 'Just a dollar amount', 'A signature'],
      correct: 1,
    },
    {
      question: 'Why log every activity in the CRM instead of just remembering it?',
      options: ["It's legally required", "Your manager — and the scoring engine — reads the CRM, not your memory", "It's not really necessary", 'Only for large deals'],
      correct: 1,
    },
    {
      question: 'What does "CRM Accuracy" actually get scored on?',
      options: ['How colorful your pipeline looks', 'Whether the records you created are complete and consistent with reality', 'Number of logins', 'Typing speed'],
      correct: 1,
    },
  ],
  6: [
    {
      question: 'What should you do first when a prospect raises an objection?',
      options: ['Ignore it and keep pitching', 'Acknowledge it before responding', 'Argue immediately', 'End the call'],
      correct: 1,
    },
    {
      question: 'What makes an objection response credible?',
      options: ['Confidence alone', 'Specific evidence — a number, a case study, a concrete feature', 'Repeating the same point louder', 'Changing the subject'],
      correct: 1,
    },
    {
      question: "If you can't fully resolve an objection in the moment, what should you do?",
      options: ['Give up on the deal', 'Offer a concrete next step', "Pretend it's resolved", 'Immediately drop the price'],
      correct: 1,
    },
    {
      question: 'Who is Ray Dominguez in this deal?',
      options: ['The VP of Sales', 'The CFO', 'Head of Procurement', 'The CEO'],
      correct: 1,
    },
    {
      question: 'What kind of objection is Ray, as CFO, most likely to raise?',
      options: ["The product's color scheme", 'Price versus the competing ERP-bundled bid', 'Office location', 'Font choice in the proposal'],
      correct: 1,
    },
  ],
  7: [
    {
      question: 'What should the Expected ROI section tie back to?',
      options: ['A random industry statistic', 'Something the buyer actually told you in discovery', "Your company's own revenue", 'Nothing in particular'],
      correct: 1,
    },
    {
      question: 'Why should proposal pricing match the CRM opportunity amount?',
      options: ["It doesn't need to", 'Contradicting your own CRM data undermines your credibility', 'Pricing is irrelevant to the proposal', 'CRM data is just a placeholder'],
      correct: 1,
    },
    {
      question: 'What is the Implementation Plan section actually for?',
      options: ['Padding the document', 'Reducing perceived risk with a clear rollout plan', "Listing your team's job titles", "It's optional filler"],
      correct: 1,
    },
    {
      question: 'What should the Executive Summary do?',
      options: ['List every product feature', 'Give the one-paragraph version of the whole deal', 'Include legal disclaimers', 'Repeat the pricing three times'],
      correct: 1,
    },
    {
      question: 'Why base "Business Problems" on discovery notes rather than assumptions?',
      options: ["Assumptions work just as well", 'A defensible proposal reflects what you actually learned from the buyer', "It doesn't really matter", "Because it's faster to write"],
      correct: 1,
    },
  ],
  8: [
    {
      question: 'What actually confirms a deal is closed?',
      options: ['A verbal agreement', 'Updating the opportunity stage in the CRM', 'A handshake', 'Nothing further is needed'],
      correct: 1,
    },
    {
      question: 'Why book a follow-up regardless of whether you won or lost the deal?',
      options: ["It's not necessary", 'It keeps the relationship and pipeline accurate either way', 'Only winning deals need follow-ups', 'Follow-ups happen automatically'],
      correct: 1,
    },
    {
      question: 'What turns a signature into a happy customer?',
      options: ['Nothing more is needed', 'The onboarding handoff task', 'A single thank-you email', 'Waiting until renewal'],
      correct: 1,
    },
    {
      question: 'What is the risk of skipping "request signature" as an explicit action?',
      options: ['None', 'The deal can stall indefinitely with no forcing function', 'It actually speeds things up', "It's automatic anyway"],
      correct: 1,
    },
    {
      question: 'What should your negotiation notes actually capture?',
      options: ["Nothing, they're optional", 'Final terms, concessions made, and sticking points', 'Just the final price', 'Whatever comes to mind'],
      correct: 1,
    },
  ],
}
