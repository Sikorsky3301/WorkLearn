// Rule-based replies for the manager chat widget — intentionally NOT AI.
// Derek Holt only ever talks about the current stage's task, using the same
// objective/briefing/hints/rubric/successCriteria data already defined in
// simulationConfig.js, matched against a small set of keyword intents.

import { stageByIndex } from '../engine/simulationConfig'

const GREETING_RE = /\b(hi|hello|hey|sup|yo|morning|afternoon)\b/i
const THANKS_RE = /\b(thanks|thank you|thx|appreciate|cool|great|awesome)\b/i
const SCORE_RE = /\b(scored?|grade[ds]?|rubric|weight(ed)?|evaluat\w*)\b/i
const CRITERIA_RE = /\b(criteria|requirement|checklist|need to do|expect\w*|before I (move|continue|finish))\b/i
const DONE_RE = /\b(done|finish\w*|complete\w*|next|move on|what'?s next|ready|submit)\b/i
const HINT_RE = /\b(hint|tip|advice|clue|stuck)\b/i
const TIME_RE = /\b(how long|deadline|time limit|due)\b/i
const HELP_RE = /\b(help|not sure|confused|lost|start|begin|what should i|how do i|where do i)\b/i

function bulletList(items) {
  return items.map((item) => `• ${item}`).join('\n')
}

function rubricLine(rubric) {
  return Object.entries(rubric)
    .map(([key, weight]) => `${key} (${Math.round(weight * 100)}%)`)
    .join(', ')
}

/** Returns Derek's canned reply for a given free-text message and stage index. */
export function getManagerReply(text, stageIndex) {
  const stage = stageByIndex(stageIndex)
  const t = (text || '').trim()

  if (!t) return `Still here whenever you want to talk through ${stage.shortTitle}.`

  if (THANKS_RE.test(t) && t.length < 40) {
    return `Anytime. Keep the momentum going on ${stage.shortTitle} — you've got this.`
  }
  if (SCORE_RE.test(t)) {
    return `${stage.title} is scored on ${rubricLine(stage.rubric)}. Keep those in mind while you work through it.`
  }
  if (CRITERIA_RE.test(t) || DONE_RE.test(t)) {
    return `To wrap up ${stage.shortTitle}, I need to see:\n${bulletList(stage.successCriteria)}`
  }
  if (HINT_RE.test(t)) {
    const hint = stage.hints[Math.floor(Math.random() * stage.hints.length)]
    return `Here's one thing to keep in mind: ${hint}`
  }
  if (TIME_RE.test(t)) {
    return `No hard clock on this one — I'd rather you get it right than get it fast.`
  }
  if (HELP_RE.test(t)) {
    return `${stage.objective}\n\n${stage.briefing}`
  }
  if (GREETING_RE.test(t) && t.length < 25) {
    return `Hey — good to see you. We're on ${stage.title} right now. What do you need?`
  }

  return `Good question. Right now your focus is ${stage.title}: ${stage.objective} Ask me for a "hint", what you're "scored on", or what's "left to finish" if you want more.`
}

/** The message Derek opens with when a stage is entered for the first time. */
export function getStageGreeting(stageIndex, { isFirstStage } = {}) {
  const stage = stageByIndex(stageIndex)
  if (isFirstStage) {
    return `Morning — glad to have you on the team. First up: ${stage.title}. ${stage.objective}`
  }
  return `Nice work on the last stage. Moving on to ${stage.title} — ${stage.objective}`
}
