import { useNavigate } from 'react-router-dom'
import { ChevronDown, Eye, Undo2, Redo2, History, Sparkles, Save, Loader2 } from 'lucide-react'
import SimBuilderLogo from './SimBuilderLogo'
import { useCmsBasePath } from '../../../hooks/useCmsBasePath'

export default function Toolbar({
  project, onSave, saving, canUndo, canRedo, onUndo, onRedo,
  onOpenPreview, onOpenVersions, onOpenAiGenerate, onPublish, publishing,
}) {
  const navigate = useNavigate()
  const cmsBase = useCmsBasePath()

  return (
    <header className="h-16 border-b border-border dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 px-4 shrink-0">
      <button
        type="button"
        onClick={() => navigate(`${cmsBase}/content/sim-builder/projects`)}
        title="Back to Sim Builder projects"
        className="flex items-center gap-2 shrink-0 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg px-1 -mx-1"
      >
        <SimBuilderLogo className="w-8 h-8" />
        <ChevronDown className="h-3.5 w-3.5 text-outline group-hover:text-on-surface-variant transition-colors" />
        <span className="text-sm font-bold text-on-surface dark:text-slate-100 whitespace-nowrap">Sim Builder</span>
      </button>

      <div className="h-6 w-px bg-border dark:bg-slate-700 shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-on-surface dark:text-slate-100 truncate">{project?.title}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <ToolbarIconButton title="Undo" onClick={onUndo} disabled={!canUndo}><Undo2 className="h-4 w-4" /></ToolbarIconButton>
        <ToolbarIconButton title="Redo" onClick={onRedo} disabled={!canRedo}><Redo2 className="h-4 w-4" /></ToolbarIconButton>
        <ToolbarIconButton title="Version History" onClick={onOpenVersions}><History className="h-4 w-4" /></ToolbarIconButton>
        <ToolbarIconButton title="Preview" onClick={onOpenPreview}><Eye className="h-4 w-4" /></ToolbarIconButton>
      </div>

      <button
        onClick={onOpenAiGenerate}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
      >
        <Sparkles className="h-3.5 w-3.5" /> AI Generate
      </button>

      <button
        onClick={onSave}
        disabled={saving}
        title="Save the currently selected block's edits"
        className="flex items-center gap-1.5 text-xs font-semibold text-on-surface border border-border hover:border-primary/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
      </button>

      <span className={`chip text-[10px] shrink-0 ${project?.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-surface-high text-on-surface-variant dark:bg-slate-800 dark:text-slate-300'}`}>
        {project?.status}
      </span>

      <button
        onClick={onPublish}
        disabled={publishing}
        className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
      >
        {publishing && <Loader2 className="h-4 w-4 animate-spin" />} Publish
      </button>
    </header>
  )
}

function ToolbarIconButton({ title, onClick, disabled, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
