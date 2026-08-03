/**
 * Badge and certificate PDF layouts. Both share document.js's house style;
 * they differ only in wording and which meta fields they carry.
 *
 * Everything printed comes from real records (UserBadge / Certificate rows
 * + the signed-in user) — nothing is invented at render time, so a
 * downloaded document can't claim more than the platform actually granted.
 *
 * Vertical rhythm is laid out explicitly against the frame rather than by
 * eyeballed constants: the first draft crammed everything into the top
 * two-thirds and left a ~39mm void above the footer, which is what made the
 * page read as broken.
 */
import {
  createDocument, drawWordmark, drawEyebrow, drawSubtitle, drawFittedTitle,
  drawRecipient, drawCrest, drawMetaRow, drawFooterNote, formatDate, slugify,
} from './document'

/**
 * @param {object} badge   UserBadge row: { id, label, badge_key, granted_at }
 * @param {object} holder  { name, email }
 */
export function downloadBadgePdf(badge, holder) {
  const { doc, W, frameTop, frameBottom, contentWidth } = createDocument()

  drawWordmark(doc, W, frameTop + 14)
  drawEyebrow(doc, W, 'BADGE OF ACHIEVEMENT', frameTop + 26)

  drawCrest(doc, W / 2, frameTop + 62, 1.25)

  const titleEnd = drawFittedTitle(doc, W, badge.label || 'Achievement Badge', frameTop + 98, {
    maxSize: 26, minSize: 13, maxWidth: contentWidth,
  })

  drawSubtitle(doc, W, 'This badge was awarded to', titleEnd + 14)
  drawRecipient(doc, W, holder?.name || 'WorkLearn Learner', titleEnd + 30, contentWidth)

  // Anchored to the frame bottom so the strip and footnote always sit
  // inside the border, whatever height the title above resolved to.
  drawMetaRow(doc, W, frameBottom - 32, [
    { label: 'Awarded on', value: formatDate(badge.granted_at) },
    { label: 'Badge ID', value: badge.id ? String(badge.id).slice(0, 8).toUpperCase() : '—' },
    ...(holder?.email ? [{ label: 'Holder', value: holder.email }] : []),
  ])

  drawFooterNote(doc, W, 'Earned through graded job simulations on WorkLearn — not self-reported.', frameBottom - 7)

  doc.save(`worklearn-badge-${slugify(badge.label, 'badge')}.pdf`)
}

/**
 * @param {object} cert    Certificate row from GET /api/users/me/certificates
 * @param {object} holder  { name, email }
 */
export function downloadCertificatePdf(cert, holder) {
  const { doc, W, frameTop, frameBottom, contentWidth } = createDocument()

  drawWordmark(doc, W, frameTop + 14)
  drawEyebrow(doc, W, 'CERTIFICATE OF COMPLETION', frameTop + 26)

  drawCrest(doc, W / 2, frameTop + 54, 1.0)

  drawSubtitle(doc, W, 'This is to certify that', frameTop + 84)

  // recipient_name is the snapshot taken at issue time, not the account's
  // current name — the certificate must keep reading the way it did when it
  // was earned (see the model's note on denormalisation).
  const ruleY = drawRecipient(
    doc, W, cert.recipient_name || holder?.name || 'WorkLearn Learner',
    frameTop + 98, contentWidth,
  )

  drawSubtitle(doc, W, 'has successfully completed the job simulation', ruleY + 11)
  const titleEnd = drawFittedTitle(doc, W, cert.simulation_title || 'Job Simulation', ruleY + 23, {
    maxSize: 18, minSize: 11, maxWidth: contentWidth, lineGap: 7,
  })

  if (cert.company) {
    drawSubtitle(doc, W, `at ${cert.company}`, titleEnd + 8, 10)
  }

  drawMetaRow(doc, W, frameBottom - 32, [
    { label: 'Certificate No.', value: cert.certificate_number },
    { label: 'Issued', value: formatDate(cert.issued_at) },
    { label: 'Tasks', value: `${cert.tasks_completed}/${cert.total_tasks}` },
    ...(cert.average_score != null ? [{ label: 'Avg. score', value: `${cert.average_score}%` }] : []),
  ])

  drawFooterNote(
    doc, W,
    `Verify this certificate at worklearn.ai/verify using certificate number ${cert.certificate_number}.`,
    frameBottom - 7,
  )

  doc.save(`worklearn-certificate-${slugify(cert.simulation_title, 'certificate')}.pdf`)
}
