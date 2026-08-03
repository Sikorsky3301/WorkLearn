/** Sim Builder's own mark — a blocky, geometric "S" glyph, distinct from the
 * WorkLearn logo used everywhere else in the admin (SuperAdmin sidebar,
 * AdminLogin, the job-sim builder's toolbar). Rendered as inline SVG so it
 * stays crisp at any size with no image asset to manage. */
export default function SimBuilderLogo({ className = 'w-8 h-8' }) {
  return (
    <div className={`${className} rounded-lg bg-[#0a0a0a] flex items-center justify-center shrink-0 overflow-hidden`}>
      <svg viewBox="0 0 40 40" className="w-[65%] h-[65%]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H24V12H12V20H4V4Z" fill="#FAFAFA" />
        <path d="M16 20H28V28H36V36H16V20Z" fill="#FAFAFA" />
      </svg>
    </div>
  )
}
