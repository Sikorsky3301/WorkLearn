const SIZES = {
  xs: { box: 'h-5 w-5', text: 'text-[9px]' },
  sm: { box: 'w-8 h-8', text: 'text-xs' },
  md: { box: 'h-10 w-10', text: 'text-sm' },
  lg: { box: 'h-11 w-11', text: 'text-sm' },
}

/** Photo-or-initials circle — the same fallback pattern (an `<img>` when a
 * photo URL exists, else a colored circle of initials) used to be repeated
 * by hand at every manager/user avatar in the app. `className` overrides the
 * fallback background (defaults to `bg-primary`) so callers that want a
 * different look — e.g. a gradient — don't need a second component. */
export default function Avatar({ src, alt = '', initials = '', size = 'md', className = 'bg-primary' }) {
  const { box, text } = SIZES[size] || SIZES.md

  if (src) {
    return <img src={src} alt={alt} className={`${box} rounded-full object-cover shrink-0`} />
  }

  return (
    <span className={`${box} ${text} rounded-full text-white flex items-center justify-center font-bold shrink-0 ${className}`}>
      {initials}
    </span>
  )
}
