import lumenLogoImg from '../assets/lumen-logo.png'
import enigmaLogoImg from '../assets/enigma-logo.png'
import nimbusLogoImg from '../assets/nimbus-logo.png'
import derekHoltPhoto from '../assets/derek-holt.jpg'
import daJobSimBanner from '../assets/da-job-sim-banner.jpg'
import frontendDevSimBanner from '../assets/frontend-dev-sim-banner.jpg'
import salesCrmSimBanner from '../assets/sales-crm-sim-banner.jpg'

// Purely cosmetic per-simulation branding (logo + accent + manager photo +
// card banner) — the backend has no notion of any of these, so this is a
// client-side lookup keyed by the simulation id the backend already sends.
// Any simulation not listed here (e.g. a future one) still renders — just
// without branding/a photo/banner. Shared across Dashboard and Portfolio
// (case studies) so a branding entry is only ever defined once.
//
// `banner` is a real stock photo (Unsplash, free license), not a fabricated
// or AI-generated image — picked to match each simulation's actual work
// (a dashboard/charts screen for the data-analyst sim, a React code editor
// for the frontend sim, a sales presentation for the CRM sim).
// Accents stay inside the brand's own cool palette (indigo primary, slate,
// teal) — deliberately no orange/amber, which read as generic "template"
// colors here and clash with the indigo primary everything else uses.
// `explainerVideo` is served from public/videos/ (a plain URL path, not a
// bundled import — these are tens of MB and must not go through the JS
// bundle). Only sims that actually have one carry the field; the overview
// page's video section renders nothing when it's absent.
export const SIM_BRANDING = {
  'da-job-sim':       { logo: lumenLogoImg, accentColor: 'bg-indigo-700', banner: daJobSimBanner },
  'frontend-dev-sim': { logo: enigmaLogoImg, accentColor: 'bg-slate-800', banner: frontendDevSimBanner, explainerVideo: '/videos/enigma-job-sim-explainer.mp4' },
  'sales-crm-sim':    { logo: nimbusLogoImg, accentColor: 'bg-teal-700', managerPhoto: derekHoltPhoto, banner: salesCrmSimBanner },
}
