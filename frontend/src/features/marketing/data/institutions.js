// Institution crests for the landing page's recognition strip.
//
// Unlike the invented names these replaced (see trustPlaceholders.js), these
// are REAL organisations and their actual registered marks. Displaying them
// under a recognition heading is a public claim of a real relationship —
// keep this list to institutions that relationship genuinely covers, and get
// the usual sign-off before adding a crest you don't have permission to show.
//
// Served from public/images/institutions/ as plain URLs rather than bundled
// imports, so adding or swapping a crest is a file drop plus one line here.
// All are normalised to 160px tall so the strip aligns despite the seals being
// square and the IIIT-H mark being 2:1.
export const INSTITUTIONS = [
  { key: 'iit-delhi', name: 'IIT Delhi', logo: '/images/institutions/iit-delhi.png' },
  { key: 'iit-kanpur', name: 'IIT Kanpur', logo: '/images/institutions/iit-kanpur.png' },
  { key: 'iisc-bangalore', name: 'IISc Bangalore', logo: '/images/institutions/iisc-bangalore.png' },
  { key: 'iiit-hyderabad', name: 'IIIT Hyderabad', logo: '/images/institutions/iiit-hyderabad.png' },
]
