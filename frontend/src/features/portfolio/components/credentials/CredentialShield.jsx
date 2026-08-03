/**
 * The crest/shield mark used by every earned credential (badges today,
 * certificates too). Pure SVG — no raster asset, so it stays sharp at any
 * size and can be re-tinted per variant without shipping three images.
 *
 * Three tonal variants mirror the reference set: a solid filled crest, a
 * split crest (dark head, light body), and a fully outlined one. They carry
 * no ranking meaning — `variantFor()` picks deterministically from the
 * credential's own key so a given credential always renders identically,
 * rather than implying a rarity tier the platform doesn't actually have.
 */

// viewBox 0 0 100 124 — rounded top corners, straight flanks, curving to a
// point at bottom centre.
const SHIELD_PATH =
  'M 50 120 C 20 106 6 88 6 66 V 16 A 10 10 0 0 1 16 6 H 84 A 10 10 0 0 1 94 16 V 66 C 94 88 80 106 50 120 Z'

const VARIANTS = {
  solid:   { fill: '#312E81', stroke: '#312E81', ink: '#ffffff', rule: 'rgba(255,255,255,0.55)', sub: 'rgba(255,255,255,0.85)' },
  split:   { fill: '#ffffff', stroke: '#312E81', ink: '#312E81', rule: '#312E81', sub: '#312E81', head: '#312E81', headInk: '#ffffff' },
  outline: { fill: '#ffffff', stroke: '#312E81', ink: '#312E81', rule: '#312E81', sub: '#312E81', innerRule: true },
}

const VARIANT_KEYS = ['solid', 'split', 'outline']

/** Stable per-credential variant — same key always yields the same crest. */
export function variantFor(key = '') {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return VARIANT_KEYS[hash % VARIANT_KEYS.length]
}

function Star({ x, y, size, fill }) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size / 2.3
    const a = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${x + r * Math.cos(a)},${y + r * Math.sin(a)}`)
  }
  return <polygon points={pts.join(' ')} fill={fill} />
}

export default function CredentialShield({ word = 'CERTIFIED', sublabel = 'Certified', variant = 'solid', className = '' }) {
  const v = VARIANTS[variant] ?? VARIANTS.solid
  const headInk = variant === 'split' ? v.headInk : v.ink

  // Long words have to shrink to stay inside the crest — the mark is fixed
  // width, so the type scales rather than the shield stretching.
  const len = word.length
  const fontSize = len <= 5 ? 19 : len <= 7 ? 16 : len <= 9 ? 13 : len <= 12 ? 10.5 : 8.5

  return (
    <svg viewBox="0 0 100 124" className={className} role="img" aria-label={`${word} ${sublabel}`}>
      <path d={SHIELD_PATH} fill={v.fill} stroke={v.stroke} strokeWidth="5" strokeLinejoin="round" />

      {/* Split variant: dark head behind the stars + word, clipped to the crest */}
      {variant === 'split' && (
        <>
          <clipPath id={`crest-clip-${word}`}>
            <path d={SHIELD_PATH} />
          </clipPath>
          <rect x="0" y="0" width="100" height="74" fill={v.head} clipPath={`url(#crest-clip-${word})`} />
        </>
      )}

      {variant === 'outline' && (
        <path
          d={SHIELD_PATH}
          fill="none"
          stroke={v.stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          transform="translate(50 62) scale(0.88) translate(-50 -62)"
        />
      )}

      <Star x={34} y={28} size={6.5} fill={headInk} />
      <Star x={50} y={25} size={7.5} fill={headInk} />
      <Star x={66} y={28} size={6.5} fill={headInk} />

      <text
        x="50" y="55"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="0.5"
        fill={headInk}
      >
        {word}
      </text>

      <line x1="22" y1="66" x2="78" y2="66" stroke={variant === 'split' ? v.rule : v.rule} strokeWidth="2.5" />

      <text
        x="50" y="80"
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="1.4"
        fill={v.sub}
      >
        {sublabel}
      </text>

      <path
        d="M 41 94 L 47.5 101 L 60 88"
        fill="none"
        stroke={v.ink}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
