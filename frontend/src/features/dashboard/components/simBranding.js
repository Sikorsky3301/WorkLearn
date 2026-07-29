import lumenLogoImg from '../../../assets/lumen-logo.png'
import enigmaLogoImg from '../../../assets/enigma-logo.png'
import nimbusLogoImg from '../../../assets/nimbus-logo.png'
import derekHoltPhoto from '../../../assets/derek-holt.jpg'

// Purely cosmetic per-simulation branding (logo + accent + manager photo) —
// the backend has no notion of any of these, so this is a client-side
// lookup keyed by the simulation id the backend already sends. Any
// simulation not listed here (e.g. a future one) still renders — just
// without branding/a photo — so SimulationCard/AssignmentCard never
// silently drop a simulation they don't recognize. Shared by both so a
// branding entry is only ever defined once.
export const SIM_BRANDING = {
  'da-job-sim':       { logo: lumenLogoImg, accentColor: 'bg-orange-500' },
  'frontend-dev-sim': { logo: enigmaLogoImg, accentColor: 'bg-orange-500' },
  'sales-crm-sim':    { logo: nimbusLogoImg, accentColor: 'bg-blue-600', managerPhoto: derekHoltPhoto },
}
