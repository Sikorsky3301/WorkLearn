import lumenLogoImg from '../assets/lumen-logo.png'
import enigmaLogoImg from '../assets/enigma-logo.png'
import nimbusLogoImg from '../assets/nimbus-logo.png'
import derekHoltPhoto from '../assets/derek-holt.jpg'
import daJobSimBanner from '../assets/da-job-sim-banner.jpg'
import frontendDevSimBanner from '../assets/frontend-dev-sim-banner.webp'
import salesCrmSimBanner from '../assets/sales-crm-sim-banner.jpg'

// Purely cosmetic per-simulation branding (logo + accent + manager photo +
// card banner) — the backend has no notion of any of these, so this is a
// client-side lookup keyed by the simulation id the backend already sends.
// Any simulation not listed here (e.g. a future one) still renders — just
// without branding/a photo/banner. Shared across Dashboard and Portfolio
// (case studies) so a branding entry is only ever defined once.
//
// `banner` is picked to match each simulation's actual work. The data-analyst
// and CRM sims use stock photography (Unsplash, free license) — a
// dashboard/charts screen and a sales presentation respectively. The frontend
// sim uses a supplied photograph of a real two-laptop coding setup (1880x1253
// webp); check its licensing before this ships publicly, since the other two
// ride on Unsplash's free license and this one does not.
//
// It is deliberately NOT run through any blur, scrim or backdrop-filter. Every
// place a banner renders (overview card, showcase tile, workspace header,
// hero parallax) shows it at 1:1 or downscaled, which stays sharp; the one
// thing that would soften it is upscaling past its native size, so keep any
// new surface below 1880px wide or supply a larger file.
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
