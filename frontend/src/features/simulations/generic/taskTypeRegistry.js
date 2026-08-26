import TextRubricTask from './TextRubricTask'
import StructuredFormTask from './StructuredFormTask'
import QuizTask from './QuizTask'
import AiRoleplayChatTask from './AiRoleplayChatTask'
import CrmWorkspaceTask from './CrmWorkspaceTask'
import CodeSandboxTask from './CodeSandboxTask'
import MermaidDiagramTask from './MermaidDiagramTask'

// One entry per task `type` — read by both the runtime renderer
// (GenericStageRenderer) and the future admin builder's task-type palette.
export const taskTypeRegistry = {
  text_rubric: { RendererComponent: TextRubricTask, label: 'Text + Rubric' },
  structured_form: { RendererComponent: StructuredFormTask, label: 'Structured Form' },
  quiz: { RendererComponent: QuizTask, label: 'Quiz' },
  ai_roleplay_chat: { RendererComponent: AiRoleplayChatTask, label: 'AI Roleplay Chat' },
  // Renders a hardcoded sales-CRM shell regardless of the simulation's
  // domain — labeled explicitly so it isn't mistaken for a generic
  // "workspace" option when authoring a non-sales simulation.
  crm_workspace: { RendererComponent: CrmWorkspaceTask, label: 'CRM Workspace (Sales)' },
  code_sandbox: { RendererComponent: CodeSandboxTask, label: 'Code Sandbox' },
  mermaid_diagram: { RendererComponent: MermaidDiagramTask, label: 'Mermaid Diagram' },
}
