import { FileText, ListChecks, HelpCircle, MessageCircle, Building2, Code2 } from 'lucide-react'

// Icon + accent classes per task type, for the visual Stages builder
// (StageCard uses `border` for its left accent strip; StageFlowOverview uses
// `solidBorder` for a full node border). Classes are enumerated literally
// (not template-interpolated) so Tailwind's JIT scanner can see and keep them.
export const taskTypeMeta = {
  text_rubric: {
    icon: FileText,
    border: 'border-l-blue-500',
    solidBorder: 'border-blue-500',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-600',
  },
  structured_form: {
    icon: ListChecks,
    border: 'border-l-violet-500',
    solidBorder: 'border-violet-500',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-600',
  },
  quiz: {
    icon: HelpCircle,
    border: 'border-l-amber-500',
    solidBorder: 'border-amber-500',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
  },
  ai_roleplay_chat: {
    icon: MessageCircle,
    border: 'border-l-emerald-500',
    solidBorder: 'border-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
  },
  crm_workspace: {
    icon: Building2,
    border: 'border-l-rose-500',
    solidBorder: 'border-rose-500',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-600',
  },
  code_sandbox: {
    icon: Code2,
    border: 'border-l-slate-500',
    solidBorder: 'border-slate-500',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-600',
  },
}

export const DEFAULT_TASK_TYPE_META = {
  icon: FileText,
  border: 'border-l-border',
  solidBorder: 'border-border',
  badgeBg: 'bg-surface-high',
  badgeText: 'text-on-surface-variant',
}
