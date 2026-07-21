import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useCrmSimStore } from '../store/useCrmSimStore'
import { useStageCompletion } from '../engine/useSimEngine'
import { useGradeEmail } from '../../../../shared/api/hooks'
import { stageByIndex } from '../engine/simulationConfig'
import { StageHeader, StageFooterNav } from './StageChrome'
import { Card, CardContent } from '../../../../shared/ui/shadcn/card'
import { Label } from '../../../../shared/ui/shadcn/label'
import { Input } from '../../../../shared/ui/shadcn/input'
import { Button } from '../../../../shared/ui/shadcn/button'
import { cn } from '../../../../shared/utils/cn'

const STAGE = stageByIndex(3)

function ToolbarButton({ active, onClick, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'h-7 w-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-low transition-colors',
        active && 'bg-primary/10 text-primary'
      )}
    >
      {children}
    </button>
  )
}

function ScoreBar({ label, value }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-on-surface-variant capitalize">{label.replace(/([A-Z])/g, ' $1')}</span>
        <span className="font-semibold text-on-surface">{value}</span>
      </div>
      <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function Stage3ColdOutreach() {
  const form = useCrmSimStore((s) => s.outreachEmail)
  const updateOutreachEmail = useCrmSimStore((s) => s.updateOutreachEmail)
  const setEmailGrade = useCrmSimStore((s) => s.setEmailGrade)
  const { completeStageIndex } = useStageCompletion()
  const { mutate: gradeEmail, isPending: grading } = useGradeEmail()

  const editor = useEditor({
    extensions: [StarterKit],
    content: form.body || '',
    onUpdate: ({ editor }) => updateOutreachEmail({ body: editor.getHTML() }),
  })

  useEffect(() => () => editor?.destroy(), [editor])

  const criteriaMet = [
    form.subject.trim().length > 0,
    !!editor && editor.getText().trim().length > 20,
    form.cta.trim().length > 0,
    !!form.grade,
  ]

  function handleGrade() {
    if (!editor) return
    gradeEmail(
      { subject: form.subject, body: editor.getText(), cta: form.cta, stageContext: { stage: 'cold-outreach' } },
      {
        onSuccess: (grade) => { setEmailGrade(grade); toast.success('Email graded') },
        onError: () => toast.error('Could not grade the email — try again.'),
      }
    )
  }

  return (
    <div>
      <StageHeader stage={STAGE} />

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardContent className="p-5 space-y-4">
            <div>
              <Label className="mb-1.5 block">Subject line</Label>
              <Input
                value={form.subject}
                placeholder="Keep it short and specific..."
                onChange={(e) => updateOutreachEmail({ subject: e.target.value })}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Email body</Label>
              <div className="rounded-md border border-border overflow-hidden">
                <div className="flex items-center gap-0.5 border-b border-border bg-surface-low px-1.5 py-1">
                  <ToolbarButton label="Bold" active={editor?.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <Bold className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarButton label="Italic" active={editor?.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarButton label="Bullet list" active={editor?.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <List className="h-3.5 w-3.5" />
                  </ToolbarButton>
                </div>
                <EditorContent
                  editor={editor}
                  className="prose prose-sm max-w-none px-3 py-2.5 min-h-40 text-sm text-on-surface [&_.ProseMirror]:outline-none"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Call to action</Label>
              <Input
                value={form.cta}
                placeholder="What's the one thing you want them to do next?"
                onChange={(e) => updateOutreachEmail({ cta: e.target.value })}
              />
            </div>

            <Button onClick={handleGrade} disabled={grading} className="w-full">
              {grading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {grading ? 'Grading with AI…' : form.grade ? 'Re-grade email' : 'Grade my email'}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 h-fit lg:sticky lg:top-[76px]">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-on-surface mb-4">AI Feedback</h3>
            {!form.grade ? (
              <p className="text-sm text-on-surface-variant">Grade your email to see a breakdown of grammar, professionalism, personalization, value proposition, and CTA strength.</p>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{form.grade.overall}</p>
                  <p className="text-xs text-on-surface-variant">Overall score</p>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(form.grade.scores || {}).map(([key, value]) => (
                    <ScoreBar key={key} label={key} value={value} />
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed pt-3 border-t border-border">{form.grade.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StageFooterNav stage={STAGE} criteriaMet={criteriaMet} onContinue={(quizScore) => completeStageIndex(3, { quizScore })} />
    </div>
  )
}
