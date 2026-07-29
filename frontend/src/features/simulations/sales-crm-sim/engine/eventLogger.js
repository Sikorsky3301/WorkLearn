// Append-only event log — every meaningful candidate action (nav, CRM
// mutation, email revision, retry, chat turn, decision) gets one of these.
// scoringEngine.js and RecruiterReplayView.jsx both read this log back.
let seq = 0

export function createEvent(type, stage, payload = {}) {
  seq += 1
  return {
    id: `evt_${Date.now()}_${seq}`,
    type,
    stage,
    payload,
    timestamp: new Date().toISOString(),
  }
}

// Event `type` vocabulary (informal, not enforced) so the replay view can
// render sensible icons/labels: 'stage_enter' | 'stage_complete' |
// 'field_update' | 'crm_create' | 'crm_update' | 'crm_delete' |
// 'chat_message' | 'email_revision' | 'decision' | 'retry'
