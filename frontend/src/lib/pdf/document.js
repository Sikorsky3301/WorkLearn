/**
 * Shared PDF primitives — the house style every generated document uses, so
 * a badge PDF and a certificate PDF look like they came from the same
 * platform rather than two unrelated templates.
 *
 * Drawn with jsPDF vector primitives rather than rasterising DOM to canvas:
 * the output stays sharp at any zoom/print size and the file stays ~10KB
 * instead of a multi-megabyte screenshot.
 *
 * Layout note: every y-coordinate below is a real millimetre position on a
 * 297x210mm landscape page, and callers lay documents out against
 * FRAME_TOP/FRAME_BOTTOM rather than page edges. An earlier version placed
 * the footer at H-15 (=195mm) while the frame ends at 194mm, so the footer
 * text printed across the border rule; the FRAME_* constants exist so that
 * class of off-by-one can't recur silently.
 */
import { jsPDF } from 'jspdf'

export const INK = { r: 27, g: 27, b: 33 }          // on-surface
export const MUTED = { r: 71, g: 70, b: 81 }        // on-surface-variant
export const BRAND = { r: 49, g: 46, b: 129 }       // primary #312E81
export const HAIRLINE = { r: 214, g: 211, b: 224 }

const BAND = 10        // brand band height, top and bottom
const FRAME_INSET = 12 // inner hairline frame inset from the page edge

/** Landscape A4 document with the brand frame already drawn. */
export function createDocument() {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 297
  const H = doc.internal.pageSize.getHeight()  // 210

  const frameTop = BAND + 6
  const frameBottom = H - BAND - 6

  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.rect(0, 0, W, BAND, 'F')
  doc.rect(0, H - BAND, W, BAND, 'F')

  doc.setDrawColor(HAIRLINE.r, HAIRLINE.g, HAIRLINE.b)
  doc.setLineWidth(0.4)
  doc.rect(FRAME_INSET, frameTop, W - FRAME_INSET * 2, frameBottom - frameTop)

  return {
    doc, W, H,
    frameTop,
    frameBottom,
    // Widest a line of text may be before it collides with the frame.
    contentWidth: W - FRAME_INSET * 2 - 24,
  }
}

export function drawWordmark(doc, W, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
  doc.text('WORKLEARN', W / 2, y, { align: 'center', charSpace: 2 })
}

/** Small uppercase eyebrow above the main content. */
export function drawEyebrow(doc, W, text, y) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(text, W / 2, y, { align: 'center', charSpace: 1.2 })
}

export function drawSubtitle(doc, W, text, y, size = 11) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(size)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(text, W / 2, y, { align: 'center' })
}

/**
 * Centred bold text that shrinks to fit `maxWidth`, then wraps if it still
 * doesn't fit at the minimum size. Returns the y position just past the
 * last line so callers can keep stacking.
 *
 * Titles here are user/CMS data ("Junior Data Analyst Job Simulation —
 * Journey"), not fixed copy, so a fixed font size would eventually run a
 * long simulation name straight through the frame.
 */
export function drawFittedTitle(doc, W, text, y, { maxSize = 28, minSize = 13, maxWidth, color = INK, lineGap = 9 } = {}) {
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(color.r, color.g, color.b)

  let size = maxSize
  while (size > minSize) {
    doc.setFontSize(size)
    if (doc.getTextWidth(text) <= maxWidth) break
    size -= 1
  }
  doc.setFontSize(size)

  const lines = doc.getTextWidth(text) <= maxWidth ? [text] : doc.splitTextToSize(text, maxWidth)
  lines.forEach((line, i) => doc.text(line, W / 2, y + i * lineGap, { align: 'center' }))
  return y + (lines.length - 1) * lineGap
}

/** Recipient name with the underline rule beneath it. Returns the rule's y. */
export function drawRecipient(doc, W, name, y, maxWidth) {
  const endY = drawFittedTitle(doc, W, name, y, { maxSize: 24, minSize: 14, maxWidth, color: BRAND, lineGap: 10 })

  doc.setDrawColor(HAIRLINE.r, HAIRLINE.g, HAIRLINE.b)
  doc.setLineWidth(0.4)
  doc.line(W / 2 - 55, endY + 5, W / 2 + 55, endY + 5)
  return endY + 5
}

/**
 * The crest, drawn as vectors so it echoes CredentialShield.jsx's on-screen
 * mark. jsPDF has no SVG-path renderer, so the shield is rebuilt from
 * primitives — shoulders, point, stars, and the checkmark — rather than
 * pulling in an svg2pdf dependency for one shape.
 */
export function drawCrest(doc, cx, cy, scale = 1) {
  const w = 30 * scale
  const h = 38 * scale
  const left = cx - w / 2
  const top = cy - h / 2
  const shoulder = top + h * 0.6

  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.roundedRect(left, top, w, h * 0.62, 2.5 * scale, 2.5 * scale, 'F')
  doc.triangle(left, shoulder, left + w, shoulder, cx, top + h, 'F')

  // Three stars, as small filled diamonds — readable at print size and
  // vector-clean, unlike a glyph that depends on font coverage.
  const starY = top + h * 0.2
  const s = 1.5 * scale
  ;[-6 * scale, 0, 6 * scale].forEach((dx, i) => {
    const r = i === 1 ? s * 1.25 : s
    doc.setFillColor(255, 255, 255)
    doc.triangle(cx + dx, starY - r, cx + dx - r, starY + r * 0.7, cx + dx + r, starY + r * 0.7, 'F')
    doc.triangle(cx + dx, starY + r, cx + dx - r, starY - r * 0.7, cx + dx + r, starY - r * 0.7, 'F')
  })

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.2 * scale)
  doc.text('CERTIFIED', cx, top + h * 0.42, { align: 'center', charSpace: 0.4 })

  // Rule under the word, then the checkmark on the crest's point.
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.5 * scale)
  doc.line(cx - w * 0.28, top + h * 0.5, cx + w * 0.28, top + h * 0.5)

  doc.setLineWidth(1.4 * scale)
  doc.setLineCap('round')
  doc.line(cx - 3.5 * scale, top + h * 0.68, cx - 1 * scale, top + h * 0.75)
  doc.line(cx - 1 * scale, top + h * 0.75, cx + 4 * scale, top + h * 0.62)
  doc.setLineCap('butt')
}

/** Evenly divided meta strip (issued date, reference number…). */
export function drawMetaRow(doc, W, y, items) {
  doc.setDrawColor(HAIRLINE.r, HAIRLINE.g, HAIRLINE.b)
  doc.setLineWidth(0.4)
  doc.line(40, y, W - 40, y)

  const colWidth = (W - 80) / items.length
  items.forEach((item, i) => {
    const x = 40 + colWidth * i + colWidth / 2

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(item.label.toUpperCase(), x, y + 8, { align: 'center', charSpace: 0.6 })

    // Values are variable-length (an email, a certificate number) — shrink
    // rather than let neighbouring columns collide.
    doc.setFont('helvetica', 'bold')
    let size = 10
    doc.setFontSize(size)
    while (size > 6 && doc.getTextWidth(String(item.value)) > colWidth - 6) {
      size -= 0.5
      doc.setFontSize(size)
    }
    doc.setTextColor(INK.r, INK.g, INK.b)
    doc.text(String(item.value), x, y + 14, { align: 'center' })
  })
}

export function drawFooterNote(doc, W, text, y) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(text, W / 2, y, { align: 'center' })
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Filesystem-safe filename fragment. */
export function slugify(text, fallback = 'worklearn') {
  const slug = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}
