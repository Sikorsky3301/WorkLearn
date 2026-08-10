import MarketingNav from './components/MarketingNav'
import MarketingFooter from './components/MarketingFooter'
import HeroSection from './sections/HeroSection'
import AppShowcaseSection from './sections/AppShowcaseSection'
import FeaturesBentoSection from './sections/FeaturesBentoSection'
import HowItWorksSection from './sections/HowItWorksSection'
import TrustSection from './sections/TrustSection'
import SimulationsShowcase from './sections/SimulationsShowcase'
import PricingSection from './sections/PricingSection'
import FinalCtaSection from './sections/FinalCtaSection'

/** Public marketing landing page at `/`. Composition only — each section
 * owns its own content and data fetching. Carries its own nav/footer rather
 * than MainLayout, whose Navbar hard-depends on authenticated queries.
 *
 * Minimal and light throughout — see the `.panel` / `.pill-btn` /
 * `.eyebrow` classes in styles/index.css. Rhythm comes from alternating
 * white with `surface-low` bands, never from dark sections or decoration:
 * hero → app → features → how → trust → catalogue → pricing → CTA.
 *
 * There used to be a second scroll-driven tour section between the hero and
 * the app showcase. It was cut: `AppShowcaseSection` now cycles through the
 * same screens on its own, so the tour was saying the same thing twice. */
export default function LandingPage() {
  return (
    <div className="bg-white">
      <MarketingNav />
      <main>
        <HeroSection />
        <AppShowcaseSection />
        <FeaturesBentoSection />
        <HowItWorksSection />
        <TrustSection />
        <SimulationsShowcase />
        <PricingSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
    </div>
  )
}
