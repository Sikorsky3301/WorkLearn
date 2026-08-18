import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Model output, rendered as the markdown it actually is.
//
// react-markdown on its own only handles CommonMark, which has NO TABLES. So a
// model that answers with a pipe table produced exactly this on screen:
//
//     | Skill | Current Level | What to Target Next |
//     |-------|---------------|---------------------|
//     | SQL   | Basic SELECT  | Window functions... |
//
// …as literal text, on one wrapped line, unreadable. `remark-gfm` is what adds
// tables (plus strikethrough, task lists and autolinks). It was never
// installed, so this was latent the whole time — it only became visible when
// the provider model changed to one that formats answers with tables.
//
// One component rather than the same fix in three chat panels, so the global
// mentor, the task rail and the sandbox assistant cannot drift apart.

const PROSE = [
  'prose prose-sm max-w-none',
  'prose-p:my-1.5 prose-p:leading-relaxed',
  'prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5',
  'prose-headings:text-on-surface prose-headings:mt-3 prose-headings:mb-1.5',
  'prose-h1:text-base prose-h2:text-[0.95rem] prose-h3:text-sm',
  'prose-strong:text-on-surface',
  'prose-code:text-on-surface prose-code:bg-surface-high prose-code:px-1 prose-code:py-0.5',
  'prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
  'prose-pre:bg-surface-high prose-pre:text-on-surface prose-pre:text-[0.75rem]',
  'prose-a:text-primary prose-hr:my-3',
  // Tables are the reason this file exists; size them for a chat column.
  'prose-table:my-2 prose-table:text-[0.72rem]',
  'prose-th:px-2 prose-th:py-1.5 prose-th:text-left prose-th:font-bold',
  'prose-td:px-2 prose-td:py-1.5 prose-td:align-top',
].join(' ')

const COMPONENTS = {
  // A table that cannot shrink below its content will push a chat bubble wider
  // than its container and break the layout. Its own scroll container keeps
  // the overflow inside the message.
  table: ({ node, ...props }) => (
    <div className="my-2 -mx-1 overflow-x-auto">
      <table {...props} className="w-full border-collapse" />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th {...props} className="border-b border-border bg-surface-low" />
  ),
  td: ({ node, ...props }) => (
    <td {...props} className="border-b border-border/60" />
  ),
  // Long URLs in a narrow column otherwise force a horizontal scrollbar on the
  // whole panel.
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer noopener" className="break-words" />
  ),
}

export default function MarkdownMessage({ children, className = '' }) {
  return (
    <div className={`${PROSE} ${className}`}>
      {/* A space rather than an empty string: react-markdown renders nothing
          for '', which collapses the bubble to zero height mid-stream. */}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children || ' '}
      </ReactMarkdown>
    </div>
  )
}
