import * as Heading from './blocks/HeadingBlock'
import * as Text from './blocks/TextBlock'
import * as Image from './blocks/ImageBlock'
import * as Video from './blocks/VideoBlock'
import * as Quiz from './blocks/QuizBlock'
import * as AiChat from './blocks/AiChatBlock'
import * as EmailExercise from './blocks/EmailExerciseBlock'
import * as CodingChallenge from './blocks/CodingChallengeBlock'
import * as FileUpload from './blocks/FileUploadBlock'
import * as Assessment from './blocks/AssessmentBlock'
import * as BranchingLogic from './blocks/BranchingLogicBlock'
import * as Timer from './blocks/TimerBlock'
import * as XpRewards from './blocks/XpRewardsBlock'

// All 13 originally-requested block types. Each module exports {meta, Editor,
// Preview} — mirrors the job-sim builder's taskTypeRegistry.js/taskTypeMeta.js
// pattern, kept entirely separate from that registry. ai_chat, coding_challenge,
// email_exercise, file_upload, timer, xp_rewards, assessment, and
// branching_logic are editor-preview only for v1 — no live runtime wired up.
export const blockTypeRegistry = {
  heading: Heading,
  text: Text,
  image: Image,
  video: Video,
  quiz: Quiz,
  ai_chat: AiChat,
  email_exercise: EmailExercise,
  coding_challenge: CodingChallenge,
  file_upload: FileUpload,
  assessment: Assessment,
  branching_logic: BranchingLogic,
  timer: Timer,
  xp_rewards: XpRewards,
}

// Sidebar/palette grouping — purely a UI aid, matches the categories the
// backend's block_types.py registry assigns.
export const BLOCK_GROUPS = [
  { name: 'Content', types: ['heading', 'text', 'image', 'video'] },
  { name: 'Interactive', types: ['quiz', 'ai_chat', 'email_exercise', 'coding_challenge', 'file_upload', 'assessment', 'branching_logic'] },
  { name: 'Utility', types: ['timer', 'xp_rewards'] },
]

export const DEFAULT_BLOCK_CONFIG = {
  heading: { text: 'New heading', level: 2 },
  text: { body: '' },
  image: { url: '', caption: '' },
  video: { url: '', caption: '' },
  quiz: { question: '', options: ['', ''], correct: 0 },
  ai_chat: { persona_name: 'Contact Name', persona_role: 'Role', prompt: '' },
  email_exercise: { scenario: '', to_placeholder: 'recipient@company.com', subject_placeholder: 'Subject line…', body_placeholder: 'Write your email here…' },
  coding_challenge: { language: 'python', starter_code: '', instructions: '' },
  file_upload: { instructions: '', accepted_types: ['.pdf', '.docx'], max_size_mb: 10 },
  assessment: { criteria: [{ label: 'Quality', weight: 0.5 }, { label: 'Clarity', weight: 0.5 }] },
  branching_logic: { prompt: '', branches: [{ label: 'Path A', description: '' }, { label: 'Path B', description: '' }] },
  timer: { duration_minutes: 15, label: 'Time limit' },
  xp_rewards: { xp_amount: 50, badge_label: '' },
}
