export const AUTHOR_STARTER_MMD = `flowchart TD
  subgraph W1["Week 1 - Intake"]
    T1["Triage the ticket"]:::structured_form
    T2["Debug the script"]:::code_sandbox
  end
  subgraph W2["Week 2 - Close"]
    T3["Talk through the outage"]:::ai_roleplay_chat
    T4["Write the postmortem"]:::text_rubric
    T5["Draw the architecture"]:::mermaid_diagram
  end
  T1 --> T2 --> T3 --> T4 --> T5
`

export const STUDENT_STARTER_MMD = `flowchart TD
  startNode[Start] --> process[Name the components]
  process --> endNode[End]
`

export const TASK_TYPE_HINT = 'Use :::text_rubric, :::structured_form, :::quiz, :::ai_roleplay_chat, :::crm_workspace, :::code_sandbox, or :::mermaid_diagram on a node (or class NodeId type). Subgraphs become weeks.'
