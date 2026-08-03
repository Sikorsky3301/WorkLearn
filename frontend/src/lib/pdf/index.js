/**
 * Barrel + lazy boundary. jsPDF (and its own deps) is ~400KB — far too much
 * to sit in the main bundle for a feature that only runs when someone
 * clicks Download on the Portfolio page. These wrappers dynamic-import the
 * real implementation on first use, so the cost is paid on click rather
 * than on every page load.
 *
 * Callers just invoke these like normal functions; the returned promise
 * only matters if you want to await the save completing.
 */

export async function downloadBadgePdf(badge, holder) {
  const { downloadBadgePdf: impl } = await import('./credentialPdf')
  return impl(badge, holder)
}

export async function downloadCertificatePdf(certificate, holder) {
  const { downloadCertificatePdf: impl } = await import('./credentialPdf')
  return impl(certificate, holder)
}
