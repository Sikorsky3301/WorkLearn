// Rule-based manager replies shared by da-job-sim and frontend-dev-sim —
// intentionally NOT AI. Matches free text against a small set of keyword
// intents and answers using only the current task's own data (message,
// whatToDo, whatToSubmit, hints, skills) — the same data already rendered
// in each workspace's Instructions/Hints tabs.

const GREETING_RE = /\b(hi|hello|hey|sup|yo|morning|afternoon)\b/i
const THANKS_RE = /\b(thanks|thank you|thx|appreciate|cool|great|awesome)\b/i
const SCORE_RE = /\b(scored?|grade[ds]?|evaluat\w*|assess\w*)\b/i
const CRITERIA_RE = /\b(criteria|requirement|checklist|need to (do|submit)|expect\w*|before I (move|continue|finish|submit))\b/i
const DONE_RE = /\b(done|finish\w*|complete\w*|next|move on|what'?s next|ready|submit)\b/i
const HINT_RE = /\b(hint|tip|advice|clue|stuck)\b/i
const TIME_RE = /\b(how long|deadline|time limit|due)\b/i
const HELP_RE = /\b(help|not sure|confused|lost|start|begin|what should i|how do i|where do i)\b/i

function bulletList(items) {
  return items.map((item) => `• ${item}`).join('\n')
}

/** Returns the manager's canned reply for a given free-text message about the current task. */
export function getGenericManagerReply(text, task) {
  const t = (text || '').trim()
  if (!t) return `Still here whenever you want to talk through ${task.title}.`

  if (THANKS_RE.test(t) && t.length < 40) {
    return `Anytime. Keep going on ${task.title} — you're doing fine.`
  }
  if (SCORE_RE.test(t)) {
    return task.skills?.length
      ? `This one's evaluated on: ${task.skills.join(', ')}.`
      : `Check the "What to submit" list — that's exactly what gets graded.`
  }
  if (CRITERIA_RE.test(t) || DONE_RE.test(t)) {
    return task.whatToSubmit?.length
      ? `To wrap this up, I need:\n${bulletList(task.whatToSubmit)}`
      : `Once you've covered everything in "What to do," you're good to submit.`
  }
  if (HINT_RE.test(t)) {
    if (!task.hints?.length) return `No extra hints for this one — trust your instincts and re-read the brief.`
    const hint = task.hints[Math.floor(Math.random() * task.hints.length)]
    return `Here's one thing to keep in mind: ${hint}`
  }
  if (TIME_RE.test(t)) {
    return `No hard clock on this one — I'd rather you get it right than get it fast.`
  }
  if (HELP_RE.test(t)) {
    return task.whatToDo?.length
      ? `${task.message}\n\nStart here:\n${bulletList(task.whatToDo.slice(0, 3))}`
      : task.message
  }
  if (GREETING_RE.test(t) && t.length < 25) {
    return `Hey — good to see you. We're on ${task.title} right now. What do you need?`
  }

  return `Good question. Right now your focus is ${task.title}: ${task.subject} Ask me for a "hint", what you're "scored on", or what's "left to submit" if you want more.`
}

/** The message the manager opens with when a task is entered for the first time. */
export function getGenericGreeting(task, { isFirstTask } = {}) {
  if (isFirstTask) {
    return `Hey — glad to have you on the team. First up: ${task.title}. ${task.subject}`
  }
  return `Nice work on the last one. Moving on to ${task.title} — ${task.subject}`
}
